FROM node:20.15

USER node 

RUN mkdir /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package-lock.json package.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev:local"]