FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
# install typescript for the build step
RUN npm install typescript ts-node

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
