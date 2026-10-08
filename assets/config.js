/* Cloud sync settings. All three values are public by design (they ship to every browser);
   security comes from Row-Level Security in supabase/schema.sql. Leave url and key empty for local-only mode.
   ownerId is the auth user whose progress the site shows while signed out (read-only view). */
window.AA_CONFIG = {
  supabaseUrl: "https://ijznfijgzqgedwprulfb.supabase.co",
  supabaseAnonKey: "sb_publishable_jQRHdKBORCh8RmEKmNnWyg_1f9et7W4",
  ownerId: "b1eebe3f-ad40-42cb-adcb-c055ac2d07ab"
};
