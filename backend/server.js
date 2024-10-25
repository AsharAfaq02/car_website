const { suggestion, mainInterchange } = require("./helpers.js");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const IP_ADDRESS = "10.0.0.50";
var corsOptions = { origin: "http://10.0.0.50:4200" };
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const http = require("http");
const url = require("url");

const myEmitter = require("./myEmitter");

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Ashars Backend application." });
});

app.get("/postData", async (req, res) => {
    year = req.query["year"];
    make = req.query["make"];
    model = req.query["model"];
    part = req.query["part"];
    try {
        suggestion(year, make, model, part, res);
    } catch (error) {}
});
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
    const { year, make, model, part, suggestion } = query;

    // Log the parameters received
    console.log("Received parameters:", {
        year,
        make,
        model,
        part,
        suggestion,
    });
    mainInterchange(year, make, model, part, suggestion);

    resObj.push(res);
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
              console.log("eBay stream done.");

          }
      });
  });
});


myEmitter.on("comparisons", async (data) => {

    Object(resObj).forEach(async (res) => {
        if (data != "end of comparisons") {
            res.write(`data: ${JSON.stringify(data)} \n\n`);
        } if (data == "end of comparisons") {
            console.log("comparison stream done.");
            res.write(
                `data: ${JSON.stringify({ comparisonMessg: data })} \n\n`
            );
            setTimeout(() => {
                resObj = [];
                res.end();
            }, 5000);
        }
    });
});


server.listen(8081, () => {
    console.log("LiveStream Running On ", 8081);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server is running on port ${PORT}.`);
});
