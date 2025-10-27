// Firebase Config - Replace with yours
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

// Stripe - Replace with yours
const stripe = Stripe('pk_test_51SMrk4RwNinfTWeGGuWHQF57stgtRWZWKdQthxAwMXFrUVAk9KaokbUHNmKl8m1as63LTc6KE6ZAFvjnbOPwq8of00NAglKpPl');
const elements = stripe.elements();
const card = elements.create('card', { style: { base: { fontSize: '16px' } } });
card.mount('#card-element');

// Wallet
let MY_WALLET = { btc: '', eth: '' };

// Init Wallet
async function initWallet() {
  const saved = localStorage.getItem('myCryptoWallet');
  if (saved) {
    MY_WALLET = JSON.parse(saved);
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('mainSite').style.display = 'block';
    document.getElementById('footerAddr').textContent = MY_WALLET.btc || MY_WALLET.eth;
    loadProgress();
  } else {
    document.getElementById('saveWallet').onclick = () => {
      const btc = document.getElementById('btcAddress').value.trim();
      const eth = document.getElementById('ethAddress').value.trim();
      if (!btc && !eth) return alert("Enter at least one address!");
      MY_WALLET = { btc, eth: eth || btc };
      localStorage.setItem('myCryptoWallet', JSON.stringify(MY_WALLET));
      alert("Wallet saved! Site is live.");
      location.reload();
    };
  }
}

// Progress
async function loadProgress() {
  const snap = await db.collection('donations').get();
  let total = 0;
  snap.forEach(doc => { total += doc.data().usd || 0; });
  const percent = Math.min((total / 200000) * 100, 100);
  document.getElementById('fill').style.width = percent + '%';
  document.getElementById('raised').innerHTML = `$${total.toLocaleString()} raised (<span id="percent">${percent.toFixed(1)}</span>%)`;
}
setInterval(loadProgress, 5000);

// Card Form
document.getElementById('cardForm').onsubmit = async (e) => {
  e.preventDefault();
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: card,
    billing_details: { name: document.getElementById('name').value, email: document.getElementById('email').value }
  });
  if (error) return alert(error.message);

  const amount = parseFloat(document.getElementById('amount').value);
  const res = await fetch('/api/convertToCrypto', {  // Update to your function URL later
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethodId: paymentMethod.id,
      amount: amount * 100,
      email: document.getElementById('email').value,
      wallet: MY_WALLET.eth || MY_WALLET.btc
    })
  });
  const data = await res.json();
  if (data.success) {
    alert(`$${amount} sent to your crypto wallet! Tx: ${data.txId}`);
    await db.collection('donations').add({ usd: amount, type: 'fiat', timestamp: new Date() });
    loadProgress();
  } else {
    alert("Error: " + data.error);
  }
};

// Amount Buttons
document.querySelectorAll('[data-amt]').forEach(btn => {
  btn.onclick = () => {
    document.getElementById('amount').value = btn.dataset.amt;
    document.querySelectorAll('[data-amt]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
});

// Crypto QR (Fixed for Mobile)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.crypto-btn').forEach(btn => {
    // Add both click & touch for phones
    btn.addEventListener('click', handleCryptoClick);
    btn.addEventListener('touchstart', handleCryptoClick); // Mobile fix
  });
});

function handleCryptoClick(e) {
  e.preventDefault(); // Stop double-fire
  const type = e.currentTarget.dataset.type;
  const addr = type === 'BTC' ? MY_WALLET.btc : MY_WALLET.eth;
  
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
