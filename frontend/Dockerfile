# Imagem do front end (React + Vite) para o ambiente de E2E: constrói os arquivos estáticos e os serve com nginx.
# A URL da API é decidida na construção (VITE_API_URL), nunca digitada no código. Sem segredo na imagem.
# Imagens fixadas por digest, como no compose.yaml.

# ---- construção
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS construcao
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: scripts de instalação de pacotes não rodam (mesma regra da CI).
RUN npm ci --ignore-scripts
COPY . .
# O contrato (docs/api/openapi.json) já gerou src/api/schema.d.ts, versionado; a imagem não precisa regenerá-lo.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npx vite build

# ---- execução
FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construcao /app/dist /usr/share/nginx/html
EXPOSE 80
