require('nko')('oLjV929INRhZXw/I');
var express = require('express');
var io = require('socket.io');

var app = express.createServer();
app.use(app.router);
app.use(express.static(__dirname + '/'));

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {
	console.log('Ready');

	// if run as root, downgrade to the owner of this file
	if (process.getuid() === 0)
		require('fs').stat(__filename, function(err, stats) {
			if (err) return console.log(err)
			process.setuid(stats.uid);
		});
});

io = io.listen(app);

var players = [];

io.sockets.on('connection', function(socket) {
	var	player = {x:405 , y:100};
	players.push(player);
	var player.index = players.indexOf(player);
	socket.on('join', function(nickname) {
		player.nickname = nickname;
	});
	socket.on('disconnect', function() {
		delete players.[player.index];
		socket.broadcast.emit('leave', player.index);
	});
});
