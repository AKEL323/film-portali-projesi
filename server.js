const express = require('express');
const path = require('path'); // Dosya yollarını bulmamızı sağlayan araç
const mongoose = require('mongoose'); // Mongoose'u dahil ettik
const bcrypt = require('bcryptjs'); // Şifreleme aracı
const Movie = require('./models/Movie'); // Film modelimizi projemize dahil ettik
const User = require('./models/User'); // Kullanıcı modelini dahil ettik
const Comment = require('./models/Comment');
const app = express();
app.use(express.json()); // Frontend'den gelen JSON verilerini okumamızı sağlar
const port = process.env.PORT || 3000;

// Veritabanı Bağlantı Linki (Kopyaladığın linki buraya yapıştıracaksın)
const dbURL = "mongodb+srv://furkanadmin:film123@cluster0.isiodpg.mongodb.net/?appName=Cluster0";

// MongoDB'ye Bağlanma İşlemi
mongoose.connect(dbURL)
  .then(() => console.log("🥳 Harika! MongoDB Veritabanına başarıyla bağlandık!"))
  .catch((hata) => console.log("Veritabanı bağlantı hatası: ", hata));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Tarayıcıdan bu adrese girildiğinde veritabanına bir film ekleyecek
app.get('/test-film-ekle', async (req, res) => {
  try {
    const yeniFilm = new Movie({
      title: "Inception (Başlangıç)",
      description: "Rüya içinde rüya... Dom Cobb çok yetenekli bir hırsızdır.",
      genre: "Bilim Kurgu",
      rating: 8.8,
      posterUrl: "https://ornek.com/inception-afis.jpg"
    });
    
    await yeniFilm.save(); // Hazırlanan filmi MongoDB'ye kaydet!
    res.send("🎬 Film başarıyla veritabanına eklendi! MongoDB Atlas üzerinden kontrol edebilirsin.");
  } catch (hata) {
    res.send("Bir hata oluştu: " + hata);
  }
});
// Test amaçlı kullanıcı kayıt sistemi
app.get('/test-kayit', async (req, res) => {
  try {
    // 1. Şifreyi güvenli hale getir (Şifreleme)
    const salt = await bcrypt.genSalt(10);
    const guvenliSifre = await bcrypt.hash("benimsifrem123", salt);

    // 2. Yeni kullanıcıyı oluştur
    const yeniKullanici = new User({
      username: "furkanyazilimci",
      email: "furkan@ornek.com",
      password: guvenliSifre
    });

    // 3. Veritabanına kaydet
    await yeniKullanici.save();
    res.send("👤 Kullanıcı başarıyla kaydedildi! Şifresi gizlendi.");
  } catch (hata) {
    res.send("Kayıt sırasında hata oluştu (Bu mail veya kullanıcı adı zaten alınmış olabilir): " + hata);
  }
});
// --- KULLANICI KAYIT VE GİRİŞ ROTALARI --- //
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const guvenliSifre = await bcrypt.hash(password, salt);
    
    const yeniKullanici = new User({ username, email, password: guvenliSifre });
    await yeniKullanici.save();
    res.status(201).json({ mesaj: "Kayıt başarılı!" });
  } catch (hata) {
    res.status(500).json({ hata: "Bu email veya kullanıcı adı zaten kullanımda olabilir." });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const kullanici = await User.findOne({ email });
    if (!kullanici) return res.status(404).json({ hata: "Kullanıcı bulunamadı." });

    const sifreDogruMu = await bcrypt.compare(password, kullanici.password);
    if (!sifreDogruMu) return res.status(400).json({ hata: "Hatalı şifre girdiniz." });

    res.json({ mesaj: "Giriş başarılı", username: kullanici.username });
  } catch (hata) {
    res.status(500).json({ hata: "Giriş işlemi sırasında hata oluştu." });
  }
});
// Tüm filmleri getiren, ARAMA ve FİLTRELEME yapabilen rotamız
app.get('/api/movies', async (req, res) => {
  try {
    const { aranankelime, tur } = req.query; // URL'den gelen arama ve tür verilerini al
    let filtre = {}; // Başlangıçta boş bir filtre (her şeyi getir demek)

    // Eğer kullanıcı arama kutusuna bir şey yazmışsa
    if (aranankelime) {
      // $regex ile isminde o kelime geçenleri buluruz. $options: 'i' büyük/küçük harf duyarlılığını kaldırır.
      filtre.title = { $regex: aranankelime, $options: 'i' }; 
    }

    // Eğer kullanıcı bir tür seçmişse
    if (tur && tur !== '') {
      filtre.genre = tur; // Sadece o türe ait olanları bul
    }

    const filmler = await Movie.find(filtre); // Filtreye uyan filmleri veritabanından getir
    res.json(filmler);
  } catch (hata) {
    res.status(500).json({ mesaj: "Filmler getirilirken hata oluştu" });
  }
});
// Yeni film ekleme rotası (POST)
app.post('/api/movies', async (req, res) => {
  try {
    const yeniFilm = new Movie({
      title: req.body.title,
      description: req.body.description,
      genre: req.body.genre,
      rating: req.body.rating,
      posterUrl: req.body.posterUrl
    });
    
    await yeniFilm.save(); // Formdan gelenleri veritabanına kaydet
    res.status(201).json({ mesaj: "Film başarıyla eklendi" });
  } catch (hata) {
    res.status(500).json({ hata: "Film eklenemedi" });
  }
});
// Tek bir filmi getirme ve Görüntülenme Sayısını artırma rotası
app.get('/api/movies/:id', async (req, res) => {
  try {
    // Filmi ID'sine göre bul ve 'views' değerini 1 artır ($inc komutu ile)
    const film = await Movie.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true } // Güncellenmiş yeni halini geri döndür
    );
    
    if (!film) return res.status(404).json({ mesaj: "Film bulunamadı" });
    
    res.json(film); // Filmi frontend'e gönder
  } catch (hata) {
    res.status(500).json({ mesaj: "Hata oluştu" });
  }
});

// Tarayıcıdan detay sayfasına girildiğinde detay.html'i göster
app.get('/detay.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'detay.html'));
});
// Tarayıcıdan /ekle adresine girildiğinde form sayfasını göster
app.get('/ekle', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ekle.html'));
});;
// --- PUANLAMA API ROTASI --- //
app.post('/api/movies/:id/rate', async (req, res) => {
  try {
    const { verilenPuan } = req.body; 

    // Gelen puanın 1 ile 10 arasında olduğunu kontrol et
    if (!verilenPuan || verilenPuan < 1 || verilenPuan > 10) {
      return res.status(400).json({ hata: "Lütfen 1 ile 10 arasında geçerli bir puan verin." });
    }

    // Puan verilecek filmi veritabanından bul
    const film = await Movie.findById(req.params.id);
    if (!film) return res.status(404).json({ mesaj: "Film bulunamadı." });

    // Mevcut puanı al (Eğer puanı yoksa 0 kabul et)
    let mevcutPuan = film.rating || 0;
    
    // Yeni ortalamayı hesapla (Eğer daha önce hiç puan almamışsa direkt verilen puanı kaydet)
    let yeniOrtalama = mevcutPuan === 0 ? verilenPuan : (mevcutPuan + verilenPuan) / 2;
    
    // Virgülden sonra tek haneli olacak şekilde (örneğin 8.5) ayarla
    film.rating = Number(yeniOrtalama.toFixed(1)); 

    // Veritabanına kaydet
    await film.save();

    res.json({ mesaj: "Puanınız başarıyla kaydedildi!", guncelPuan: film.rating });
  } catch (hata) {
    res.status(500).json({ hata: "Puan verilirken bir hata oluştu." });
  }
});
// --- YORUM API ROTALARI --- //

// 1. Yeni Yorum Kaydetme (POST)
app.post('/api/comments', async (req, res) => {
  try {
    const { movieId, author, text } = req.body;
    const yeniYorum = new Comment({ movieId, author, text });
    await yeniYorum.save();
    res.status(201).json({ mesaj: "Yorum başarıyla eklendi!" });
  } catch (hata) {
    res.status(500).json({ hata: "Yorum kaydedilemedi." });
  }
});

// 2. Bir Filme Ait Tüm Yorumları Getirme (GET)
app.get('/api/comments/:movieId', async (req, res) => {
  try {
    // Filme ait yorumları bul ve en yeniden eskiye sırala
    const yorumlar = await Comment.find({ movieId: req.params.movieId }).sort({ createdAt: -1 });
    res.json(yorumlar);
  } catch (hata) {
    res.status(500).json({ hata: "Yorumlar getirilemedi." });
  }
});
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor!`);
});
// Tarayıcıdan /login adresine girildiğinde giriş sayfasını göster
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});