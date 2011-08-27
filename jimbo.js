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
	var	player = {id: Date.now() + Math.random(), x:405 , y:100, vx:0, vy:0};
	socket.on('join', function(nickname) {
		player.nickname = nickname;
		players.push(player);
		socket.emit('players', players, player.id);
		socket.broadcast.emit('player', player);
		socket.on('disconnect', function() {
			players.splice(players.indexOf(player), 1);
			socket.broadcast.emit('leave', player.id);
		});
	});
});

var frameInterval = setInterval(function() {
	players.forEach(function(player) {
		player.x += player.vx;
		player.y += player.vy;
	});
}, 40);
