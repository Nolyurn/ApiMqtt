FROM node

RUN apt-get -qq update
RUN apt-get -qq install git libzmq3 libzmq3-dev

COPY tests /home/node/tests
RUN chown node:node /home/node -R

USER node
WORKDIR /home/node/tests
RUN npm install --silent

CMD [ "npm", "test" ]
