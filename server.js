const express = require("express");
const WebSocket = require("ws");
const nmea = require('nmea-0183');
const app = express();
const ws = new WebSocket('wss://api.oxyfi.com/trainpos/listen?v=1&key=cab87d3d86d54a808fe4180296a4e05f');
const wsLocal =new WebSocket.Server({ port: 8080 });


nmea.setErrorHandler(function(e){
   console.log(e);
});

/* serves main page */
app.get("/", function (req, res) {
    res.sendfile(__dirname + '/index.html');
});
/*
app.post("/trains", function (req, res) {
    /!* some server side logic *!/
    res.send("OK");
});*/

/* serves all the static files */
app.get(/^(.+)$/, function (req, res) {
    console.log('static file request : ' + req.params);
    res.sendfile(__dirname + req.params[0]);
});


// Broadcast to all.
wsLocal.broadcast = function broadcast(data) {
    wsLocal.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

ws.on('message', function incoming(data) {
    let parsedData = nmea.parse(data);
    wsLocal.broadcast(JSON.stringify([parsedData]));
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on " + port);
});