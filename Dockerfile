FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Development command
CMD ["sh", "-c", "npm run dev"]

# Development command (with node_modules check)
# CMD ["sh", "-c", "if [ ! -d node_modules ]; then npm install --legacy-peer-deps; fi && npm run dev"]
