
const { suggestion, mainInterchange} = require('./helpers.js');
const { Readable } = require('stream');

const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const IP_ADDRESS = 'localhost';
var corsOptions = {origin: "http://localhost:4200"};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ashars Backend application." });
});
app.get("/token", (req, res) => {
res.json({message: "stuff"})
console.log(req.query)
});

app.get('/postData', async (req, res) => {
  year = req.query['year'];
  make = req.query['make'];
  model = req.query['model'];
  part = req.query['part'];
  console.log(req.query);
  try{
    suggestion(year, make, model, part, res);

  }catch(error){}
});
app.get('/posteBay', async (req, res) => {
  year = req.query['year'];
  make = req.query['make'];
  model = req.query['model'];
  part = req.query['part'];
  suggest = req.query['suggestion'];
  console.log(req.query);
  
  try{
   await mainInterchange(year, make, model, part, suggest, res);
  }catch(error){}
});

app.get("/postSims" ,async (req, res) => {

  if (fs.existsSync(`./searches/similarities.json`)) {
    console.log(`./searches/similarities.json`, ' exists.');
   
    fs.readFile("./searches/similarities.json",'utf8', async (err, s) => {
    res.send(JSON.parse(s));
    
    })
   


  }
}
)

const PORT = process.env.PORT || 8080;
app.listen(PORT, IP_ADDRESS, () => {
console.log(`Server is running on port ${PORT}.`);

});
