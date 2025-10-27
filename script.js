// Firebase & Stripe (unchanged placeholders)
const firebaseConfig = { /* Your config */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const stripe = Stripe('pk_test_51SMrk4RwNinfTWeGGuWHQF57stgtRWZWKdQthxAwMXFrUVAk9KaokbUHNmKl8m1as63LTc6KE6ZAFvjnbOPwq8of00NAglKpPl');
const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

// Pre-Set Your Wallet (Admin-Only – From Firebase)
let MY_WALLET = { btc: '19nnbChjYzuJx2nYPcHbGhZg8tnGiBDmva', eth: '0xdc88b3c0be5a9dffa0f0b0f4997fab063eab2647' }; // Hardcoded for you – secure in prod via env

// Load Progress (unchanged)
async function loadProgress() { /* unchanged */ }
loadProgress();
setInterval(loadProgress, 5000);

// Modal Open/Close
const modal = document.getElementById('donateModal');
document.getElementById('donateBtn').onclick = () => modal.style.display = 'block';
document.getElementById('heroDonate').onclick = () => modal.style.display = 'block';
document.querySelector('.close').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').style.display = 'block';
  };
});

// Card Form (unchanged + Email Trigger)
document.getElementById('cardForm').onsubmit = async (e) => {
  e.preventDefault();
  // ... (Stripe code unchanged)
  if (data.success) {
    await db.collection('donations').add({ usd: amount, type: 'fiat', timestamp: new Date() });
    await sendEmail(amount, document.getElementById('email').value, 'fiat', data.txId); // New: Email you
    alert('Thank you! Your gift is transforming lives in Gaza.');
    loadProgress();
    modal.style.display = 'none';
  }
};

// Crypto (Fixed + Confirm Button)
document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('walletAddr').textContent = `Send to: ${addr}`;
  document.getElementById('walletAddr').style.display = 'block';
  const uri = type === 'BTC' ? `bitcoin:${addr}` : `ethereum:${addr}`;
  document.getElementById('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}" alt="QR for ${type}" />`;
  document.getElementById('confirmCrypto').style.display = 'block';
  document.getElementById('confirmCrypto').onclick = async () => {
    const cryptoAmount = prompt('Enter USD equivalent donated:');
    if (cryptoAmount) {
      await db.collection('donations').add({ usd: parseFloat(cryptoAmount), type: 'crypto', coin: type, timestamp: new Date() });
      await sendEmail(parseFloat(cryptoAmount), 'anonymous', 'crypto', 'manual');
      alert('Thank you! Progress updated – Gaza children benefit directly.');
      loadProgress();
      modal.style.display = 'none';
    }
  };
}

// New: Email You on Donation
async function sendEmail(amount, donorEmail, type, txId) {
  await fetch('/api/sendEmail', {  // Firebase Function URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'osemudiamenmonday2@gmail.com', amount, donorEmail, type, txId })
  });
}

// Amount Buttons (unchanged)
document.querySelectorAll('[data-amt]').forEach(btn => { /* unchanged */ });// Firebase & Stripe (unchanged placeholders)
const firebaseConfig = { /* Your config */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const stripe = Stripe('pk_test_YOUR_KEY');
const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

// Pre-Set Your Wallet (Admin-Only – From Firebase)
let MY_WALLET = { btc: '19nnbChjYzuJx2nYPcHbGhZg8tnGiBDmva', eth: '0xdc88b3c0be5a9dffa0f0b0f4997fab063eab2647' }; // Hardcoded for you – secure in prod via env

// Load Progress (unchanged)
async function loadProgress() { /* unchanged */ }
loadProgress();
setInterval(loadProgress, 5000);

// Modal Open/Close
const modal = document.getElementById('donateModal');
document.getElementById('donateBtn').onclick = () => modal.style.display = 'block';
document.getElementById('heroDonate').onclick = () => modal.style.display = 'block';
document.querySelector('.close').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').style.display = 'block';
  };
});

// Card Form (unchanged + Email Trigger)
document.getElementById('cardForm').onsubmit = async (e) => {
  e.preventDefault();
  // ... (Stripe code unchanged)
  if (data.success) {
    await db.collection('donations').add({ usd: amount, type: 'fiat', timestamp: new Date() });
    await sendEmail(amount, document.getElementById('email').value, 'fiat', data.txId); // New: Email you
    alert('Thank you! Your gift is transforming lives in Gaza.');
    loadProgress();
    modal.style.display = 'none';
  }
};

// Crypto (Fixed + Confirm Button)
document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('walletAddr').textContent = `Send to: ${addr}`;
  document.getElementById('walletAddr').style.display = 'block';
  const uri = type === 'BTC' ? `bitcoin:${addr}` : `ethereum:${addr}`;
  document.getElementById('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}" alt="QR for ${type}" />`;
  document.getElementById('confirmCrypto').style.display = 'block';
  document.getElementById('confirmCrypto').onclick = async () => {
    const cryptoAmount = prompt('Enter USD equivalent donated:');
    if (cryptoAmount) {
      await db.collection('donations').add({ usd: parseFloat(cryptoAmount), type: 'crypto', coin: type, timestamp: new Date() });
      await sendEmail(parseFloat(cryptoAmount), 'anonymous', 'crypto', 'manual');
      alert('Thank you! Progress updated – Gaza children benefit directly.');
      loadProgress();
      modal.style.display = 'none';
    }
  };
}

// New: Email You on Donation
async function sendEmail(amount, donorEmail, type, txId) {
  await fetch('/api/sendEmail', {  // Firebase Function URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'osemudiamenmonday2@gmail.com', amount, donorEmail, type, txId })
  });
}

// Amount Buttons (unchanged)
document.querySelectorAll('[data-amt]').forEach(btn => { /* unchanged */ });  const addr = type === 'BTC' ? MY_WALLET.btc : MY_WALLET.eth;
  
  if (!addr) {
    alert(`Set your ${type} address first! Go back to setup.`);
    return;
  }
  
  // Highlight button on click
  e.currentTarget.classList.add('active');
  setTimeout(() => e.currentTarget.classList.remove('active'), 300);
  
  // Show address
  document.getElementById('walletAddr').textContent = `Send ${type} to: ${addr}`;
  
  // Generate QR with Bitcoin URI (standard format)
  const uri = type === 'BTC' ? `bitcoin:${addr}` : `ethereum:${addr}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  document.getElementById('qrCode').innerHTML = `<img src="${qrUrl}" alt="QR Code for ${type}" style="border:1px solid #ddd; border-radius:8px;" />`;
  
  // Scroll to QR
  document.getElementById('qrCode').scrollIntoView({ behavior: 'smooth' });
}

initWallet();
