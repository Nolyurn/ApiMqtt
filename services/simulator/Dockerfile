FROM node

COPY sensors /home/node/sensors
RUN chown node:node /home/node -R

RUN npm install --silent -g webpack

USER node
WORKDIR /home/node/sensors
RUN npm install --silent && npm run build

CMD ['npm', 'start']
