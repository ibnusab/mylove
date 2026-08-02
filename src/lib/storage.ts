import {
  isSupabaseConfigured,
  getSupabaseClient,
  uploadToSupabaseStorage,
} from "./supabase";

/**
 * Helper to convert File to Base64 Data URL (used when server & Supabase upload unavailable)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Safe file upload:
 * 1. Tries Supabase Storage ('media' bucket) if configured
 * 2. Tries Express backend endpoint (/api/upload/...)
 * 3. Fallback to client-side Base64 Data URL
 */
export const uploadFileWithFallback = async (
  file: File,
  endpoint: string,
): Promise<string> => {
  // 1. Try Supabase Storage
  if (isSupabaseConfigured()) {
    const folderName = endpoint.includes("music") ? "music" : "photos";
    const supabaseUrl = await uploadToSupabaseStorage(file, folderName);
    if (supabaseUrl) {
      return supabaseUrl;
    }
  }

  // 2. Try Express API
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn(`Upload API (${endpoint}) unavailable.`, err);
  }

  // 3. Fallback to client-side Base64 Data URL
  return await fileToDataUrl(file);
};

// Get item from localStorage
export function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Set item in localStorage
export function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("LocalStorage error:", e);
  }
}

/**
 * Generic Fetcher:
 * 1. Checks Supabase table if configured
 * 2. Checks Express API endpoint
 * 3. Falls back to LocalStorage or default values
 */
export async function fetchWithFallback<T>(
  apiEndpoint: string,
  storageKey: string,
  defaultValue: T,
  supabaseTable?: string,
): Promise<T> {
  const client = getSupabaseClient();

  // 1. Try Supabase DB
  if (isSupabaseConfigured() && supabaseTable && client) {
    try {
      const { data, error } = await client
        .from(supabaseTable)
        .select("*")
        .order("id", { ascending: false });
      if (error) {
        console.warn(
          `Supabase fetch on table '${supabaseTable}' returned error:`,
          error.message,
          error,
        );
      } else if (data) {
        if (supabaseTable === "settings" && data.length > 0) {
          const row = data[0] as Record<string, any>;
          const settingsObj = {
            partner1_name: row.partner1_name || "Rian",
            partner2_name: row.partner2_name || "Anisa",
            anniversary_date:
              row.anniversary_date || row.start_date || "2023-05-14",
            quote: row.quote || "Together is my favorite place to be.",
            couple_photo_url: row.couple_photo_url || "",
            particle_intensity: row.particle_intensity || "high",
            accent_color: row.accent_color || "#FF69B4",
            theme_mode: row.theme_mode || "pastel",
            gallery_layout: row.gallery_layout || "masonry",
          } as unknown as T;
          setLocalData(storageKey, settingsObj);
          return settingsObj;
        } else if (data.length >= 0) {
          setLocalData(storageKey, data as unknown as T);
          return data as unknown as T;
        }
      }
    } catch (err) {
      console.warn(`Supabase fetch on table '${supabaseTable}' failed:`, err);
    }
  }

  // 2. Try Express API
  try {
    const res = await fetch(apiEndpoint);
    if (res.ok) {
      const data = await res.json();
      if (
        data &&
        (Array.isArray(data) ? data.length >= 0 : Object.keys(data).length > 0)
      ) {
        setLocalData(storageKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn(`GET ${apiEndpoint} failed, using local storage cache.`, err);
  }

  // 3. Fallback to local storage or default value
  return getLocalData(storageKey, defaultValue);
}
