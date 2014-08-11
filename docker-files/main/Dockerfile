#
# filibuster_main Dockerfile
# copies filibuster and node to disk
# REQUIRED MOUNTS:
# /root:/host/root:rw
# /usr/local/bin/:/host/bin
# /etc/init.d
# anandkumarpatel
###         #

# Pull base image.
FROM registry.runnable.com/runnableio/filibuster_base:latest

WORKDIR /

# Download Repo
RUN git clone git@github.com:CodeNow/filibuster.git

WORKDIR /filibuster
RUN npm install

# Expose port to Host
EXPOSE 3000

# Define default command.
CMD ["/usr/local/bin/npm", "start"]
