import nodemailer from "nodemailer"

//here creating a sinlge mail component, so no need to define somewhere, call and pass parameters somewhere, all in oneplace
//here, we would get to: to whom to mail, subject: subject of mail, text: text to be mailed(can also use html as done in auth project)
export const sendMail = async (to,subject,text) =>{
    try{ //do add the mailtrap related ones we added in the .env, hence we can monitor all using mailtrap
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_SMTP_HOST,
            port:process.env.MAILTRAP_SMTP_PORT,
            secure: false, //true fro port 465, false for other parts, remove it on adding to production
            auth:{
                user: process.env.MAILTRAP_SMTP_USER,
                pass: process.env.MAILTRAP_SMTP_PASS
            }
        })

        const info = await transporter.sendMail({
            from:"Inngest TMS",
            to,
            subject,
            text,
        })

        console.log("Message sent:", info.messageId)
    }
    catch(error){
       console.error("Mail error", error.mesage)
       throw error
    }
}