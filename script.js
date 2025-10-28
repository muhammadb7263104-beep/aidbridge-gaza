// Firebase (Replace placeholders with yours)
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

// Stripe (Replace with your publishable key)
const stripe = Stripe('pk_test_51SMrk4RwNinfTWeGGuWHQF57stgtRWZWKdQthxAwMXFrUVAk9KaokbUHNmKl8m1as63LTc6KE6ZAFvjnbOPwq8of00NAglKpPl');
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

// FIXED: Stripe Checkout (No Backend – Success Alert + Email)
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
    // Step 1: Save to Firebase (Progress Bar Updates)
    await db.collection('donations').add({
      usd: amount,
      name: name,
      email: email,
      type: 'fiat',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Step 2: Send Email Alert to You (Using EmailJS – Free)
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'YOUR_EMAILJS_SERVICE_ID', // Get free at emailjs.com (1 min setup below)
        template_id: 'YOUR_TEMPLATE_ID', // Default template
        user_id: 'YOUR_PUBLIC_KEY', // From EmailJS
        template_params: {
          amount: amount,
          donor_name: name,
          donor_email: email,
          message: 'New donation to Gaza Aid!'
        }
      })
    }).catch(() => alert('Donation recorded! Email delayed – check later.'));

    // Step 3: Redirect to Stripe Checkout for Payment
    const stripeCheckout = stripe.redirectToCheckout({
      lineItems: [{
        price: 'price_placeholder', // Use dynamic price in prod
        quantity: 1,
      }],
      mode: 'payment',
      successUrl: window.location.href + '?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: window.location.href + '?cancel=true',
      customerEmail: email,
      billingAddressCollection: 'auto'
    });

    await stripeCheckout;
    alert('Thank you! Your gift is helping Gaza children. Payment processing...');
    loadProgress(); // Update bar immediately
  } catch (error) {
    console.error('Error:', error);
    alert('Donation recorded in progress! Payment failed – contact support. Error: ' + error.message);
  }
});

    const session = await response.json();
    if (session.id) {
      // Save to Firebase
      await db.collection('donations').add({
        usd: amount / 100,
        type: 'fiat',
        email: email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Send email alert
      await fetch('https://us-central1-aidbridge-gaza.cloudfunctions.net/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'osemudiamenmonday2@gmail.com',
          amount: amount / 100,
          donorEmail: email,
          type: 'fiat',
          txId: session.id
        })
      });

      // Redirect to Stripe
      stripe.redirectToCheckout({ sessionId: session.id });
    }
  } catch (err) {
    console.error(err);
    alert('Payment failed – try again. Check internet.');
  }
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
