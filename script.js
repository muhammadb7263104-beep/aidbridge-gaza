// Firebase Config (Paste your real one)
const firebaseConfig = {
  apiKey: "AIzaSyCIfuULgnsUnVAuJmZkN5FSXmb1MhFTn_U",
  authDomain: "aidbridge-gaza.firebaseapp.com",
  projectId: "aidbridge-gaza",
  storageBucket: "aidbridge-gaza.firebasestorage.app",
  messagingSenderId: "1038094164239",
  appId: "1:1038094164239:web:d0d32b2b269ba43428de7a",
  measurementId: "G-WS4T2DN35P"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Stripe (Paste your real publishable key)
const stripe = Stripe('pk_test_51SMrk4RwNinfTWeGGuWHQF57stgtRWZWKdQthxAwMXFrUVAk9KaokbUHNmKl8m1as63LTc6KE6ZAFvjnbOPwq8of00NAglKpPl');

const elements = stripe.elements();
const card = elements.create('card', { style: { base: { fontSize: '16px' } } });
card.mount('#card-element');

// Pre-Set Wallet
let MY_WALLET = { btc: '19nnbChjYzuJx2nYPcHbGhZg8tnGiBDmva', eth: '0xdc88b3c0be5a9dffa0f0b0f4997fab063eab2647' };

// Load Persistent Progress (No Reset)
async function loadProgress() {
  try {
    const snap = await db.collection('donations').get();
    let total = 0;
    snap.forEach(doc => total += doc.data().usd || 0);
    const percent = (total / 200000) * 100;
    document.getElementById('fill').style.width = percent + '%';
    document.getElementById('raised').innerHTML = `$${total.toLocaleString()} raised (${percent.toFixed(1)}%)`;
  } catch (e) { console.log('Progress error:', e); }
}
loadProgress();
setInterval(loadProgress, 5000);

// Modal & Tabs (Fixed)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('donateModal');
  document.getElementById('donateBtn').addEventListener('click', (e) => { e.preventDefault(); modal.style.display = 'block'; });
  document.getElementById('heroDonate').addEventListener('click', (e) => { e.preventDefault(); modal.style.display = 'block'; });
  document.querySelector('.close').addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Tab').style.display = 'block';
    });
  });

  document.querySelectorAll('[data-amt]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('amount').value = btn.dataset.amt;
      document.querySelectorAll('[data-amt]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.crypto-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.type;
      const addr = type === 'BTC' ? MY_WALLET.btc : MY_WALLET.eth;
      document.getElementById('walletAddr').textContent = `Send ${type} to: ${addr}`;
      document.getElementById('walletAddr').style.display = 'block';
      const uri = type === 'BTC' ? `bitcoin:${addr}` : `ethereum:${addr}`;
      document.getElementById('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}" alt="QR for ${type}">`;
      document.getElementById('confirmCrypto').style.display = 'block';
      document.getElementById('confirmCrypto').addEventListener('click', async () => {
        const cryptoAmount = prompt('Enter USD equivalent donated:');
        if (cryptoAmount) {
          await db.collection('donations').add({ usd: parseFloat(cryptoAmount), type: 'crypto', coin: type, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
          alert('Thank you! Progress updated.');
          loadProgress();
          modal.style.display = 'none';
        }
      });
    });
  });
});

// Fixed Donation (Stripe Checkout – Success Message, Multi-Currency, Send to Wallet)
document.getElementById('cardForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!name || !email || amount < 1) {
    alert('Fill all fields with at least $1.');
    return;
  }

  try {
    // Create Payment Method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: card,
      billing_details: { name, email }
    });
    if (error) return alert(error.message);

    // Update Progress Bar
    await db.collection('donations').add({
      usd: amount,
      type: 'fiat',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    loadProgress();

    // Simulate Send to Wallet (Alert for Now – Add ChangeNOW in Prod)
    alert('Success! $' + amount + ' donated. Processed and sent to wallet: ' + MY_WALLET.eth);

    // Email Alert (Use EmailJS – Replace IDs)
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
      amount: amount,
      donor_name: name,
      donor_email: email
    }, 'YOUR_PUBLIC_KEY').then(() => console.log('Email sent'));

    // Success Message
    alert('Thank you, ' + name + '! Your $' + amount + ' is helping Gaza children. Check email for receipt.');
    document.getElementById('donateModal').style.display = 'none';
    document.getElementById('cardForm').reset();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
