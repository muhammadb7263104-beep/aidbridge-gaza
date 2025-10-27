
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const nodemailer = require('nodemailer');
admin.initializeApp();

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

exports.convertToCrypto = functions.https.onRequest(async (req, res) => {
  // ... (unchanged from earlier)
});

exports.sendEmail = functions.https.onRequest(async (req, res) => {
  const { to, amount, donorEmail, type, txId } = req.body;
  await transporter.sendMail({
    from: 'aidbridge@gmail.com',
    to,
    subject: `New $${amount} ${type} Donation to Gaza Aid`,
    html: `<p>New donation: $${amount} from ${donorEmail} (${type}, Tx: ${txId})</p><p>Check wallet for receipt.</p>`
  });
  res.json({ success: true });
});


