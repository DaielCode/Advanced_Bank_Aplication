'use strict';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

// ── Firebase init ─────────────────────────────────────────────────────────────
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── UI Elements ───────────────────────────────────────────────────────────────
const labelWelcome = document.querySelector('.welcome');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');
const registerModal = document.getElementById('register-modal');
const showRegisterBtn = document.getElementById('show-register');
const closeRegisterBtn = document.getElementById('close-register');
const landing = document.getElementById('landing');
const siteFooter = document.getElementById('site-footer');
const welcomeBanner = document.getElementById('welcome-banner');
const closeBannerBtn = document.getElementById('close-welcome-banner');
const bannerProgressBar = document.getElementById('banner-progress-bar');

// ── Currencies config ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'EUR', prefix: 'EU',  locale: 'de-DE', flag: '🇪🇺', name: 'Euro' },
  { code: 'USD', prefix: 'US',  locale: 'en-US', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'GBP', prefix: 'GB',  locale: 'en-GB', flag: '🇬🇧', name: 'British Pound' },
  { code: 'PLN', prefix: 'PL',  locale: 'pl-PL', flag: '🇵🇱', name: 'Polish Złoty' },
  { code: 'UAH', prefix: 'UA',  locale: 'uk-UA', flag: '🇺🇦', name: 'Ukrainian Hryvnia' },
  { code: 'CHF', prefix: 'CH',  locale: 'de-CH', flag: '🇨🇭', name: 'Swiss Franc' },
];

// ── App State ─────────────────────────────────────────────────────────────────
let currentAccount = null;
let currentUser = null;
let sorted = false;
let timerInterval;
let exchangeRates = { EUR: 1 };
let displayCurrency = localStorage.getItem('yb_currency') || 'EUR';

// ── Firestore helpers ─────────────────────────────────────────────────────────
const userRef = uid => doc(db, 'users', uid);

const loadAccount = async uid => {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) throw new Error('Account not found');
  return snap.data();
};

const addMovement = async (uid, amount) => {
  const snap = await getDoc(userRef(uid));
  const movements = [...snap.data().movements, amount];
  await updateDoc(userRef(uid), { movements });
};

// ── Exchange Rates ────────────────────────────────────────────────────────────
const ratesPanel = document.getElementById('rates-panel');
const ratesList = document.getElementById('rates-list');
const ratesDate = document.getElementById('rates-date');
const ratesUpdatedTime = document.getElementById('rates-updated-time');
const toggleRatesBtn = document.getElementById('toggle-rates');
const closeRatesBtn = document.getElementById('close-rates-panel');

toggleRatesBtn.addEventListener('click', () => ratesPanel.classList.toggle('hidden'));
closeRatesBtn.addEventListener('click', () => ratesPanel.classList.add('hidden'));
document.getElementById('landing-view-rates-btn').addEventListener('click', () => ratesPanel.classList.remove('hidden'));

// rates always stored as "X per 1 EUR" (base = EUR from API)
let ratesBaseCurrency = 'EUR';
const SPREAD = 0.015; // 1.5% buy/sell spread

// rate of 1 BASE → TARGET using EUR-based rates
const getRate = (base, target) => {
  if (base === target) return 1;
  return exchangeRates[target] / exchangeRates[base];
};

const renderRatesPanel = () => {
  ratesList.innerHTML = CURRENCIES
    .filter(c => c.code !== ratesBaseCurrency)
    .map(c => {
      const mid = getRate(ratesBaseCurrency, c.code);
      const buy  = mid * (1 - SPREAD);
      const sell = mid * (1 + SPREAD);
      const decimals = mid >= 10 ? 2 : mid >= 1 ? 4 : 6;
      return `
        <div class="rates-row">
          <span class="rates-row__flag">${c.flag}</span>
          <div class="rates-row__info">
            <span class="rates-row__code">${c.code}</span>
            <span class="rates-row__name">${c.name}</span>
          </div>
          <div class="rates-row__bs">
            <div class="rates-row__bs-item">
              <span class="rates-row__bs-label">BUY</span>
              <span class="rates-row__bs-val rates-row__bs-val--buy">${buy.toFixed(decimals)}</span>
            </div>
            <div class="rates-row__bs-item">
              <span class="rates-row__bs-label">SELL</span>
              <span class="rates-row__bs-val rates-row__bs-val--sell">${sell.toFixed(decimals)}</span>
            </div>
          </div>
        </div>`;
    }).join('');
};

const fetchRates = async () => {
  try {
    // exchangerate-api.com free v4 — supports UAH
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await res.json();
    exchangeRates = data.rates; // already has EUR:1 included

    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    ratesDate.textContent = data.date;
    ratesUpdatedTime.textContent = `Updated at ${timeStr}`;

    // Update landing rates grid
    const landingGrid = document.getElementById('landing-rates-grid');
    const landingTime = document.getElementById('landing-rates-time');
    if (landingTime) landingTime.textContent = `${data.date} · ${timeStr}`;
    if (landingGrid) {
      landingGrid.innerHTML = CURRENCIES.map(c => {
        const mid = getRate('EUR', c.code);
        const decimals = mid >= 10 ? 2 : mid >= 1 ? 4 : 6;
        const formatted = c.code === 'EUR' ? '1.0000' : mid.toFixed(decimals);
        return `
          <div class="landing__rate-card">
            <span class="landing__rate-prefix">${c.prefix}</span>
            <span class="landing__rate-code">${c.code}</span>
            <span class="landing__rate-name">${c.name}</span>
            <span class="landing__rate-value">${formatted}</span>
          </div>`;
      }).join('');
    }

    renderRatesPanel();
    if (currentAccount) updateUI(currentAccount);
  } catch (err) {
    ratesList.innerHTML = '<div class="rates-loading rates-error">Failed to load rates. Check connection.</div>';
  }
};

// Base currency switcher
document.getElementById('rates-base-btns').addEventListener('click', e => {
  const btn = e.target.closest('.rates-base-btn');
  if (!btn) return;
  ratesBaseCurrency = btn.dataset.base;
  document.querySelectorAll('.rates-base-btn').forEach(b =>
    b.classList.toggle('active', b === btn)
  );
  const base = CURRENCIES.find(c => c.code === ratesBaseCurrency);
  ratesDate.textContent = `1 ${base.flag} ${ratesBaseCurrency} = ...`;
  renderRatesPanel();
});

// Landing CTA buttons
document.getElementById('landing-register-btn').addEventListener('click', () =>
  registerModal.classList.remove('hidden')
);
document.getElementById('landing-signin-btn').addEventListener('click', () =>
  document.getElementById('login-username').focus()
);

// Fetch on load + refresh every 10 minutes
fetchRates();
setInterval(fetchRates, 10 * 60 * 1000);

// ── Currency Switcher ─────────────────────────────────────────────────────────
const currencyBtns = document.querySelectorAll('.currency-btn');

const setActiveCurrencyBtn = () => {
  currencyBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === displayCurrency);
  });
};

setActiveCurrencyBtn();

currencyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    displayCurrency = btn.dataset.currency;
    localStorage.setItem('yb_currency', displayCurrency);
    setActiveCurrencyBtn();
    if (currentAccount) updateUI(currentAccount);
  });
});

// ── Formatting ────────────────────────────────────────────────────────────────
const formatCurrency = eurValue => {
  const rate = exchangeRates[displayCurrency] ?? 1;
  const converted = eurValue * rate;
  const curr = CURRENCIES.find(c => c.code === displayCurrency) || CURRENCIES[0];
  return new Intl.NumberFormat(curr.locale, {
    style: 'currency',
    currency: displayCurrency,
  }).format(converted);
};

// ── UI Render ─────────────────────────────────────────────────────────────────
const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';
  const movs = sort ? [...acc.movements].sort((a, b) => a - b) : acc.movements;
  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__value">${formatCurrency(mov)}</div>
      </div>`;
    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((sum, mov) => sum + mov, 0);
  labelBalance.textContent = formatCurrency(acc.balance);
};

const calcDisplaySummary = function (acc) {
  const incomes = acc.movements.filter(m => m > 0).reduce((s, m) => s + m, 0);
  labelSumIn.textContent = formatCurrency(incomes);

  const out = acc.movements.filter(m => m < 0).reduce((s, m) => s + m, 0);
  labelSumOut.textContent = formatCurrency(Math.abs(out));

  const interest = acc.movements
    .filter(m => m > 0)
    .map(d => (d * acc.interestRate) / 100)
    .filter(i => i >= 1)
    .reduce((s, i) => s + i, 0);
  labelSumInterest.textContent = formatCurrency(interest);
};

const updateUI = function (acc) {
  displayMovements(acc, sorted);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
};

const showError = (el, msg) => {
  if (!el) return;
  el.textContent = msg;
  el.style.color = 'red';
};

const showSuccess = (el, msg) => {
  if (!el) return;
  el.textContent = msg;
  el.style.color = 'green';
};

// ── Logout Timer ──────────────────────────────────────────────────────────────
const startLogoutTimer = function () {
  if (timerInterval) clearInterval(timerInterval);
  let time = 300;

  const tick = async () => {
    const min = String(Math.trunc(time / 60)).padStart(2, '0');
    const sec = String(time % 60).padStart(2, '0');
    labelTimer.textContent = `${min}:${sec}`;

    if (time === 0) {
      clearInterval(timerInterval);
      await signOut(auth);
      labelWelcome.textContent = 'Log in to get started';
      containerApp.style.opacity = 0;
      containerApp.classList.add('hidden');
      landing.classList.remove('hidden');
      siteFooter.classList.remove('hidden');
      currentAccount = null;
      currentUser = null;
    }
    time--;
  };

  tick();
  timerInterval = setInterval(tick, 1000);
};

// ── Welcome Banner ────────────────────────────────────────────────────────────
let bannerTimeout;

const showWelcomeBanner = () => {
  welcomeBanner.classList.remove('hidden');
  // Animate progress bar to 0% over 8 seconds
  bannerProgressBar.style.transition = 'none';
  bannerProgressBar.style.width = '100%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bannerProgressBar.style.transition = 'width 8s linear';
      bannerProgressBar.style.width = '0%';
    });
  });
  bannerTimeout = setTimeout(closeWelcomeBanner, 8000);
};

const closeWelcomeBanner = () => {
  welcomeBanner.classList.add('banner-hide');
  setTimeout(() => {
    welcomeBanner.classList.add('hidden');
    welcomeBanner.classList.remove('banner-hide');
  }, 400);
  clearTimeout(bannerTimeout);
};

closeBannerBtn.addEventListener('click', closeWelcomeBanner);

// ── Shared login success handler ──────────────────────────────────────────────
const handleLoginSuccess = async (user, account, isNew = false) => {
  currentUser = user;
  currentAccount = account;
  landing.classList.add('hidden');
  siteFooter.classList.add('hidden');
  containerApp.classList.remove('hidden');
  loginMessage.textContent = '';
  labelWelcome.textContent = `Welcome back, ${account.username}!`;
  containerApp.style.opacity = 100;

  // account bar
  const fullName = account.firstName && account.lastName
    ? `${account.firstName} ${account.lastName}`
    : account.username;
  const initials = account.firstName && account.lastName
    ? `${account.firstName[0]}${account.lastName[0]}`.toUpperCase()
    : account.username.slice(0, 2).toUpperCase();
  document.getElementById('account-avatar').textContent = initials;
  document.getElementById('account-name').textContent = fullName;

  const dateStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  document.querySelector('.date').textContent = dateStr;
  document.querySelector('.date2').textContent = dateStr;
  loginForm.reset();
  sorted = false;
  updateUI(account);
  startLogoutTimer();
  if (isNew) {
    await updateDoc(userRef(user.uid), { isNewUser: false });
    showWelcomeBanner();
  }
};

// ── Register Modal ────────────────────────────────────────────────────────────
// ── Register Modal open/close ─────────────────────────────────────────────────
showRegisterBtn.addEventListener('click', () => {
  registerModal.classList.remove('hidden');
  goToRegStep(1);
});
closeRegisterBtn.addEventListener('click', () => registerModal.classList.add('hidden'));
registerModal.addEventListener('click', e => {
  if (e.target === registerModal) registerModal.classList.add('hidden');
});

// ── Registration wizard helpers ───────────────────────────────────────────────
const goToRegStep = step => {
  document.querySelectorAll('.reg-panel').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === step);
  });
  document.querySelectorAll('.reg-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 === step) s.classList.add('active');
    if (i + 1 < step) s.classList.add('done');
  });
  document.querySelectorAll('.reg-step__line').forEach((l, i) => {
    l.classList.toggle('done', i + 1 < step);
  });
};

// Password strength
document.getElementById('register-password').addEventListener('input', function () {
  const val = this.value;
  const bar = document.getElementById('pwd-strength-bar');
  const label = document.getElementById('pwd-strength-label');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: '0%',   color: '',                  text: '' },
    { w: '25%',  color: 'var(--red)',         text: 'Weak' },
    { w: '50%',  color: 'var(--amber)',       text: 'Fair' },
    { w: '75%',  color: '#60a5fa',            text: 'Good' },
    { w: '100%', color: 'var(--green)',        text: 'Strong' },
  ];
  const lvl = val.length === 0 ? levels[0] : levels[score] || levels[1];
  bar.style.width = lvl.w;
  bar.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
});

// Password visibility toggles
document.querySelectorAll('.pwd-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// Step navigation
document.getElementById('reg-next-1').addEventListener('click', () => {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const dob       = document.getElementById('reg-dob').value;
  const phone     = document.getElementById('reg-phone').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  if (!firstName || !lastName || !dob || !phone || !email) {
    return showError(document.getElementById('register-message'), 'Please fill in all fields');
  }
  const age = (new Date() - new Date(dob)) / (365.25 * 24 * 3600 * 1000);
  if (age < 18) return showError(document.getElementById('register-message'), 'You must be at least 18 years old');
  goToRegStep(2);
});

document.getElementById('reg-back-2').addEventListener('click', () => goToRegStep(1));

document.getElementById('reg-next-2').addEventListener('click', () => {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm  = document.getElementById('reg-confirm-pwd').value;
  const registerMessage = document.getElementById('register-message');
  if (!username || username.includes(' ')) return showError(registerMessage, 'Username must have no spaces');
  if (password.length < 8) return showError(registerMessage, 'Password must be at least 8 characters');
  if (password !== confirm) return showError(registerMessage, 'Passwords do not match');
  goToRegStep(3);
});

document.getElementById('reg-back-3').addEventListener('click', () => goToRegStep(2));

// ── Register submit ───────────────────────────────────────────────────────────
registerForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const registerMessage = document.getElementById('register-message');
  if (!document.getElementById('reg-terms').checked || !document.getElementById('reg-age').checked) {
    return showError(registerMessage, 'Please accept the terms to continue');
  }
  const username  = document.getElementById('register-username').value.trim();
  const password  = document.getElementById('register-password').value;
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const dob       = document.getElementById('reg-dob').value;
  const phone     = document.getElementById('reg-phone').value.trim();

  try {
    const email = `${username}@yourbank.app`;
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(userRef(user.uid), {
      username,
      firstName,
      lastName,
      dob,
      phone,
      movements: [1000],
      interestRate: 1.2,
      currency: 'EUR',
      locale: 'en-US',
      isNewUser: true,
    });
    const account = await loadAccount(user.uid);
    registerForm.reset();
    registerModal.classList.add('hidden');
    goToRegStep(1);
    await handleLoginSuccess(user, account, true);
  } catch (err) {
    const msg =
      err.code === 'auth/email-already-in-use'
        ? 'Username already taken'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 8 characters'
        : 'Registration failed. Try again.';
    showError(registerMessage, msg);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const email = `${username}@yourbank.app`;
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const account = await loadAccount(user.uid);
    await handleLoginSuccess(user, account, false);
  } catch {
    showError(loginMessage, 'Invalid username or password');
  }
});

// ── Transfer ──────────────────────────────────────────────────────────────────
btnTransfer.addEventListener('click', async function (e) {
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  const receiverUsername = inputTransferTo.value.trim();
  inputTransferAmount.value = inputTransferTo.value = '';

  if (!currentAccount || amount <= 0) return;
  if (receiverUsername === currentAccount.username) return;
  if (currentAccount.balance < amount) return;

  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', receiverUsername)
    );
    const snap = await getDocs(q);
    if (snap.empty) return alert('User not found');

    const receiverUid = snap.docs[0].id;
    await addMovement(currentUser.uid, -amount);
    await addMovement(receiverUid, amount);

    currentAccount = await loadAccount(currentUser.uid);
    updateUI(currentAccount);
    startLogoutTimer();
  } catch (err) {
    console.error('Transfer error:', err);
  }
});

// ── Loan ──────────────────────────────────────────────────────────────────────
btnLoan.addEventListener('click', async function (e) {
  e.preventDefault();
  const amount = Math.floor(Number(inputLoanAmount.value));
  inputLoanAmount.value = '';

  if (!currentAccount || amount <= 0) return;
  if (!currentAccount.movements.some(m => m >= amount * 0.1)) return;

  try {
    await addMovement(currentUser.uid, amount);
    currentAccount = await loadAccount(currentUser.uid);
    updateUI(currentAccount);
    startLogoutTimer();
  } catch (err) {
    console.error('Loan error:', err);
  }
});

// ── Close Account ─────────────────────────────────────────────────────────────
btnClose.addEventListener('click', async function (e) {
  e.preventDefault();
  const confirmUsername = inputCloseUsername.value.trim();
  const confirmPassword = inputClosePin.value;
  inputCloseUsername.value = inputClosePin.value = '';

  if (!currentAccount || confirmUsername !== currentAccount.username) return;

  try {
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      confirmPassword
    );
    await reauthenticateWithCredential(currentUser, credential);
    await deleteDoc(userRef(currentUser.uid));
    await currentUser.delete();

    clearInterval(timerInterval);
    containerApp.style.opacity = 0;
    landing.classList.remove('hidden');
    labelWelcome.textContent = 'Account closed. Goodbye!';
    currentAccount = null;
    currentUser = null;
  } catch (err) {
    console.error('Close account error:', err);
  }
});

// ── Sort ──────────────────────────────────────────────────────────────────────
btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  sorted = !sorted;
  displayMovements(currentAccount, sorted);
});
