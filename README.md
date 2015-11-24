# node.js TUIOsimulator client

A simple client that sends TUIO style touch events to a listener on port 3333 of _localhost_.

This client creates an initial amount of Touches that move across the screen for a random lifespan. When one touch dies, a new touch is spawned. 

This client is intended for debugging purposes for touch based applications. 

Usage:

1. _git clone https://github.com/labatrockwell/nodeTuioSimulator_
2. _npm install_
3. _node client.js -**touchCount**- -**minimumDuration**- -**maximumDuration**-_

***touchCount***      = the total number of touches 

***minimumDuration*** = the minimum lifespan of a touch

***maximumDuratoin*** = the maximum lifespan of a touch

