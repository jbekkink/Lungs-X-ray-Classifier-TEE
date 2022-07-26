const express = require('express');
const app = express(); 
const cors = require('cors');
const port = 3000; 

app.use(express.static('dist'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://gateway.pinata.cloud"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Oops! Something went wrong!');
});

app.listen(port, function() {
    console.log(`Listening on port ${port}`)
});
