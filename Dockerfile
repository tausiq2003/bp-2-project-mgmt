FROM node:22.19.0-alpine3.21 AS base

FROM base AS builder
WORKDIR /home/build
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM base AS runner
LABEL author="Tausiq Samantaray"
LABEL description="This is a project-management-application where you can create projects, manage it, create tasks, subtasks with rbac"
WORKDIR /home/app
COPY --from=builder /home/build/dist ./dist/
COPY --from=builder /home/build/package*.json ./
COPY --from=builder /home/build/.env ./

RUN apk --no-cache add curl
RUN npm install --omit=dev
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost:8000/api/v1/healthcheck || exit 1
CMD ["npm", "start"]

