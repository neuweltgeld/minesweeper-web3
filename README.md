# Minesweeper Web3

Web3 entegrasyonlu klasik Mayın Tarlası oyunu. Ethereum blockchain üzerinde çalışan, oyun hakları satın alınabilen ve liderlik tablosu olan bir oyun.

## 🎮 Özellikler

- Klasik Mayın Tarlası oyunu deneyimi
- Web3 entegrasyonu (Ethereum)
- Oyun hakları satın alma sistemi
- Liderlik tablosu
- Gerçek zamanlı skor takibi
- Responsive tasarım
- Pixel art tarzı arayüz

## 🛠️ Teknolojiler

- Next.js
- TypeScript
- Tailwind CSS
- Wagmi
- RainbowKit
- Ethers.js
- MongoDB
- Solidity

## 🚀 Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/neuweltgeld/minesweeper-web3.git
cd minesweeper-web3
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyası oluşturun:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
MONGODB_URI=your_mongodb_uri
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## 📝 Oyun Kuralları

- Her oyuncu günde 10 ücretsiz oyun hakkına sahiptir
- Ek oyun hakları 0.001 ETH karşılığında satın alınabilir
- Oyun 10x10'luk bir tahta üzerinde oynanır
- 20 mayın vardır
- Oyun süresi 120 saniyedir
- Sol tık ile kare açılır
- Sağ tık ile mayın işaretlenir
- Tüm mayınları işaretleyip diğer kareleri açarsanız kazanırsınız
- Mayına tıklarsanız kaybedersiniz

## 🏆 Skor Sistemi

- Skor, açılan kare sayısı ve kalan süreye göre hesaplanır
- Daha hızlı bitirmek daha yüksek skor getirir
- En yüksek skorlar liderlik tablosunda görüntülenir

## 🔒 Güvenlik

- Tüm işlemler blockchain üzerinde güvenli bir şekilde gerçekleşir
- Oyun hakları ve skorlar merkezi olmayan bir şekilde saklanır
- Kullanıcı cüzdanları güvenli bir şekilde bağlanır

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

- [Neuweltgeld](https://github.com/neuweltgeld)

## 🙏 Teşekkürler

- Oyunu oynayan ve geri bildirim veren tüm kullanıcılara
- Web3 topluluğuna
- Açık kaynak topluluğuna 