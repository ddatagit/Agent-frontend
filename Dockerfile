# 1. Base image
FROM node:20

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy source
COPY . .

# 5. Build Prisma Client
RUN npx prisma generate

# 6. Expose port
EXPOSE 3000

# 7. Start Next.js
CMD ["npm", "run", "dev"]
