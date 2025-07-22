const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Реєстрація
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Введіть імʼя та пароль' });

  try {
    const existing = await Account.findOne({ username });
    if (existing)
      return res.status(409).json({ message: 'Користувач вже існує' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = new Account({ username, password: hashedPassword });
    await account.save();

    res.status(201).json({ message: 'Користувача зареєстровано успішно!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверна помилка' });
  }
});

// Логін
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Введіть імʼя та пароль' });

  try {
    const account = await Account.findOne({ username });
    if (!account)
      return res
        .status(401)
        .json({ message: 'Неправильне імʼя користувача або пароль' });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: 'Неправильне імʼя користувача або пароль' });

    const token = jwt.sign(
      { id: account._id, username: account.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Успішний вхід', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверна помилка' });
  }
});

module.exports = router;
