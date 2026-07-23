# Running an rss.chat server in Docker

The same install [server/docs/install.md](../server/docs/install.md) describes, in
containers. Nothing about the server is changed or vendored: the image runs
`rssnetwork.js` unmodified, `npm install` pulls daveappserver, daverss, davesql and
the rest from npm at build time, and the client's home page is still fetched from
`code.scripting.com` at runtime. Everything you'd configure by hand is still in a
`config.json` you edit -- these files only decide where it's mounted.

Three services:

| | |
|---|---|
| **rsschat** | the server -- http on 1420, websockets on 1422, SQLite in a volume |
| **caddy** | the only thing listening on the host; routes websocket upgrades to 1422, everything else to 1420 |
| **mailpit** | catches the sign-in mail so nobody has to set up SMTP to log in |

## Why mailpit

Sign-in is a magic link: the server emails you a URL, you click it, you're in. There
are no passwords, so **a server that can't send mail is a server nobody can sign into**
-- including you. Normally that means an SMTP provider or a verified SES domain
before you can see your own install.

Mailpit is a fake SMTP server with a web inbox. The server sends to it, and you read
the link in a browser. No provider, no account, no DNS records.

Swapping in real mail later is four values in `config.json` (`smtpHost`, `smtpPort`,
`smtpUsername`, `smtpPassword`) and deleting the mailpit service --
[server/docs/email.md](../server/docs/email.md) covers both SMTP and SES.

## Development

```
docker compose -f compose.dev.yml up --build
```

- the app: <http://localhost>
- the inbox: <http://localhost:8025>

Sign up with any address at all -- `you@example.com` works, nothing is really sent --
then open the inbox and click the link.

`rssnetwork.js` is bind-mounted, so editing it and running
`docker compose -f compose.dev.yml restart rsschat` picks up the change with no rebuild.

If either port is taken (another project's mailpit, say):

```
HTTP_PORT=8080 MAILPIT_PORT=8026 docker compose -f compose.dev.yml up
```

## Production

```
cp .env.example .env                                       # domain, ACME email, mailpit password
cp config/config.prod.example.json config/config.prod.json # the server's own settings
```

Edit both, then:

```
docker compose -f compose.prod.yml up -d --build
```

Caddy gets a certificate for `$DOMAIN` on first boot -- point the DNS at the host
first, and leave 80 open, that's how the ACME challenge arrives.

**Your domain goes in two files.** `.env` is what Caddy gets a certificate for;
`config.prod.json` is what the server builds permalinks and feed URLs from. They have
to agree. (`urlServerForClient` in particular is baked into the guid of every post --
changing it later changes the identity of future posts.)

The inbox is at `https://$DOMAIN/mailpit`, behind basic auth. **Set a real password.**
Anyone who reaches that inbox can request a magic link for any address and read it --
it is a skeleton key to every account on the server. Generate the hash with:

```
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'yourpassword'
```

### Backups

The database is one file in a named volume. The server's own export verb is the better
way, and it runs against a live server without disturbing it:

```
docker compose -f compose.prod.yml exec rsschat node rssnetwork.js export backup.json
docker compose -f compose.prod.yml cp rsschat:/app/backup.json ./backup.json
```

Post ids survive the round trip, so permalinks keep working. `import` takes it back
into an empty server -- see [install.md](../server/docs/install.md#backups).

## Notes

**Dependencies float.** `package.json` pins the two direct dependencies and asks for
`*` on Dave's packages, so a rebuild picks up whatever npm has today. That's how the
project works upstream, and there is no lockfile to change it. If you need a
reproducible image, tag it and redeploy the tag rather than rebuilding.

**One upstream crash to know about.** `buildFeedForUser` reads `userRec.prefs.myFeedTitle`,
and `prefs` is null until `/saveprefs` has been called at least once. The shipped
client always calls it during signup, so the web UI never hits this -- but an API
client that posts before saving prefs takes the server down (`restart: unless-stopped`
brings it back, and the post is already saved; only the feed rebuild dies).

**`stats.json` isn't persisted.** daveappserver writes it to the working directory,
which is the container's writable layer, so the hit counters reset when the container
is recreated. `prefs.json` and the database are in the volume.

**`webSocketStartup: err.message == theWsServer.listen is not a function`** at boot is
upstream noise, not a misconfiguration -- `new ws.Server({port})` has already bound the
port by the time that line runs. Websockets work; the error is caught and ignored.
