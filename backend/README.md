# arunpremji.com — site + location-page admin

This is a small Node.js server that does two things:

1. Serves your portfolio site at `/` (the same design you already had).
2. Lets you create extra "location" landing pages — e.g.
   `www.arunpremji.com/digital_marketing_expert_in_dubai` — from a private
   admin panel at `/admin`, without touching any code. These pages are never
   linked from the homepage menu; they're meant to be found by Google (via the
   sitemap) or shared directly, so they can each target a different city's
   search keywords.

No database server to install — page data is stored in a small JSON file
(`data/pages.json`) on the server, which is simple and easy to back up.

---

## 1. What you need on the VPS

- Node.js 18 or newer. Check with `node -v`. If it's missing or older:
  ```
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- `pm2` to keep the site running and restart it automatically:
  ```
  sudo npm install -g pm2
  ```

## 2. Upload the project

Copy this whole folder to the VPS, e.g. into `/var/www/arunpremji`:

```
scp -r arunpremji-backend/ youruser@your-vps-ip:/var/www/arunpremji
ssh youruser@your-vps-ip
cd /var/www/arunpremji
```

## 3. Install dependencies

```
npm install --production
```

## 4. Configure

```
cp .env.example .env
nano .env
```

Set these values:

- `SITE_URL` → `https://www.arunpremji.com` (must match your real domain, used
  to build canonical links, the sitemap, and Open Graph image URLs)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` → only used the **first time** the
  server starts, to create the admin login. Change `ADMIN_PASSWORD` to
  something stronger than a phone number before going live — anyone who
  guesses it can edit your site. (See "Changing your password" below.)
- `SESSION_SECRET` → replace with a long random string, e.g. run
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  and paste the result in.
- `COOKIE_SECURE` → leave unset (or `false`) until HTTPS is working (step 6),
  then set it to `true`. This makes login cookies HTTPS-only.

## 5. Start it with pm2

```
pm2 start server.js --name arunpremji
pm2 save
pm2 startup     # follow the one printed command to enable auto-start on reboot
```

The site now runs on `http://127.0.0.1:3000` (or whatever `PORT` you set).
Check it's alive: `curl http://127.0.0.1:3000/`

## 6. Point Nginx + your domain at it

Install Nginx if you don't have it (`sudo apt-get install nginx`), then create
`/etc/nginx/sites-available/arunpremji`:

```
server {
    listen 80;
    server_name arunpremji.com www.arunpremji.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```
sudo ln -s /etc/nginx/sites-available/arunpremji /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Make sure your domain's DNS A record points at the VPS's IP address (this is
done wherever you registered/manage arunpremji.com, e.g. Otech Oman's panel).

Then get a free SSL certificate:

```
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d arunpremji.com -d www.arunpremji.com
```

Certbot edits the Nginx config to serve HTTPS automatically. Once that's
working, go back into `.env` and set `COOKIE_SECURE=true`, then
`pm2 restart arunpremji`.

## 7. Log in and create your first location page

Visit `https://www.arunpremji.com/login` and sign in with the username and
password from your `.env`. You'll land on `/admin`, where "+ New page" opens
a form with:

- **URL slug** — e.g. `digital_marketing_expert_in_dubai`. This becomes the
  page's link: `www.arunpremji.com/digital_marketing_expert_in_dubai`.
- **Meta title** — what shows in the browser tab and as the blue link in
  Google search results.
- **Meta description** — the gray snippet under the title in Google search
  results.
- **Title tag (hero)** — the small line above your name on the page itself
  (this is the field that currently says "DIGITAL MARKETING SPECIALIST" on
  the homepage).
- **Heading below the name** — one or more titles, comma-separated (e.g.
  `Digital Marketing Expert in Dubai, Full Stack Digital Marketer`); if you
  enter more than one they rotate automatically like on the homepage.

Save, and the page is live immediately — no deploy step. It will also appear
in `/sitemap.xml` automatically so Google can find it even without a link
from your homepage.

## Changing your password later

There's no "change password" screen yet (kept this first version simple).
To change it:

```
node -e "console.log(require('bcryptjs').hashSync('yourNewPassword', 10))"
```

Copy the output, then edit `data/admin.json` on the server and replace the
`passwordHash` value with it. Restart: `pm2 restart arunpremji`.

## Updating the homepage content itself

The homepage (`/`) is not editable from `/admin` on purpose, so it can't be
changed by accident. Its text lives in `lib/defaults.js`, and the full page
design is in `templates/site-template.html` (the same file every page,
including location pages, is built from). Edit either directly and restart
the server to apply changes.

## Local testing (optional)

```
npm install
cp .env.example .env
npm start
```

Then open `http://localhost:3000`.
