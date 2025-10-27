// Firebase Config - Replace with yours
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "aidbridge-gaza",
  storageBucket: "aidbridge-gaza.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Stripe - Replace with yours
const stripe = Stripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY');
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

// Crypto QR
document.querySelectorAll('.crypto-btn').forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.type;
    const addr = type === 'BTC' ? MY_WALLET.btc : MY_WALLET.eth;
    if (!addr) return alert(`Set your ${type} address first!`);
    document.getElementById('walletAddr').textContent = addr;
    document.getElementById('qrCode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(addr)}" alt="QR Code" />`;
  };
});

initWallet();
