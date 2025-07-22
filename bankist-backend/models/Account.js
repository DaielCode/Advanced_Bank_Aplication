const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  movements: { type: [Number], default: [] },
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
