import Mailgen from "mailgen";
import nodemailer from "nodemailer";

export async function sendEmail(options) {
    const mailGenerator = new Mailgen({
        product: {
            name: "Task Manager",
            link: "https://google.com",
        },
    });
    const mailText = mailGenerator.generatePlaintext(options.mailgenContent);
    const mailHtml = mailGenerator.generate(options.mailgenContent);
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

    const mail = {
        from: "mail.projectmgmt@example.com",
        to: options.email,
        subject: options.subject,
        text: mailText,
        html: mailHtml,
    };
    try {
        await transporter.sendMail(mail);
    } catch (err) {
        console.error("Email service failed. Enter your .env");
        console.error(err);
    }
}

export function emailVerificationMailgenContent(username, verificationUrl) {
    return {
        body: {
            name: username,
            intro: "Welcome to project-mgmt-ptfm!",
            action: {
                instructions:
                    "To verify your email please click on the following button",
                button: {
                    color: "#0f0",
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have queries? Just reply to this email, we'd love to help.",
        },
    };
}
export function forgotPasswordMailgenContent(username, passwordResetUrl) {
    return {
        body: {
            name: username,
            intro: "Action Required! We got a request to reset the password of your account",
            action: {
                instructions:
                    "To reset your password click on the following button or link",
                button: {
                    color: "#f00",
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have queries? Just reply to this email, we'd love to help.",
        },
    };
}
