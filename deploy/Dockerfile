# The server is four files plus whatever npm brings in -- see server/docs/install.md.
# Nothing is vendored here: daveappserver, daverss, davesql and the rest come from
# npm at build time, exactly as they do in a hand install.

FROM node:22-bookworm-slim AS build

# better-sqlite3 arrives via davesql and ships prebuilds for most platforms;
# these are here so the build still succeeds when it has to compile.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/code/package.json ./
RUN npm install --omit=dev


FROM node:22-bookworm-slim

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY server/code/package.json server/code/rssnetwork.js server/code/emailtemplate.html ./

# config.json is mounted in, per environment. data/ is the volume: the sqlite
# database, the feeds, and prefs.json all live there.
RUN mkdir -p data && chown -R node:node /app
USER node

EXPOSE 1420 1422

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:1420/getrecentitems?ct=1').then(r => process.exit (r.ok ? 0 : 1)).catch (() => process.exit (1))"

CMD ["node", "rssnetwork.js"]
