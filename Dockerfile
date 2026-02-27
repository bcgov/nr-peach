# Global arguments
ARG APP_ROOT=/app \
    APP_PORT=3000 \
    APP_UID=10001
ARG GIT_COMMIT

#
# Stage 1: Build & Dependency Extraction
#
FROM docker.io/node:24.13.1-alpine AS build

ARG APP_ROOT APP_UID
ENV NPM_CONFIG_FUND=false NPM_CONFIG_UPDATE_NOTIFIER=false

# Install app dependencies
WORKDIR ${APP_ROOT}
COPY package*.json .
RUN npm ci --ignore-scripts --omit=dev

# Create minimal user/group files for the final image
RUN echo "appuser:x:${APP_UID}:${APP_UID}:appuser:/:/sbin/nologin" > /etc/passwd_min && \
    echo "appgroup:x:${APP_UID}:" > /etc/group_min

# Check node dynamic dependencies
# RUN ldd /usr/local/bin/node

#
# Stage 2: Final Distroless Image
#
FROM scratch

ARG APP_ROOT APP_PORT APP_UID GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT} NODE_ENV=production

# Copy minimal identity and SSL certs (required for HTTPS requests)
COPY --from=build /etc/passwd_min /etc/passwd
COPY --from=build /etc/group_min /etc/group
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy required Alpine musl shared libraries and Node.js binary
COPY --from=build /lib/ld-musl-*.so.1 /lib/
COPY --from=build /usr/lib/libgcc_s.so.1 /usr/lib/libstdc++.so.6 /usr/lib/
COPY --from=build /usr/local/bin/node /usr/local/bin/node

# Copy App Code
WORKDIR ${APP_ROOT}
COPY --from=build --chown=0:0 ${APP_ROOT}/node_modules ./node_modules
COPY --chown=0:0 src ./src
COPY --chown=0:0 .env.default server.ts ./

# Security & Port configuration
USER ${APP_UID}
EXPOSE ${APP_PORT}

# Enter using the binary directly (no shell available in scratch)
ENTRYPOINT ["/usr/local/bin/node"]
CMD ["server.ts"]
