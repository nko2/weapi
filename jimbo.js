var net = require('net');

var server = net.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello World\n');
});

server.listen(8080);
