// Firebase (Replace placeholders with yours)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // From Firebase console
  authDomain: "aidbridge-gaza.firebaseapp.com",
  projectId: "aidbridge-gaza",
  storageBucket: "aidbridge-gaza.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Stripe (Replace with your publishable key)
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
const elements = stripe.elements();
const card = elements.create('card', { style: { base: { fontSize: '16px' } } });
card.mount('#card-element');

// Your Pre-Set Wallet
let MY_WALLET = { 
  btc: '19nnbChjYzuJx2nYPcHbGhZg8tnGiBDmva', 
  eth: '0xdc88b3c0be5a9dffa0f0b0f4997fab063eab2647' 
};

// Load Progress (with error handling)
async function loadProgress() {
  try {
    const snap = await db.collection('donations').get();
    let total = 0;
    snap.forEach(doc => total += doc.data().usd || 0);
    const percent = Math.min((total / 200000) * 100, 100);
    document.getElementById('fill').style.width = percent + '%';
    document.getElementById('raised').innerHTML = `$${total.toLocaleString()} raised (<span id="percent">${percent.toFixed(1)}</span>%)`;
  } catch (e) { console.log('Progress error:', e); }
}
loadProgress();
setInterval(loadProgress, 5000);

// FIXED: Modal Open (Event Listeners + Error Check)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('donateModal');
  const donateBtn = document.getElementById('donateBtn');
  const heroDonate = document.getElementById('heroDonate');
  const closeBtn = document.querySelector('.close');

  if (donateBtn) {
    donateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'block';
      else alert('Site loading – refresh and try again.');
    });
  }
  if (heroDonate) {
    heroDonate.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'block';
      else alert('Site loading – refresh and try again.');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Tab').style.display = 'block';
    });
  });

  // Amount Buttons
  document.querySelectorAll('[data-amt]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('amount').value = btn.dataset.amt;
      document.querySelectorAll('[data-amt]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Crypto Buttons (Fixed)
  document.querySelectorAll('.crypto-btn').forEach(btn => {
    btn.addEventListener('click', handleCryptoClick);
    btn.addEventListener('touchstart', handleCryptoClick);
  });
});

function handleCryptoClick(e) {
  e.preventDefault();
  const type = e.currentTarget.dataset.type;
  const addr = type === 'BTC' ? MY_WALLET.btc : MY_WALLET.eth;
  e.currentTarget.classList.add('active');
  setTimeout(() => e.currentTarget.classList.remove('active'), 300);
  document.getElementById('walletAddr').textContent = `Send ${type} to: ${addr}`;
  document.getElementById('walletAddr').style.display = 'block';
  const uri = type === 'BTC' ? `bitcoin:${addr}` : `ethereum:${addr}`;
  document.getElementById('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}" alt="QR for ${type}" style="border:1px solid #ddd; border-radius:8px;" />`;
  document.getElementById('confirmCrypto').style.display = 'block';
  document.getElementById('confirmCrypto').onclick = async () => {
    const cryptoAmount = prompt('Enter USD equivalent you donated (for progress):');
    if (cryptoAmount) {
      await db.collection('donations').add({ usd: parseFloat(cryptoAmount), type: 'crypto', coin: type, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      await sendEmail(parseFloat(cryptoAmount), 'anonymous', 'crypto', 'manual');
      alert('Thank you! Progress updated – Gaza benefits.');
      loadProgress();
      document.getElementById('donateModal').style.display = 'none';
    }
  };
}

// Card Form
document.getElementById('cardForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: card,
    billing_details: { name, email }
  });
  if (error) return alert(error.message);

  try {
    const res = await fetch('/api/convertToCrypto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: paymentMethod.id, amount: amount * 100, email, wallet: MY_WALLET.eth || MY_WALLET.btc })
    });
    const data = await res.json();
    if (data.success) {
      await db.collection('donations').add({ usd: amount, type: 'fiat', timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      await sendEmail(amount, email, 'fiat', data.txId);
      alert('Thank you! Your gift is helping Gaza children.');
      loadProgress();
      document.getElementById('donateModal').style.display = 'none';
      document.getElementById('cardForm').reset();
    } else alert('Error: ' + data.error);
  } catch (e) { alert('Connection error – try again.'); }
});

// Email Function
async function sendEmail(amount, donorEmail, type, txId) {
  try {
    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'osemudiamenmonday2@gmail.com', amount, donorEmail, type, txId })
    });
  } catch (e) { console.log('Email error:', e); }
}
