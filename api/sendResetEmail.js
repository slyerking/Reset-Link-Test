import nodemailer from "nodemailer";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Generate Firebase password reset link
    const resetLink = await getAuth().generatePasswordResetLink(email);

    // Send Email via Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlTemplate = `
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" 
         style="padding: 10px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
         Reset Password
      </a>
    `;

    await transporter.sendMail({
      from: `"Takesell" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: htmlTemplate,
    });

    return res.status(200).json({ success: true, message: "Reset email sent!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
