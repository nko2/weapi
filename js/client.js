var socket = io.connect();
var players = {};
var bullets = [];
var layers = {};
var myId = -1;

  // create layers
layers['stars']   = new Layer();
layers['players'] = new Layer();
layers['widgets'] = new Layer();

//initial zoom
layers.players.lastZoom = 1;

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
		this.path.remove();
	}
    this.path.position.y = this.y;
	this.path.position.x = this.x;
  };
}

function BloodWidget(position){
  layers['widgets'].activate();
  var thickness = 10;
  var bgColor = '#868686';
  var color = '#616161';

  //blood widget, an arc at top corner
  var backPath = this.backPath = new Path.Circle(position,20);

  backPath.strokeColor = bgColor;
  backPath.strokeWidth = thickness + 3;

  this.setBlood = function(blood) {
    this.blood = blood;
    if (this.bloodPath) {
      this.bloodPath.remove();
    }
    layers['widgets'].activate();
    bloodPath = this.bloodPath = new ArcD(position, 20, (360 * blood / 100) - 0.001);
    bloodPath.strokeWidth = thickness;
    bloodPath.strokeColor = color;
    bloodPath.opacity = 1;
  }
  //blood is full when user starts!
  this.setBlood(100);
}

function ScoreWidget(position){
  layers['widgets'].activate();

  this.scores = [];
  this.score = 0;
  
  var scoreShape = this.scoreShape = new PointText(position);
  scoreShape.content = '10000';
  scoreShape.characterStyle = {
    font: 'courier,sans-serif',
    fontSize: 10,
    fillColor: '#fff'
  };
  scoreShape.paragraphStyle.justification = 'center';
  
  this.setScore = function(score){
    this.scoreShape.content = score;
  }
  
  this.push = function(score){
    this.scores.push(score);
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
  
}

function stars(count){
  layers['stars'].activate();
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
  var count = layers['stars'].children.length;
  for (var i = 0; i < count; i++) {
    var item = layers['stars'].children[i];
    
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
  //if(!players[myId]) return;
  //zoom
}

var zoomUpdate = function(zoomTo,toContinue) {
  var maxZoom = 10;
  var minZoom = -10;
  var initialZoom = 1;
  var stepZoom = 1;
  var scaleFactor = 1.08;
  var currentZoom = layers['players'].lastZoom;
  var scaleOrigin = players[myId].shape.position.clone();
  
  if(zoomTo && zoomTo !== currentZoom){
    var zoom = zoomTo - currentZoom;
    var scaleTo;
    if(zoom < 0){
      scaleTo = 1/(-1*zoom*scaleFactor);
    }else{
      scaleTo = zoom*scaleFactor;
    }
    currentZoom = zoomTo;
    layers['players'].scale(scaleTo,scaleOrigin);
    layers['players'].lastZoom = zoomTo;
  }
  
  if(!toContinue) return;
  
  if(Key.isDown('down')){
    if(currentZoom < maxZoom){
      layers['players'].scale( scaleFactor ,scaleOrigin );
      layers['players'].lastZoom = currentZoom + stepZoom;
    }
  }else if (Key.isDown('up')){
    if(currentZoom > minZoom){
      layers['players'].scale( 1 / scaleFactor,scaleOrigin );
      layers['players'].lastZoom = currentZoom - stepZoom;
    }
  }else{
    if(currentZoom > initialZoom){
      layers['players'].scale(1/scaleFactor,scaleOrigin );
      layers['players'].lastZoom = currentZoom - stepZoom;
    }else if( currentZoom < initialZoom){
      layers['players'].scale(scaleFactor,scaleOrigin );
      layers['players'].lastZoom = currentZoom + stepZoom;
    }
  }
};

var keyTimer;

var lastShot = 0;

var checkKeys = function () {
	var preventDefault = false;
	['up', 'down', 'left', 'right', 'space'].forEach(function(key){
		if (Key.isDown(key)) {
			preventDefault = true;
			clearTimeout(keyTimer);
			keyTimer = setTimeout(checkKeys, 50);
			if (key == 'space') {
				if (lastShot > Date.now() - 1000) {
					return;
				}
				lastShot = Date.now();
			}
			socket.emit(key);
		}
	});
	return !preventDefault;
};

function onKeyDown() {
	if (myId != -1) {
		return checkKeys();
	}
}

socket.on('id',function(id){

  //@FIXME what if user be disconnected for a moment? does socket.io understand
  // this situation? if not, we should check if myId is -1 ;)
  // and if it is not -1, we should emit disconnect manually and then set the
  // newly created id.
  myId = id;

  //start rendering frames right after you recognized your self
  var lastFrame = 0;
  socket.on('frame', function(frame, p, objects) {

    //we want to operate on players and objects.
    layers['players'].activate();
  	if (players[myId]) {
    	layers.players.translate([players[myId].x - 405, players[myId].y - 250]);
 	    //var originalZoom = layers.players.lastZoom;
      //zoomUpdate(1);
	  }
    
    p.forEach(function(player) {
		  if (!players[player.id]) {
			  players[player.id] = {};
        var shape = new Player([player.x, player.y]);
        if( player.id === myId){
          shape.fillColor = 'white';
          shape.strokeColor = 'white';
          scoreWidget.setScore(player.score);
        }else{
          scoreWidget.push(player.score);
        }
        players[player.id].shape = shape;
      }
      players[player.id].shape.setPosition(player.x, player.y);
      players[player.id].x = player.x;
      players[player.id].y = player.y;
      players[player.id].vx = player.vx;
      players[player.id].vy = player.vy;

      bullets.forEach(function(bullet) {
		    bullet.update(frame - lastFrame);
      });
      if (player.fire) {
          bullets.push(new Bullet(players[player.id].shape.position));
      }
      lastFrame = frame;

    });
    scoreWidget.flush();
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
	
	  //@FIXME zoom feature temporary disabled to be fixed later.
//	  zoomUpdate(originalZoom);
	  //zoomUpdate(originalZoom,true);
  });

  socket.on('leave', function(id) {
    players[id].shape.remove();
	  delete players[id];
  });

});

function welcome(){
  $('#nickForm').bind('submit',function(){
	if (myId != -1) {
		return false; 
	}
    var nickname = $('#nickname').val().trim();
    if(nickname.match(/^\w+$/)){
      socket.emit('join',nickname);
      $('#modal').fadeOut('fast');
    }else{
      alert('Please use alphanumeric characters only');
      $('#nickname').focus();
    }
    return false;
  });
  $('#modal .wrapper').append($('#welcomeScreen')).parent().fadeIn();
}

stars(60);
welcome();

var bloodWidget = new BloodWidget(new Point(775,35));
var scoreWidget = new ScoreWidget(new Point(777,80));

layers.players.activate();
new Path.Rectangle(new Point(-200, 500), new Point(1000, -4500));
layers.widgets.activate();
var overview = new Path.Rectangle(new Point(0, 0), new Point(120, 500));
overview.fillColor = '#162126';
overview.strokeColor = '#203040';
overview.opacity = 0.8;
