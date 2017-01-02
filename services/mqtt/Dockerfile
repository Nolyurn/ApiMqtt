FROM node

COPY server /home/node/server
RUN chown node:node /home/node -R

RUN npm install --silent -g webpack

USER node
WORKDIR /home/node/server
RUN npm install --silent && npm run build

CMD ['npm', 'start']
