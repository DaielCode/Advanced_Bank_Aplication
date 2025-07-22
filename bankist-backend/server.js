const mongoose = require('mongoose');
require('dotenv').config();

mongoose
  .connect('mongodb://localhost:27017/bankist', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

const express = require('express');
const authRouter = require('./routes/auth');
const accountRoutes = require('./routes/accountRoutes'); // або правильна назва твого файлу

const cors = require('cors');
const app = express();

app.use(
  cors({
    origin: 'http://127.0.0.1:5500', // тут вкажи адресу твого фронтенда
    credentials: true,
  })
);

// інші middleware і маршрути

const authenticateToken = require('./middleware/authMiddleware');

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/bankist');

app.use('/auth', authRouter);

app.use('/accounts', accountRoutes);

// Захищений роут
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Привіт, ${req.user.username}! Це захищена інформація.`,
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
