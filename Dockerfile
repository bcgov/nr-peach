ARG APP_ROOT=/app
ARG APP_PORT=3000
ARG BASE_IMAGE=docker.io/node:22.16.0-alpine@sha256:9f3ae04faa4d2188825803bf890792f33cc39033c9241fc6bb201149470436ca

#
# Build the app
#
FROM ${BASE_IMAGE} AS build

ARG APP_ROOT
ENV NO_UPDATE_NOTIFIER=true
WORKDIR ${APP_ROOT}

# Build App
COPY package*.json .
RUN npm ci --ignore-scripts --omit-dev

#
# Compile the container image
#
FROM ${BASE_IMAGE}

ARG APP_ROOT
ARG APP_PORT
ENV NODE_ENV=production \
    NO_UPDATE_NOTIFIER=true \
    PATH="$PATH:${APP_ROOT}/node_modules/.bin"
WORKDIR ${APP_ROOT}

# Drop NPM and use a non-root user and group (appuser:appgroup)
RUN rm -rf /usr/local/lib/node_modules/npm \
 && addgroup -S appgroup && adduser -S appuser -G appgroup

# Install File Structure
COPY --chown=appuser:appgroup --chmod=755 --from=build ${APP_ROOT}/node_modules ${APP_ROOT}/node_modules
COPY --chown=appuser:appgroup --chmod=755 .git ${APP_ROOT}/.git
COPY --chown=appuser:appgroup --chmod=755 . ${APP_ROOT}

# Run the app as appuser and limit heap size to 50 MB
USER appuser:appgroup
EXPOSE ${APP_PORT}
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --spider http://localhost:${APP_PORT}/live || exit 1
CMD ["node", "--experimental-transform-types", "--max-old-space-size=50", "server.ts"]
