const fs = require('fs');
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
const EbayAuthToken = require('ebay-oauth-nodejs-client');
const { Worker } = require('worker_threads');

async function ebay_token(){
  let token = null;
const ebayAuthToken = new EbayAuthToken({
    clientId: 'AsharAfa-Timeless-PRD-3900bce50-fc0d3a26',
    clientSecret: 'PRD-900bce5033e7-adcc-4c7d-8a14-a433',
    redirectUri: 'Ashar_Afaq-AsharAfa-Timele-inbgqtjw'
});
  
   await ebayAuthToken.getApplicationToken('PRODUCTION').then(token1=>{

        const accessToken = JSON.parse(token1).access_token;
        const timeout = JSON.parse(token1).expires_in;
        
        // return accessToken;
        token = accessToken;
        
    })
    return token;

    
}
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
      Then, in the compatible_with section, list 10 different cars\
      that use a "+part+" that can be used interchangeably. Make sure the parts are identical. \
      The first entry in this list should be the same as the interchange_base details.\
      For each of the other 9 cars, provide:\
      'car_year' The year of the compatible car (must be an integer).\
      'car_brand': The brand of the compatible car.\
      'car_model': The model of the compatible car.\
      Constraints:\
      No Repeats: Ensure that there are no duplicate cars in the compatible_with list.\
      Car Year: The car_year of each compatible car should not be greater than the current year.\
      Response Format: Provide only the JSON object as specified. Do not include any extra text, tags, or quotations. Write perfect JSON object that is parseable."

      const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
      { "role": "system", "content": "find cars\
        that have the same manufacturer just for the specified part, and the also use a part that is identical and installable in either vehicle." },
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
  let token = await ebay_token();
    try{
    let prompt = ebaySearchPrompt+" "+part;
    let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
    let response = await fetch(url, 
    {
      headers: {
        'Authorization':`Bearer ${token}`,
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
              // console.log('Confirmation from Worker:', message.stream);
              messagesCompleted++;
              if (messagesCompleted === messagesSent) {
                console.log('All messages have been processed.');
                console.log(filename_OGmodel);
                await delay(1000);
                await retrieve_file_contents(year+' '+make+' '+model+' '+part+' '+suggestion, filename_OGmodel, parentData,worker_ebay,res);
                
              }
            }
          })      
       }catch(error){}
}
async function retrieve_file_contents(query, filename,parentData,worker_ebay, res){
  let dataFromEbay = {};
  if (fs.existsSync(`./searches/${filename}.json`)) {
    console.log(`./searches/${filename}.json`, ' exists.');
    fs.readFile("./searches/"+filename+".json",'utf8', async (err, s) => {
      
      if(Object.entries(JSON.parse(s))[0][1].total <= 1 || !Object.entries(JSON.parse(s))[0][1].total){
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
    
     res.send(parentData);

    Object.keys(parentData.listings).forEach(a=>{ 
    lenListingsOfEachModel = Object.keys(parentData.listings[a].model).length
    for(i = 0; i < lenListingsOfEachModel; i++){
      let model = parentData.listings[a].model[i].model
      let comp1 = query;
      let comp2 = parentData.listings[a].model[i].title;

      let comparisonQuery = ['comparison', JSON.stringify(model), comp1, comp2]
      worker_ebay.postMessage( comparisonQuery );
      messagesSent++
    } 
  })

    let messagesCompleted = 0;
    worker_ebay.on('message', (message) => {
    if (message.status == 'completed comparison') {
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
async function compareTexts(model, pair, similarities) {
    try {
      const [embedding1, embedding2] = await Promise.all([
        getEmbedding(pair[0]),
        getEmbedding(pair[1]),
      ]);
      const similarity = cosineSimilarity(embedding1, embedding2);
      const comps = {'title': pair[1], 'similiarity': similarity};

      
      if(typeof(comps) !== "undefined"){
        similarities.data.push(comps);
      }
          
        
      
      

    } catch (error) {
      console.error('Error comparing texts:', error);
    }
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