# Flowstas build worker image.
# Carries node (to run the server + engine), git (to clone repos), and flyctl
# (to build + deploy customer apps via Fly's remote builder — so no Docker
# daemon is needed inside this container).
FROM node:20-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# flyctl, pinned to the version proven in the spike.
RUN curl -L https://fly.io/install.sh | FLYCTL_INSTALL=/usr/local sh -s 0.4.59
ENV PATH="/usr/local/bin:${PATH}"

WORKDIR /app
# Build context is the repo's scripts/ dir, so both the worker and the engine it
# drives are in reach. Layout mirrors the repo: deploy-app.mjs sits one dir above
# the worker, matching server.mjs's relative ../deploy-app.mjs lookup.
COPY build-worker /app/build-worker
COPY deploy-app.mjs /app/deploy-app.mjs

ENV PORT=8080
EXPOSE 8080
CMD ["node", "/app/build-worker/server.mjs"]
