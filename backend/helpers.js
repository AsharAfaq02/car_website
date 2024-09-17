const fs = require('fs');
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
const { Worker } = require('worker_threads');


async function suggestion(year, make, model, part, httpResponse){
  try{
    await getSuggestions(year,make,model,part)
    .then(async data=>{
      data = {'suggestions': data}
      httpResponse.json(data);
    })
    }catch(error){}
  }
async function getSuggestions(year,make,model,part){
   
    try{
      console.log('fetching suggestions from chatGPT')
      content_string = 
      "Return a list of part suggestions to append to an eBay search query for the item described as "+year+" "+make+" "+model+" "+part+".\
      The suggestions should include generic attributes such as color, kit, or specific components. Make sure to lisr searches relevant to\
      the year of the car as well Output only the list of suggestions, with no additional text, numbering, or letters.";
  
      const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
      { "role": "system", "content": "You return suggestions to make a query about car parts more specific" },
      { "role": "user", "content": content_string }
      ]});
      gpt_output = completion.choices[0].message['content'];
      gpt_array = gpt_output.split(',')
      console.log(gpt_array);
      return gpt_array;
      } catch (error) {
      console.error("Error in partGPT:", error);
    }
  }
async function partGPT(year, make, model, part) {
    let vehicle = make+' '+model;
    let failed = true;
    while (failed){
    try{
      console.log('fetching interchanges from ChatGPT...')
      content_string = "use the following format in JSON: \
      {\
      interchange_base: \
      {part: "+ part +"\
      car_model: "+vehicle+"\
      car_year: "+year+ " },\
      compatible_with:\
      {\
        car_year:\
        car_brand:\
        car_model:\
      }\
      ]\
      }\
      Follow the following rules strictly: \
      In interchage_base, insert the "+year+" "+vehicle+" "+part+".\
      Then, in the compatible_with section, list 10 different cars \
      that have the same manufacturer just for the specified part, and the also use a part that is practically identical and installable in either vehicle.\
      The first entry in this list should be the same as the interchange_base details.\
      For each of the other 9 cars, provide:\
      'car_year' The year of the compatible car (must be an integer).\
      'car_brand': The brand of the compatible car.\
      'car_model': The model of the compatible car.\
      Constraints:\
      No Repeats: Ensure that there are no duplicate cars in the compatible_with list.\
      Car Year: The car_year of each compatible car should not be greater than the year specified in interchange_base.\
      Response Format: Provide only the JSON object as specified. Do not include any extra text, tags, or quotations. Write perfect JSON object that is parseable."

      const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
      { "role": "system", "content": "You are a car part swapping tool. Given any year, make, model,\
      you are able to find various cars that use "+part+" that are identical to the "+year+" "+vehicle+".\
      You only print a JSON file and nothing else, no extra tags or quotations." },
      { "role": "user", "content": content_string }
      ]});
      gpt_output = completion.choices[0].message['content']
      if(gpt_output){
        failed = false;
      }
      return JSON.parse(gpt_output);
    } catch (error) {
      failed = true;
      console.log(error)
      
    }
  }
  }
async function ebay_search(ebaySearchPrompt, part,information){
    try{
    let prompt = ebaySearchPrompt+" "+part;
    let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
    let response = await fetch(url, 
    {
      headers: {
        'Authorization':'Bearer v^1.1#i^1#f^0#p^1#r^0#I^3#t^H4sIAAAAAAAAAOVYf2wTVRxv90sIbEZBwMFCOSD8vPbdXdu1x1rtfuAq21pp2eaMzuvd63rb/Sj3XtkKicxFMP4jMQpBDWYB4yQZIUQnCSJRMEESEn/EH5hokBiiICaMP5h/LMR3XRndJICsiUu8NOnd933f930+n/f9vvfuQG/JzNU763eOlFofKOjvBb0FViszC8wsKV5TVlhQXmwBOQ7W/t5lvUV9hb9XIUFVkvxGiJK6hqCtR1U0xGeMPiplaLwuIBnxmqBCxGORjwQaG3jWDvikoWNd1BXKFqz1UZyT4xjgAU7Rw3mZSo5YtZsxo7qPgnEQh07RG3c5hRjnYUg7QikY1BAWNOyjWMA6aeClmcooADz5udx2l9PTRtmaoYFkXSMudkD5M3D5TF8jB+udoQoIQQOTIJQ/GFgfCQWCtXVN0SpHTix/VocIFnAKTXyq0SVoaxaUFLzzMCjjzUdSoggRohz+sREmBuUDN8HcB/yM1G7gBJzgckoeySmxXCwvUq7XDVXAd8ZhWmSJjmdceahhGafvpihRI9YJRZx9aiIhgrU28++plKDIcRkaPqquOvB0IBym/AGUEIxAXKCjsgoVIiId3lhLc14AYiJ0ATouAokTWHd2oLFoWZknjVSja5JsioZsTTquhgQ1zNHGHWU53pWjDXEKaSEyODYR5WrIjmvItJmTOjaLKZzQzHmFKhHClnm8+wyM98bYkGMpDMcjTG7ISOSjhGRSlqjJjZlczKZPD/JRCYyTvMPR3d1t7+bsutHhYAFgHK2NDRExAVWBIr5mrY/5y3fvQMsZKiIkPZHM43SSYOkhuUoAaB2U3wU4jgVZ3SfC8k+2/sOQw9kxsSLyVSECCysrhRgLOZbcOfNRIP5sjjpMGDAmpGlVMLogTiqCCGmRpFlKhYYs8ZwrznKeOKQltzdOO73xOB1zSW6aiUMIIIzFRK/n/1Qn95rpESgaEOcl1fOW5lK4c3OLKDc0M6pUtzUSTYTbqju1Fj2lhzc2rZE3dQbBE8Dr3hprbfTdazHclnyNIhNlomT86Vfr9TrCUJoSvYioJ2FYV2QxPb0mmDOksGDgdAQqCjFMiWQgmQzmZ6nOG71/uUzcH+/8bVH/0fZ0W1bITNnpxcrsj0gAISnbzR3ILuqqQzdrXSCnD9PcnkE9Jd4yObhOK9aE5BhbWRo7cdp1k64dbRHtBkR6yiCHbXvIPIBF9S6okf0MG7qiQKOZmXI9q2oKCzEFTrfCzkOCy8I022yZStbt4hjWNbXlSMxspe3TbUnKy1JctP7+TtWOie/4fkvmYvqsJ0Gf9USB1QqqwHJmKVhSUripqHB2OZIxtMtC3I7kDo28uhrQ3gXTSUE2CuZYru3fXV9TXhfas3pbNP3V26cts3M+MfQ/CxaMf2SYWcjMyvniABbdailmHpxfyjqBl6kE5HK528DSW61FzLyiuW/oL+///txFPEglRi5vO1B34/nBQ6B03MlqLbYU9VktzJvppoV75r2qVgR2oWuXmh6pe+9w1/yhhYflQ7O/fey59gPPWBd9fXXzmdLRvRt+inWspLpCx4eu/NXaO1qhfkQX/LHaOGKd+9KOM97tJacfH2bKzm1ZFqJKFnNX6DIw4+Qr1Q+Hzq94f3Tu1Tm/7NuU/mE4ceG3b9IVx90jH1iOSn9+vG7HideVzlOjrRt+LlAvdzy0quXJwy8ogxWpRadXDTrah6+W7N36Wd3ZkWvO61XLrge+W1v844qBy+9cwm992XiwZah+4coG9tiMfQeDG3ourn20f6jvkw9fO3UDWyrK2cRA1fLFzX0DSxYMa0fpIzb8bnB7zbEv8Ixfy3YN+D+9fv7C2RfX7f58bC7/Bm7VI6/8EQAA',
        'X-EBAY-C-MARKETPLACE-ID':'EBAY_US',
        'X-EBAY-C-ENDUSERCTX':'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>'
      }
    })
    response.json()
    .then(async data =>{
      try{
        totals = data['total']
        if(totals == 0){}
        else{
          await storeEbayData(information, prompt, data);
          
        }
       
      }
      catch(error){}
    })
  } catch(error){}
  
  }
async function storeEbayData(information, prompt, data){
  information[prompt] = data;

}
async function mainInterchange(year,make,model,part,suggestion,res){
  const worker_ebay = new Worker('./worker_ebay.js');

    let filename_OGmodel = '';
    let parentData = {'listings':[]};
  try{
    let messagesSent = 0;
    let messagesCompleted = 0;
    let data = await partGPT(year, make, model, part + ' '+ suggestion);
    if(data){
      console.log(data)
      filename_OGmodel = year+' '+make+' '+model+' '+part+' '+suggestion;
      filename_OGmodel = filename_OGmodel.replace(/ /g, '_');
      console.log("fetching eBay listings...")
        for(let x = 0; x < data['compatible_with'].length; x++){
          let ebaySearchPrompt = data['compatible_with'][x].car_year + " " +
          data['compatible_with'][x].car_brand + " " + data['compatible_with'][x].car_model;
          console.log(ebaySearchPrompt, part + ' '+ suggestion)
          let stream = ['ebay',ebaySearchPrompt, part + ' '+ suggestion, filename_OGmodel];
          worker_ebay.postMessage({ stream });
          messagesSent++;
        
        }
      }
         worker_ebay.on('message', async (message) => {
            if (message.status === 'completed') {
              console.log('Confirmation from Worker:', message.stream);
              messagesCompleted++;
              if (messagesCompleted === messagesSent) {
                console.log('All messages have been processed.');
                console.log(filename_OGmodel);
               await delay(1000)

               
               await retrieve_file_contents(year+' '+make+' '+model+' '+part+' '+suggestion, filename_OGmodel, parentData,worker_ebay,res);
              
            }
            }
          })
        
          
    }catch(error){}

    
  }
async function retrieve_file_contents(query, filename,parentData,worker_ebay,res){
    let dataFromEbay = {};
    if (fs.existsSync(`./searches/${filename}.json`)) {
      console.log(`./searches/${filename}.json`, ' exists.');
      fs.readFile("./searches/"+filename+".json",'utf8', async (err, s) => {
        if(Object.entries(JSON.parse(s))[0][1].total <= 1 || Object.keys(s).length === 0){
          res.send({key:'nodata'});
          console.log("ebay search could not be completed");
          await delay(1000);
          fs.unlinkSync("./searches/"+filename+".json",'utf8');
        }
        else{
          let messagesSent = 0;
          s = Object.entries(JSON.parse(s)).forEach(async a=>{
              dataFromEbay = {'model':[]};
             

              
              Object.keys(Object.entries(a[1]['itemSummaries'])).forEach(async key=>{
                let title = a[1]['itemSummaries'][key]['title'];
                let imageURL = a[1]['itemSummaries'][key]['image']['imageUrl'];
                let price = a[1]['itemSummaries'][key]['price']['value'];
                let listingURL = a[1]['itemSummaries'][key]['itemWebUrl'];
                let listing_info = 
                {
                model: a[0] ,
                title:title,
                imageUrl:imageURL, 
                price:price, 
                listingURL:listingURL
                };
                dataFromEbay['model'].push(listing_info);
            });

        parentData.listings.push(dataFromEbay);
        });
      
      
   
        console.log(parentData);
          res.send(parentData);
          Object.keys(parentData.listings).forEach(a=>{ 
            lenListingsOfEachModel = Object.keys(parentData.listings[a].model).length
              for(i = 0; i < lenListingsOfEachModel; i++){
                // for(j = i + 1; j < lenListingsOfEachModel; j++){
                  let model = parentData.listings[a].model[i].model
                  let comp1 = query;
                  let comp2 = parentData.listings[a].model[i].title;
                  let comparisonQuery = ['comparison', JSON.stringify(model), comp1, comp2]
                  worker_ebay.postMessage( comparisonQuery );
                  messagesSent++
                // }
              } 
            })
   
          let messagesCompleted = 0;
          worker_ebay.on('message', (message) => {
            if (message.status == 'completed comparison') {
                console.log('Confirmation from Worker:', message.status);
                messagesCompleted++;
                if (messagesCompleted === messagesSent) {
                    console.log('All messages have been processed.');
                    worker_ebay.terminate();
                  }
              }
          })
        }
      })
    
  
  } else {
      console.error('File does not exist.');
  }

  } 
async function compareTexts(model,pair) {
    try {
      const [embedding1, embedding2] = await Promise.all([
        getEmbedding(pair[0]),
        getEmbedding(pair[1]),
      ]);
  
      // Calculate cosine similarity between the two embeddings
      // console.log(embedding1)
      const similarity = cosineSimilarity(embedding1, embedding2);
      // sims.push([pair[0],pair[1],similarity])
      console.log('for ',model,':');
      console.log(pair[0]);
      console.log(pair[1]);
      console.log('similarity score: ', similarity);
      console.log(' ');
      
    } catch (error) {
      console.error('Error comparing texts:', error);
    }
  //   console.log(sims)
  
  }
async function getEmbedding(text) {

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
   return embedding.data[0]['embedding'];
    
  }
function cosineSimilarity(A, B) {
    var dotproduct = 0;
    var mA = 0;
    var mB = 0;

    for(var i = 0; i < A.length; i++) {
        dotproduct += A[i] * B[i];
        mA += A[i] * A[i];
        mB += B[i] * B[i];
    }

    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    var similarity = dotproduct / (mA * mB);
    
    return similarity;
  }
function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }


  module.exports = { suggestion, compareTexts, ebay_search, mainInterchange,retrieve_file_contents,delay, storeEbayData};