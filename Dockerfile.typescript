FROM node:20-slim

WORKDIR /app

# Install CA certificates
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Copy package manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]
