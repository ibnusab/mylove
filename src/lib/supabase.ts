import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseCredentials = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  const localUrl =
    typeof window !== "undefined"
      ? localStorage.getItem("custom_supabase_url") || ""
      : "";
  const localKey =
    typeof window !== "undefined"
      ? localStorage.getItem("custom_supabase_key") || ""
      : "";

  const url = envUrl || localUrl;
  const key = envKey || localKey;

  return { url, key, isFromEnv: Boolean(envUrl && envKey) };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url && key && url !== "MY_SUPABASE_URL" && url.startsWith("http"),
  );
};

let clientInstance: SupabaseClient | null = null;
let lastUrl = "";
let lastKey = "";

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key || !url.startsWith("http")) return null;

  if (!clientInstance || url !== lastUrl || key !== lastKey) {
    clientInstance = createClient(url, key);
    lastUrl = url;
    lastKey = key;
  }
  return clientInstance;
};

export const supabase = getSupabaseClient();

/**
 * Upload file to Supabase Storage bucket 'media'
 */
export async function uploadToSupabaseStorage(
  file: File,
  folder: string = "uploads",
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await client.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.warn("Supabase storage upload error:", error);
      return null;
    }

    const { data: publicUrlData } = client.storage
      .from("media")
      .getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Failed to upload to Supabase storage:", err);
    return null;
  }
}

/**
 * SQL Schema script string for users to copy into Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `
-- Run this script in Supabase SQL Editor:

-- 1. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  couple_name TEXT DEFAULT 'Sabri & Anisa',
  partner1_name TEXT DEFAULT 'Rian',
  partner2_name TEXT DEFAULT 'Anisa',
  anniversary_date TEXT DEFAULT '2023-05-14',
  start_date TEXT DEFAULT '2023-05-14',
  quote TEXT DEFAULT 'Together is my favorite place to be.',
  couple_photo_url TEXT DEFAULT '',
  particle_intensity TEXT DEFAULT 'high',
  accent_color TEXT DEFAULT '#FF69B4',
  theme_mode TEXT DEFAULT 'pastel',
  gallery_layout TEXT DEFAULT 'masonry',
  passcode TEXT DEFAULT '1234'
);

-- Ensure missing columns exist if settings table was already created:
ALTER TABLE settings ADD COLUMN IF NOT EXISTS anniversary_date TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS particle_intensity TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_mode TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gallery_layout TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS couple_photo_url TEXT;

INSERT INTO settings (id, couple_name, partner1_name, partner2_name, anniversary_date, start_date, quote, passcode, accent_color, couple_photo_url, gallery_layout)
VALUES (1, 'Rian & Anisa', 'Rian', 'Anisa', '2023-05-14', '2023-05-14', 'Together is my favorite place to be.', '1234', '#FF69B4', '', 'masonry')
ON CONFLICT (id) DO NOTHING;

-- 2. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT DEFAULT 'photo',
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  date TEXT DEFAULT '',
  favorite INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Music Table
CREATE TABLE IF NOT EXISTS music (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  album_art TEXT DEFAULT '',
  duration TEXT DEFAULT '03:30',
  favorite INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Story Table
CREATE TABLE IF NOT EXISTS story (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Memory',
  location TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  favorite INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Letters Table
CREATE TABLE IF NOT EXISTS letters (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT DEFAULT '',
  is_opened INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sender TEXT DEFAULT 'Sabri',
  receiver TEXT DEFAULT 'Anisa',
  message TEXT NOT NULL,
  emoji TEXT DEFAULT '❤️',
  is_pinned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Calendar Memories Table
CREATE TABLE IF NOT EXISTS calendar (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT DEFAULT '',
  event_type TEXT DEFAULT 'memory',
  media_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPORTANT: Disable Row Level Security (RLS) on all tables so anon key can insert/read data freely
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE music DISABLE ROW LEVEL SECURITY;
ALTER TABLE story DISABLE ROW LEVEL SECURITY;
ALTER TABLE letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar DISABLE ROW LEVEL SECURITY;

-- Or if you want RLS enabled, run policies below:
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE story ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all settings" ON settings;
CREATE POLICY "Allow public all settings" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all gallery" ON gallery;
CREATE POLICY "Allow public all gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all music" ON music;
CREATE POLICY "Allow public all music" ON music FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all story" ON story;
CREATE POLICY "Allow public all story" ON story FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all letters" ON letters;
CREATE POLICY "Allow public all letters" ON letters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all notes" ON notes;
CREATE POLICY "Allow public all notes" ON notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all calendar" ON calendar;
CREATE POLICY "Allow public all calendar" ON calendar FOR ALL USING (true) WITH CHECK (true);

-- Create public storage bucket 'media' for photos/videos/audio uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow public storage access" ON storage.objects;
CREATE POLICY "Allow public storage access" ON storage.objects FOR ALL USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
`;
