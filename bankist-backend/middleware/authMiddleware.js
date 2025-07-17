const jwt = require('jsonwebtoken');

const secret = 'your_jwt_secret_key'; // Потім можна винести в .env

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Очікуємо формат: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен не надано' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Токен недійсний' });
    }
    req.user = user; // Передаємо дані користувача далі
    next();
  });
}

module.exports = authenticateToken;
