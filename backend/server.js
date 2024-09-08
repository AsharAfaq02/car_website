const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const IP_ADDRESS = '10.0.0.43';
var corsOptions = {origin: "http://10.0.0.43:4200"};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ashars Backend application." });
  });

app.get('/postData', async (req, res) => {
  year = req.query['year'];
  make = req.query['make'];
  model = req.query['model'];
  part = req.query['part'];
  console.log(req.query);
  try{
    await mainInterchange(year, make, model, part, res);
    // dataFromEbay = {};
    // raw = {};
    // _dataFromEbay = {};
  }catch(error){}
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, IP_ADDRESS, () => {
console.log(`Server is running on port ${PORT}.`);
});

async function partGPT(year, make, model, part) {
  let vehicle = make+' '+model;
  try{
    console.log('fetching interchanges from ChatGPT...')
    content_string = "use the following format in JSON: \
    {\
    interchange_base: {part: "+ part +"\
    car_model: "+vehicle+"\
    car_year: "+year+ " },\
    compatible_with:\
    [\
    {\
      car_year:\
      car_brand:\
      car_model:\
    }\
    ]\
    }\
    In interchage_base, insert the "+year+" "+vehicle+" "+part+".\
    Then, in the compatible_with key, insert the most common year, brand, and model of different brands that use an identical "+part+" as the "+year+" "+vehicle+".\
    Make the first entry is the "+year+" "+vehicle+" "+part+". Make sure car_year is of type integer. Return a list of 20 cars.\
    Do not allow repeats. Make sure your response is a JSON file. And make sure the car year is no greater than the current year";

    const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
    { "role": "system", "content": "You are a car part swapping tool. Given any year, make, model,\
    you are able to find various cars that use "+part+" that are identical to the "+year+" "+vehicle+".\
    You only return readable JSON data." },
    { "role": "user", "content": content_string }
    ]});
    gpt_output = completion.choices[0].message['content']
    return JSON.parse(gpt_output);
  } catch (error) {
    console.error("Error in partGPT:", error);
  }
}

let dataFromEbay = {};
async function ebay_search(ebaySearchPrompt, part){
  try{
  let prompt = ebaySearchPrompt+" "+part;
  let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
  let response = await fetch(url, 
  {
    headers: {
      'Authorization':'Bearer v^1.1#i^1#r^0#I^3#p^1#f^0#t^H4sIAAAAAAAAAOVYa2wUVRTuttuaWqpGy6uBZJ2CIGV278zs7GNgt2wfwAbaLt2lrVVS787c6U6ZlzOztFujNJVHfMTEpBWDBBoCNhJ+aEJKAmgI4fFDY8CgETEaFHygphESiSagM7ulbCsBpJvYxP2zmXPPPff7vnPOvXcG9BYVL9qycsu1UtsD+YO9oDffZiNKQHFRYeVDBfnlhXkgy8E22Duv195X8ONSHUqiyjQhXVVkHTm6JVHWmbQxgCU1mVGgLuiMDCWkMwbLREP1qxnSCRhVUwyFVUTMEa4NYBTyUB43okg37aFYL2Fa5ZsxY0oA4wkf8gHoj5Mci0jkNsd1PYnCsm5A2QhgJCDdOPDjgI4BmiEoBlBOmqDbMEcz0nRBkU0XJ8CCabhMeq6WhfXOUKGuI80wg2DBcGh5tDEUrq1riC11ZcUKjuoQNaCR1Mc/1SgccjRDMYnuvIye9maiSZZFuo65gpkVxgdlQjfB3Af8tNQ8TXg9fo7w+b3QC93xnEi5XNEkaNwZh2UROJxPuzJINgQjdTdFTTXinYg1Rp8azBDhWof1tyYJRYEXkBbA6qpDT4UiESwY0hNQC/EQjwkSEk0R8UhTLU75AYiziAY4zwKOgqRndKFMtFGZJ6xUo8icYImmOxoUoxqZqNFEbUCWNqZTo9xoLm5YiLL9vDc1BL42K6mZLCaNhGzlFUmmEI70490zMDbbMDQhnjTQWISJA2mJAhhUVYHDJg6ma3G0fLr1AJYwDJVxubq6upxdlFPROlwkAISrtX51lE0gCWKmr9XrGX/h7hNwIU2FReZMXWCMlGpi6TZr1QQgd2BBGlAUCUZ1Hw8rONH6D0MWZ9f4jshVh1DuOO2lWOhhfZ6410flokOCo0XqsnCgOEzhEtTWI0MVIYtw1qyzpIQ0gWMomicpH49wzuPncbef5/E4zXlwgkcIIBSPs37f/6lR7rXUo4jVkJGTWs9ZnXORzudaWGF1MyFxdT3RWCLSVt0ptyhJJdLUUCms7QyDFcDv6Ym31gfutRtuS75GFExlYub6uRDA6vXcibBS0Q3ETYpelFVUFFFEgU1NrQRTGheBmpGKIlE0DZMiGVLVcG726pzR+5fbxP3xzt0Z9R+dT7dlpVslO7VYWfN1MwBUBad1AjlZRXJZva5A8/phmdvTqCfFWzBvrlOKtUkyw1bgMldOZ5quU9/AOjWkK0nNvG07G60bWExZj2TzPDM0RRSR1kxMup8lKWnAuIimWmPnoMAFOMUOW8JL0jRBET5qUrzY9FHaPtW2pFxsxfYV93mtdo1/yQ/mpX9En+0Y6LN9mG+zgaVgPlEBHi8qWGsvmFauCwZyCpB36kKHbL67asi5HqVUKGj5j+Vd2T2wsqa8rvHNRc/HUqffPpU3Lesbw+A6MGvsK0NxAVGS9ckBzLk1Ukg8PLOUdAM/oIGZdEC1gYpbo3Zihr3sz7yqjS/s7SqJzL66rfv9M78kdl13gNIxJ5utMM/eZ8tzL1vRveDQqrKL3753Unpm6MXpbUd39lTTP289sungHxv6F+9PSFc3cbPO91csGNl45q2BjQPJyu+C9V+f/rX1Y63nL25Hy/dHKk4NvvtJ164LLZU74fwv8cD+6LHh5PHZF5aUb/up7MRLX4gNatW1NzY/+03/jC7vgyWvtZ995OTwy7/tuTR8aXFs5KuRebZHVxmVBzwzfjhcdrTp3I3f69xbWvs3V9WMeObugiPigf0De66ntpN8VdEr9q3RUm24eMdmrPedmUMJvn3o7Nkb7Z/NKXt67+WPPjhc/bq2sO3cldmXL366bo17aOGGQ9uvrd3X/+T5Ewd3vzr9831Lnpg2v+NQeyNJVh5fNlctDGVy+Tfyc0XH/REAAA==',
      'X-EBAY-C-MARKETPLACE-ID':'EBAY_US',
      'X-EBAY-C-ENDUSERCTX':'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>'
    }
  })
  response.json()
  .then(data =>{
    try{
      totals = data['total']
      if(totals == 0){}
      else{
        dataFromEbay[prompt] = data['itemSummaries'];
      }
    }
    catch(error){}
  })
} catch(error){}
}

async function mainInterchange(year, make, model, part, httpResponse){
let raw = {};
let _dataFromEbay = {};
try{
  await partGPT(year, make, model, part)
    .then(async data => {
      console.log(data)
      console.log("fetching eBay listings...")
        for(let x = 0; x < data['compatible_with'].length; x++){
          let ebaySearchPrompt = data['compatible_with'][x].car_year + " " + data['compatible_with'][x].car_brand + " " + data['compatible_with'][x].car_model;
          await ebay_search(ebaySearchPrompt, part);
        }
        // fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(dataFromEbay, null, 2));
        Object.keys(dataFromEbay).forEach(brand =>{
          _dataFromEbay = {"listings": []};
            Object.keys(dataFromEbay[brand]).forEach(listing =>{
              try{
                // if(dataFromEbay[brand][listing].title.toLowerCase().includes(part.toLowerCase())){
                let listingTitle = dataFromEbay[brand][listing].title
                let href = dataFromEbay[brand][listing].itemWebUrl;
                let image = dataFromEbay[brand][listing].image.imageUrl;
                let price = dataFromEbay[brand][listing].price.value;
                price = +price;
                let l = {Title: listingTitle,
                          href: href,
                          image: image,
                          price: price
                        }  
                _dataFromEbay["listings"].push(l)
                }
                catch(error){}
            })
          raw[brand] = _dataFromEbay;
        })
      console.log(raw);
      httpResponse.send(raw);
      dataFromEbay = {};
      raw = {};
      _dataFromEbay = {};
      // fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(raw, null, 2));     
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }catch(error){}
}

