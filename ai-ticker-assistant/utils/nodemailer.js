// //here creating a sinlge mail component, so no need to define somewhere, call and pass parameters somewhere, all in oneplace
// //here, we would get to: to whom to mail, subject: subject of mail, text: text to be mailed(can also use html as done in auth project)
// export const sendMail = async (to,subject,text) =>{
//     try{ //do add the mailtrap related ones we added in the .env, hence we can monitor all using mailtrap
//         const transporter = nodemailer.createTransport({
//             host: process.env.MAILTRAP_SMTP_HOST,
//             port:process.env.MAILTRAP_SMTP_PORT,
//             secure: false, //true for port 465, false for other parts, remove it on adding to production
//             auth:{
//                 user: process.env.MAILTRAP_SMTP_USER,
//                 pass: process.env.MAILTRAP_SMTP_PASS
//             }
//         })

//         const info = await transporter.sendMail({
//             from:"Inngest TMS",
//             to,
//             subject,
//             text,
//         })

//         console.log("Message sent:", info.messageId)
//     catch(error){
//     }
//        console.error("Mail error", error.message)
//        throw error
//     }
// }

// Updated nodemailer.js for production readiness
// utils/nodemailer.js - Gmail SMTP for both development and production
//                     import nodemailer from "nodemailer";

//                     // Create Gmail transporter for all environments
//                     const createGmailTransporter = () => {
//                         console.log("📧 Using Gmail SMTP");

//                         return nodemailer.createTransporter({
//                             service: "gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: process.env.GMAIL_USER,
//       pass: process.env.GMAIL_APP_PASS,
//     },
//   });
// };

import nodemailer from "nodemailer";

/**
 * Creates a Gmail transporter using environment variables
 */
function createGmailTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASS } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    throw new Error(
      "GMAIL_USER or GMAIL_PASS environment variables are not set."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS,
    },
  });
}

export const sendMail = async (to, subject, text) => {
  try {
    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Environment: ${process.env.NODE_ENV || "development"}`);

    const transporter = createGmailTransporter();

    // verify connection
    await transporter.verify();
    console.log("✅ Gmail SMTP connection verified successfully");

    const mailOptions = {
      from: `"Inngest TMS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Inngest TMS</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
            ${text.replace(/\n/g, "<br>")}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This email was sent from Inngest TMS application.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully via Gmail!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📊 Sent to:", to);

    return info;
  } catch (error) {
    console.error("❌ Gmail email sending failed:", error.message);

    if (
      error.message.includes("Invalid login") ||
      error.message.includes("Username and Password not accepted")
    ) {
      console.error("💡 AUTHENTICATION ERROR — fix these:");
      console.error("1️⃣ Enable 2FA on your Gmail account");
      console.error(
        "2️⃣ Use a Gmail App Password instead of your main password"
      );
      console.error(
        "3️⃣ Generate it from https://myaccount.google.com/security > App Passwords"
      );
      console.error("4️⃣ Paste it as GMAIL_PASS without spaces");
    }

    if (error.message.includes("ECONNREFUSED")) {
      console.error("💡 CONNECTION ERROR — fix these:");
      console.error("1️⃣ Check your network connection");
      console.error("2️⃣ Make sure port 587 (TLS) is open");
      console.error("3️⃣ Check any local firewalls blocking SMTP");
    }

    if (error.message.includes("Daily sending quota exceeded")) {
      console.error("💡 QUOTA ERROR:");
      console.error(
        "Gmail daily limit (500 emails) exceeded; resets at midnight PST."
      );
    }

    throw error;
  }
};

/**
 * Send a test email to verify Gmail SMTP works
 */
export const sendTestEmail = async (testEmail = process.env.GMAIL_USER) => {
  try {
    console.log("🧪 Sending test email...");

    await sendMail(
      testEmail,
      "🧪 Test Email from Inngest TMS",
      `Hello!\n\nThis is a test email to verify your Gmail SMTP configuration is working.\n\nTimestamp: ${new Date().toISOString()}\nEnvironment: ${
        process.env.NODE_ENV || "development"
      }\n\nIf you receive this email, your Gmail SMTP setup is working perfectly! ✅\n\nDaily Gmail limit: 500 emails\nThis email counts towards your daily quota.`
    );

    console.log("🎉 Test email sent successfully!");
  } catch (error) {
    console.error("❌ Test email failed:", error.message);
    throw error;
  }
};

/**
 * Logs the Gmail quota info
 */
export const getEmailQuotaInfo = () => {
  const now = new Date();
  const pstTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );

  console.log("📊 Gmail SMTP Info:");
  console.log("   Daily Limit: 500 emails");
  console.log("   Current PST Time:", pstTime.toLocaleString());
  console.log("   Quota resets at: Midnight PST");
  console.log("   👉 Consider SendGrid if you need higher limits.");
};
