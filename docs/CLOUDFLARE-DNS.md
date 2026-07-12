# Cloudflare DNS for jackalsvolleyball.com

Your domain is on **Cloudflare**. The app deploys to **Fly.io** as `jackals-vc` (see `fly.toml`).

Do this **after** your first `fly deploy` succeeds.

## 1. Request TLS certificates on Fly

```bash
fly certs add jackalsvolleyball.com
fly certs add www.jackalsvolleyball.com
```

Fly prints the DNS records it needs. You can also check anytime:

```bash
fly certs show jackalsvolleyball.com
```

## 2. Add DNS records in Cloudflare

Open **Cloudflare Dashboard → jackalsvolleyball.com → DNS → Records**.

### Apex (`jackalsvolleyball.com`)

Fly usually provides **A** and **AAAA** records. Add what `fly certs show` lists, for example:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | Fly IPv4 (from `fly certs show`) | **DNS only** (grey cloud) |
| **AAAA** | `@` | Fly IPv6 (from `fly certs show`) | **DNS only** (grey cloud) |

**Alternative (works on Cloudflare):** CNAME flattening for apex:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **CNAME** | `@` | `jackals-vc.fly.dev` | **DNS only** (grey cloud) |

> Start with **DNS only** (grey cloud) until HTTPS works end-to-end. You can enable the orange cloud later.

### `www`

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **CNAME** | `www` | `jackals-vc.fly.dev` | **DNS only** (grey cloud) |

## 3. SSL/TLS settings (Cloudflare)

After Fly shows the certificate as **Ready**:

1. **SSL/TLS → Overview** → set mode to **Full (strict)**
2. **Edge Certificates** → enable **Always Use HTTPS**
3. Optional **Redirect Rule**: `www.jackalsvolleyball.com/*` → `https://jackalsvolleyball.com/$1` (301)

Fly also terminates HTTPS on its edge; **Full (strict)** is correct when both Fly and Cloudflare issue certs.

## 4. Verify

```bash
fly certs check jackalsvolleyball.com
fly certs check www.jackalsvolleyball.com
```

In a browser:

- https://jackalsvolleyball.com
- https://www.jackalsvolleyball.com (should redirect to apex if you added the rule)

DNS can take a few minutes (up to an hour in rare cases).

## 5. App configuration (already in repo)

| Setting | Value |
|---------|--------|
| `fly.toml` → `NEXT_PUBLIC_SITE_URL` | `https://jackalsvolleyball.com` |
| `src/lib/site-config.ts` | `SITE_DOMAIN = "jackalsvolleyball.com"` |
| Root layout `metadataBase` | Uses production URL |

Redeploy after any env change:

```bash
fly deploy
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Certificate stuck “Awaiting configuration” | DNS records missing or wrong; compare with `fly certs show` |
| Too many redirects | Cloudflare SSL on **Flexible** — switch to **Full (strict)** |
| Site loads on `*.fly.dev` but not custom domain | DNS not propagated; check grey vs orange cloud |
| Login redirects to wrong host | `NEXT_PUBLIC_SITE_URL` must be `https://jackalsvolleyball.com` |

## Email (optional, same domain later)

If you later send mail as `@jackalsvolleyball.com`, add SPF/DKIM in Cloudflare. For now, Gmail SMTP (`jackalsvolleyballclub@gmail.com`) in Fly secrets is fine and needs no DNS change.
