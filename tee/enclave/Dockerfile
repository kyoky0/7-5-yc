# Built by scripts/build-eif.sh, then converted into an EIF via
# `nitro-cli build-enclave --docker-uri <this image> --output-file enclave.eif`.
# nitro-cli measures this image's contents (PCR0/1/2) at build time.

FROM node:20-bullseye-slim
WORKDIR /app

COPY package.json package-lock.json* tsconfig.base.json ./
COPY common ./common
COPY enclave ./enclave

RUN npm install --workspaces --include-workspace-root \
 && npm run build --workspace=@serendipity/common --workspace=@serendipity/enclave

ENV ENCLAVE_TRANSPORT=vsock
ENV ENCLAVE_PORT=5005

WORKDIR /app/enclave

# Nitro Enclaves have no network interface -- vsock is the only I/O this
# process has, which is what makes it safe to hold decrypted company secrets.
ENTRYPOINT ["node", "dist/index.js"]
