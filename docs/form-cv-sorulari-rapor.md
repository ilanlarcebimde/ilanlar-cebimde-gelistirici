# Form ile CV Toplama — Sorular, Öneriler, İpuçları ve Kullanıcı İşlemleri Raporu

Bu rapor, **Form ile** CV toplama yönteminde yer alan tüm soruları, her sorudaki kullanıcı işlemlerini, seçimleri, ipuçlarını ve soru kalıplarını tek tek listeler.

---

## Genel akış

1. **Soru fazı:** 25 soru (Soru 1/25 … Soru 25/25), tek tek gösterilir.
2. **Hedef ülke ve meslek:** Ülke (dropdown), Meslek alanı (dropdown), Meslek dalı (dropdown).
3. **Fotoğraf:** Profil fotoğrafı yükleme (opsiyonel).

Her soru ekranında:
- **Soru metni** (başlık)
- **İpucu** (varsa; formda `formHint` yoksa `hint` kullanılır)
- **Giriş alanı:** metin kutusu (text), çok satırlı metin (multiline) veya seçim listesi (select)
- **Öneri chip’leri:** Sadece `text` ve `select` sorularda; tıklanınca ilgili değer alana yazılır (multiline’da chip yok)
- **İleri / Geri** butonları (ilk soruda Geri devre dışı)

---

## Soru kalıpları ve alan tipleri

| Tip       | Arayüz | Kullanıcı işlemi |
|----------|--------|-------------------|
| **text** | Tek satır input (type="text" veya type="email") | Serbest metin yazma; isteğe bağlı chip’e tıklayıp öneriyi alana yazma |
| **multiline** | Textarea (4 satır) | Çok satır serbest metin; chip gösterilmez |
| **select** | Dropdown (options listesi) | Listeden tek seçenek seçme; chip’ler öneri amaçlı, tıklanınca o metin alana yazılır |

---

## Zorunluluk kuralları (Form)

- **formRequired: true** olan soruda: Alan dolu olmadan **İleri** aktif olmaz.
- **E-posta** sorusunda ek kural: Geçerli e-posta formatı (`...@....`) gerekir; yoksa İleri devre dışı.
- Diğer sorularda **required: false** ise alan boş bırakılabilir; İleri her zaman tıklanabilir (ülke/meslek ve fotoğraf fazları kendi kurallarına tabi).

---

# Soru bazlı detay rapor

---

## Soru 1 / 25 — Ad soyad

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Adınız ve soyadınız nedir? |
| **Tip** | text |
| **Zorunlu** | Evet |
| **İpucu** | 💡 Adınızı kimlik veya pasaportunuzda yazdığı şekilde girin. |
| **Kayıt alanı** | `personal.fullName` |

**Öneri chip’leri (tıklanınca input’a yazılır):**
- Resmî belgelerdeki gibi yazın
- Kısaltma kullanmayın
- Takma ad yazmayın
- Ad + Soyad birlikte olmalı
- Türkçe karakter kullanabilirsiniz

**Kullanıcının yapabilecekleri:** Serbest metin yazmak; isterse bir chip’e tıklayıp o cümleyi alana almak. İleri için en az bir karakter girmek gerekir.

---

## Soru 2 / 25 — Doğum tarihi

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Doğum tarihiniz nedir? |
| **Tip** | text |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Yıl veya gün.ay.yıl şeklinde yazabilirsiniz. |
| **Kayıt alanı** | `personal.birthDate` |

**Öneri chip’leri:**
- Sadece yıl yazabilirsiniz
- Gün.ay.yıl da olur
- Yaklaşık yazmayın
- Yanlış tarih sorun çıkarabilir
- İsterseniz boş bırakın

**Kullanıcının yapabilecekleri:** Tarih yazmak veya boş bırakmak; chip’lerden birini tıklayıp alana yazmak. İleri her zaman kullanılabilir.

---

## Soru 3 / 25 — Telefon

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Telefon numaranız nedir? |
| **Tip** | text |
| **Zorunlu** | Evet |
| **İpucu** | 💡 Ülke kodu ile yazın. Örn: +90... |
| **Kayıt alanı** | `personal.phone` |

**Öneri chip’leri:**
- Ülke kodu ile yazın
- Aktif kullandığınız numara olsun
- WhatsApp kullanılan numara iyi olur
- Boşluk koyabilirsiniz
- Yanlış numara işverenin ulaşmasını engeller

**Kullanıcının yapabilecekleri:** Numara yazmak; chip’e tıklamak. İleri için alanın dolu olması gerekir.

---

## Soru 4 / 25 — E-posta

| Özellik | Değer |
|--------|--------|
| **Soru metni** | E-posta adresinizi girin. |
| **Tip** | text (input type="email") |
| **Zorunlu** | Evet (form) + geçerli e-posta formatı |
| **İpucu (form)** | 💡 Geçerli bir e-posta adresi girin. |
| **Kayıt alanı** | `personal.email` |

**Öneri chip’leri:**
- Aktif kullandığınız adres olsun
- Basit ve ciddi bir adres tercih edin
- Örn: ad.soyad@email.com

**Kullanıcının yapabilecekleri:** Geçerli e-posta yazmak; chip’e tıklamak. İleri yalnızca geçerli e-posta (örn. `x@y.z`) girildiğinde aktif olur.

---

## Soru 5 / 25 — Şehir / ülke

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Şu an nerede yaşıyorsunuz? (Şehir, ülke) |
| **Tip** | text |
| **Zorunlu** | Evet |
| **İpucu** | 💡 Sadece şehir ve ülke yazmanız yeterli. |
| **Kayıt alanı** | `personal.city` |

**Öneri chip’leri:**
- Sadece şehir ve ülke yeterli
- Mahalle/adres yazmayın
- Taşındıysanız günceli yazın
- İşveren için önemli bir bilgidir
- Kısa yazın

**Kullanıcının yapabilecekleri:** Şehir/ülke yazmak; chip’e tıklamak. İleri için alan dolu olmalı.

---

## Soru 6 / 25 — Meslek unvanı

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Hangi işi yapıyorsunuz? (Mesleğiniz) |
| **Tip** | text |
| **Zorunlu** | Evet |
| **İpucu** | 💡 Günlük yaptığınız işi kısa şekilde yazın. |
| **Kayıt alanı** | `work.title` |

**Öneri chip’leri:**
- Günlük yaptığınız işi yazın
- Tek cümle yeterli
- Resmî unvan şart değil
- Usta / yardımcı farkını yazabilirsiniz
- Abartılı yazmayın

**Kullanıcının yapabilecekleri:** Meslek adı yazmak; chip’e tıklamak. İleri için dolu olmalı.

---

## Soru 7 / 25 — Deneyim süresi

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Bu işte kaç yıldır çalışıyorsunuz? |
| **Tip** | select |
| **Zorunlu** | Evet |
| **İpucu** | 💡 Yakın olan aralığı seçin. |
| **Kayıt alanı** | `work.experienceYears` |

**Seçenekler (dropdown):**
- 0–1 yıl
- 1–3 yıl
- 3–5 yıl
- 5–10 yıl
- 10+ yıl

**Öneri chip’leri:**
- Yakın olan aralığı seçin
- Toplam deneyimi düşünün
- Ara verdiyseniz yine toplam yazın
- Kesin değilse en yakını seçin
- Doğru bilgi iş bulmayı hızlandırır

**Kullanıcının yapabilecekleri:** Dropdown’dan tek seçenek seçmek; chip’e tıklayıp o metni alana yazmak (select’te chip metin olarak yazılır). İleri için bir seçim gerekir.

---

## Soru 8 / 25 — İş özeti (ne yapıyorsunuz)

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Bu işte genelde neler yaparsınız? (kısa maddeler) |
| **Tip** | multiline |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Teknik terim şart değil; kısa ve anlaşılır yazın. |
| **Kayıt alanı** | `work.summary` |

**Öneri chip’leri:** Formda multiline sorularda chip gösterilmez.

**Kullanıcının yapabilecekleri:** Çok satırlı serbest metin yazmak; boş bırakabilir. İleri her zaman kullanılabilir.

---

## Soru 9 / 25 — İş yeri adı

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Şu an çalıştığınız veya en son çalıştığınız iş yeri adı nedir? |
| **Tip** | text |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Şirket yoksa 'Serbest' yazabilirsiniz. |
| **Kayıt alanı** | `work.currentCompany` |

**Öneri chip’leri:**
- Şirket adını yazabilirsiniz
- Bilmiyorsanız boş bırakın
- 'Serbest' yazabilirsiniz
- Ustabaşı/ekip adı yazabilirsiniz
- Kısa yeterli

**Kullanıcının yapabilecekleri:** Metin yazmak veya boş bırakmak; chip’e tıklamak.

---

## Soru 10 / 25 — İş türü / sektör

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Daha çok hangi tür işlerde çalıştınız? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 En çok çalıştığınız alanı seçin. |
| **Kayıt alanı** | `work.sector` |

**Seçenekler (dropdown):**
- Şantiye / inşaat
- Fabrika / üretim
- Bakım-onarım
- Tadilat / ev işleri
- Depo / lojistik
- Diğer

**Öneri chip’leri:**
- En çok çalıştığınız alanı seçin
- Birden fazlaysa en baskın olan
- Kararsızsanız boş bırakın
- İşveren filtrelemesinde kullanılır
- Doğru seçmek önemlidir

**Kullanıcının yapabilecekleri:** Dropdown’dan seçim yapmak veya boş bırakmak; chip’e tıklamak.

---

## Soru 11 / 25 — Eğitim

| Özellik | Değer |
|--------|--------|
| **Soru metni** | En son mezun olduğunuz eğitim nedir? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Kısa seçim yeterli. |
| **Kayıt alanı** | `education.primary` |

**Seçenekler (dropdown):**
- İlkokul
- Ortaokul
- Lise
- Meslek lisesi
- Diğer

**Öneri chip’leri:**
- Kısa seçim yeterli
- Meslek lisesi varsa seçin
- Devam ediyorsanız 'Diğer' seçin
- Okul adı şart değil
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Dropdown’dan seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 12 / 25 — Yabancı dil

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Yabancı dil biliyor musunuz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 En doğru seviyeyi seçin. |
| **Kayıt alanı** | `languages` |

**Seçenekler (dropdown):**
- Hayır
- Biraz
- Orta
- İyi

**Öneri chip’leri:**
- En doğru seviyeyi seçin
- Abartmayın
- Biraz bile iş görür
- İş bulmada avantaj sağlar
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seviye seçmek veya boş bırakmak; chip’e tıklamak.

---

## Soru 13 / 25 — Ehliyet

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Ehliyetiniz var mı? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Varsa en yakın seçeneği seçin. |
| **Kayıt alanı** | `mobility.drivingLicense` |

**Seçenekler (dropdown):**
- Yok
- Var (B)
- Var (C)
- Var (Diğer)

**Öneri chip’leri:**
- Vardiyalı işler için avantaj olabilir
- Bilmiyorsanız boş bırakın
- Var ise mutlaka belirtin
- Aktif kullanıyorsanız daha iyi
- Yanlış yazmayın

**Kullanıcının yapabilecekleri:** Dropdown’dan seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 14 / 25 — Araç kullanımı

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Aktif araç kullanabiliyor musunuz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Günlük araç kullanıyorsanız 'Evet' seçin. |
| **Kayıt alanı** | `mobility.vehicleUsage` |

**Seçenekler (dropdown):**
- Evet
- Hayır
- Bazen

**Öneri chip’leri:**
- Günlük kullanıyorsanız seçin
- Şirket servis/araç işlerinde önemli
- Kararsızsanız 'Bazen'
- Yalan bilgi vermeyin
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim yapmak veya boş bırakmak; chip’e tıklamak.

---

## Soru 15 / 25 — Pasaport

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Pasaportunuz var mı? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Yurt dışı için önemli; yoksa sorun değil. |
| **Kayıt alanı** | `mobility.passport` |

**Seçenekler (dropdown):**
- Evet (geçerli)
- Hayır
- Yenileme/başvuru aşamasında

**Öneri chip’leri:**
- Varsa belirtmek avantaj
- Yoksa sorun değil
- Süreçteyseniz söyleyin
- Geçerliyse seçin
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 16 / 25 — Yurt dışına hazırlık

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Yurt dışında çalışmaya ne zaman hazırsınız? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Gerçekçi olanı seçin. |
| **Kayıt alanı** | `mobility.travelReady` |

**Seçenekler (dropdown):**
- Hemen
- 1 ay içinde
- 2–3 ay içinde
- Daha sonra
- Belirsiz

**Öneri chip’leri:**
- Gerçekçi olanı seçin
- İşveren planı için önemli
- Belirsizse 'Belirsiz'
- Yakın tarih avantaj olabilir
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 17 / 25 — Vardiya / gece

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Vardiyalı veya gece çalışmaya uygun musunuz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Uygunsanız belirtmek iş seçeneğini artırır. |
| **Kayıt alanı** | `mobility.shiftWork` |

**Seçenekler (dropdown):**
- Evet
- Hayır
- Kısmen

**Öneri chip’leri:**
- Uygunsanız belirtin
- Sağlık durumunuzu düşünün
- Kısmen seçeneği var
- İşveren için önemli
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 18 / 25 — Fazla mesai

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Fazla mesai yapabilir misiniz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Duruma göre ise 'Duruma göre' seçin. |
| **Kayıt alanı** | `work.overtime` |

**Seçenekler (dropdown):**
- Evet
- Hayır
- Duruma göre

**Öneri chip’leri:**
- Duruma göre seçeneği var
- İş bulmayı kolaylaştırabilir
- Gerçekçi olun
- Şartlar değişebilir
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 19 / 25 — Şehir değiştirme

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Gerekirse şehir değiştirebilir misiniz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Taşınma durumu iş seçeneklerini etkiler. |
| **Kayıt alanı** | `mobility.relocation` |

**Seçenekler (dropdown):**
- Evet
- Hayır
- Duruma göre

**Öneri chip’leri:**
- İş seçeneklerini artırır
- Aile durumunuza göre seçin
- Duruma göre seçeneği var
- Gerçekçi olun
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 20 / 25 — Sertifika / belge

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Mesleki belgeniz veya sertifikanız var mı? |
| **Tip** | multiline |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Varsa sadece adını yazmanız yeterli. |
| **Kayıt alanı** | `certificates` |

**Öneri chip’leri:** Multiline’da formda chip yok.

**Kullanıcının yapabilecekleri:** Çok satırlı metin yazmak; boş bırakabilir.

---

## Soru 21 / 25 — İş güvenliği uyumu

| Özellik | Değer |
|--------|--------|
| **Soru metni** | İş güvenliği kurallarına uyum konusunda kendinizi nasıl görürsünüz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 İşverenler bu konuya önem verir. |
| **Kayıt alanı** | `work.safetyCompliance` |

**Seçenekler (dropdown):**
- Çok dikkat ederim
- Dikkat ederim
- Geliştirmek isterim

**Öneri chip’leri:**
- İşverenler önem verir
- Dürüst cevap verin
- Geliştirmek isterim demek sorun değil
- Kısa ve net
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 22 / 25 — Hedef ülke/bölge

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Hangi ülke veya bölgede çalışmak istersiniz? |
| **Tip** | text |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Birden fazla yazabilirsiniz, öncelik sırasıyla. |
| **Kayıt alanı** | `mobility.targetCountry` |

**Öneri chip’leri:**
- Birden fazla yazabilirsiniz
- Öncelik sırasıyla yazın
- Gitmeye hazır olduğunuzu yazın
- Kararsızsanız boş bırakın
- Şehir adı da yazabilirsiniz

**Kullanıcının yapabilecekleri:** Serbest metin; chip’e tıklamak; boş bırakabilir.

---

## Soru 23 / 25 — En erken başlama

| Özellik | Değer |
|--------|--------|
| **Soru metni** | En erken ne zaman işe başlayabilirsiniz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Gerçekçi olanı seçin. |
| **Kayıt alanı** | `mobility.earliestStart` |

**Seçenekler (dropdown):**
- Hemen
- 2 hafta içinde
- 1 ay içinde
- 2–3 ay içinde
- Belirsiz

**Öneri chip’leri:**
- Gerçekçi olanı seçin
- Yakın başlama avantaj olabilir
- Belirsizse 'Belirsiz'
- Planınıza göre seçin
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 24 / 25 — Maaş notu

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Maaş konusunu CV'de yazmak ister misiniz? |
| **Tip** | select |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Genelde CV'ye yazmak zorunlu değildir. |
| **Kayıt alanı** | `work.salaryNote` |

**Seçenekler (dropdown):**
- Hayır
- Evet
- Görüşmede konuşmak isterim

**Öneri chip’leri:**
- CV'ye yazmak zorunlu değil
- Görüşmede konuşmak yaygın
- İsterseniz yazmayın
- Ülkeye göre değişebilir
- Boş bırakabilirsiniz

**Kullanıcının yapabilecekleri:** Seçim; chip’e tıklamak; boş bırakabilir.

---

## Soru 25 / 25 — Ek not

| Özellik | Değer |
|--------|--------|
| **Soru metni** | Eklemek istediğiniz başka bir bilgi var mı? |
| **Tip** | multiline |
| **Zorunlu** | Hayır |
| **İpucu** | 💡 Önemli bir şey yoksa boş bırakın. |
| **Kayıt alanı** | `finalNote` |

**Öneri chip’leri:** Multiline’da formda chip yok.

**Kullanıcının yapabilecekleri:** Çok satırlı metin; boş bırakabilir. Bu sorudan sonra **İleri** ile “Devam et” gelir ve **Hedef ülke ve meslek** fazına geçilir.

---

# Hedef ülke ve meslek (soru sonrası ortak adım)

Bu adım soru listesinde yer almaz; 25 soru bittikten sonra tek ekranda gelir.

| Alan | Arayüz | Zorunlu | Açıklama |
|------|--------|--------|----------|
| **Ülke** | Dropdown | Evet | COUNTRIES listesinden: Almanya, Fransa, Hollanda, Avusturya, İsviçre, Katar, Dubai/BAE, Suudi Arabistan, Kuveyt, Irak, Libya, ABD/Alaska. |
| **Meslek alanı** | Dropdown | Evet | PROFESSION_AREAS: İnşaat Teknolojisi, Elektrik-Elektronik, Metal İşleri, Motorlu Araçlar, Seramik & Fayans, Konaklama, … (alan seçilince meslek dalı listesi güncellenir). |
| **Meslek dalı** | Dropdown | Evet | Seçilen alana göre branches listesi (örn. Sıvacılık, Betonarme, Fayans/Seramik Döşeme, …). |

**Kullanıcının yapabilecekleri:** Ülke seçmek; meslek alanı seçmek (dal listesi değişir); meslek dalı seçmek. **İleri** butonu “Devam et — Fotoğraf” olur; ülke + alan + dal seçilmeden aktif olmaz.

**Kayıt:** `country`, `job_area`, `job_branch` (wizard state / profiles tablosu).

---

# Fotoğraf adımı

| Özellik | Değer |
|--------|--------|
| **Metin** | Son olarak, CV'niz için profesyonel bir fotoğraf yüklemek ister misiniz? |
| **Arayüz** | PhotoUpload bileşeni: dosya seçme, önizleme, kaldırma. |
| **Zorunlu** | Hayır |

**Kullanıcının yapabilecekleri:** Fotoğraf seçmek (yükleme Supabase Storage `cv-photos` bucket’ına yapılır); fotoğrafı kaldırmak; fotoğraf olmadan **Tamamla** ile wizard’ı bitirmek.

**Kayıt:** `photo_url` (profiles).

---

# Özet tablo: Form soru tipleri ve zorunluluk

| # | saveKey | Tip | Zorunlu (form) | İpucu | Chip | Select seçenekleri |
|---|---------|-----|----------------|-------|------|--------------------|
| 1 | personal.fullName | text | Evet | Evet | 5 | — |
| 2 | personal.birthDate | text | Hayır | Evet | 5 | — |
| 3 | personal.phone | text | Evet | Evet | 5 | — |
| 4 | personal.email | text (email) | Evet + format | Evet (formHint) | 3 | — |
| 5 | personal.city | text | Evet | Evet | 5 | — |
| 6 | work.title | text | Evet | Evet | 5 | — |
| 7 | work.experienceYears | select | Evet | Evet | 5 | 5 |
| 8 | work.summary | multiline | Hayır | Evet | — | — |
| 9 | work.currentCompany | text | Hayır | Evet | 5 | — |
| 10 | work.sector | select | Hayır | Evet | 5 | 6 |
| 11 | education.primary | select | Hayır | Evet | 5 | 5 |
| 12 | languages | select | Hayır | Evet | 5 | 4 |
| 13 | mobility.drivingLicense | select | Hayır | Evet | 5 | 4 |
| 14 | mobility.vehicleUsage | select | Hayır | Evet | 5 | 3 |
| 15 | mobility.passport | select | Hayır | Evet | 5 | 3 |
| 16 | mobility.travelReady | select | Hayır | Evet | 5 | 5 |
| 17 | mobility.shiftWork | select | Hayır | Evet | 5 | 3 |
| 18 | work.overtime | select | Hayır | Evet | 5 | 3 |
| 19 | mobility.relocation | select | Hayır | Evet | 5 | 3 |
| 20 | certificates | multiline | Hayır | Evet | — | — |
| 21 | work.safetyCompliance | select | Hayır | Evet | 5 | 3 |
| 22 | mobility.targetCountry | text | Hayır | Evet | 5 | — |
| 23 | mobility.earliestStart | select | Hayır | Evet | 5 | 5 |
| 24 | work.salaryNote | select | Hayır | Evet | 5 | 3 |
| 25 | finalNote | multiline | Hayır | Evet | — | — |

---

*Rapor, `src/data/cvQuestions.ts` ve `src/components/wizard/FormWizard.tsx` ile uyumludur. Form yönteminde hitap sorusu (personal.hitap) yer almaz.*
