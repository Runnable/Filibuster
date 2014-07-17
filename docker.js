'use strict';
var configs = require("./configs.js");
var Docker = require('dockerode');
var docker = new Docker({
  host: configs.dockerHost,
  port: configs.dockerPort
});

function getContainerPid (containerId, cb) {
  var container = docker.getContainer(containerId);
  container.inspect(function(err, data){
    var pid = getPidFromInspectData(data);
    if (pid < 0) {
      return cb(new Error('cannot find Pid of container'));
    }
    return cb(null, pid);
  });
}

// will return -1 if invalid pid
function getPidFromInspectData (data) {
  if(data.State.Running){
    return parseInt(data.State.Pid);
  }
  return -1;
}

module.exports.getContainerPid = getContainerPid;