// ─────────────────────────────────────────────────────────────
// db.js — All Supabase database operations for HeartLink
//
// Tables:
//   master_admin  — one row, website owner credentials
//   clients       — client accounts (one per couple page)
//   couples       — couple pages / love websites
//
// Security: clients have a session_token that locks their
// account to one active session. New login revokes the old one.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';

/* ─── small helpers ─── */
const rand = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Generate a secure session token */
function generateSessionToken() {
  return `hl_${rand()}_${rand()}`;
}

/** Strip base64 data: URLs from an object before saving to DB */
function stripBase64(obj) {
  if (typeof obj === 'string') {
    return obj.startsWith('data:') ? '[image:idb]' : obj;
  }
  if (Array.isArray(obj)) return obj.map(stripBase64);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = stripBase64(obj[k]);
    return out;
  }
  return obj;
}

/* ════════════════════════════════════════
   MASTER ADMIN
════════════════════════════════════════ */

/** Verify master admin credentials */
export async function masterAdminLogin(username, password) {
  const { data, error } = await supabase
    .from('master_admin')
    .select('id, username')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) return { success: false, error: 'Invalid credentials.' };
  return { success: true };
}

/* ════════════════════════════════════════
   CLIENTS
════════════════════════════════════════ */

/** Load all clients (master admin only) */
export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, gmail, display_name, activation_code, activated, active, approved, created_at, subscription, expires_at, couple_slug')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchClients error:', error); return []; }
  return data.map(normalizeClient);
}

/** Check if an activation code is valid and unused */
export async function validateActivationCode(code) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, gmail, activation_code, activated')
    .eq('activation_code', code.trim().toUpperCase())
    .single();

  if (error || !data) return { valid: false, error: 'Invalid activation code.' };
  if (data.gmail)      return { valid: false, error: 'This code has already been used.' };
  return { valid: true, client: normalizeClient(data) };
}

/** Client self-registers with Gmail + password + activation code */
export async function clientRegister(gmail, password, activationCode) {
  const check = await validateActivationCode(activationCode);
  if (!check.valid) return { success: false, error: check.error };

  // Check if Gmail is already taken
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('gmail', gmail.toLowerCase())
    .maybeSingle();

  if (existing) return { success: false, error: 'This Gmail is already registered.' };

  const { error } = await supabase
    .from('clients')
    .update({
      gmail:        gmail.toLowerCase(),
      password:     password,
      display_name: gmail.split('@')[0],
      activated:    true,
      approved:     true,
    })
    .eq('activation_code', activationCode.trim().toUpperCase());

  if (error) { console.error('clientRegister error:', error); return { success: false, error: 'Registration failed. Try again.' }; }
  return { success: true };
}

/**
 * Client logs in with Gmail + password.
 * Security: issues a new session_token, invalidating any previous session.
 * One active session per account at all times.
 */
export async function clientLogin(gmail, password) {
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, gmail, password, display_name, activation_code, activated, active, approved, subscription, expires_at, couple_slug')
    .eq('gmail', gmail.toLowerCase())
    .maybeSingle();

  if (error || !client)  return { success: false, error: 'Invalid Gmail or password.' };
  if (client.password !== password) return { success: false, error: 'Invalid Gmail or password.' };
  if (!client.active)    return { success: false, error: 'Your account has been disabled. Contact support.' };
  if (!client.approved)  return { success: false, error: 'Your account is pending approval.' };

  // Issue a fresh session token — this invalidates any other open session
  const token = generateSessionToken();
  const now   = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('clients')
    .update({ session_token: token, session_created: now })
    .eq('id', client.id);

  if (updateErr) { console.error('clientLogin session update error:', updateErr); }

  const session = {
    clientId:     client.id,
    gmail:        client.gmail,
    displayName:  client.display_name,
    coupleSlug:   client.couple_slug,
    subscription: client.subscription,
    sessionToken: token,
  };

  return { success: true, session };
}

/**
 * Validate that a stored session token is still the active one for this client.
 * Returns true if valid, false if another device has logged in.
 */
export async function validateClientSession(clientId, sessionToken) {
  if (!clientId || !sessionToken) return false;

  const { data, error } = await supabase
    .from('clients')
    .select('session_token, active')
    .eq('id', clientId)
    .single();

  if (error || !data) return false;
  if (!data.active)   return false;
  return data.session_token === sessionToken;
}

/** Revoke a client's session (logout) */
export async function clientLogout(clientId, sessionToken) {
  if (!clientId) return;
  // Only clear if this token is still the current one
  await supabase
    .from('clients')
    .update({ session_token: null, session_created: null })
    .eq('id', clientId)
    .eq('session_token', sessionToken ?? '');
}

/** Create a new client (master admin) */
export async function createClient(data) {
  const tag  = (data.displayName || data.gmail || '').replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'USER';
  const rand4 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const year  = new Date().getFullYear();
  const activationCode = `HL-${year}-${tag}-${rand4}`;

  const newClient = {
    id:               `client-${Date.now()}`,
    gmail:            data.gmail?.toLowerCase() || '',
    password:         data.password || '',
    display_name:     data.displayName || '',
    activation_code:  activationCode,
    activated:        false,
    active:           true,
    approved:         false,
    created_at:       new Date().toISOString().split('T')[0],
    subscription:     data.subscription || 'Basic',
    expires_at:       data.expiresAt || null,
    couple_slug:      data.coupleSlug || '',
  };

  const { error } = await supabase.from('clients').insert(newClient);
  if (error) { console.error('createClient error:', error); return null; }
  return normalizeClient({ ...newClient });
}

/** Update a client (master admin) */
export async function updateClient(clientId, updates) {
  const mapped = {};
  if ('displayName'  in updates) mapped.display_name    = updates.displayName;
  if ('active'       in updates) mapped.active           = updates.active;
  if ('approved'     in updates) mapped.approved         = updates.approved;
  if ('subscription' in updates) mapped.subscription     = updates.subscription;
  if ('expiresAt'    in updates) mapped.expires_at       = updates.expiresAt;
  if ('coupleSlug'   in updates) mapped.couple_slug      = updates.coupleSlug;
  if ('password'     in updates) mapped.password         = updates.password;

  const { error } = await supabase.from('clients').update(mapped).eq('id', clientId);
  if (error) console.error('updateClient error:', error);
}

/** Delete a client */
export async function deleteClient(clientId) {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) console.error('deleteClient error:', error);
}

/** Regenerate activation code (resets registration) */
export async function regenerateActivationCode(clientId, displayName) {
  const tag  = (displayName || '').replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'USER';
  const rand4 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const year  = new Date().getFullYear();
  const newCode = `HL-${year}-${tag}-${rand4}`;

  await supabase
    .from('clients')
    .update({ activation_code: newCode, activated: false, gmail: '', password: '', approved: false, session_token: null })
    .eq('id', clientId);

  return newCode;
}

/* ════════════════════════════════════════
   COUPLES
════════════════════════════════════════ */

/** Load all couples */
export async function fetchCouples() {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchCouples error:', error); return []; }
  return data.map(normalizeCouple);
}

/** Load a single couple by slug */
export async function fetchCoupleBySlug(slug) {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return normalizeCouple(data);
}

/** Verify a visitor's access code */
export async function coupleLogin(slug, code) {
  const { data, error } = await supabase
    .from('couples')
    .select('slug, name1, name2, access_code')
    .eq('slug', slug)
    .eq('access_code', code)
    .single();

  if (error || !data) return null;
  return { slug: data.slug, name: `${data.name1} & ${data.name2}` };
}

/** Add a new couple page */
export async function addCouple(coupleData) {
  const row = {
    id:                coupleData.slug,
    slug:              coupleData.slug,
    name1:             coupleData.name1,
    name2:             coupleData.name2,
    relationship_date: coupleData.relationshipDate || null,
    access_code:       coupleData.accessCode || '',
    theme:             coupleData.theme || 'rose',
    package:           coupleData.package || 'Basic',
    tagline:           coupleData.tagline || '',
    active:            true,
    qr_generated:      false,
    photos:            [],
    letters_photos:    [],
    letters:           [],
    songs:             [],
    timeline:          [],
    monthsary_messages:[],
    time_capsule:      [],
    page_content:      coupleData.pageContent || getDefaultPageContent(),
    video_slideshow:   null,
    bouquet:           {},
    memory_game_photos:[],
  };

  const { error } = await supabase.from('couples').insert(row);
  if (error) { console.error('addCouple error:', error); return null; }
  return normalizeCouple(row);
}

/** Update couple data — merges with existing */
export async function updateCouple(slug, updates) {
  // Map camelCase keys → snake_case columns
  const mapped = {};
  if ('photos'           in updates) mapped.photos            = stripBase64(updates.photos);
  if ('lettersPhotos'    in updates) mapped.letters_photos    = stripBase64(updates.lettersPhotos);
  if ('letters'          in updates) mapped.letters           = updates.letters;
  if ('songs'            in updates) mapped.songs             = updates.songs;
  if ('timeline'         in updates) mapped.timeline          = updates.timeline;
  if ('monthsaryMessages'in updates) mapped.monthsary_messages= updates.monthsaryMessages;
  if ('timeCapsule'      in updates) mapped.time_capsule      = updates.timeCapsule;
  if ('videoSlideshow'   in updates) mapped.video_slideshow   = updates.videoSlideshow;
  if ('qrGenerated'      in updates) mapped.qr_generated      = updates.qrGenerated;
  if ('accessCode'       in updates) mapped.access_code       = updates.accessCode;
  if ('active'           in updates) mapped.active            = updates.active;
  if ('bouquet'          in updates) mapped.bouquet           = updates.bouquet;
  if ('memoryGamePhotos' in updates) mapped.memory_game_photos= stripBase64(updates.memoryGamePhotos);

  // pageContent is merged (not replaced)
  if ('pageContent' in updates) {
    const { data: current } = await supabase
      .from('couples')
      .select('page_content')
      .eq('slug', slug)
      .single();
    const merged = { ...(current?.page_content || {}), ...stripBase64(updates.pageContent) };
    mapped.page_content = merged;
  }

  if (Object.keys(mapped).length === 0) return;

  const { error } = await supabase.from('couples').update(mapped).eq('slug', slug);
  if (error) console.error('updateCouple error:', error);
}

/** Delete a couple page */
export async function deleteCouple(slug) {
  const { error } = await supabase.from('couples').delete().eq('slug', slug);
  if (error) console.error('deleteCouple error:', error);
}

/** Save bouquet data */
export async function saveBouquet(slug, quantities, seed) {
  await updateCouple(slug, { bouquet: { quantities, seed } });
}

/* ════════════════════════════════════════
   NORMALIZERS  (DB snake_case → app camelCase)
════════════════════════════════════════ */

function normalizeClient(c) {
  return {
    id:             c.id,
    gmail:          c.gmail ?? '',
    password:       c.password ?? '',
    displayName:    c.display_name ?? '',
    activationCode: c.activation_code ?? '',
    activated:      c.activated ?? false,
    active:         c.active ?? true,
    approved:       c.approved ?? false,
    createdAt:      c.created_at ?? '',
    subscription:   c.subscription ?? 'Basic',
    expiresAt:      c.expires_at ?? '',
    coupleSlug:     c.couple_slug ?? '',
    sessionToken:   c.session_token ?? null,
  };
}

function normalizeCouple(c) {
  return {
    id:                   c.id ?? c.slug,
    slug:                 c.slug,
    name1:                c.name1,
    name2:                c.name2,
    relationshipDate:     c.relationship_date ?? c.relationshipDate ?? '',
    accessCode:           c.access_code ?? c.accessCode ?? '',
    theme:                c.theme ?? 'rose',
    package:              c.package ?? 'Basic',
    tagline:              c.tagline ?? '',
    active:               c.active ?? true,
    createdAt:            c.created_at ?? c.createdAt ?? '',
    qrGenerated:          c.qr_generated ?? c.qrGenerated ?? false,
    photos:               c.photos ?? [],
    lettersPhotos:        c.letters_photos ?? c.lettersPhotos ?? [],
    letters:              c.letters ?? [],
    songs:                c.songs ?? [],
    timeline:             c.timeline ?? [],
    monthsaryMessages:    c.monthsary_messages ?? c.monthsaryMessages ?? [],
    timeCapsule:          c.time_capsule ?? c.timeCapsule ?? [],
    pageContent:          c.page_content ?? c.pageContent ?? getDefaultPageContent(),
    videoSlideshow:       c.video_slideshow ?? c.videoSlideshow ?? null,
    bouquet:              c.bouquet ?? {},
    memoryGamePhotos:     c.memory_game_photos ?? c.memoryGamePhotos ?? [],
    // Legacy: song field mapped from first songs entry
    song: (c.songs ?? [])[0] ?? {},
  };
}

function getDefaultPageContent() {
  return {
    login:      { titleTop: 'Happy', titleBottom: 'Anniversary', hintText: 'Tap the scroll to open your love page', openingText: 'Opening your letter...', continueBtnText: 'Continue' },
    home:       { taglineOverride: '', coverPhotoUrl: '', coverPhotoCaption: '' },
    memories:   { title: 'Our Memories',  subtitle: 'Every photo tells our story' },
    letters:    { title: 'Love Letters',  subtitle: 'Words written with our hearts' },
    song:       { title: 'Our Song',      subtitle: 'The melody of our love story' },
    video:      { title: 'Our Video',     subtitle: 'A romantic slideshow of our journey', pendingTitle: 'Your video is being created', pendingText: 'Our admin is crafting a beautiful romantic slideshow.' },
    monthsary:  { title: 'Monthsary',     subtitle: 'Celebrating every month of us', inLoveText: 'of being in love', defaultMessage: "Every month with you is a gift I'll never take for granted." },
    capsule:    { title: 'Time Capsule',  subtitle: 'Messages from the past, for your future' },
    codeScreen: { title: 'Enter Code',    hint: 'The day you finally said "YES" to me.', footer: 'Enter the 4-digit code from your invitation' },
    memoryGame: { eyebrow: 'Mini game',   title: "Let's play a little game", subtitle: 'Find all matching pairs to unlock your love page', hint: 'Tap two cards to find matching pairs' },
    wishPage:   { title: 'Wishes',        subtitle: 'Little wishes sent to you on butterfly wings' },
    wishes:     [],
  };
}
