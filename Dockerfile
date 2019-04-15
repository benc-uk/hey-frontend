FROM node:10-jessie
ENV NODE_ENV production
WORKDIR /app 

# For efficient layer caching with NPM, this *really* speeds things up
COPY package.json .

# NPM install for the server packages
RUN npm install --production --silent

# NPM is done, now copy in the the whole project to the workdir
COPY server.js .
COPY bin/ ./bin/
COPY site/ ./site/

VOLUME [ "/app/data" ]

EXPOSE 3000
ENTRYPOINT  ["npm", "start"]
