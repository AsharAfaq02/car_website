const { parentPort } = require('worker_threads');

const {ebay_search} = require('./helpers.js');

parentPort.on('message', async (data) => {
    // console.log(data);
    // console.log(data[0], data[1], data[2]);
    await ebay_search(data[0], data[1])
   
    
    
});