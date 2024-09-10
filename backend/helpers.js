const fs = require('fs');
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

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
      Then, in the compatible_with key, insert the most common year, brand, and model of different brands that use the same exact "+part+" build design as the "+year+" "+vehicle+".\
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
  
  async function ebay_search(ebaySearchPrompt, part, dataFromEbay){
    try{
    let prompt = ebaySearchPrompt+" "+part;
    let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
    let response = await fetch(url, 
    {
      headers: {
        'Authorization':'Bearer v^1.1#i^1#f^0#I^3#p^1#r^0#t^H4sIAAAAAAAAAOVYfWxTVRRft26wwDARBByo9QHGsPT1vtd2bV/axu6DURxbWcvAAS7v45a97fW957u3bB0xNkscU0kWEeEP+GOoaPwG1BhFYIHIIgkG0ShEg8EYQUGURaOJiXpfV0Y3CSBr4hLbJs0999xzz+93zrnnvgfSJaWLe5f2/lZmmVI4kAbpQouFmQZKS4orZhQVlhcXgBwFy0B6YdraU3Tej/iEonNNEOmaiqCtK6GoiMsIA1TSUDmNRzLiVD4BEYdFLhpaXs+xNOB0Q8OaqCmULVwToNzQ4xLcblYUGMnrFCqJVL1iM6aReUnw+hjBxboYEXpZH5lHKAnDKsK8igMUC1iXHfjILwbcHOPhWA/t9HpaKFszNJCsqUSFBlQw4y6XWWvk+Hp9V3mEoIGJESoYDi2JNobCNbUNMb8jx1Ywy0MU8ziJxo6qNQnamnklCa+/Dcpoc9GkKEKEKEdwZIexRrnQFWduwf0s1azEiKIoiKLL5xNBXqhcohkJHl/fD1MiS/Z4RpWDKpZx6kaMEjaEdiji7KiBmAjX2My/FUlekeMyNAJUbVXooVAkQgVDqI03QnHeHpMTUCEk2iNNNXanDwBBhG5gj4tAcvJsZXajEWtZmsftVK2pkmyShmwNGq6CxGs4nhuQww1RalQbyebY9ChXzzPKIWgxgzoSxSRuU824wgQhwpYZ3jgCo6sxNmQhieGohfETGYoCFK/rskSNn8zkYjZ9ulCAasNY5xyOzs5OutNJa8Z6BwsA41i9vD4qtsEETxFds9ZH9OUbL7DLGSgiJCuRzOGUTnzpIrlKHFDXU0E3cDpZkOV9rFvB8dJ/CHIwO8ZWRL4qhCVV4ZLipDoEj4tl3fmokGA2SR2mH1DgU/YEb3RArCu8CO0iybNkAhqyxDndcdbpjUO7VOmL212+eNwuuKVKOxOHEEAoCKLP+38qlJtN9SgUDYjzkut5y3Mp0v7IKlGub2YSUm13NNYWaalqV1dpSS3S1FAhr2wPgzrgq+wWVi8P3Gw1XBN8tSITZmJk/3wQYNZ6/khYqiEMpQnBi4qaDiOaIoupyRVgpyFFeAOnolBRiGBCIEO6Hs7PWZ03eP/ymLg13PnrUf9Rf7omKmSm7ORCZa5HxACvy7TZgWhRSzjMWtd4cv0wxa0ZryeEWyY310mFmoAcQStLI1dOOgOXRhtE2oBISxrktk03mjewmNYBVdLPsKEpCjSamQnXcyKRxLygwMlW2HlIcJmfZM2W8bBur9sHXJ4J4RIzrbR1sh1J+TiKrXW3eK12jH3IDxZkPkyP5TDosRwstFiAHyxiFoB7S4pWWoumlyMZQ1rm4zSS16vk2dWAdAdM6bxsFM4sGH7u2aXV5bWN2xZvjKVO7BgqmJ7zjmFgHZg7+pahtIiZlvPKAcy/OlPM3DanjHUBH/m6SeQ9LWDB1VkrM9s6Sxtes3nrqUf7Mf6kZuvUM90X1cE0KBtVsliKC6w9loJtvw9uR0NT+4MP7v51zYXwE8l99c/0zTu+UOzZG3xzF9fHvn7oLrr7bG/8L3bF0SPly0rKrDb/2T2v/Hl5X8fa8zbj7c9K3+gavLRz/ulDL1RsOnp8uGXw45/8P1Z9n5p5cN3jDTvvmRuoe6xv2ND9F+/Y/93dHzAvxj7k9nz1LX3k9P277zwgVfsHtrTRfJ3vzFtTlK87jQdmtNy+4OHXTobe8fYPrdo3u2moYWpf5OdL932+cfdH+iXnsnfbth/dcXLLrHN/7ML9hzfUvOTaD0+dPTTY9bT+5cquc6WbW7+omG7/1L1rx4VfqtPvvzzvWGldsNe19r1vWn84sCkRrD/2/KtPrn1qb2rOiUWXBetILP8G6E1SO/0RAAA=',
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
  let dataFromEbay = {};
  try{
    await partGPT(year, make, model, part)
      .then(async data => {
        console.log(data)
        console.log("fetching eBay listings...")
          for(let x = 0; x < data['compatible_with'].length; x++){
            let ebaySearchPrompt = data['compatible_with'][x].car_year + " " + data['compatible_with'][x].car_brand + " " + data['compatible_with'][x].car_model;
            await ebay_search(ebaySearchPrompt, part, dataFromEbay)
          }
          // fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(dataFromEbay, null, 2));
          Object.keys(dataFromEbay).forEach(brand =>{
            _dataFromEbay = {"listings": []};
            
              Object.keys(dataFromEbay[brand]).forEach((listing) =>{
                try{
                  // if(dataFromEbay[brand][listing].title.toLowerCase().includes(part.toLowerCase())){
                
                  let listingTitle = dataFromEbay[brand][listing].title
                  let href = dataFromEbay[brand][listing].itemWebUrl;
                  let image = dataFromEbay[brand][listing].image.imageUrl;
                  let price = dataFromEbay[brand][listing].price.value;
                  price = +price;
                  let t = {Title: listingT}
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
        httpResponse.send(raw);
        fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(raw, null, 2));     

        dataFromEbay = {};
        raw = {};
        _dataFromEbay = {};
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }catch(error){}
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

  async function compareTexts(pair) {
  try {
    const [embedding1, embedding2] = await Promise.all([
      getEmbedding(pair[0]),
      getEmbedding(pair[1]),
    ]);

    // Calculate cosine similarity between the two embeddings
    // console.log(embedding1)
    const similarity = cosineSimilarity(embedding1, embedding2);
    // sims.push([pair[0],pair[1],similarity])
    console.log(pair[0]);
    console.log(pair[1]);
    console.log('similarity score: ', similarity);
    console.log(' ');
    
  } catch (error) {
    console.error('Error comparing texts:', error);
  }
//   console.log(sims)
//   fs.writeFileSync('./full_ebay_sims.json', JSON.stringify(sims, null, 2));

  }


  module.exports = { mainInterchange, compareTexts };