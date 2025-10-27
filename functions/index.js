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
    }, { headers: { 'x-changenow-api-key': '5651c74fe1a33635a037d04ef749a7d0de6a3f126cd470d7eb57d8f3363c3cd9' } }); // Replace key

    await admin.firestore().collection('donations').add({
      usd: amount / 100, type: 'fiat', tx: convert.data.id
    });

    res.json({ success: true, txId: convert.data.id });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
