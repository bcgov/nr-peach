ARG APP_ROOT=/app
ARG APP_PORT=3000
ARG BASE_IMAGE=docker.io/node:22.14.0-alpine

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
ENV NO_UPDATE_NOTIFIER=true \
    PATH="$PATH:${APP_ROOT}/node_modules/.bin"
WORKDIR ${APP_ROOT}

# Drop NPM
RUN rm -rf /usr/local/lib/node_modules/npm

# Use a non-root user and group (appuser:appgroup)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Install File Structure
COPY --chown=appuser:appgroup --from=build ${APP_ROOT}/node_modules ${APP_ROOT}/node_modules
COPY --chown=appuser:appgroup .git ${APP_ROOT}/.git
COPY --chown=appuser:appgroup . ${APP_ROOT}

# Run the app, limit heap size to 50 MB
EXPOSE ${APP_PORT}
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --spider http://localhost:${APP_PORT} || exit 1
CMD ["node", "--experimental-transform-types", "--max-old-space-size=50", "server.ts"]
