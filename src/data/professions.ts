export interface ProfessionArea {
  id: string;
  name: string;
  branches: string[];
}

export const PROFESSION_AREAS: ProfessionArea[] = [
  { id: "insaat", name: "İnşaat İşleri", branches: ["İnşaat İşleri"] },
  { id: "metal-kaynak", name: "Metal & Kaynak İşleri", branches: ["Metal & Kaynak İşleri"] },
  { id: "makine-bakim", name: "Makine Bakım & Montaj", branches: ["Makine Bakım & Montaj"] },
  { id: "nakliye-depo", name: "Nakliye & Depo", branches: ["Nakliye & Depo"] },
  { id: "temizlik-site", name: "Temizlik & Site Hizmetleri", branches: ["Temizlik & Site Hizmetleri"] },
  { id: "gida-uretim", name: "Gıda Üretim", branches: ["Gıda Üretim"] },
  { id: "tekstil-uretim", name: "Tekstil Üretim", branches: ["Tekstil Üretim"] },
  { id: "konaklama-mutfak", name: "Konaklama & Mutfak", branches: ["Konaklama & Mutfak"] },
  { id: "plastik-kaucuk", name: "Plastik & Kauçuk", branches: ["Plastik & Kauçuk"] },
  { id: "kimya-uretim", name: "Kimya Üretim", branches: ["Kimya Üretim"] },
  { id: "cam-seramik", name: "Cam & Seramik", branches: ["Cam & Seramik"] },
  { id: "ahsap-marangoz", name: "Ahşap & Marangoz", branches: ["Ahşap & Marangoz"] },
  { id: "giyim-uretim", name: "Giyim Üretim", branches: ["Giyim Üretim"] },
  { id: "kagit-ambalaj", name: "Kâğıt & Ambalaj", branches: ["Kâğıt & Ambalaj"] },
  { id: "madencilik", name: "Madencilik", branches: ["Madencilik"] },
  { id: "madencilik-destek", name: "Madencilik Destek", branches: ["Madencilik Destek"] },
  { id: "tarim-hayvancilik", name: "Tarım & Hayvancılık", branches: ["Tarım & Hayvancılık"] },
  { id: "balikcilik", name: "Balıkçılık", branches: ["Balıkçılık"] },
  { id: "orman-isleri", name: "Orman İşleri", branches: ["Orman İşleri"] },
  { id: "icecek-uretim", name: "İçecek Üretim", branches: ["İçecek Üretim"] },
  { id: "tutun-uretim", name: "Tütün Üretim", branches: ["Tütün Üretim"] },
  { id: "petrol-rafineri", name: "Petrol & Rafineri", branches: ["Petrol & Rafineri"] },
  { id: "deri-ayakkabi", name: "Deri & Ayakkabı", branches: ["Deri & Ayakkabı"] },
  { id: "matbaa", name: "Matbaa", branches: ["Matbaa"] },
  { id: "tamir-onarim", name: "Tamir & Onarım", branches: ["Tamir & Onarım"] },
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
