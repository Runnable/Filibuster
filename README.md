Filibuster
==========
![Filibuster](https://s3.amazonaws.com/uploads.hipchat.com/31372/651154/4B81cwE0Ynn3CwA/pirate_270x270-24-20130116-39.jpg)
Allow host to enter into the namespaces of running containers.


Server Mode
-----------
use `npm start` to start this server on port specified by config


API
---
Filibuster only listens on its port and ignores all routes

However it does use query parameters for inputs

REQUIRED

?containerID  = container of the container you want to attach too

*optional*

?name = type of terminal you desire. (default xterm-color)

?cols = number of cols for terminal (default 80)

?rows = number of rows for terminal (default 30)

?cwd = cwd path (default /)

?env = json object containing env variables (default none)

The api returns a primus stream. This stream is actually 2 substreams clientEvents and terminal

clientEvents: used to pass events from client to server

terminal: `stream` of `stdin` and `stdout` of `pty` instance in container namespace


Events
------
This stream only accepts objects formated like so:
```
{
  event: "EVENT_NAME", // must be string
  data: data // can be anything
}

to resize the terminal
```
{
  event: "resize"
  data: {
    x: number of col
    y: number of row
  }
}
```
to send ping event
```
{
  event: "ping"
}
```
this stream will also emit errors with the form
```
{
  event: "error"
  data: "error data"
}
```


Tests
-----
`npm test`
