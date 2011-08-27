var socket = io.connect();
var players = {};
var layers = {};
var myId = -1;

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
  backPath.strokeWidth = thickness + 3;

  this.setBlood = function(blood) {
    this.blood = blood;
    if (this.bloodPath) {
      this.bloodPath.remove();
    }
    bloodPath = this.bloodPath = new ArcD(position, 20, (360 * blood / 100) - 0.001);
    bloodPath.strokeWidth = thickness;
    bloodPath.strokeColor = color;
    bloodPath.opacity = 1;
  }
  //blood is full when user starts!
  this.setBlood(100);
}

function stars(count){
  layers['stars'].activate();
  // Create a symbol, which we will use to place instances of later:
  var path = new Path.Circle(new Point(0, 0), 3);
  path.style = {
    fillColor: 'white',
    strokeColor: 'black',
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
      jimbo.strokeColor = 'black';
      jimbo.fillColor = 'black';
      jimbo.setPosition(x,y);

  return jimbo;
}

var lastZoom  = 1;

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
  if(!players[myId]) return;
  //zoom
  var maxZoom = 20;
  var minZoom = -20;
  var initialZoom = 1;
  var stepZoom = 1;
  var scaleFactor = 1.02;
  var currentZoom = lastZoom;
  var position = players[myId].shape.position.clone();

  if(Key.isDown('down')){
    if(currentZoom < maxZoom){
      layers['players'].scale( scaleFactor ,position);
      lastZoom = currentZoom + stepZoom;
    }
  }else if (Key.isDown('up')){
    if(currentZoom > minZoom){
      layers['players'].scale( 1 / scaleFactor,position);
      lastZoom = currentZoom - stepZoom;
    }
  }else{
    if(currentZoom > initialZoom){
      layers['players'].scale(1/scaleFactor,position);
      lastZoom = currentZoom - stepZoom;
    }else if( currentZoom < initialZoom){
      layers['players'].scale(scaleFactor,position);
      lastZoom = currentZoom + stepZoom;
    }
  }

}


var keyTimer;

var checkKeys = function () {
	['up', 'down', 'left', 'right', 'space'].forEach(function(key){
		if (Key.isDown(key)) {
			socket.emit(key);
			clearTimeout(keyTimer);
			keyTimer = setTimeout(checkKeys, 50);
		}
	});
};

function onKeyDown() {
	checkKeys();
}

function onKeyUp(e){
  if(e.key == 'down'){
    socket.emit('up');
  }
}
socket.on('players', function(players) {

});

socket.on('id',function(id){

  //@FIXME what if user be disconnected for a moment? does socket.io understand
  // this situation? if not, we should check if myId is -1 ;)
  // and if it is not -1, we should emit disconnect manually and then set the
  // newly created id.
  myId = id;

  //start rendering frames right after you recognized your self
  var oldPosition;
  socket.on('frame', function(p, objects) {
  
    //we want to operate on players and objects.
    layers['players'].activate();
    p.forEach(function(player) {
		  if (!players[player.id]) {
			  players[player.id] = {};
        var shape = new Player([player.x, player.y]);
        if( player.id === myId){
    		  oldPosition = shape.position;
          shape.fillColor = 'white';
        }
        players[player.id].shape = shape;
      }
      if (player.id == myId) {
		    oldPosition = players[myId].shape.position.clone();
      }
      players[player.id].shape.setPosition(player.x, player.y);
      players[player.id].x = player.x;
      players[player.id].y = player.y;
      players[player.id].vx = player.vx;
      players[player.id].vy = player.vy;
    });

    layers['players'].translate( oldPosition - players[myId].shape.position);
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
