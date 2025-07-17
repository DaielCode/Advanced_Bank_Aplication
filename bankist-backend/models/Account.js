const express = require('express');
const Account = require('../models/Account');

const router = express.Router();

// Оновлення балансу, транзакцій тощо
router.patch('/update', async (req, res) => {
  const { username, movements, balance } = req.body;

  const account = await Account.findOne({ username });
  if (!account) return res.status(404).json({ message: 'Account not found' });

  account.movements = movements;
  account.balance = balance;

  await account.save();

  res.json({ message: 'Account updated' });
});

module.exports = router;
