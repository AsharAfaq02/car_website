const { mainInterchange, compareTexts } = require('./helpers.js');
const { Worker } = require('worker_threads');
const path = require('path');

const fs = require('fs');
fs.readFile('./full_ebay_exchanges.json', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
    }

    
    // console.log(JSON.parse(data)); // File content
    
    // Example usage
   data = JSON.parse(data);
   let t = {"title":[]}
    Object.keys(data).forEach(async i=>{
        
        Object.keys(data[i]['listings']).forEach(j=>{
            s.push(data[i]["listings"][j]["Title"])
        })
        t[i] = s
        
        // await delay(7000);
    

    })
    console.log
//    console.log(titles)
});

async function parseTitles(arr) {
    const n = arr.length;
    let counter = 0;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            
            // console.log(title);
            
            console.log(arr[i], '-----', arr[j])
            
            // createWorkerForComparison([arr[i], arr[j]],title);
            counter++;

            // Pause every 10 iterations
           
                await delay(1000); // 1 second pause
            
        }
    }

}

async function createWorkerForComparison(pair) {
    // console.log("comparison- for ", title)
    const worker = new Worker(path.resolve(__dirname, 'worker.js'));
    worker.postMessage(pair);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

