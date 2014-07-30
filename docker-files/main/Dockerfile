#
# filibuster_main Dockerfile
# Author anandkumarpatel
##                 #

# Pull base image.
FROM registry.runnable.com/core/filibuster_base:latest

WORKDIR /

# Download Repo
RUN git clone git@github.com:CodeNow/Filibuster.git

WORKDIR /Filibuster

RUN npm install

# Expose port to Host
EXPOSE 3000

# Define default command.
CMD ["/usr/local/bin/npm", "start"]
