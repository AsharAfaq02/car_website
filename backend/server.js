const { suggestion, mainInterchange } = require("./helpers.js");

const IP_ADDRESS = "10.0.0.50";
const http = require("http");
const url = require("url");
const myEmitter = require("./myEmitter");
let resObj = [];

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });

    if(pathname == '/suggestions'){
        const { year, make, model, part} = query;
        try {
            suggestion(year, make, model, part).then(async suggestions=>{
                res.end(JSON.stringify(suggestions))
            })
        } catch (error) {}
        console.log("--------suggestion Data-------")
        console.log({year, make, model, part})
    }
    if(pathname == "/ebaySearch"){
    const {year, make, model, part, suggestion} = query;
    console.log("--------eBay Search Data-------")
    console.log({year, make, model, part, suggestion});

    mainInterchange(year, make, model, part, suggestion);
    resObj.push(res);
    }
});



myEmitter.on("event", (data) => {
  setImmediate(() => {
      Object(resObj).forEach((res) => {
          //dynamic amount of responses created accoring to needs of client (Server Sent Event Livestreaming)
          if (data != "end of stream") {
              res.write(
                  `data: ${JSON.stringify({
                      title: data[0],
                      info: data[1],
                  })} \n\n`
              );
          }
           if (data == "end of stream") {
              res.write(`data: ${JSON.stringify({ message: "end of stream" })} \n\n`);
              console.log(" (1/2) --------eBay Stream Terminated---------");

          }
      });
  });
});


myEmitter.on("comparisons", async (data) => {

    Object(resObj).forEach(async (res) => {
        if (data != "end of comparisons") {
            res.write(`data: ${JSON.stringify(data)} \n\n`);
        } if (data == "end of comparisons") {
            console.log(" (2/2) --------Comparison Stream Terminated---------");

            res.write(
                `data: ${JSON.stringify({ comparisonMessg: data })} \n\n`
            );
            setTimeout(() => {
                resObj = [];
                res.end();
            }, 2000);
        }
    });
});


server.listen(8081, () => {
    console.log('10.0.0.50', 8081, '(Listening)');
    console.log('------------------');

});
