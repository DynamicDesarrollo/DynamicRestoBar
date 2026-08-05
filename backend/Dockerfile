# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Instalar ca-certificates para conexiones HTTPS
RUN apk add --no-cache ca-certificates

# Copiar node_modules del builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Crear carpetas necesarias
RUN mkdir -p logs

# Exponer puerto
EXPOSE 5081

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||5081;require('http').get('http://localhost:'+p+'/health',(r)=>{if(r.statusCode!==200)process.exit(1)}).on('error',()=>process.exit(1))"

# Default command
CMD ["sh", "-c", "npm run migrate && npm start"]
