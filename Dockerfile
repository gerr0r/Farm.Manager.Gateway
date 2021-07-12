FROM node:alpine

WORKDIR /opt/app

COPY package.json .

RUN npm install --silent
COPY . .

CMD npm run dev