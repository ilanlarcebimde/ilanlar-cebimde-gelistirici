export interface ProfessionArea {
  id: string;
  name: string;
  branches: string[];
}

export const PROFESSION_AREAS: ProfessionArea[] = [
  { id: "insaat", name: "1️⃣ İnşaat İşleri", branches: ["İnşaat İşleri"] },
  { id: "metal-kaynak", name: "2️⃣ Metal & Kaynak İşleri", branches: ["Metal & Kaynak İşleri"] },
  { id: "makine-bakim", name: "3️⃣ Makine Bakım & Montaj", branches: ["Makine Bakım & Montaj"] },
  { id: "nakliye-depo", name: "4️⃣ Nakliye & Depo", branches: ["Nakliye & Depo"] },
  { id: "temizlik-site", name: "5️⃣ Temizlik & Site Hizmetleri", branches: ["Temizlik & Site Hizmetleri"] },
  { id: "gida-uretim", name: "6️⃣ Gıda Üretim", branches: ["Gıda Üretim"] },
  { id: "tekstil-uretim", name: "7️⃣ Tekstil Üretim", branches: ["Tekstil Üretim"] },
  { id: "konaklama-mutfak", name: "8️⃣ Konaklama & Mutfak", branches: ["Konaklama & Mutfak"] },
  { id: "plastik-kaucuk", name: "9️⃣ Plastik & Kauçuk", branches: ["Plastik & Kauçuk"] },
  { id: "kimya-uretim", name: "🔟 Kimya Üretim", branches: ["Kimya Üretim"] },
  { id: "cam-seramik", name: "1️⃣1️⃣ Cam & Seramik", branches: ["Cam & Seramik"] },
  { id: "ahsap-marangoz", name: "1️⃣2️⃣ Ahşap & Marangoz", branches: ["Ahşap & Marangoz"] },
  { id: "giyim-uretim", name: "1️⃣3️⃣ Giyim Üretim", branches: ["Giyim Üretim"] },
  { id: "kagit-ambalaj", name: "1️⃣4️⃣ Kâğıt & Ambalaj", branches: ["Kâğıt & Ambalaj"] },
  { id: "madencilik", name: "1️⃣5️⃣ Madencilik", branches: ["Madencilik"] },
  { id: "madencilik-destek", name: "1️⃣6️⃣ Madencilik Destek", branches: ["Madencilik Destek"] },
  { id: "tarim-hayvancilik", name: "1️⃣7️⃣ Tarım & Hayvancılık", branches: ["Tarım & Hayvancılık"] },
  { id: "balikcilik", name: "1️⃣8️⃣ Balıkçılık", branches: ["Balıkçılık"] },
  { id: "orman-isleri", name: "1️⃣9️⃣ Orman İşleri", branches: ["Orman İşleri"] },
  { id: "icecek-uretim", name: "2️⃣0️⃣ İçecek Üretim", branches: ["İçecek Üretim"] },
  { id: "tutun-uretim", name: "2️⃣1️⃣ Tütün Üretim", branches: ["Tütün Üretim"] },
  { id: "petrol-rafineri", name: "2️⃣2️⃣ Petrol & Rafineri", branches: ["Petrol & Rafineri"] },
  { id: "deri-ayakkabi", name: "2️⃣3️⃣ Deri & Ayakkabı", branches: ["Deri & Ayakkabı"] },
  { id: "matbaa", name: "2️⃣4️⃣ Matbaa", branches: ["Matbaa"] },
  { id: "tamir-onarim", name: "2️⃣5️⃣ Tamir & Onarım", branches: ["Tamir & Onarım"] },
];

export const MARQUEE_TAGS = [
  "İnşaat İşleri",
  "Metal & Kaynak İşleri",
  "Makine Bakım & Montaj",
  "Nakliye & Depo",
  "Temizlik & Site Hizmetleri",
  "Gıda Üretim",
  "Tekstil Üretim",
  "Konaklama & Mutfak",
  "Plastik & Kauçuk",
  "Kimya Üretim",
  "Cam & Seramik",
  "Ahşap & Marangoz",
  "Tarım & Hayvancılık",
  "Petrol & Rafineri",
  "Tamir & Onarım",
];
