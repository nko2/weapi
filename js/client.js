var socket = io.connect();

/*function ArcD(center,r,d){
  if(! center.x ){ // assume it as an array
    center = new Point(center[0],center[1]);
  }
  var side = center.clone();
  side.x -= r;
  var vector = center - side;
  vector.angle += d;
  var arc = new Path();
  arc.add(side);
  arc.arcTo(center + vector);
  return arc;
}*/

function bloodWidget(position){
  var thickness = 10;
  var bgColor = '#868686';
  var color = '#616161';
  //blood is full when user starts!
  this.blood = 100;

  //blood widget, an arc at top corner
  var backPath = this.backPath = new Path.Circle([40,40],20);
  //@FIXME this is fake! use a real arc instead;
  var bloodPath = this.backPath = new Path.Circle([40,40],20);
  
  backPath.setPosition(position);
  bloodPath.setPosition(position);
  
  backPath.strokeColor = bgColor;
  backPath.strokeWidth = thickness+3;

  bloodPath.strokeColor = color;
  bloodPath.strokeWidth = thickness;
  bloodPath.opacity = 1;
  
  this.setBlood = function(blood){
    this.blood = blood;
    //@TODO draw arc
  }
}

function onKeyDown(event) {
	switch (event.key) {
		case 'up':
		case 'down':
		case 'left':
		case 'right':
			socket.emit(event.key);
			break;
		case 'space':
			socket.emit('fire');
			break;
	}
}

function onFrame(event) {

}


function welcome(){
  $('#startBtn').bind('click',function(){
    var nickname = $('#nickname').val().trim();
    if(nickname.match(/^\w+$/)){
      socket.emit('join',nickname);
      $('#modal').fadeOut('fast');
    }else{
      alert('Please use alphanumeric characters only');
      $('#nickname').focus();
    }
  });
  $('#modal .wrapper').append($('#welcomeScreen')).parent().fadeIn();
}

welcome();

new bloodWidget(new Point(775,35));
