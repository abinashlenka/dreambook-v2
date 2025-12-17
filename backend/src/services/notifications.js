const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");
const config = require("../config/config");
const { User } = require("../models/user.model");

// 🔹 Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(config.firebase_secret)),
  });
}

// ---------------------------
// ✨ Email Template Generator
// ---------------------------
function generateEmailTemplate({ subject, message, buttonText = "View", buttonLink = "https://dashboard.dreambookpublishing.com/books" }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="padding:40px 0;">
      <tr>
        <td align="center">
          <!-- Card -->
          <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td bgcolor="#4f46e5" style="padding:20px;text-align:center;color:white;font-size:24px;font-weight:bold;">
                DreamBook Publishing
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding:32px;color:#374151;font-size:16px;line-height:1.6;">
                <h2 style="margin-top:0;color:#111827;font-size:22px;">${subject}</h2>
                <p>${message}</p>
                
                ${buttonText && buttonLink
      ? `
                <div style="text-align:center;margin:30px 0;">
                  <a href="${buttonLink}"
                    style="background:#4f46e5;color:#ffffff;font-size:16px;font-weight:600;padding:14px 28px;
                    border-radius:8px;text-decoration:none;display:inline-block;">
                    ${buttonText}
                  </a>
                </div>`
      : ""
    }

                <p style="font-size:14px;color:#6b7280;margin-top:30px;">
                  If you have any questions, just reply to this email — we're always happy to help.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td bgcolor="#f9fafb" style="padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} DreamBook Publishing. All rights reserved.<br/>
                <a href="https://dreambookpublishing.com" style="color:#4f46e5;text-decoration:none;">Visit Website</a>
              </td>
            </tr>
          </table>
          <!-- End Card -->
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ---------------------------
// 🔹 Push to a topic
// ---------------------------
async function sendToTopic(topic, notification, data) {
  const messaging = admin.messaging();
  const payload = { notification, data, topic };

  try {
    await messaging.send(payload);
    console.log("✅ Push notification sent to topic:", topic);
    return true;
  } catch (err) {
    console.error("❌ Error sending push notification:", err);
    return false;
  }
}

// 🔹 Push to a specific device
async function sendToDevice(fcmToken, notification, data) {
  const messaging = admin.messaging();
  const payload = { notification, data };

  try {
    await messaging.sendToDevice(fcmToken, payload);
    console.log("✅ Push notification sent to device!");
    return true;
  } catch (err) {
    console.error("❌ Error sending push notification to device:", err);
    return false;
  }
}

// ---------------------------
// 🔹 Email notification
// ---------------------------
async function sendEmailNotification(toEmail, subject, message, buttonText, buttonLink) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"DreamBook Publishing Notifications" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html: generateEmailTemplate({ subject, message, buttonText, buttonLink }),
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email notification sent!");
    return true;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return false;
  }
}

// ---------------------------
// 🔹 Password reset link
// ---------------------------
async function sendPasswordResetLink(email) {
  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: "https://dashboard.dreambookpublishing.com/reset-password",
    });

    await sendEmailNotification(
      email,
      "Set Your Password",
      `Welcome to DreamBook Publishing!<br><br> Click the button below to set your password:`,
      "Set Password",
      resetLink
    );

    console.log("✅ Password reset link sent!");
    return true;
  } catch (err) {
    console.error("❌ Error sending reset link:", err);
    return false;
  }
}

// ---------------------------
// 🔹 Save + send notification
// ---------------------------
async function createAndSendNotification({ userId, email, fcmToken, title, body, data = {}, topic }) {
  try {
    // 1. Save to DB
    const notification = await Notification.create({ userId, title, body, data });

    // Fetch user's FCM token
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendToDevice(user.fcmToken, { title, body }, data);
    }

    // 2. Send push/email
    if (topic) await sendToTopic(topic, { title, body }, data);
    if (fcmToken) await sendToDevice(fcmToken, { title, body }, data);
    if (email) await sendEmailNotification(email, title, body);

    return notification;
  } catch (err) {
    console.error("❌ Error creating/sending notification:", err);
    throw err;
  }
}

module.exports = {
  createAndSendNotification,
  sendEmailNotification,
  sendPasswordResetLink,
  sendToDevice,
  sendToTopic,
};
