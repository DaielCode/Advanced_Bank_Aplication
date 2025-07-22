const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const accountController = require('../controllers/accountController');

// register

router.post('/register', accountController.register);
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Отримано логін-запит:', req.body);

  if (!username || !password) {
    console.log('Відсутній username або password');
    return res.status(400).json({ message: 'Введіть імʼя та пароль' });
  }

  try {
    const account = await Account.findOne({ username });
    console.log('Знайдений акаунт:', account);

    if (!account) {
      console.log('Акаунт не знайдено');
      return res
        .status(401)
        .json({ message: 'Неправильне імʼя користувача або пароль' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    console.log('Порівняння пароля:', isMatch);

    if (!isMatch) {
      console.log('Пароль не співпадає');
      return res
        .status(401)
        .json({ message: 'Неправильне імʼя користувача або пароль' });
    }

    const token = jwt.sign(
      { id: account._id, username: account.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Логін успішний, токен:', token);
    res.json({ message: 'Успішний вхід', token });
  } catch (err) {
    console.error('Помилка при логіні:', err);
    res.status(500).json({ message: 'Серверна помилка' });
  }
});
// login – маєш уже

// get account data
router.get('/me', auth, accountController.getAccount);

// add movement
router.post('/movements', auth, accountController.addMovement);

module.exports = router;
