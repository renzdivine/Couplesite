CREATE TABLE IF NOT EXISTS clients (
  id                TEXT PRIMARY KEY DEFAULT ('client-' || gen_random_uuid()::text),
  gmail             TEXT UNIQUE,
  password          TEXT NOT NULL,
  display_name      TEXT,
  activation_code   TEXT UNIQUE NOT NULL,
  activated         BOOLEAN DEFAULT FALSE,
  active            BOOLEAN DEFAULT TRUE,
  approved          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT NOW(),
  subscription      TEXT DEFAULT 'Basic',
  expires_at        DATE,
  couple_slug       TEXT,
  
  session_token     TEXT UNIQUE,          
  session_created   TIMESTAMP,
  device_fingerprint TEXT,                
  
  deleted_at        TIMESTAMP DEFAULT NULL
);


CREATE TABLE IF NOT EXISTS couples (
  id                 TEXT PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  name1              TEXT NOT NULL,
  name2              TEXT NOT NULL,
  relationship_date  DATE,
  access_code        TEXT NOT NULL,
  theme              TEXT DEFAULT 'rose',
  package            TEXT DEFAULT 'Basic',
  tagline            TEXT,
  active             BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT NOW(),
  qr_generated       BOOLEAN DEFAULT FALSE,
  
  
  photos             JSONB DEFAULT '[]'::jsonb,
  letters_photos     JSONB DEFAULT '[]'::jsonb,
  letters            JSONB DEFAULT '[]'::jsonb,
  songs              JSONB DEFAULT '[]'::jsonb,
  timeline           JSONB DEFAULT '[]'::jsonb,
  monthsary_messages JSONB DEFAULT '[]'::jsonb,
  time_capsule       JSONB DEFAULT '[]'::jsonb,
  page_content       JSONB DEFAULT '{}'::jsonb,
  video_slideshow    TEXT,
  bouquet            JSONB DEFAULT '{}'::jsonb,
  memory_game_photos JSONB DEFAULT '[]'::jsonb,
  
  deleted_at         TIMESTAMP DEFAULT NULL
);


CREATE TABLE IF NOT EXISTS master_admin (
  id         SERIAL PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_clients_gmail ON clients(gmail);
CREATE INDEX IF NOT EXISTS idx_clients_activation_code ON clients(activation_code);
CREATE INDEX IF NOT EXISTS idx_clients_couple_slug ON clients(couple_slug);
CREATE INDEX IF NOT EXISTS idx_clients_session_token ON clients(session_token);
CREATE INDEX IF NOT EXISTS idx_couples_slug ON couples(slug);
CREATE INDEX IF NOT EXISTS idx_couples_access_code ON couples(access_code);




INSERT INTO clients (
  id, gmail, password, display_name, activation_code,
  activated, active, approved, created_at, subscription,
  expires_at, couple_slug
) VALUES (
  'client-renz-jane',
  'renzjane@gmail.com',
  'renzjane2024',
  'Renz',
  'HL-2024-RENZ',
  true,
  true,
  true,
  '2024-01-10',
  'Premium',
  '2025-01-10',
  'renz-jane'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO couples (
  id, slug, name1, name2, relationship_date, access_code,
  theme, package, tagline, active, created_at, qr_generated,
  photos, letters_photos, letters, songs, timeline,
  monthsary_messages, time_capsule, page_content
) VALUES (
  'renz-jane',
  'renz-jane',
  'Renz',
  'Jane',
  '2023-02-14',
  '0214',
  'rose',
  'Premium',
  'Two souls, one heartbeat',
  true,
  '2024-01-10',
  true,
  '[
    {"id": 1, "url": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80", "caption": "Our first date 💕"},
    {"id": 2, "url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80", "caption": "Summer adventure 🌸"},
    {"id": 3, "url": "https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=600&q=80", "caption": "Coffee mornings ☕"},
    {"id": 4, "url": "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&q=80", "caption": "Sunset walk 🌅"},
    {"id": 5, "url": "https://images.unsplash.com/photo-1596460107916-430662021049?w=600&q=80", "caption": "Beach day 🌊"},
    {"id": 6, "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", "caption": "Cooking together 🍝"}
  ]'::jsonb,
  '[
    {"id": 1, "url": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80", "caption": "Our first date 💕"},
    {"id": 2, "url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80", "caption": "Summer adventure 🌸"}
  ]'::jsonb,
  '[
    {"id": 1, "from": "Renz", "to": "Jane", "subject": "The day I knew", "content": "From the moment I first saw your smile, I knew my life had changed forever.", "date": "2024-02-14", "unlockDate": null},
    {"id": 2, "from": "Jane", "to": "Renz", "subject": "My forever person", "content": "You make ordinary moments feel extraordinary.", "date": "2024-02-14", "unlockDate": null}
  ]'::jsonb,
  '[
    {"title": "Perfect", "artist": "Ed Sheeran", "albumArt": "", "embedUrl": "https://open.spotify.com/embed/track/0tgVpDi06FyKpA1z0VMD4v", "youtubeId": "2Vv-BfVoq4g", "reason": "Our first dance song", "lyrics": "I found a love for me\\nDarling just dive right in"}
  ]'::jsonb,
  '[
    {"id": 1, "date": "2023-02-14", "title": "First Date 💕", "description": "We met at the coffee shop on Valentine''s Day."},
    {"id": 2, "date": "2023-06-15", "title": "Said \"I Love You\" 💬", "description": "Renz finally said the three words under the sunset bridge."}
  ]'::jsonb,
  '[
    {"month": 1, "message": "One month of pure bliss! You make every day worth living. ❤️"},
    {"month": 6, "message": "Half a year of us! You are the best thing that has ever happened to me. 🌹"}
  ]'::jsonb,
  '[
    {"id": 1, "title": "Message for our 1st Anniversary", "content": "By the time you read this, we''ve made it a full year. I''m so proud of us.", "unlockDate": "2024-02-14"}
  ]'::jsonb,
  '{
    "login": {"titleTop": "Happy", "titleBottom": "Anniversary", "hintText": "Tap the scroll to open your love page ✨", "openingText": "💌 Opening your letter...", "continueBtnText": "Continue 💕"},
    "home": {"taglineOverride": "", "coverPhotoUrl": "", "coverPhotoCaption": ""},
    "memories": {"title": "Our Memories", "subtitle": "Every photo tells our story"},
    "letters": {"title": "Love Letters", "subtitle": "Words written with our hearts"},
    "song": {"title": "Our Song", "subtitle": "The melody of our love story"},
    "codeScreen": {"title": "Enter Code", "hint": "The day you finally said \"YES\" to me.", "footer": "Enter the 4-digit code from your invitation"},
    "memoryGame": {"eyebrow": "Mini game", "title": "Let''s play a little game", "subtitle": "Find all matching pairs to unlock your love page", "hint": "Tap two cards to find matching pairs"},
    "wishPage": {"title": "Wishes", "subtitle": "Little wishes sent to you on butterfly wings"},
    "wishes": [
      {"id": 1, "title": "Always by your side", "message": "No matter where life takes us, I wish for you to always feel safe, loved, and never alone.", "unlocked": true},
      {"id": 2, "title": "For every morning", "message": "I wish you a life full of mornings that feel like beginnings.", "unlocked": true}
    ]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;




ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples      ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_admin ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_admin: deny all anon" ON master_admin
  AS RESTRICTIVE FOR ALL TO anon USING (false);


CREATE POLICY "clients: anon read for auth only" ON clients
  FOR SELECT TO anon
  USING (true)
  
  
  
  ;


CREATE POLICY "clients: anon register" ON clients
  FOR UPDATE TO anon
  USING (activated = false AND gmail = '');


CREATE POLICY "clients: anon admin update" ON clients
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);


CREATE POLICY "clients: anon insert" ON clients
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "clients: deny anon delete" ON clients
  AS RESTRICTIVE FOR DELETE TO anon USING (false);


CREATE POLICY "couples: anon read active" ON couples
  FOR SELECT TO anon
  USING (active = true);


CREATE POLICY "couples: anon insert" ON couples
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "couples: anon update" ON couples
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "couples: anon delete" ON couples
  FOR DELETE TO anon USING (true);


ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;


CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_couples_deleted_at ON couples(deleted_at);


DROP POLICY IF EXISTS "clients: anon register" ON clients;
DROP POLICY IF EXISTS "clients: anon admin update" ON clients;

CREATE POLICY "clients: anon register" ON clients
  FOR UPDATE TO anon
  USING (activated = false AND gmail = '');

CREATE POLICY "clients: anon admin update" ON clients
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);




DROP POLICY IF EXISTS "clients: deny anon insert" ON clients;
DROP POLICY IF EXISTS "clients: anon insert" ON clients;
CREATE POLICY "clients: anon insert" ON clients
  FOR INSERT TO anon WITH CHECK (true);


DROP POLICY IF EXISTS "clients: deny anon delete" ON clients;
CREATE POLICY "clients: anon delete" ON clients
  FOR DELETE TO anon USING (true);


DROP POLICY IF EXISTS "couples: deny anon insert" ON couples;
DROP POLICY IF EXISTS "couples: deny anon update" ON couples;
DROP POLICY IF EXISTS "couples: deny anon delete" ON couples;
DROP POLICY IF EXISTS "couples: anon insert" ON couples;
DROP POLICY IF EXISTS "couples: anon update" ON couples;
DROP POLICY IF EXISTS "couples: anon delete" ON couples;

CREATE POLICY "couples: anon insert" ON couples
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "couples: anon update" ON couples
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "couples: anon delete" ON couples
  FOR DELETE TO anon USING (true);



ALTER TABLE couples ADD COLUMN IF NOT EXISTS bg_music TEXT DEFAULT NULL;
