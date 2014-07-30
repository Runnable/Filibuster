#
# filibuster_base Dockerfile
# Author anandkumarpatel
##                 #

# Pull base image.
FROM registry.runnable.com/core/base:latest

WORKDIR /

# Installing Node.js
RUN wget http://nodejs.org/dist/v0.10.29/node-v0.10.29.tar.gz
RUN tar xvf node-v*.tar.gz
WORKDIR node-v0.10.29/
RUN ./configure
RUN make -j16
RUN make install
