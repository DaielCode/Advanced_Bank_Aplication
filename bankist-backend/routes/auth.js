const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const usersFilePath = path.join(process.cwd(), 'bankist-backend', 'users.json');
const JWT_SECRET = 'тут_повинен_бути_секретний_ключ_великими_літерами'; // Заміни на свій секрет!

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

// Реєстрація (оновлено для хешування пароля)
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

// Логін
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

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res
      .status(401)
      .json({ message: 'Неправильне імʼя користувача або пароль' });
  }

  // Створюємо JWT токен
  const token = jwt.sign({ username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ message: 'Успішний вхід', token });
});

module.exports = router;
