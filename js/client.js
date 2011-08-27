var socket = io.connect();
var players = {};
var layers = {};
var myId = -1;

  // create layers
layers['stars']   = new Layer();
layers['players'] = new Layer();
layers['me'] = new Layer();
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
  for (var i = 0; i < count; i++) {
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

function onFrame(event) {
  // move stars
  var count = layers['stars'].children.length;
  for (var i = 0; i < count; i++) {
    var item = layers['stars'].children[i];
    
    item.position.y += item.bounds.height / 20;

    // If the item has left the view on the right, move it back
    // to the left:
    if (item.bounds.bottom > view.size.height) {
      item.position.y = -item.bounds.height;
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
    /*p.forEach(function(player) {
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
    });

    layers['players'].translate(players[myId].shape.position - oldPosition);*/
    var translate;
    var oldPosition;
    var newPosition;
    var diff;
	  p.forEach(function(player) {

      // is it a new player? yes: add it to the list
		  if (!players[player.id]) {
			  players[player.id] = {};
			  var shape;
			  if( player.id === myId){
			    layers['me'].activate();
          shape = new Player([player.x, player.y]);
          shape.fillColor = 'white';
          layers['players'].activate();
        }else{
          shape = new Player([player.x, player.y]);
        }
        players[player.id].shape = shape;
      }
      
      if(player.id == myId){
        oldPosition = players[myId].shape.position.clone();
        newPosition = new Point(player.x,player.y);
        diff = newPosition - oldPosition;
        if(diff.x !=0 && diff.y != 0){
          translate = new Point(-1 * diff.x , -1 * diff.y);
        }
        else
          translate = new Point(0,0);
      }else{
        players[player.id].shape.setPosition(player.x, player.y);
        players[player.id].x = player.x;
        players[player.id].y = player.y;
      }
    });
    if(translate)
      layers['players'].translate(translate);
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

stars(150);
welcome();

var bloodWidget = new BloodWidget(new Point(775,35));
