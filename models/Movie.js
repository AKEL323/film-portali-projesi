const mongoose = require('mongoose');

// Filmlerimiz için bir şablon (Schema) oluşturuyoruz
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },        // Film Adı (Zorunlu)
  description: { type: String, required: true },  // Film Özeti (Zorunlu)
  genre: { type: String, required: true },        // Türü (Zorunlu)
  rating: { type: Number, default: 0 },           // Puanı (Varsayılan: 0)
  views: { type: Number, default: 0 },            // İzlenme Sayısı (Varsayılan: 0)
  posterUrl: { type: String }                     // Film Afişi Linki
}, { timestamps: true }); // timestamps: true özelliği, filmin ne zaman eklendiğini otomatik kaydeder.

// Bu kalıbı diğer dosyalarda kullanabilmek için dışarı aktarıyoruz
module.exports = mongoose.model('Movie', movieSchema);