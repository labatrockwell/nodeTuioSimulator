// node.js application that simulates multiple touches to tuio tracker
// built based on TUIO specification: http://www.tuio.org/?specification
// davidptracy for LAB at Rockwellgroup

var osc = require('node-osc');
var client = new osc.Client('127.0.0.1', 3333); //localhost and standard TUIO ports

var touches = new Array();

var touchIndexCounter = 0;

var touchCount 	= process.argv[2];
var intervalMin = process.argv[3];
var intervalMax = process.argv[4];

// if we are missing arguments from the command line ...
if(touchCount == null || intervalMin == null || intervalMax == null){
	console.log("client.js requires (3) arguments to run. Please re-run as follows:");
	console.log("---->	node client.js [intial touch count] [min lifespan] [max lifespan] ");
	console.log("bracketed elements of the above are numbers greater than 0");
	process.exit();
} 

// start with an initial amount of touches
for (var i = 0; i < touchCount; i++) {
	// iterator serves as sessionId for each touch
	var random = getRandomRange(intervalMin, intervalMax);
	console.log("Creating Touch with lifespan of " + random);

	var touch = new Touch(i, random );
	touches.push(touch);
	touchIndexCounter ++; // keep track of our lifespan
};

var fSeq = 0; //used to set a unique frame id to conclude each message chunk

// if the app is terminated, this function will reset the frame id and touch ids
var reset = function(){

	console.log("Resetting all touches ...");

	var aliveMsg =  new osc.Message('/tuio/2Dcur')
	aliveMsg.append("alive");
	client.send(aliveMsg, function(err){
		if (err) console.log(err);
	});

	var fseqMsg =  new osc.Message('/tuio/2Dcur')
	fseqMsg.append("fseq");
	fseqMsg.append(-1); //sessionId
	client.send(fseqMsg, function(err){
		if (err) console.log(err);
	});
}

var addTouch = function(){
	var touch = new Touch(touchIndexCounter);
	touches.push(touch);
}

// build the message bundle and send it
var sendMessage = function(){
	aliveMessage();
	setMessage();
	frameSequenceMessage();

	cleanupTouches();
}

// 1 -----> send the alive message first
var aliveMessage = function() {

	aliveTouches = new Array();

	var aliveMsg = new osc.Message('/tuio/2Dcur');
	aliveMsg.append("alive");
	//add all active touches

	for (touch of touches){
		if ( touch.isAlive() ){
			aliveMsg.append( touch.getSessionId() );
			aliveTouches.push( touch.getSessionId() );
		}
	}

	client.send(aliveMsg, function(err){
		if (err) console.log(err);
		console.log(aliveTouches);
	});

}

// 2 -----> send the updated set message for each touch (position, etc)
var setMessage = function() {
	for (var i = 0; i < touches.length; i++) {
		touches[i].update();
		touches[i].sendMessage();
	};
	
}

// 3 -----> finally send the frame sequence message with unique ID to conclude the tuio chunk
var frameSequenceMessage = function() {
	var fseqMsg =  new osc.Message('/tuio/2Dcur')
	fseqMsg.append("fseq");
	fseqMsg.append(fSeq); //sessionId
	client.send(fseqMsg, function(err){
		if (err) console.log(err);
	});
	fSeq ++; // frame sequence must be incremented each call so its unique
}

var cleanupTouches = function(){

	var deadTouches = new Array();

	//loop through all touches, get index of dead touches
	for (var i=0; i<touches.length; i++){
		if ( !touches[i].isAlive() ){
			deadTouches.push(i);
		}
	}

	//now loop through deadTouches, removing items from touches array
	for (var i =0; i<deadTouches.length; i++){
		touches.splice(deadTouches[i], 1);

		console.log("Adding New Touch with ID: " + touchIndexCounter);
		var touch = new Touch(touchIndexCounter, getRandomRange(intervalMin, intervalMax) );
		touches.push(touch);
		touchIndexCounter ++;
	}	
}

function getRandomRange(_min, _max){
	return Math.random()*(_max - _min)+ _min;
}

reset();
setInterval(sendMessage, 100);




// =====================================================
// ================== Touch Class ======================
// =====================================================

function Touch(_sessionId, _lifespan){

	this.location		= {"x": Math.random(), "y": Math.random() };
	this.velocity		= {"x": Math.random()/100, "y": Math.random()/100 };
	this.acceleration	= Math.random();
	this.sessionId		= _sessionId;
	this.fSeq 			= _sessionId;
	this.lifeSpan		= _lifespan;
	this.lifeCounter 	= 0;
	this.alive 			= true;
};

Touch.prototype.update = function(){

	this.location.x 	+= this.velocity.x;
	this.location.y 	+= this.velocity.y;
	this.acceleration 	= Math.random();

	if (this.location.x > 1.0) this.location.x = 0.125;
	if (this.location.y > 1.0) this.location.y = 0.125;	

	if(this.lifeCounter < this.lifeSpan) this.lifeCounter ++;
	else this.alive = false;

};

Touch.prototype.sendMessage = function(){

	if (this.alive){

		var setMsg =  new osc.Message('/tuio/2Dcur')
		setMsg.append("set");
		setMsg.append(this.sessionId); //sessionId
		setMsg.append( this.location.x ); //x_pos
		setMsg.append( this.location.y ); //y_pos
		setMsg.append( this.velocity.x ); //x_vel
		setMsg.append( this.velocity.y ); //y_vel
		setMsg.append( this.acceleration ); //acceleration
		client.send(setMsg, function(err){
			if (err) console.log(err);
			// console.log(setMsg);
		});
		
	}
};

Touch.prototype.getSessionId = function(){
	return this.sessionId;
}

Touch.prototype.isAlive = function(){
	if (this.alive) return true;
	else return false;
}

// method to cleanup touches on program exit	
process.on('SIGINT', function() {
  console.log('TEST');
  reset();
  process.exit();
});