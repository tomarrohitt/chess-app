FROM node@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e AS base


FROM base AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run db:generate

RUN npm run build


FROM base AS runner

USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH \
    NODE_ENV=production

WORKDIR /app

COPY --chown=node package.json package-lock.json* ./

RUN npm ci --only=production

COPY --chown=node --from=builder /app/dist ./dist


EXPOSE 7860
ENV PORT=7860

CMD ["node", "dist/src/index.js"]