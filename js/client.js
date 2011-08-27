var socket = io.connect();

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

/**
 * Creates a new Player
 **/
function Player(x,y){
  var jimbo = new Path();
      jimbo.moveTo(0,0);
      jimbo.lineTo(10,20);
      jimbo.lineTo(3,18);
      jimbo.lineTo(2,20);
      jimbo.lineTo(-2,20);
      jimbo.lineTo(-3,18);
      jimbo.lineTo(-10,20);
      jimbo.closePath();
      jimbo.strokeColor = 'black';
      jimbo.fillColor = 'black';
      jimbo.setPosition(x,y);

  return jimbo;
}

$(window).keydown(function() {
	if event
});

function onkeyDown(event) {
	['up', 'down', 'left', 'right', 'space'].forEach(function(key){
		if (Key.isDown(key)) {
			socket.emit(event.key);
		}
	});
	/*switch (true) {
		case Key.isDown('up'):
		case Key.isDown('down'):
		case 'left':
		case 'right':
			break;
		case 'space':
			socket.emit('fire');
			break;
	}*/
}

function onFrame(event) {

}



var players = {};

socket.on('players', function(players) {

});

socket.on('frame', function(p, objects) {
	p.forEach(function(player) {
		if (!players[player.id]) {
			players[player.id] = {};
			var shape = new Player([player.x, player.y]);
			players[player.id].shape = shape;
		}
		players[player.id].shape.setPosition(player.x, player.y);
		players[player.id].x = player.x;
		players[player.id].y = player.y;
	});
});

function welcome(){
  $('#nickForm').bind('submit',function(e){
    var nickname = $('#nickname').val().trim();
    if(nickname.match(/^\w+$/)){
      socket.emit('join',nickname);
      $('#modal').fadeOut('fast');
    }else{
      alert('Please use alphanumeric characters only');
      $('#nickname').focus();
    }
    e.preventDefault();
  });
  $('#modal .wrapper').append($('#welcomeScreen')).parent().fadeIn();
}

welcome();

var bloodWidget = new BloodWidget(new Point(775,35));
