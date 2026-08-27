
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendResetEmail(toEmail, resetLink) {
    await transporter.sendMail({
        from: `"APNA Library" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset your APNA Library password',
        html: `
            <p>We received a request to reset your password.</p>
            <p><a href="${resetLink}">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `
    });
}