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
var SPEED = 5;

var removePlayer = function(player, socket) {
	players.splice(players.indexOf(player), 1);
	socket.broadcast.emit('leave', player.id);
}

io.sockets.on('connection', function(socket) {
	socket.on('join', function(nickname) {
		var	player = {id: Date.now() + Math.random(), x:405 , y:250, blood: 100, vx: 0, vy: -3, fire: false};
		player.nickname = nickname;
		players.push(player);
		socket.emit('id', player.id);
		socket.on('up', function() {
			player.vy = -SPEED - 2;
		});
		socket.on('down', function() {
			player.vy = -1;
		});
		socket.on('right', function() {
			player.vx = SPEED + 2;
			//if (player.x < 0) {
			//	removePlayer(player, socket);
			//}
		});
		socket.on('left', function() {
			player.vx = -SPEED - 2;
			//if (player.x > 809) {
			//	removePlayer(player, socket);
			//}
		});
		socket.on('fire', function() {
			player.fire = true;
		});
		socket.on('disconnect', function() {
			removePlayer(player, socket);
		});
	});
});

var frame = 0;

var frameInterval = setInterval(function() {
	frame++;
	players.forEach(function(player) {
		if (Math.abs(player.vy) < SPEED) {
			player.y += player.vy;
		} else {
			player.y += -SPEED;
		}
		if (player.vy != -3) {
			player.vy += player.vy > -3 ? -1 : 1;
		}
		if (player.vx) {
			if (Math.abs(player.vx) < SPEED) {
				player.x += player.vx;
			} else {
				player.x += player.vx > 0 ? SPEED : -SPEED;
			}
			player.vx += player.vx > 0 ? -1 : 1;
		}
	});

	io.sockets.volatile.emit('frame', frame, players, objects);
	players.forEach(function(player) {
		player.fire = false;
	});
}, 34);
