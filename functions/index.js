const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
admin.initializeApp();

exports.convertToCrypto = functions.https.onRequest(async (req, res) => {
  try {
    const { paymentMethodId, amount, email, wallet } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      receipt_email: email
    });

    const convert = await axios.post('https://api.changenow.io/v2/exchange', {
      from: 'usd', to: wallet.startsWith('0x') ? 'eth' : 'btc',
      amount: amount / 100, address: wallet
    }, { headers: { 'x-changenow-api-key': process.env.CHANGENOW_API_KEY } }); // Replace key

    await admin.firestore().collection('donations').add({
      usd: amount / 100, type: 'fiat', tx: convert.data.id
    });

    res.json({ success: true, txId: convert.data.id });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
const nodemailer = require('nodemailer'); // npm i nodemailer

// Email Transporter (Use Gmail App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'your-gmail@gmail.com', pass: 'your-app-password' } // Set in env
});

exports.sendEmail = functions.https.onRequest(async (req, res) => {
  const { to, amount, donorEmail, type, txId } = req.body;
  await transporter.sendMail({
    from: 'aidbridge@alerts.com',
    to,
    subject: `Aidbridge Alert: New $${amount} ${type} Donation`,
    html: `<p>New donation: $${amount} from ${donorEmail || 'Crypto Donor'} (${type}, Tx: ${txId})</p><p>Wallet: BTC/19nnb... or USDT/0xdc88...</p>`
  });
  res.json({ success: true });
});

// Pre-Set Wallet on Deploy (Run Once)
exports.initWallet = functions.https.onRequest(async (req, res) => {
  await db.collection('config').doc('wallet').set(MY_WALLET); // Your addresses
  res.json({ success: true });
});
