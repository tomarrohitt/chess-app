FROM node@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e AS base


FROM base AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN SKIP_ENV_VALIDATION=true npm run db:generate

RUN SKIP_ENV_VALIDATION=true npm run build


FROM base AS runner

USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH \
    NODE_ENV=production

WORKDIR /app

COPY --chown=node package.json package-lock.json* ./

RUN npm install --omit=dev

COPY --chown=node --from=builder /app/dist ./dist


EXPOSE 7860
ENV PORT=7860

CMD ["node", "dist/src/index.js"]
