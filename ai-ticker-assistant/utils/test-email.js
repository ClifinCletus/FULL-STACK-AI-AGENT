// test-email.js - Test Gmail SMTP setup
import dotenv from "dotenv";
import { sendTestEmail, getEmailQuotaInfo } from "./nodemailer.js";

// Load environment variables from root directory
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look in the root directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const testGmailSetup = async () => {
  console.log("🧪 Testing Gmail SMTP Configuration...\n");

  // Check environment variables
  console.log("📋 Environment Check:");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `GMAIL_USER: ${process.env.GMAIL_USER ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `GMAIL_APP_PASS: ${
      process.env.GMAIL_APP_PASS ? "✅ Set (16 digits)" : "❌ Missing"
    }`
  );

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.log("\n❌ Missing Gmail credentials!");
    console.log("🔧 Setup Instructions:");
    console.log("1. Add GMAIL_USER=your-email@gmail.com to .env");
    console.log("2. Enable 2-Factor Authentication on Gmail");
    console.log(
      "3. Generate App Password at: https://myaccount.google.com/security"
    );
    console.log("4. Add GMAIL_APP_PASS=your-16-digit-code to .env");
    return;
  }

  // Show quota info
  console.log("\n");
  getEmailQuotaInfo();

  console.log("\n📧 Sending test email...");

  try {
    // Test with the Gmail user email
    await sendTestEmail(process.env.GMAIL_USER);

    console.log("\n🎉 SUCCESS! Gmail SMTP is working perfectly!");
    console.log(`📬 Check ${process.env.GMAIL_USER} inbox for the test email`);
    console.log(
      "\n✅ Your email setup is ready for both development and production!"
    );
  } catch (error) {
    console.log("\n❌ FAILED! Gmail SMTP test failed:");
    console.error(error.message);

    console.log("\n🔧 Common Solutions:");
    console.log("1. Verify 2-Factor Authentication is enabled");
    console.log("2. Generate a new App Password");
    console.log("3. Make sure you're using App Password, not regular password");
    console.log("4. Check if Gmail account is locked or restricted");
    console.log("5. Verify internet connection");
    console.log("6. Try again in a few minutes (temporary Gmail issues)");
  }
};

// Alternative: Test with a different email address
const testWithCustomEmail = async (customEmail) => {
  console.log(`\n🧪 Testing with custom email: ${customEmail}`);
  try {
    await sendTestEmail(customEmail);
    console.log(`✅ Test email sent to ${customEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send to ${customEmail}:`, error.message);
  }
};

// Run the test
const runTests = async () => {
  await testGmailSetup();

  // Uncomment to test with additional email addresses
  // await testWithCustomEmail('friend@example.com');
};

runTests();
