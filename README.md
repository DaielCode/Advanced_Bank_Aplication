# YourBank 🏦

A full-featured banking demo app built with vanilla JavaScript and Firebase — simulating real-world banking: secure auth, instant transfers, live exchange rates, and multi-currency support.

**Live demo:** https://yourbankapp.web.app

---

## Features

- **Firebase Authentication** — register, sign in, sign out, close account
- **Instant Transfers** — send money to any YourBank user in real time
- **Loan on Demand** — request a loan based on deposit history
- **Live Exchange Rates** — real-time ECB data via `frankfurter.app` API
- **Multi-currency** — view balance in EUR, USD, GBP, PLN, UAH, CHF
- **Full Transaction History** — every deposit, transfer and loan logged and sortable
- **€1,000 Welcome Bonus** — credited instantly on registration
- **Auto logout** — session timer with countdown

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES6+), HTML, CSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Rates API | frankfurter.app (European Central Bank) |
| Hosting | Firebase Hosting |

---

## Getting Started

1. Clone the repo
2. Copy `firebase-config.example.js` → `firebase-config.js` and fill in your Firebase credentials
3. Open `index.html` in a browser or serve with any static server

> **Note:** `firebase-config.js` is gitignored. Never commit real credentials.

---

## Project Structure

```
├── index.html
├── script.js          # All app logic
├── style.css
├── firebase-config.js # Your Firebase config (gitignored)
├── firebase.json      # Firebase Hosting config
└── bankist-backend/   # Backend utils
```

---

## Screenshots

![YourBank landing page](https://yourbankapp.web.app)

---

*Demo project — not a real financial institution. No real money or personal data is processed.*
