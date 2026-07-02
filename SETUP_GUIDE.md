# HeartLink — Database & Security Setup Guide

This guide will help you set up the **Supabase database** and configure **client session security** for your HeartLink production system.

---

## ✅ What Changed

1. **Deleted unrelated files** — `Landing.jsx`, `react.svg`, `vite.svg` — not used in the system.
2. **Replaced localStorage with Supabase** — All data (clients, couples) now lives in a real Postgres database.
3. **Client session security** — Each client login issues a unique `session_token` stored in the database. If a client logs in on a second device, the first session is **revoked automatically**. This prevents account sharing.

---

## 🗄️ Step 1: Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in.
2. Click **New Project**.
3. Choose a name (e.g., `heartlink-production`), set a secure database password, and select your preferred region.
4. Wait ~2 minutes for the project to spin up.

---

## 🔐 Step 2: Get Your Supabase Keys

Once your project is ready:

1. Go to **Project Settings** (⚙️ icon in the left sidebar).
2. Click **API** in the settings menu.
3. Copy these two values:
   - **Project URL** (`https://your-project-ref.supabase.co`)
   - **anon public** key (under "Project API keys")

---

## 📝 Step 3: Configure Environment Variables

1. Open the `.env` file in the root of this project (it was created for you).
2. Replace the placeholder values with your real keys:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

3. Save the file.

**⚠️ Never commit `.env` to git!** It's already in `.gitignore`.

---

## 🛢️ Step 4: Run the Database Schema

1. Go to your Supabase project dashboard.
2. Click **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of **`database/schema.sql`** (in this project) and paste it into the editor.
5. Click **Run** (or press `Ctrl+Enter`).

This creates all tables (`master_admin`, `clients`, `couples`) and seeds default data (master admin + demo couple).

---

## 🧪 Step 5: Test the System

Start the dev server:

```bash
npm run dev
```

### Test Master Admin Login
- URL: `http://localhost:5173/master`
- **Username:** `masteradmin`
- **Password:** `masteradmin123`

You should see the Master Dashboard with 1 client and 1 couple page.

### Test Client Login
- URL: `http://localhost:5173/admin/login`
- **Gmail:** `renzjane@gmail.com`
- **Password:** `renzjane2024`

You should see the Client Dashboard with the editable couple page.

### Test Visitor Entry
- URL: `http://localhost:5173/love/renz-jane`
- **Access Code:** `0214`

You should see the code screen → memory game → full butterfly experience.

---

## 🔐 How Client Session Security Works

Each client login now:
1. **Generates a unique `session_token`** stored in Supabase.
2. Saves the token in `localStorage` on the client.
3. On app load, **validates the token** against the database.

If a client logs in on a second device:
- A **new token** is issued.
- The **old token** becomes invalid.
- The first device's session is **automatically revoked** (they're logged out).

This means:
- **One active session per client** at all times.
- No account sharing.
- Stolen or shared credentials can be revoked instantly by the client logging in again.

---

## 🚀 Deployment (Production)

### Deploy to Vercel / Netlify

1. Push your code to GitHub.
2. Connect your repo to Vercel or Netlify.
3. In the deployment settings, add environment variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon public key
4. Deploy.

Your production site is now live with a real database!

---

## 📊 Data Structure (Tables)

### `master_admin`
- Single row — website owner credentials.

### `clients`
- One row per client account (admin).
- Columns: `id`, `gmail`, `password`, `display_name`, `activation_code`, `activated`, `active`, `approved`, `session_token`, `couple_slug`, `subscription`, `expires_at`, etc.

### `couples`
- One row per couple page (love website).
- Columns: `id`, `slug`, `name1`, `name2`, `access_code`, `theme`, `package`, `photos`, `letters`, `songs`, `timeline`, `page_content`, etc.

---

## 🛠️ Troubleshooting

### "Supabase env vars missing" error
- Make sure `.env` exists in the root and contains valid values.
- Restart the dev server after editing `.env`.

### Client login fails
- Check the Supabase SQL Editor for errors — the `clients` table must exist.
- Verify `gmail` and `password` match a row in the `clients` table.

### Session revoked on refresh
- If a client's `session_token` no longer matches the DB (another device logged in), they're auto-logged out. This is **intentional security behavior**.

---

## 🎉 You're Done!

Your HeartLink system is now:
- ✅ Using a **real Postgres database** (Supabase).
- ✅ Secured with **single-session client accounts**.
- ✅ Free of unrelated boilerplate files.
- ✅ Production-ready.

For questions, check the Supabase docs: [supabase.com/docs](https://supabase.com/docs)
