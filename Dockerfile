FROM node:18 # Use a Node.js image with the required version of glibc

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
