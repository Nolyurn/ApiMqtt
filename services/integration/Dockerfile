FROM node

RUN apt-get -qq update
RUN apt-get -qq install git libzmq3 libzmq3-dev

COPY tests /home/node/tests
RUN chown node:node /home/node -R

USER node
WORKDIR /home/node

RUN git init
RUN git remote add -f origin https://github.com/Nolyurn/proto-mqtt.git
RUN git config core.sparseCheckout true
RUN echo "api" >> .git/info/sparse-checkout
RUN git pull origin master
RUN rm -r .git

WORKDIR /home/node/api
RUN npm install --silent
RUN npm test

WORKDIR /home/node/tests
RUN npm install --silent

CMD [ "npm", "test" ]
