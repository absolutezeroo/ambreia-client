# syntax=docker/dockerfile:1

# =================================================================================================
# Build stage
# =================================================================================================
# Node 22 and pnpm 11 are hard requirements, not preferences: this is a pnpm workspace and the
# packages depend on each other through the `workspace:` protocol, which npm and yarn cannot
# resolve at all (see README, "What has to exist outside this repository"). corepack reads
# `packageManager` in package.json, so the version here is the version the repo pins.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /src

# --- dependency layer ---------------------------------------------------------------------------
# The lockfile and every package manifest first. As long as no dependency moves, editing a source
# file reuses this layer instead of resolving and downloading the whole workspace again.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/vortex-client/package.json packages/vortex-client/
COPY packages/vortex-engine/package.json packages/vortex-engine/
COPY packages/vortex-glaze/package.json packages/vortex-glaze/
COPY packages/vortex-imager/package.json packages/vortex-imager/
RUN pnpm install --frozen-lockfile

# --- source + build ------------------------------------------------------------------------------
COPY . .

# install.mjs unpacks vortex-client-assets.zip into the tree the build expects and writes the
# deployment configuration (`common_configuration_txt.txt`), which is excluded from the archive on
# purpose so that a clone gets defaults rather than the packer's own hotel.
#
#   --skip-install  pnpm install already ran above, in its own cached layer
#   --skip-checks   the final step probes the asset host and the web API over the network; in a
#                   build container neither exists, and a failed probe sets exit code 1
#
# `sources/` is excluded by .dockerignore, so the zip is what feeds this — deliberately: a dump
# wins over the archive when both are present, and the image should build from the committed,
# reproducible copy rather than from whatever happens to sit in a developer's sources/ directory.
RUN node install.mjs --skip-install --skip-checks

# `prebuild` (tools/bundle-assets.mjs) runs on its own and turns the unpacked tree into the
# .bundle files index.html loads.
#
# NODE_OPTIONS is not tuning, it is what makes this step finish. `tsc && vite build` over this
# codebase exhausted V8's old space and aborted with exit 134 — the trace ends in
# Heap::CollectGarbage and "Aborted (core dumped)", which is the JavaScript heap filling up, not a
# compile error and not the kernel's OOM killer (that one is 137).
#
# Node sizes its default heap from the memory it believes it has, and inside a container with a
# memory limit that guess is routinely wrong in this direction. Naming the number removes the
# guess. If the step now dies with 137 instead, the limit is the container's and belongs in
# Coolify's Resource Limits — or the machine genuinely does not have the memory, and the build has
# to happen somewhere with more.
ENV NODE_OPTIONS=--max-old-space-size=4096

# The in-client window debugger (🐞 / Ctrl+Shift+D), off unless asked for. It has to be a BUILD
# argument, not a runtime variable: Vite inlines `import.meta.env.*` as literals and the minifier
# drops the dead branch, so an unset flag means the debugger is not in the bundle at all rather
# than merely hidden. Setting it in Coolify's runtime environment therefore does nothing.
#
# In Coolify this is a *Build Variable* (Configuration → Environment Variables → "Build Variable"),
# which is what gets passed through to `docker build --build-arg`.
ARG VITE_WINDOW_DEBUGGER=
ENV VITE_WINDOW_DEBUGGER=$VITE_WINDOW_DEBUGGER

RUN pnpm --filter vortex-client build

# =================================================================================================
# Runtime stage
# =================================================================================================
# Caddy rather than nginx for one reason that matters here: `handle_path` strips a prefix in one
# line, and reverse_proxy upgrades WebSockets with no extra configuration. Both are things the dev
# server did for free and that the build throws away.
FROM caddy:2-alpine AS runtime

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/packages/vortex-client/dist /srv

# No /assets volume here: the Nitro tree is its own resource (Dockerfile.assets) on its own
# hostname, and this container never reads it. The client finds it through the URLs inside
# gamedata/hashes.json.

EXPOSE 80

# This container's own build, and nothing else. `/` is the SPA entry point, so a 200 means Caddy is
# up AND /srv holds an index.html — an empty build output falls through `try_files` to a 404 rather
# than passing.
#
# Every upstream in the Caddyfile is deliberately outside the probe. The emulator being down is not
# this container being unhealthy, and probing /webapi would turn one outage into two restarting
# services.
#
# wget rather than curl: it is the busybox applet already in the alpine base, and this image ships
# no other HTTP client. `-O /dev/null` rather than `--spider`, which not every busybox build has.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
