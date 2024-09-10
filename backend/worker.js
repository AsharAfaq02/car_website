const { parentPort } = require('worker_threads');
const {compareTexts} = require('./helpers.js');
parentPort.on('message', (pair) => {
    
    
    compareTexts(pair)
    
});