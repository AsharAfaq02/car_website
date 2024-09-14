// worker_ebay.js
const { parentPort } = require('worker_threads');
const fs = require('fs');
const {ebay_search,compareTexts, delay} = require('./helpers')
searches = {};
parentPort.on('message', async (data) => {
    dataStream = data.stream
    if(dataStream && data.stream[0] == 'ebay'){
    await ebay_search(dataStream[1], dataStream[2], searches)  

    fs.writeFileSync(`./searches/${dataStream[3]}.json`, JSON.stringify(searches, null, 2));
    parentPort.postMessage({ status: 'completed', stream: data.stream });
    }
    else if(data[0] == 'comparison'){
        await compareTexts(data[1],[data[2],data[3]]);
        parentPort.postMessage({ status: 'completed comparison' });


    
    }
    

})





