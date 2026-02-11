# Form CV Sihirbazı — Chip, Select ve Kütüphane Kuralları

## 1. Chip / input davranışı (NON-NEGOTIABLE)

| Soru tipi    | Chip kaynağı     | Chip tıklanınca ne olur |
|-------------|------------------|--------------------------|
| **select**  | `options[]`      | Seçenek değeri atanır (dropdown ile aynı value). Alana serbest metin yazılmaz. |
| **text**    | `examples[]`     | O örnek metin input’a yazılır. |
| **multiline** | (chip yok)     | İstersen “örnek satır ekle” gibi buton ile satır eklenir. |

- **Select:** Chip, dropdown’daki bir seçeneği temsil eder; tıklanınca `value = optionValue` olur.
- **Text:** Chip, ipucu/örnek metindir; tıklanınca input’a o metin yazılır.

## 2. Profession library entegrasyonu

- **Dosya:** `src/data/professionLibrary.json` (fallback + areas[].branches[]).
- **Helper:** `src/data/professionLibrary.ts` → `getSkillsForBranch(areaId, branchName)`, `getTasksForBranch(areaId, branchName)`.
- **Eşleme:** Uygulama `job_area` (örn. `insaat`) + `job_branch` (örn. `Sıvacılık`) ile kütüphanede branch aranır; bulunamazsa `fallback.genericSkills` / `fallback.genericTasks` kullanılır.
- **Kullanım:** `job_branch` seçilince skills/tasks önerileri yüklenir; ileride “Beceriler” ve “Deneyim görevleri” ekranlarında chip olarak kullanılacak.

## 3. Veri yapısı (profiles.answers)

Tüm CV verisi `profiles.answers` (jsonb) içinde tutulur. Önerilen yapı (yeni akışta):

- `personal`: fullName, phone, email, location, birthDate, city
- `target`: roleTitle, country, job_area, job_branch
- `profile`: summary
- `skills`: string[]
- `experience`: Array<{ title, company?, location?, startDate?, endDate?, isCurrent?, bullets: string[] }>
- `education`: { level?, school?, field?, endYear? }
- `certificates`: Array<{ name, year?, issuer? }>
- `languages`: Array<{ name, level }>
- `mobility`: { licenses[], passport?, workPermit?, earliestStart?, shiftWork?, overtime?, relocation? }
- `links`: { linkedin?, website? }
- `references`: { preference, items? }
- `finalNote?`
- `photo_url` → profiles tablosunda ayrı kolon (mevcut).

## 4. Zorunlu minimum (CV boş kalmasın)

- Ad soyad, iletişim (telefon veya e-posta en az biri), konum, hedef pozisyon.
- En az 1 beceri veya 1 iş deneyimi (yoksa “Deneyim yok / staj” gibi alternatif yol).

## 5. Yapılacaklar (sıra ile)

- [ ] Diller: repeatable “dil + seviye” (mevcut tek select kaldırılacak).
- [ ] İş deneyimi: repeatable kart (pozisyon, şirket, tarih, bullets; min 2 madde).
- [ ] Beceriler: çoklu seçim + profession library (job_branch’e göre öneri).
- [ ] Eğitim: okul adı, alan, yıl ekle.
- [ ] Sertifika: repeatable { name, year?, issuer? }.
- [ ] Mobilite: travelReady + earliestStart birleştir; workPermit ekle.
- [ ] Maaş notu: form ana gövdesinden çıkar (tercihler veya kaldır).
- [ ] professionLibrary.json: kullanıcının verdiği 24 dalı ekle (şu an 3 dal + boya 1 dal örnek).
