FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 8000

CMD ["node", "index.js"]
