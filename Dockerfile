# syntax=docker.io/docker/dockerfile:1

FROM node:25

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm

COPY . /app
WORKDIR /app

ENV CI=true
ENV NODE_ENV=production

RUN pnpm install --frozen-lockfile

EXPOSE 80

ENV PORT=80
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
