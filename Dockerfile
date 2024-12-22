FROM node:22.11.0

WORKDIR /app

COPY . .

RUN npm install

CMD [ "node", "bot.js"]