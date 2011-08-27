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

var objects = [];
var players = [];
var SPEED = 4;

var removePlayer = function(player) {
	players.splice(players.indexOf(player), 1);
	socket.broadcast.emit('leave', player.id);
}

io.sockets.on('connection', function(socket) {
	socket.on('join', function(nickname) {
		var	player = {id: Date.now() + Math.random(), x:405 , y:100, blood: 100};
		player.nickname = nickname;
		players.push(player);
		socket.emit('players', players, player.id);
		socket.broadcast.emit('player', player);
		socket.on('up', function() {
			player.y += SPEED;
		});
		socket.on('down', function() {
			player.y -= SPEED;
		});
		socket.on('right', function() {
			player.x += SPEED;
			if (player.x < 0) {
				removePlayer(player);
			}
		});
		socket.on('left', function() {
			player.x -= SPEED;
			if (player.x > 809) {
				removePlayer(player);
			}
		});
		socket.on('fire', function() {
			
		});
		socket.on('disconnect', function() {
			removePlayer(player);
		});
	});
});

var frameInterval = setInterval(function() {
	players.forEach(function(player) {
		player.y += SPEED;
	});

	io.sockets.emit('frame', players, objects);
}, 34);
