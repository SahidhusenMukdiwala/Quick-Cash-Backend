import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: `"Quick Cash Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
    } catch (error) {
        logger.error("Email Error", { to, subject, error: error.message, stack: error.stack });
        throw error;
    }
};