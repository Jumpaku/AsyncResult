FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && apt install -y npm git curl
RUN npm install -g npm@7.5.4 n@7.0.0 
RUN n 15.8.0

WORKDIR /node-dev
