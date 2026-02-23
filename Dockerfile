# Global arguments
ARG APP_ROOT=/app \
    APP_PORT=3000
ARG GIT_COMMIT

#
# Stage 1: Build & Dependency Extraction
#
FROM docker.io/node:24.13.1-alpine AS build

ARG APP_ROOT
ENV NPM_CONFIG_FUND=false NPM_CONFIG_UPDATE_NOTIFIER=false

# Install app dependencies
WORKDIR ${APP_ROOT}
COPY package*.json .
RUN npm ci --ignore-scripts --omit=dev

# Create minimal user/group files for the final image
RUN echo "appuser:x:10001:10001:appuser:/:/sbin/nologin" > /etc/passwd_min && \
    echo "appgroup:x:10001:" > /etc/group_min

#
# Stage 2: Final Distroless Image
#
FROM scratch

ARG APP_ROOT APP_PORT GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT} NODE_ENV=production

# Copy minimal identity and SSL certs (required for HTTPS requests)
COPY --from=build /etc/passwd_min /etc/passwd
COPY --from=build /etc/group_min /etc/group
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy required Alpine musl shared libraries and Node.js binary
COPY --from=build /lib/ld-musl-*.so.1 /lib/
COPY --from=build /usr/lib/libgcc_s.so.1 /usr/lib/libstdc++.so.6 /usr/lib/libbrotli* /usr/lib/libz.so.1 /usr/lib/
COPY --from=build /usr/local/bin/node /usr/local/bin/node

# Copy App Code
WORKDIR ${APP_ROOT}
COPY --from=build --chown=10001:10001 --chmod=555 ${APP_ROOT}/node_modules ./node_modules
COPY --chown=10001:10001 --chmod=555 src ./src
COPY --chown=10001:10001 --chmod=555 .env.default server.ts ./

# Security & Port configuration
USER 10001:10001
EXPOSE ${APP_PORT}

# Enter using the binary directly (no shell available in scratch)
ENTRYPOINT ["/usr/local/bin/node"]
CMD ["server.ts"]
