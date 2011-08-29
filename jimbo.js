require('nko')('oLjV929INRhZXw/I');
var express = require('express');
var io = require('socket.io');
var log = require('util').log;

var app = express.createServer();
app.use(app.router);
app.use(express.static(__dirname + '/'));

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000,function() {
	log('Ready');

	// if run as root, downgrade to the owner of this file
	if (process.getuid() === 0)
		require('fs').stat(__filename, function(err, stats) {
			if (err) return console.log(err)
			process.setuid(stats.uid);
		});
});

io = io.listen(app);

app.configure('production',function(){
  io.set('log level', 0);
  io.enable('browser client minification');
});


var bullets = [];
var objects = [];
var players = [];
var sockets = {};
var SPEED = 5;
var fire = 0;

var removePlayer = function(player) {
	if (players.indexOf(player) == -1) {
		return;
	}
	players.splice(players.indexOf(player), 1);
	sockets[player.id].broadcast.emit('leave', player.id);
	log('user left (' + sockets[player.id].id + '):' + player.nickname);
}

io.sockets.on('connection', function(socket) {
  log('user connected: '+socket.id);
	socket.on('join', function(nickname) {
    log('user joined('+socket.id+'):'+nickname);
		var	player = {id: Date.now() + Math.random(), x:405 , y:250, blood: 100, vx: 0, vy: -3, fire: false,score:0};
		sockets[player.id] = socket;
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
		});
		socket.on('left', function() {
			player.vx = -SPEED - 2;
		});
		socket.on('space', function() {
			player.fire = ++fire;
		});
		socket.on('disconnect', function() {
			removePlayer(player);
		});
		socket.on('reconnect',function(){
		  removePlayer(player);
		  var	player = {id: Date.now() + Math.random(), x:405 , y:250, blood: 100, vx: 0, vy: -3, fire: false,score:0};
		  sockets[player.id] = socket;
		  player.nickname = nickname;
		  players.push(player);
		});
	});
});

var collidedItems, collisions;

var resetCollisions = function() {
	collisions = [];
	collidedItems = {};
};

var checkCollisions = function(item, radius, x, y) {
	if (radius > 1) {
		for (var x = item.x - radius; x < item.x + radius; x++) {
			for (var y = item.y - radius; y < item.y + radius; y++) {
				checkCollisions(item, 1, x, y);
			}
		};
		return;
	}
	if (collisions[x] && collisions[x][y]) {
		collisions[x][y].push(item) ;
		if (collisions[x][y].length == 2) {
			collidedItems[collisions[x][y][0].id] = collisions[x][y][0];
		}
		collidedItems[item.id] = item;
	} else {
		collisions[x] = collisions[x] || [];
		collisions[x][y] = [item];
	}
};

var winners = [];

var getRank = function(player) {
	var rank = 1;
	while (winners.length >= rank && winners[rank - 1].score > player.score) {
		rank++;
	}
	winners.splice(rank - 1, 0, {nickname: player.nickname, time: player.time, score: player.score});
	return rank;
};

var endGame = function(player) {
	var time = Math.round((Date.now() - player.id) / 1000);
	player.time = time;
	sockets[player.id].emit('end', getRank(player), player.score, time, winners.slice(0, 10));
	removePlayer(player);
};

var frame = 0;

var frameInterval = setInterval(function() {
	frame++;
	resetCollisions();
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

		if (player.x < -200) {
			player.x = -200;
			player.vx = 0;
		} else if (player.x > 1000) {
			player.x = 1000;
			player.vx = 0;
		}
		if (player.y < -4500) {
			endGame(player);
		}
		if (player.fire) {
			bullets.push({player: player, id: player.fire, x: player.x, y: player.y - 10}); 
		}
		checkCollisions(player, 10);
	});

	bullets.forEach(function(bullet) {
		bullet.y -= 8;
		if (bullet.y < -4500) {
			bullets.splice(bullets.indexOf(bullet), 1);
		}
		checkCollisions(bullet, 2);
	});

	for (var key in collidedItems) {
		var item = collidedItems[key];
		if (item.player) {
			item.player.score += 10;
			bullets.splice(bullets.indexOf(item), 1);
			io.sockets.emit('remove-bullet', item.id);
		} else {
			item.blood -= 10;
			if (item.blood <= 0) {
				removePlayer(item);
				sockets[item.id].emit('gameover',[]);
			}
		}
	};

	io.sockets.volatile.emit('frame', frame, players, objects);
	players.forEach(function(player) {
		player.fire = false;
	});
}, 34);
