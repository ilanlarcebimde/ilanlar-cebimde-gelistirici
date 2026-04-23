# OG görseli (eski / isteğe bağlı yerel kopya)

**Varsayılan sosyal paylaşım görseli** artık merkezi olarak Supabase’deki marka logosu (500×500) kullanılır; tanım: `src/lib/og.ts` içindeki `DEFAULT_OG_IMAGE`.

İsterseniz bu klasöre **default-1200x630.jpg** kopyalayıp `npm run optimize:og` ile sıkıştırabilirsiniz; uygulama bu dosyayı **artık varsayılan `og:image` için kullanmaz** (yalnızca eski betik / arşiv için).
