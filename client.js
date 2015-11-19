// node.js application that simulates multiple touches to tuio tracker
// built based on TUIO specification: http://www.tuio.org/?specification
// davidptracy for LAB at Rockwellgroup

var osc = require('node-osc');

var client = new osc.Client('127.0.0.1', 3333); //localhost and standard TUIO ports

var touches = new Array();

for (var i = 0; i < 50; i++) {
	// iterator serves as sessionId for each touch
	var touch = new Touch(i);
	touches.push(touch);
};

var fSeq = 0; //used to set a unique frame id to conclude each message chunk

// if the app is terminated, this function will reset the frame id and touch ids
var reset = function(){

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

// build the message bundle and send it
var sendMessage = function(){

	//the alive message must include all of the active touch sessionIds, otherwise they will be deleted
	var aliveMsg =  new osc.Message('/tuio/2Dcur')
	aliveMsg.append("alive");
	for (var i = 0; i < touches.length; i++) {
		//include each sessionId which corresponds with touch array
		aliveMsg.append(i);
	};
	//send the alive message first
	client.send(aliveMsg, function(err){
		if (err) console.log(err);
	});

	//send the updated set message for each touch (position, etc)
	for (var i = 0; i < touches.length; i++) {
		touches[i].update();
		touches[i].sendMessage();
	};

	//finally send the frame sequence message with unique ID to conclude the tuio chunk
	var fseqMsg =  new osc.Message('/tuio/2Dcur')
	fseqMsg.append("fseq");
	fseqMsg.append(fSeq); //sessionId
	client.send(fseqMsg, function(err){
		if (err) console.log(err);
		console.log(fseqMsg);
	});

	fSeq ++; // frame sequence must be incremented each call 

}

reset();

setInterval(sendMessage, 100);

// =====================================================
// ================== Touch Class ======================
// =====================================================

function Touch(_sessionId){

	this.location		= {"x": Math.random(), "y": Math.random() };
	this.velocity		= {"x": Math.random()/100, "y": Math.random()/100 };
	this.acceleration	= Math.random();
	this.sessionId		= _sessionId;
	this.fSeq 			= _sessionId;
};

Touch.prototype.update = function(){

	this.location.x 	+= this.velocity.x;
	this.location.y 	+= this.velocity.y;
	this.acceleration 	= Math.random();

	if (this.location.x > 1.0) this.location.x = 0.125;
	if (this.location.y > 1.0) this.location.y = 0.125;	

};

Touch.prototype.sendMessage = function(){

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
		console.log(setMsg);
	});
};




