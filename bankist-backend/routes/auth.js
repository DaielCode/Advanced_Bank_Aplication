const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Визначаємо шлях до users.json відносно поточного файлу
const usersFilePath = path.join(__dirname, '..', 'users.json');

// Секретний ключ для JWT (краще зберігати у .env файлі)
const JWT_SECRET = 'ТУТ_ПОВИНЕН_БУТИ_СЕКРЕТНИЙ_КЛЮЧ_ВЕЛИКИМИ_ЛІТЕРАМИ';

function readUsers() {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Реєстрація з хешуванням пароля
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Введіть імʼя та пароль' });
  }

  const users = readUsers();
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(409).json({ message: 'Користувач вже існує' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);

  res.status(201).json({ message: 'Користувача зареєстровано успішно!' });
});

// Логін із перевіркою пароля та створенням JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Введіть імʼя та пароль' });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res
      .status(401)
      .json({ message: 'Неправильне імʼя користувача або пароль' });
  }

  res.json({
    user: {
      username: account.username,
      owner: account.owner,
      type: account.type,
      interestRate: account.interestRate,
      movements: account.movements,
      balance: account.balance,
    },
  });

  const newAccount = new Account({
    username,
    password: hashedPassword,
    owner,
    type: 'basic',
    interestRate: 1.2,
    movements: [],
    balance: 0,
  });

  await newAccount.save();
  res.status(201).json({ message: 'User registered!' });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res
      .status(401)
      .json({ message: 'Неправильне імʼя користувача або пароль' });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ message: 'Успішний вхід', token });
});

module.exports = router;
