const Account = require('../models/Account');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // Додай цей рядок

// Реєстрація нового акаунту
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Перевірка, чи користувач існує
    const existing = await Account.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    const account = new Account({ username, password: hashedPassword });
    await account.save();

    res.status(201).json({ message: 'Account created', account });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Логін
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const account = await Account.findOne({ username });
    if (!account) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Генеруємо JWT токен
    const token = jwt.sign(
      { id: account._id, username: account.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Отримати дані акаунту (приклад, після auth)
exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    res.json(account);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Додати рух (movement)
exports.addMovement = async (req, res) => {
  const { movement, balance } = req.body;

  try {
    const account = await Account.findById(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    account.movements.push(movement);
    account.balance = balance;

    await account.save();

    res.json({ message: 'Movement added', account });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
