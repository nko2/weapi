  var players = {};
  var bullets = [];
  var layers = {};
  var myId = -1;
  var lastFrame = 0;
  var keyTimer;
  var lastShot = 0;
  // create layers
  layers['stars']   = new Layer();
  layers['players'] = new Layer();
  layers['widgets'] = new Layer();


function ArcD(center, radius, angle) {
	if(! center.x ){ // assume it as an array
		center = new Point(center[0],center[1]);
	}
	var from = new Point(center.x, center.y - radius);
	var through = from.rotate(angle/2, center);
	var to = from.rotate(angle, center);
	var arc = new Path.Arc(from, through, to);
	return arc;
}

function BloodWidget(position){
  layers['widgets'].activate();
  var thickness = 10;
  var bgColor = '#868686';
  var color = '#616161';

  //blood widget, an arc at top corner
  var backPath = this.backPath = new Path.Circle(position,20);

  backPath.strokeColor = bgColor;
  backPath.strokeWidth = thickness + 4;

  this.setBlood = function(blood) {
    if (this.blood == blood) return;
    this.blood = blood;
    if (this.bloodPath) {
      this.bloodPath.remove();
    }
    layers['widgets'].activate();
    bloodPath = this.bloodPath = new ArcD(position, 20, (360 * blood / 100) - 0.001);
    bloodPath.strokeWidth = thickness;
    //bloodPath.strokeColor = color;
    color = new HSLColor(blood,1,0.2);
    this.backPath.strokeColor = color.toCssString();
    color = new HSLColor(blood,1,0.5);
    bloodPath.strokeColor = color.toCssString();
    bloodPath.opacity = 0.7;
  }
  //blood is full when user starts!
  this.setBlood(100);
}

function ScoreWidget(position){
  layers['widgets'].activate();

  this.scores = [10];
  this.score = 0;
  
  var scoreShape = this.scoreShape = new PointText(position);
  scoreShape.content = '-';
  scoreShape.characterStyle = {
    font: 'courier,sans-serif',
    fontSize: 10,
    fillColor: '#fff'
  };
  scoreShape.paragraphStyle.justification = 'center';
  
  this.push = function(score,id){
    if(id == myId){
      this.score = score;
      this.scoreShape.content = score;
    }else{
      this.scores.push(score);
    }
  }
  
  this.flush = function(){
    var len = this.scores.length;
    var howBig = 0;
    for (var i = 0; i < len; i++){
      if(this.score > this.scores[i]){
        howBig += 1;
      }
    }
    var color = (120 * howBig) / len;
    color = new HSLColor(color,1,0.5);
    this.scoreShape.fillColor = color.toCssString();
  }
  
  this.reset = function(){
    this.scores = [10];
    this.score = 0;
  }
}

function stars(count){

  layers.stars.activate();
  // Create a symbol, which we will use to place instances of later:
  var path = new Path.Circle(new Point(0, 0), 3);
  path.style = {
    fillColor: 'white',
    strokeColor: 'black'
  };
  path.opacity = 0.5;
  var symbol = new Symbol(path);

  // Place the instances of the symbol:
  for (var i = 1; i < count; i++) {
    // The center position is a random point in the view:
    var center = Point.random() * view.size;
    var placedSymbol = symbol.place(center);
    placedSymbol.scale(i / count);
  }

}

var bloodWidget = new BloodWidget(new Point(775,35));
var scoreWidget = new ScoreWidget(new Point(777,80));
stars(60);

layers.players.activate();

var rect = new Path.Rectangle(new Point(-200, 500), new Point(1000, -4500));
layers.widgets.activate();

var overview = new Path.Rectangle(new Point(0, 0), new Point(120, 500));
overview.fillColor = '#162126';
overview.strokeColor = '#203040';
overview.opacity = 0.8;


var bulletSymbol = function(position) {
  var path = new Path.Circle(new Point(0, 0), 3);
  path.style = {
    fillColor: 'yellow',
	storkeColor: 'black'
  };
  var symbol = new Symbol(path);
  path.remove();
  bulletSymbol = function(position) {
    return symbol.place(position);
  };
  return bulletSymbol(position);
};

function Bullet(position) {
  this.path = bulletSymbol(position);
  this.x = position.x;
  this.y = position.y;
  this.update = function(delta) {
    this.y -= delta * 8;
	if (this.y < -4500) {
		this.remove();
	}
    this.path.position.y = this.y;
	this.path.position.x = this.x;
  };
  this.remove = function() {
    this.path.remove();
	this.removed = true;
  };
}

/**
 * Creates a new Player
 **/
function Player(x,y){
  var jimbo = new Path();
      jimbo.moveTo(0,0);
      jimbo.lineTo(10,13);
      jimbo.lineTo(10,20);
      jimbo.lineTo(3,17);
      jimbo.lineTo(2,20);
      jimbo.lineTo(-2,20);
      jimbo.lineTo(-3,17);
      jimbo.lineTo(-10,20);
      jimbo.lineTo(-10,13);
      jimbo.closePath();
      jimbo.strokeColor = 'gray';
      jimbo.fillColor = 'gray';
      jimbo.setPosition(x,y);

  return jimbo;
}


function onFrame(event) {
  // move stars
  var count = layers.stars.children.length;
  for (var i = 0; i < count; i++) {
    var item = layers.stars.children[i];
    
    var vy = -1 * item.bounds.height;
    var vx = 0;
    if(players[myId]){
      vy = players[myId].vy - item.bounds.height / 5;
      vx = players[myId].vx;
    }

    item.position.x -= vx;
    item.position.y -= vy;

    if(item.bounds.left < view.bounds.left){
      item.position.x = view.bounds.right - vx;
    }
    if(item.bounds.right > view.bounds.right + 10){
      item.position.x =  view.bounds.left;
    }
    // If the item has left the view on the right, move it back
    // to the left:
    if (item.bounds.bottom > view.size.height) {
      item.position.y = -1 * vy;
    }
  }
}

onKeyDown = function() {
	if (players[myId]) {
    return game.checkKeys();
  }
}

function Game(){

  var game = this;
  this.nickname = 'Anonymous';
  
  this.connect = function(nickname,callback){
    
    //save nickname for later use
    this.nickname = nickname;
    var socket = game.socket = io.connect(null,{'force new connection':true});
    socket.on('connect',function(){

      bloodWidget.setBlood(100);
      scoreWidget.reset();
      
      delete players;
      delete bullets;

      players = {};
      bullets = [];

      myId = -1;
      lastFrame = 0;
      clearInterval(keyTimer);
      lastShot = 0;

      socket.emit('join',nickname);
      socket.on('id',function(id){
         game.initSocket(socket,id);
      });

      callback();
    });
  }
  
  this.showWelcome = function(){
      var self = this;

      $('#nickForm').bind('submit',function(e){
        e.preventDefault();
	      if (myId != -1) {
		      return false; 
	      }

        var nickname = $('#nickname').val().trim();
        if(nickname.match(/^\w+$/)){
          $('#modal .wrapper').html($('#waitingScreen')).parent().fadeIn();
          self.connect(nickname,function(){
            $('#modal').fadeOut();
          });

        }else{
          alert('Please use alphanumeric characters only');
          $('#nickname').focus();
        }
        return false;
      });

    $('#modal .wrapper').html($('#welcomeScreen')).parent().fadeIn();
  }
  
  this.showEnd = function(rank,score,time,topScores){
    var self = this;
    var html = $('#endScreen').html();
    var nickname = this.nickname;
    var scoresTemplate = '<div class="scoreCol index">$rank$</div><div class="scoreCol">$name$</div><div class="scoreCol">$score$</div><div class="clearfix"></div>';
    var scoreTable = '';
    if(!topScores) topScores = [];
    topScores.forEach(function(p,i){
      scoreTable += scoresTemplate.replace('$rank$',i+1).replace('$name$',p.nickname).replace('$score$',p.score);
    });

    html = html.replace('$nickname$',nickname);
    html = html.replace('$rank$',rank);
    html = html.replace('$score$',score);
    html = html.replace('$time$',time);
    html = html.replace('$topscores$',scoreTable);
    html = $(html);
    
    html.bind('submit',function(e){
      e.preventDefault();
      $('#modal .wrapper').html($('#waitingScreen')).parent().fadeIn();
      self.connect(nickname,function(){
        $('#modal').fadeOut();
      });

      return false;
    });
    
    $('#modal .wrapper').html(html).parent().fadeIn();

  }
  
  this.showGameover = function(topScores){
    var self = this;
    var html = $('#gameoverScreen').html();
    var nickname = this.nickname;
    var scoresTemplate = '<div class="scoreCol index">$rank$</div><div class="scoreCol">$name$</div><div class="scoreCol">$score$</div><div class="clearfix"></div>';
    var scoreTable = '';
    if(!topScores) topScores = [];
    topScores.forEach(function(p,i){
      scoreTable += scoresTemplate.replace('$rank$',i+1).replace('$name$',p.nickname).replace('$score$',p.score);
    });

    html = html.replace('$nickname$',nickname);
    html = html.replace('$topscores$',scoreTable);
    html = $(html);
    
    html.bind('submit',function(e){
      e.preventDefault();
      $('#modal .wrapper').html($('#waitingScreen')).parent().fadeIn();
      self.connect(nickname,function(){
        $('#modal').fadeOut();
      });

      return false;
    });
    
    $('#modal .wrapper').html(html).parent().fadeIn();

  }
  
  this.checkKeys = function () {
    var self = this;
	  var preventDefault = false;
	  ['up', 'down', 'left', 'right', 'space'].forEach(function(key){
		  if (Key.isDown(key)) {
			  preventDefault = true;
			  clearTimeout(keyTimer);
			  keyTimer = setTimeout(function(){
			    self.checkKeys.call(self);
			  }, 50);
			  if (key == 'space') {
				  if (lastShot > Date.now() - 600) {
					  return;
				  }
				  lastShot = Date.now();
			  }
			  self.socket.emit(key);
		  }
	  });
	  return !preventDefault;
  };
  
  this.initSocket = function(socket,id){
    var self = this;

    //creating myself
    myId = id;
    
    socket.on('frame', function(frame, p, objects) {

      //we want to operate on players and objects.
      layers.players.activate();
      if(players[myId]){
        layers.players.translate([players[myId].x - 405, players[myId].y - 250]);
      }
      
      p.forEach(function(player) {

		    if (!players[player.id]) {
			    players[player.id] = {};
          var shape = new Player([player.x, player.y]);
          if( player.id === myId){
            shape.fillColor = 'white';
            shape.strokeColor = 'white';
          }
          players[player.id].shape = shape;
        }
        
        scoreWidget.push(player.score,player.id);

        players[player.id].shape.setPosition(player.x, player.y);

	      for (key in player) {
	          players[player.id][key] = player[key];
	      }

        bullets.forEach(function(bullet, id) {
		      bullet.update(frame - lastFrame);
			    if (bullet.removed) {
				    delete bullets[id];
			    }
        });

        if (player.fire) {
            bullets[player.fire] = new Bullet(players[player.id].shape.position);
        }

        lastFrame = frame;

      });

      //update widgets
      scoreWidget.flush();
	    bloodWidget.setBlood(players[myId].blood);

      //centerize view
      layers.players.translate([-players[myId].x + 405, -players[myId].y + 250]);

	    if (layers.overview) {
	    	layers.overview.remove();
	    }
	    layers.overview = layers.players.clone();
	    layers.overview.activate();

	    var viewport = new Path.Rectangle(view.bounds.intersect(layers.players.bounds));
	    viewport.strokeColor = 'yellow';
	    viewport.opacity = 0.3;	  	  
	    layers.overview.fitBounds(view.bounds);
	    layers.overview.translate([-345, 0]);
    });
    
    socket.on('remove-bullet', function(id) {
      bullets[id].remove();
	    delete bullets[id];
    });
    
    socket.on('leave', function(id) {
      players[id].shape.remove();
      delete players[id];
    });
        
    socket.on('end',function(rank,score,time,topScores){
      socket.disconnect();
      players[myId].shape.remove();
      delete players[myId];
      myId = -1;

      self.showEnd(rank,score,time,topScores);
    });
        
    socket.on('gameover',function(rank,score,time,topScores){
      socket.disconnect();
      players[myId].shape.remove();
      delete players[myId];
      myId = -1;
      self.showGameover(rank,score,time,topScores);
    });

  }
}

var game = new Game();
game.showWelcome();
