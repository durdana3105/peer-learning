# Troubleshooting Guide

Welcome to the troubleshooting guide for Peer Learning! If you encounter problems during project setup, dependency installation, or environment configuration, please check the solutions below. If your issue is not listed here, feel free to open a GitHub issue.

## 1. Missing Environment Variables

**Symptom**: The application crashes on startup or features do not work, often with errors indicating missing configuration keys (e.g., Supabase URLs or API keys).

**Solution**:
- Ensure you have copied `.env.example` to `.env`.
  ```bash
  cp .env.example .env
  ```
- Open `.env` and fill in all the required values. If you are missing development keys, ask a maintainer or refer to the project documentation to set up your own Supabase instance.

## 2. Supabase Connection Errors

**Symptom**: You see errors like "Failed to connect to database", "Network Error", or authentication features do not work during signup or login.

**Solution**:
- Check your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file. They must match exactly with your Supabase project settings.
- If you encounter a "Failed to fetch" error during signup, verify that your `.env` file contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values, then restart the development server.
- If you are running Supabase locally using the CLI, ensure the Docker containers are running:
  ```bash
  supabase status
  ```
- Try restarting the local Supabase instance:
  ```bash
  supabase stop
  supabase start
  ```

## 3. Dependency Installation Failures

**Symptom**: Running `npm install`, `yarn`, or `bun install` throws errors, or dependencies fail to resolve.

**Solution**:
- This project uses `bun` (as indicated by `bun.lockb`). Try using `bun` to install dependencies instead of `npm`:
  ```bash
  bun install
  ```
- If you are still encountering errors, clear the cache and reinstall:
  ```bash
  bun pm cache rm
  rm -rf node_modules
  bun install
  ```
- Ensure you are using a compatible Node.js version (v18+ recommended) if not exclusively relying on Bun.

## 4. Build and Deployment Issues

**Symptom**: The app fails to build when running `npm run build` or `bun run build`. Errors mention TypeScript compilation or Vite build failures.

**Solution**:
- Run TypeScript checking to identify type errors:
  ```bash
  bun run tsc --noEmit
  ```
- Fix any TypeScript errors reported.
- Ensure that you don't have conflicting dependencies. Sometimes updating a dependency can break the build. Try reverting to the exact versions in `bun.lockb`.

## 5. Authentication Setup Problems

**Symptom**: Users cannot sign in or sign up. OAuth providers (e.g., Google, GitHub) return an error.

**Solution**:
- Verify that your Supabase instance has the correct authentication providers enabled.
- If testing locally, ensure the Site URL in Supabase Auth settings is set to `http://localhost:5173` (or whatever port you are using).
- For OAuth, verify that the Client ID and Secret match the ones configured in your OAuth provider's developer console, and that the callback URL matches your Supabase project's redirect URL.
- After updating environment variables, restart the development server before testing authentication again.
- If you encounter a "Failed to fetch" error during signup, verify that your `.env` file contains valid Supabase credentials and that the application has been restarted after any configuration changes.

## 6. Push Notifications Not Delivering

### Symptom: Cron runs but `sent` is always 0

**Check VAPID configuration.** The response body will contain `{ "error": "Missing VAPID push server env" }` if `VAPID_PUBLIC_KEY` or `VAPID_PRIVATE_KEY` are not set in `backend/.env`. Generate keys and set them:

```bash
npx web-push generate-vapid-keys
```

Add to `backend/.env`:
```env
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

> Changing these keys invalidates all existing browser subscriptions. Users must re-subscribe.

### Symptom: Cron returns `HTTP 401` or `403`

`CRON_SECRET` is missing or does not match what the scheduler is sending. Verify the env var is set on the server and that the scheduler is passing `Authorization: Bearer <CRON_SECRET>`. Check `[AUDIT]` lines in server logs to confirm the secret type being presented.

### Symptom: Cron returns `HTTP 429` immediately

The 60-second per-route cooldown is active. The cron fired twice within 60 seconds (Vercel's at-least-once guarantee can cause this). Wait 60 seconds and retry. If this blocks manual drain, see the Manual Drain Procedure in `docs/smart-notifications.md`.

### Symptom: Notifications accumulate but are never delivered (queue keeps growing)

1. Confirm the cron scheduler is running and reaching the server (look for `[AUDIT]` log lines).
2. Check queue depth:
   ```sql
   SELECT COUNT(*) FROM notifications WHERE push_sent_at IS NULL;
   ```
3. If the queue is large, manually drain it — see `docs/smart-notifications.md` → **Manual drain procedure**.

### Symptom: `sent` is much lower than `processed` on every run

Most subscriptions in `push_subscriptions` are likely expired (browser was uninstalled, permission was revoked, or VAPID keys changed). The cron absorbs individual push failures silently. Check:

```sql
SELECT COUNT(*) FROM push_subscriptions;
```

If zero or very low, users need to re-subscribe by visiting the site and granting notification permission again.