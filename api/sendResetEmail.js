import nodemailer from "nodemailer";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin using JSON env variable
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check if email exists
    try {
      await getAuth().getUserByEmail(email);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({ error: "No account exists with this email." });
      }
      throw error;
    }

    // Generate password reset link
    const resetLink = await getAuth().generatePasswordResetLink(email);

    // Send email via Nodemailer + Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const htmlTemplate = `
      <h2>Password Reset</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetLink}" 
         style="padding: 10px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
         Reset Password
      </a>
      <p>If you didn't request this, ignore this email.</p>
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
