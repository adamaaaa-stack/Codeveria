# Codeveria

Platform for companies to hire verified student developers for paid projects. Next.js 14, TypeScript, Supabase, PayPal.

## Deploy on Vercel

1. **Push your code to GitHub** (e.g. [adamaaaa-stack/Devbridge](https://github.com/adamaaaa-stack/Devbridge) or your Codeveria repo).

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
   - Import your GitHub repo
   - Vercel will detect Next.js; keep the default build settings

3. **Environment variables**  
   In the project **Settings → Environment Variables**, add:

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | For escrow/ledger/payouts; keep secret |
   | `PAYPAL_CLIENT_ID` | Yes | PayPal REST API client ID |
   | `PAYPAL_SECRET` | Yes | PayPal REST API secret |
   | `PAYPAL_API_BASE` | No | Default `https://api-m.sandbox.paypal.com` (use live URL for production) |
   | `PAYPAL_WEBHOOK_ID` | Yes | Webhook ID from PayPal developer dashboard |
   | `NEXT_PUBLIC_APP_URL` | No | e.g. `https://your-app.vercel.app` (PayPal return URL) |

   Add them for **Production** (and Preview if you use preview deploys).

4. **Deploy**  
   Click **Deploy**. The first deployment will run `npm run build`.

5. **PayPal webhook**  
   After the first deploy, in [PayPal Developer](https://developer.paypal.com) → Your app → Webhooks, add:
   - **URL:** `https://your-project.vercel.app/api/payments/webhook`
   - **Events:** `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`
   - Copy the **Webhook ID** and set it as `PAYPAL_WEBHOOK_ID` in Vercel.

6. **Supabase**  
   Run your Supabase migrations (e.g. `supabase db push` or run SQL from `supabase/migrations/`) so the production database has all tables including `007_paypal`.

---

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Use `.env.local` for Supabase and PayPal keys (see table above). Never commit `.env.local`. See `.env.example` for variable names.
