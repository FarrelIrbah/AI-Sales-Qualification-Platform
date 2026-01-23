# LeadQual

AI-powered sales lead qualification with ICP-personalized scoring.

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Google Cloud account (for OAuth, optional)

### Setup

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Create Supabase project**

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase credentials from Settings > API:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon public key
   - `DATABASE_URL` - Connection string (Transaction pooler)

4. **Run database migration**

   In Supabase Dashboard > SQL Editor, run the contents of:
   ```
   supabase/migrations/0001_create_profiles.sql
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Development Notes

### Disable Email Confirmation (Recommended for Development)

Supabase free tier has strict email rate limits (3-4 emails/hour). **This cannot be bypassed in code** — it's enforced at Supabase's API level.

To enable instant signup without email verification:

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
2. Toggle **OFF** "Confirm email"
3. Click **Save**

**What happens with each setting:**

| Setting | Behavior |
|---------|----------|
| Confirm email ON | User created, email sent, must click link to activate. Rate limited. |
| Confirm email OFF | User created and logged in immediately. No email sent. No rate limit. |

The app handles both modes gracefully — with confirmation disabled, users redirect immediately; with it enabled, they see a "check your email" message.

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Dashboard > Authentication > Providers > Google

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Auth**: Supabase Auth
