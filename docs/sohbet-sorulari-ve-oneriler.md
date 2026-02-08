# Sohbet ile Başla — Sorular ve Öneri Chip'leri

Bu belge, **"Sohbet ile Başla"** (Soru–cevap sohbeti, öneri chip'leri ve otomatik kayıt) yönteminde kullanılan tüm soruları, her soruda gösterilen **öneri chip'lerini** ve varsa **ipuçlarını** adım adım listeler.

Kaynak: `src/data/cvQuestions.ts` (chatEnabled: true olan sorular) ve sohbet arayüzü.

---

## Giriş metni

Sohbet başlarken kullanıcıya şu mesaj gösterilir:

- **Sistem:** "Merhaba. CV'nizi oluşturmak için soruları tek tek soracağım. İlk olarak adınızı ve soyadınızı alalım."
- **Soru 1** metni aşağıda yer alır.

---

## Soru listesi (1–25)

### 1. Ad ve soyad

- **Soru:** Adınız ve soyadınız nedir? (Özgeçmişinizde görünecek tam ad.)
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `Ahmet Yılmaz`
- **İpucu:** Yok

---

### 2. Doğum tarihi

- **Soru:** Doğum tarihiniz?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `1985`, `15.03.1985`
- **İpucu:** Yıl veya gün.ay.yıl yazabilirsiniz.

---

### 3. Telefon

- **Soru:** İletişim için telefon numaranız?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `+90 532 123 45 67`
- **İpucu:** Yok

---

### 4. E-posta

- **Soru:** E-posta adresiniz?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `ornek@email.com`
- **İpucu:** Yok

---

### 5. Meslek unvanı

- **Soru:** Meslek unvanınız veya yaptığınız işin adı nedir?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `Elektrik tesisatçı`, `Kaynakçı`, `Fayans ustası`
- **İpucu:** Örn: Elektrik tesisat, kaynak, fayans.

---

### 6. Tecrübe süresi

- **Soru:** Bu alanda kaç yıllık tecrübeniz var?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Evet
- **Öneri chip'leri:** `1-3 yıl`, `3-5 yıl`, `5+ yıl`, `10 yıl`
- **İpucu:** Yok

---

### 7. Kendinizi ve iş tecrübenizi özetleme

- **Soru:** Kendinizi ve iş tecrübenizi kısaca nasıl özetlersiniz? (1-2 cümle)
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** Yok (boş liste)
- **İpucu:** Yok

---

### 8. Son / şu anki firma

- **Soru:** Şu an çalıştığınız veya en son çalıştığınız firma adı?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `ABC İnşaat`, `Serbest`
- **İpucu:** Yok

---

### 9. Eğitim

- **Soru:** Eğitim durumunuz? (Okul, alan, yıl)
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Lise`, `Meslek lisesi - Elektrik 2005`
- **İpucu:** Yok

---

### 10. Diller

- **Soru:** Konuşabildiğiniz diller ve seviyeleri?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Türkçe (ana dil)`, `İngilizce (orta)`
- **İpucu:** Yok

---

### 11. Ehliyet

- **Soru:** Ehliyet sınıfınız var mı? Varsa hangisi?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `B`, `B, C1`, `Yok`
- **İpucu:** Yok

---

### 12. Pasaport

- **Soru:** Pasaportunuz var mı? Geçerli mi?
- **Alan tipi:** Seçim (select)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Evet, geçerli`, `Hayır`, `Yenileme aşamasında`
- **İpucu:** Yok

---

### 13. Yurtdışına çıkış zamanı

- **Soru:** Yurtdışında çalışmaya ne zaman hazırsınız?
- **Alan tipi:** Seçim (select)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Hemen`, `1 ay içinde`, `2-3 ay içinde`, `Belirsiz`
- **İpucu:** Yok

---

### 14. Vardiya / gece çalışma

- **Soru:** Vardiyalı veya gece çalışmaya uygun musunuz?
- **Alan tipi:** Seçim (select)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Evet`, `Hayır`, `Kısmen uygun`
- **İpucu:** Yok

---

### 15. Sertifikalar

- **Soru:** Mesleki sertifikalarınız veya eğitimleriniz var mı?
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Kaynak sertifikası`, `İSG belgesi`
- **İpucu:** Yok

---

### 16. Beceriler

- **Soru:** Öne çıkardığınız beceriler neler? (Araç, teknik, yöntem)
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Pano montaj`, `TIG kaynak`, `PLC`
- **İpucu:** Yok

---

### 17. Referanslar

- **Soru:** Referans verebileceğiniz bir eski işveren veya ustabaşı var mı? (İsim, firma, iletişim)
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** Yok (boş liste)
- **İpucu:** Yok

---

### 18. Hobiler

- **Soru:** CV'de belirtmek istediğiniz hobiler veya uğraşlar? (İsteğe bağlı)
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Futbol`, `Okuma`, `Atlayabilirsiniz`
- **İpucu:** Yok

---

### 19. Ek bilgi

- **Soru:** Eklemek istediğiniz başka bir bilgi var mı?
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** Yok (boş liste)
- **İpucu:** Yok

---

### 20. Şehir / bölge

- **Soru:** Yaşadığınız şehir veya bölge?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `İstanbul`, `Ankara`, `İzmir`
- **İpucu:** Yok

---

### 21. Adres tercihi

- **Soru:** Adres bilginizi CV'de göstermek ister misiniz? (İsteğe bağlı)
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Evet, yazabilirsiniz`, `Hayır`, `Sadece şehir`
- **İpucu:** Yok

---

### 22. Hedef ülke(ler)

- **Soru:** Hangi ülke veya ülkelerde çalışmak istiyorsunuz?
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Almanya`, `Hollanda`, `Almanya, Avusturya`
- **İpucu:** Yok

---

### 23. En erken işe başlama

- **Soru:** En erken ne zaman işe başlayabilirsiniz?
- **Alan tipi:** Seçim (select)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Hemen`, `2 hafta içinde`, `1 ay içinde`, `2-3 ay`
- **İpucu:** Yok

---

### 24. Maaş beklentisi (CV’de belirtme)

- **Soru:** Maaş beklentinizi CV'de veya başvuruda belirtmek ister misiniz? (İsteğe bağlı)
- **Alan tipi:** Metin (text)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** `Evet`, `Hayır`, `Görüşmede belirtirim`
- **İpucu:** Yok

---

### 25. Son not

- **Soru:** Son olarak eklemek istediğiniz bir cümle var mı?
- **Alan tipi:** Çok satır (multiline)
- **Zorunlu:** Hayır
- **Öneri chip'leri:** Yok (boş liste)
- **İpucu:** Yok

---

## Sohbet sonrası adımlar

25 soru bittikten sonra kullanıcıya:

1. **Hedef ülke ve meslek alanı** seçimi (açılır liste: ülke + meslek alanı) gösterilir.
2. Ardından **fotoğraf yükleme** adımına geçilir.

Bu iki adım sohbet soruları listesine dahil değildir; ayrı ekranlarda yapılır.

---

## Özet tablo

| # | Konu              | Soru (kısaca)                          | Öneri chip'leri |
|---|-------------------|----------------------------------------|------------------|
| 1 | Ad soyad          | Adınız ve soyadınız?                   | Ahmet Yılmaz     |
| 2 | Doğum tarihi      | Doğum tarihiniz?                        | 1985, 15.03.1985 |
| 3 | Telefon           | Telefon numaranız?                     | +90 532...       |
| 4 | E-posta           | E-posta adresiniz?                     | ornek@email.com  |
| 5 | Meslek unvanı     | Meslek unvanınız / işin adı?           | Elektrik tesisatçı, Kaynakçı, Fayans ustası |
| 6 | Tecrübe           | Kaç yıllık tecrübe?                    | 1-3 yıl, 3-5 yıl, 5+ yıl, 10 yıl |
| 7 | Özet              | Kendinizi özetleyin (1-2 cümle)        | —                |
| 8 | Firma             | Son/şu anki firma adı?                 | ABC İnşaat, Serbest |
| 9 | Eğitim            | Eğitim (okul, alan, yıl)?              | Lise, Meslek lisesi - Elektrik 2005 |
|10 | Diller            | Diller ve seviyeleri?                  | Türkçe (ana dil), İngilizce (orta) |
|11 | Ehliyet           | Ehliyet sınıfı?                        | B, B C1, Yok     |
|12 | Pasaport          | Pasaport var mı, geçerli mi?           | Evet geçerli, Hayır, Yenileme aşamasında |
|13 | Yurtdışı hazırlık | Ne zaman hazırsınız?                   | Hemen, 1 ay, 2-3 ay, Belirsiz |
|14 | Vardiya           | Vardiyalı/gece uygun musunuz?          | Evet, Hayır, Kısmen uygun |
|15 | Sertifikalar      | Sertifika/eğitim?                      | Kaynak sertifikası, İSG belgesi |
|16 | Beceriler         | Öne çıkan beceriler?                   | Pano montaj, TIG kaynak, PLC |
|17 | Referanslar       | Referans (isim, firma, iletişim)?      | —                |
|18 | Hobiler           | Hobiler (isteğe bağlı)?                | Futbol, Okuma, Atlayabilirsiniz |
|19 | Ek bilgi          | Başka eklemek istediğiniz?             | —                |
|20 | Şehir             | Yaşadığınız şehir/bölge?               | İstanbul, Ankara, İzmir |
|21 | Adres tercihi     | CV'de adres gösterilsin mi?            | Evet yazabilirsiniz, Hayır, Sadece şehir |
|22 | Hedef ülke        | Hangi ülkede çalışmak istiyorsunuz?   | Almanya, Hollanda, Almanya Avusturya |
|23 | İşe başlama       | En erken ne zaman?                     | Hemen, 2 hafta, 1 ay, 2-3 ay |
|24 | Maaş (belirtme)   | Maaş beklentisi CV'de?                 | Evet, Hayır, Görüşmede belirtirim |
|25 | Son not           | Son eklemek istediğiniz cümle?         | —                |

---

*Belge, `src/data/cvQuestions.ts` ve sohbet arayüzüne göre oluşturulmuştur. Güncellemek için cvQuestions.ts içindeki `question`, `examples` ve `hint` alanlarını düzenleyin.*
