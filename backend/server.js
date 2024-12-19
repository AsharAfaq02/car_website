const {mainInterchange } = require("./helpers.js");
const IP_ADDRESS = "10.0.0.38";
const http = require("http");
const url = require("url");
const mysql = require('mysql2');
const cors = require('cors');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'AK7llv748@', // Your MySQL password
    database: 'car_models' // Your MySQL database name
  });
  // Connect to MySQL database
  db.connect((err) => {
    if (err) {
      console.error('Could not connect to MySQL:', err);
      return;
    }
  });
  

  const db2 = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'AK7llv748@', // Your MySQL password
    database: 'car_parts' // Your MySQL database name
  });
  // Connect to MySQL database

  db2.connect((err) => {
    if (err) {
      console.error('Could not connect to MySQL:', err);
      return;
    }
  });



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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',// Allow specific methods
        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
    });

    if(pathname == '/makeAPI'){
        const make = query;
        const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ?;`
        const params = [db.config.database,`${make.make}%`];
        db.query(sql, params, (err, results) => {
            if (err) {
                // console.error('Error executing query:', err);
                return;
              }
              const tableNames = results.map((row) => row.TABLE_NAME);
              res.end(JSON.stringify(tableNames));
            })
    }
    if(pathname == '/modelAPI'){
        const {make, model} = query;

        const sql = "SELECT modelname FROM ?? WHERE modelname LIKE ?;";
        const params = [make, `${model}%`]

        db.query(sql, params, (err, results) => {
            if (err) {
                // console.error('Error executing query:', err);
                return;
              }
              const Models = results.map((row) => row.modelname);
            //   console.log(Models)
              res.end(JSON.stringify(Models));
            })
    }


    if(pathname == '/partAPI'){
        const {part} = query;

        const sql = "SELECT part FROM part_list WHERE part LIKE ?;";
        const params = [`${part}%`]
        db2.query(sql, params, (err, results) => {
            if (err) {
                // console.error('Error executing query:', err);
                return;
              }
              const parts = results.map((row) => row.part);
            //   console.log(Models)
              res.end(JSON.stringify(parts));
            })

     
    }
    if(pathname == "/ebaySearch"){
    const {year, make, model, part} = query;
    console.log("--------eBay Search Data-------")
    console.log({year, make, model, part});

    mainInterchange(year, make, model, part);
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
    console.log(IP_ADDRESS, 8081, '(Listening)');
    console.log('------------------');

});
