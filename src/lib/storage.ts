import { supabase } from "@/lib/supabase";

const BUCKET = "cv-photos";

/**
 * Profil fotoğrafını cv-photos bucket'ına yükler, public URL döndürür.
 * Dosya adı çakışmasını önlemek için timestamp kullanır.
 */
export async function uploadCVPhoto(file: File, userId: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const fileName = `cv-${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    upsert: true,
  });

  if (error) {
    console.error("Upload Hatası:", error.message);
    throw new Error("Fotoğraf yüklenirken bir hata oluştu.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
