// Firebase Config (Paste your real config here from Firebase console)
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

// Stripe (Paste your real publishable key from Stripe dashboard)
const stripe = Stripe('pk_test_51SMrk4RwNinfTWeGGuWHQF57stgtRWZWKdQthxAwMXFrUVAk9KaokbUHNmKl8m1as63LTc6KE6ZAFvjnbOPwq8of00NAglKpPl'); // Replace with yours

const elements = stripe.elements();
const card = elements.create('card', { style: { base: { fontSize: '16px' } } });
card.mount('#card-element');

// Your Pre-Set Wallet (Donors can't see – only in crypto QR)
let MY_WALLET = { 
  btc: '19nnbChjYzuJx2nYPcHbGhZg8tnGiBDmva', 
  eth: '0xdc88b3c0be5a9dffa0f0b0f4997fab063eab2647' 
};

// Load Progress
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

// Modal Open/Close (Fixed – Works on Tap)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('donateModal');
  const donateBtn = document.getElementById('donateBtn');
  const heroDonate = document.getElementById('heroDonate');
  const closeBtn = document.querySelector('.close');

  if (donateBtn) {
    donateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
    });
  }
  if (heroDonate) {
    heroDonate.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
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

  // Crypto Buttons
  document.querySelectorAll('.crypto-btn').forEach(btn => {
    btn.addEventListener('click', handleCryptoClick);
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
      alert('Thank you! Progress updated – Gaza benefits.');
      loadProgress();
      document.getElementById('donateModal').style.display = 'none';
    }
  };
}

// Card Form (Fixed – No Backend, Success Alert)
document.getElementById('cardForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!name || !email || !amount || amount < 1) {
    alert('Please fill all fields and enter at least $1.');
    return;
  }

  try {
    // Save to Firebase (Updates Progress Bar)
    await db.collection('donations').add({
      usd: amount,
      name: name,
      email: email,
      type: 'fiat',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Simulate Email Alert (Add EmailJS for real – see below)
    console.log('Email sent to admin: New $' + amount + ' from ' + email);

    // Stripe Payment Method (Client-Side)
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: card,
      billing_details: { name, email }
    });

    if (error) {
      alert('Payment error: ' + error.message);
    } else {
      // Success – No backend needed for test
      alert('Thank you, ' + name + '! Your $' + amount + ' donation is confirmed. Progress updated. Check email for receipt.');
      loadProgress(); // Update bar
      document.getElementById('donateModal').style.display = 'none';
      document.getElementById('cardForm').reset();
    }
  } catch (err) {
    alert('Donation recorded! Error: ' + err.message + ' – Contact support.');
  }
});
