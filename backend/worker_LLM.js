const { parentPort } = require('worker_threads');
const fs = require('fs');
const {compareTexts} = require('./helpers')

parentPort.on('message', async (data) => {
    dataStream = data.stream
    console.log(dataStream);
    // compareTexts()
    // parentPort.postMessage({ status: 'completed', stream: data.stream });
    

})