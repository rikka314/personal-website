# Steve Huang Personal Website

This repository contains the source for `https://gfm156.com` and the writing surface for `https://write.gfm156.com`.

## Stack

- React 19 + Vite 7
- Tailwind CSS v4
- React Router
- Static public blog runtime JSON
- PHP/FPM admin API for writing, publishing, upload, and Markdown import

## Public routes

- `/` About page
- `/projects` Projects page
- `/blog` Blog hub with search, filters, featured posts, and pagination
- `/blog/columns/:columnSlug` Column pages
- `/blog/:slug` Article page with TOC, code blocks, LaTeX, and comments
- `/contact` Contact page

## Admin surface

- Hostname: `write.gfm156.com`
- Routes:
  - `/` dashboard
  - `/articles/new`
  - `/articles/:articleId`
- Auth: GitHub OAuth via `server/blog-admin/api/index.php`
- Temporary fallback while the dedicated subdomain is not live yet: `https://gfm156.com/write/`

## Runtime content model

- Public site reads runtime data from `/blog-runtime`.
- Published assets are served from `/blog-assets`.
- Server-side source of truth is a file library under the configured `storage_root`.
- This repo ships an empty default blog seed in `src/data/blogSeed.js` and bootstrap runtime JSON in `server/seeds/blog-runtime`.
- Source storage is only bootstrapped on first initialization; deleting all articles is treated as a valid long-term empty state.

## Local development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run build:blog-runtime
npm run lint
```

### Local admin development

1. Copy `server/blog-admin/api/config.example.php` to `server/blog-admin/api/config.php`.
2. Fill in GitHub OAuth, storage, and runtime paths. Leave `github_allowed_logins` empty to allow any GitHub account, or add one or more logins to restrict access.
3. Start a local PHP server that exposes the `server/blog-admin/api` directory under `/api`.
4. Run the frontend with `VITE_SITE_SURFACE=admin`.

Client env vars are documented in `.env.example`.

## Deployment

The deploy scripts now:

1. build the frontend
2. build seed runtime JSON
3. upload the public app to `/www/wwwroot/www.gfm156.com`
4. upload the admin app, PHP API, and seed runtime to `/www/wwwroot/write.gfm156.com`
5. keep `write.gfm156.com` in HTTP bootstrap mode until the subdomain certificate exists
6. automatically switch nginx to the final `write.gfm156.com` + `/write` redirect config after the certificate is live
7. reload nginx

Related server files:

- `nginx/www.gfm156.com.conf`
- `nginx/www.gfm156.com.after-write-cutover.conf`
- `nginx/write.gfm156.com.conf`
- `nginx/write.gfm156.com.bootstrap.conf`
- `server/blog-admin/api/config.example.php`

## Finalizing The Subdomain

When `write.gfm156.com` has a public DNS A record pointing to `115.191.68.122`, finish the production cutover with:

```bash
GITHUB_CLIENT_ID=your-client-id \
GITHUB_CLIENT_SECRET=your-client-secret \
node scripts/activate-write-subdomain.mjs
```

Optional env vars:

- `GITHUB_ALLOWED_LOGINS` comma-separated GitHub logins; omit it to allow any GitHub account
- `GITHUB_ALLOWED_LOGIN` legacy single-login fallback
- `LETSENCRYPT_EMAIL`
- `WRITE_SERVER_HOST`
- `WRITE_SERVER_IP`

The activation script:

1. verifies DNS from the server side
2. installs the HTTP bootstrap vhost for `write.gfm156.com`
3. requests the Let's Encrypt certificate
4. writes the production `api/config.php` with GitHub OAuth and disables password login
5. switches the public `/write` path to a redirect targeting `https://write.gfm156.com/`

## Blog authoring flows

1. Write directly inside `write.gfm156.com`, save draft, and publish.
2. Import a local Markdown file plus related images through the dashboard.

Published runtime JSON is rebuilt by the admin API after create, update, publish, unpublish, delete, and import actions.

## Editorial design preview

The public site and writing surface share the typography, color, and interaction rules in `design-system/personal-website/MASTER.md`. The public site uses open editorial sections; the admin editor uses side-by-side Markdown and preview at 1200px and above, with view tabs on smaller screens.

```bash
npm run dev                 # Actual local site; the default blog seed is empty
npm run preview:editorial   # Isolated fixture previews: public :5175, admin :5174
npm run test:editorial      # Markdown heading / table-of-contents regression checks
```

The fixture previews bind only to `127.0.0.1`, keep sample articles in memory, and do not connect to the production API or library. Restarting the command resets the sample content. The preview admin starts signed in; after logout its local password form accepts any text. This behavior belongs only to the standalone preview script, which is never imported by the application or production build.

Review screenshots and the responsive check results are generated under `artifacts/editorial/`. Production authentication, API paths, article schema, and publishing semantics remain unchanged.
