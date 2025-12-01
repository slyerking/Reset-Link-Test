import nodemailer from "nodemailer";
import admin from "firebase-admin";

// Firebase Admin init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { email } = req.body;
  if (!email) return res.status(400).send("Email is required");

  try {
    // 1️⃣ Firebase Auth থেকে user fetch
    const authUser = await admin.auth().getUserByEmail(email);

    // 2️⃣ Firestore থেকে user details fetch
    const userDoc = await admin.firestore().collection("users").doc(authUser.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const fullName = userData.fullName || authUser.displayName || "User";
    const username = userData.username || "N/A";

    // 3️⃣ Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // 4️⃣ Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    // 5️⃣ HTML Email template
    const html = `
      <p>Hello ${fullName},</p>
      <p>You requested a password reset for your TakeSell Pricing Tool account.</p>
      <p>Your Details:</p>
      <p>Email: <strong>${email}</strong><br>
      Username: <strong>${username}</strong></p>
      <p><a href="${resetLink}" style="background:#4CAF50;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a></p>
      <p>If you didn’t request this, ignore this email.</p>
      <p>Thanks,<br>TAKESELL PRICING TOOL Team</p>
    `;

    // 6️⃣ Send email
    await transporter.sendMail({
      from: `TakeSell Pricing Tool <${process.env.BREVO_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
