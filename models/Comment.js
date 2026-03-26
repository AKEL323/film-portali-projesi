const mongoose = require('mongoose');

// Yorumların veritabanındaki şablonu
const commentSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true }, // Hangi filme yapıldı?
  author: { type: String, required: true }, // Yorumu yapanın kullanıcı adı
  text: { type: String, required: true }    // Yorumun içeriği
}, { timestamps: true }); // Ne zaman yazıldığını otomatik tutar

module.exports = mongoose.model('Comment', commentSchema);