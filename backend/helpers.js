const fs = require('fs');
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
const { Worker } = require('worker_threads');
const worker_ebay = new Worker('./worker_ebay.js');

const path = require('path');

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
      content_string = "return a list of specific general suggestions to add to the end of an ebay search for "+part+".\
      Make the suggestions generic attributes of color, kit, specific part of the "+part+", etc.\
      Just print a list and nothing else. No numbering or lettering.";
  
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
      Follow the following rules strictly: \
      In interchage_base, insert the "+year+" "+vehicle+" "+part+".\
      Then, in the compatible_with key, insert the a reasonable year, brand, and model of different car companies that use the same exact "+part+" design as the "+year+" "+vehicle+".\
      Make the first entry is the "+year+" "+vehicle+" "+part+".\
      Make sure car_year is of type integer. Return a list of 10 cars.\
      Do not allow repeats. Make sure your response is a JSON file.\
      Make sure the car year is no greater than .\
      You only print a JSON file and nothing else, no extra tags or quotations.";
  
      const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
      { "role": "system", "content": "You are a car part swapping tool. Given any year, make, model,\
      you are able to find various cars that use "+part+" that are identical to the "+year+" "+vehicle+".\
      You only print a JSON file and nothing else, no extra tags or quotations." },
      { "role": "user", "content": content_string }
      ]});
      gpt_output = completion.choices[0].message['content']
      return JSON.parse(gpt_output);
    } catch (error) {
    }
  }
async function ebay_search(ebaySearchPrompt, part, information){
    try{
    let prompt = ebaySearchPrompt+" "+part;
    let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
    let response = await fetch(url, 
    {
      headers: {
        'Authorization':'Bearer v^1.1#i^1#I^3#f^0#r^0#p^1#t^H4sIAAAAAAAAAOVYW2wUVRje7W4LyC0ComkwLANaUjKzZ2YvszvpLll6Y5PSLuy2hUYlszNn22nnss6cZbsQY1OTJj55SUAJt1JEhMQIPohcFKMGQmIsEKM++ACBBnjQEBSEYIhnZpeyrQSQbmIT92Vz/vOf/3zfd/7/nDMH9FVMqx5YOfDnTPuUssE+0Fdmt9PTwbSK8mWzHGWV5TZQ5GAf7FvS5+x3XKkxeEVOc2ugkdZUA7p6FVk1OMsYIjK6ymm8IRmcyivQ4JDAxSOrmjiGAlxa15AmaDLhitaFCFEQkkwQAt7v8wvegA9b1XsxE1qIYH1QCLIB6GH8AsOILO43jAyMqgbiVRQiGMB4SRAkaW8CsJzPzwGWYjzBDsLVBnVD0lTsQgEibMHlrLF6EdaHQ+UNA+oIByHC0UhDvCUSratvTtS4i2KFCzrEEY8yxthWrSZCVxsvZ+DDpzEsby6eEQRoGIQ7nJ9hbFAucg/ME8C3pGZ4lg3SKRYCAYgBLyyJlA2arvDo4ThMiySSKcuVgyqSUO5RimI1kt1QQIVWMw4RrXOZf6szvCylJKiHiPoVkXWRWIwIR4wuXo+keDIhKVDGIpKxNXWkJwhAUoA+QKYwYw/P+AsT5aMVZB43U62mipIpmuFq1tAKiFHD8dp4i7TBTi1qC54cmYiK/YKjGjId5qLmVzGDulRzXaGChXBZzUevwOhohHQpmUFwNML4DkuiEMGn05JIjO+0crGQPr1GiOhCKM253dlslsp6KE3vdDMA0O61q5riQhdUeAL7mrWe95cePYCULCoCzi3sz6FcGmPpxbmKAaidRNgHPB4GFHQfCys83voPQxFn99iKKFWFsH7og8kkAAHRA3DelKJCwoUkdZs4YJLPkQqv90CUlnkBkgLOs4wCdUnkPL4U4wmkICn6gynSG0ylyKRP9JN0CkIAMSwhGPg/FcrjpnocCjpEJcn1kuW5GOt+tV2QmtpoRazfGE90xTpWdKvtWkaLrWleJrV2R0EjCPo3JteuCj1uNTyQfK0sYWUSeP5SCGDWeulEWKkZCIoTohcXtDSMabIk5CbXAnt0McbrKBeHsowNEyIZSaejpdmrS0bvX24TT8a7dGfUf3Q+PZCVYabs5GJljjdwAD4tUeYJRAma4jZrXePx9cM0r7dQT4i3hG+uk4o1JplnK4n5Kydl0aWMDQKlQ0PL6Pi2TbWYN7CE1gNVfJ4hXZNlqLfRE65nRckgPinDyVbYJUhwiZ9khy3NMn4PAD4/OyFegnWUrp9sW1IptmJn4xNeq91jP/LDNutH99u/Bv32L8vsdlADXqAXg0UVjlanY0alISFISXyKMqROFX+76pDqgbk0L+llc23XhzavrK2sb9lSvSmRO7PtlG1G0RvD4MvgudFXhmkOenrRkwNYcL+nnJ797EzGC4K0F7A+P2A7wOL7vU56vnPevKXR099nWj+5dGH5savHD11Y8GZ4K5g56mS3l9uc/XZbbMeR8Lu77c/vn7O+irt0oLV2JHRi3/H+hhOn9uz/6retL/548aVbd36hDv6UXVR+do74bS2Zmn9j6mz50I7LIwe6P3it8uquL87+cGfd7KMJtGH3XNehp/oaq5/+tOyvxUuHB85Lrzdmz0/V+7Up1z4KJVjx9Cs9h3vYmnXH4lv2f7ZRXSic9NeN3Pjm3CbH3u3vLww1/PzG9ey1dtb9Ie9P7x06eKSKCJ/0phY88/a5i1r19qFBdPB2feeFDts+Z7tqG27YdfPm1cQB2553mu6urvr8VvUJr2945MqSnR9Xue+eAe8dbaxYPsc9pffX3YeVWZe9v/9REdj5luN2Fbl5E7o1fGXg6HdDNfm1/BveLjC2/REAAA==',
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
          
          information[prompt] = data;
        }
      }
      catch(error){}
    })
  } catch(error){}
  
  }
async function mainInterchange(year,make,model,part,suggestion,res){
    let filename_OGmodel = '';
  try{
    let messagesSent = 0;
    let messagesCompleted = 0;
    await partGPT(year, make, model, part + ' '+ suggestion)
    .then(async data => {
      filename_OGmodel = year+' '+make+' '+model+' '+part+' '+suggestion
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
          worker_ebay.on('message', async (message) => {
            if (message.status === 'completed') {
              console.log('Confirmation from Worker:', message.stream);
              messagesCompleted++;
              if (messagesCompleted === messagesSent) {
                console.log('All messages have been processed.');
                await delay(1000)
                console.log(filename_OGmodel);
                retrieve_file_contents(filename_OGmodel, res);
              }
            }
          })
        })
          .catch(error => {
            console.error('Error:', error);
          });
    }catch(error){}
    
  }
function retrieve_file_contents(filename,res){
    let parentData = {'listings':[]};
    let dataFromEbay = {};
    if (fs.existsSync(`./searches/${filename}.json`)) {
      console.log(`./searches/${filename}.json`, ' exists.');
      fs.readFile("./searches/"+filename+".json",'utf8', async (err, s) => {
          let messagesSent = 0;
          s = Object.entries(JSON.parse(s)).forEach(a=>{
              dataFromEbay = {[a[0]] :[]};
              Object.keys(Object.entries(a[1]['itemSummaries'])).forEach(key=>{
                let title = a[1]['itemSummaries'][key]['title'];
                let imageURL = a[1]['itemSummaries'][key]['image']['imageUrl'];
                let price = a[1]['itemSummaries'][key]['price']['value'];
                let listingURL = a[1]['itemSummaries'][key]['itemWebUrl'];
                let listing_info = {title:title, imageUrl:imageURL, price:price, listingURL:listingURL};
                dataFromEbay[a[0]].push(listing_info);
            });
            parentData.listings.push(dataFromEbay);

          });
          console.log(parentData);
          

          Object.keys(parentData.listings).forEach(a=>{
            Object.keys(parentData.listings[a]).forEach(b=>{
              lenModelListings = Object.keys(parentData.listings[a][b]).length;
              for(i = 0; i < lenModelListings; i++){
                for(j = i + 1; j < lenModelListings; j++){
                  let model = Object.keys(parentData.listings[a])
                  let comp1 = parentData.listings[a][b][i].title
                  let comp2 = parentData.listings[a][b][j].title
                  let comparisonQuery = ['comparison', JSON.stringify(model), comp1, comp2]
                  worker_ebay.postMessage( comparisonQuery );
                  messagesSent++
                }
              }
            })
          })
          let messagesCompleted = 0;

          worker_ebay.on('message', (message) => {
            if (message.status == 'completed comparison') {
                console.log('Confirmation from Worker:', message.status);
                messagesCompleted++;
                if (messagesCompleted === messagesSent) {
                    console.log('All messages have been processed.');
                    worker_ebay.terminate();
                    Object.keys(require.cache).forEach(function(key){
                      delete require.cache[key];
                    
                    })
                    
                  }
              }
          })
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


  module.exports = { suggestion, compareTexts, ebay_search, mainInterchange,retrieve_file_contents,delay};