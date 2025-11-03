ARG APP_ROOT=/app
ARG APP_PORT=3000
ARG BASE_IMAGE=docker.io/node:24.11.0-alpine
ARG GIT_COMMIT

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
ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT} \
    NODE_ENV=production \
    NO_UPDATE_NOTIFIER=true \
    PATH="$PATH:${APP_ROOT}/node_modules/.bin"
WORKDIR ${APP_ROOT}

# Remove npm to reduce image size and attack surface. Use a non-root user and group (appuser:appgroup)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
 && addgroup -S appgroup && adduser -S appuser -G appgroup

# Install File Structure
COPY --chown=appuser:appgroup --chmod=555 --from=build ${APP_ROOT}/node_modules ${APP_ROOT}/node_modules
COPY --chown=appuser:appgroup --chmod=555 . ${APP_ROOT}
# Copying .git directory is unnecessary if GIT_COMMIT is defined
# COPY --chown=appuser:appgroup --chmod=555 .git ${APP_ROOT}/.git

# Run the app as appuser and limit heap size to 50 MB
USER appuser:appgroup
EXPOSE ${APP_PORT}
# Healthcheck is unsupported for OCI images
# HEALTHCHECK --interval=10s --timeout=3s CMD wget --quiet --spider http://localhost:${APP_PORT}/live || exit 1
CMD ["node", "server.ts"]
