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

**Symptom**: You see errors like "Failed to connect to database", "Network Error", or authentication features do not work.

**Solution**:
- Check your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file. They must match exactly with your Supabase project settings.
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
