const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Kullanıcı adı (Benzersiz olmalı)
  email: { type: String, required: true, unique: true },    // E-posta (Benzersiz olmalı)
  password: { type: String, required: true },               // Şifre (Şifrelenmiş olarak tutacağız)
  role: { type: String, default: 'user' }                   // Rolü: Normal kullanıcı (user) veya Admin (admin)
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);