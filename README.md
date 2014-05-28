Filibuster
==========

Allow host to enter into the namespaces of running containers.

Server Mode
-----------
use `npm start` to start this server on port specified by config

API
---
Filibuster only listens on its port and ignores all routes.
However it does use query parameters for inputs
*REQUIRED*
?pid  = pid of the container you want to attach too

optional
?name = type of terminal you desire. (default xterm-color)
?cols = number of cols for terminal (default 80)
?rows = number of rows for terminal (default 30)
?cwd = cwd path (default /)
?env = json object containing env variables (default none)

Tests
-----
`npm test`
