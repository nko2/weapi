var socket = io.connect();

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

socket.emit('join', nickname);
