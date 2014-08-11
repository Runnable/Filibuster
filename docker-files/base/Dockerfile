#
# filibuster_base Dockerfile
# anandkumarpatel
###         #

# Pull base image.
FROM registry.runnable.com/runnable/base:latest


WORKDIR /

COPY ./filibuster ./filibuster-init

# Installing Node.js
RUN wget http://nodejs.org/dist/v0.10.29/node-v0.10.29.tar.gz
RUN tar xvf node-v*.tar.gz
WORKDIR node-v0.10.29/
RUN ./configure
RUN make -j16
RUN make install
