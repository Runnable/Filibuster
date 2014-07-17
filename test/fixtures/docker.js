'use strict';
var app = require('express')();

app.get('/containers/:id/json', function(req, res) {
  res.json({
    State: {
      Pid: 123,
      Running: true,
    }
  });
});

module.exports = app;