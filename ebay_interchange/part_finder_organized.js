const fs = require('fs');
const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

const dataFromEbay = {};

async function partGPT(car, part, year) {
    try{
        console.log('fetching interchanges from ChatGPT...')
        content_string = "use the following format in JSON: \
        {\
        interchange_base: {part: "+ part +"\
        car_model: "+car+"\
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
        In interchage_base, insert the "+year+" "+car+" "+part+".\
        Then, in the compatible_with key, insert the most common year, brand, and model of different brands that use the same original equipment manufacturer as the "+year+" "+car+" "+part+".\
        Make the first entry is the "+year+" "+car+" "+part+". Make sure car_year is of type integer. Return a list of 20 cars. Do not allow repeats, and make sure the car year is no greater than the current year";

        const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
        { "role": "system", "content": "returns a JSON" },
        { "role": "user", "content": content_string }
        ]})
        gpt_output = completion.choices[0].message['content']
        // console.log(JSON.parse(gpt_output));
        console.log(gpt_output);
        return JSON.parse(gpt_output);
    
        } catch (error) {
            console.error("Error in partGPT:", error);
    }
}

async function ebay_search(stuff, part){
    let prompt = stuff + " " + part;
    let url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q='+prompt+'&limit=10';
    let response = await fetch(url, 
    {
        headers: {
          'Authorization':'Bearer v^1.1#i^1#p^1#r^0#I^3#f^0#t^H4sIAAAAAAAAAOVYe2xTVRhf9wAWxniNAY3ReseiQm577r3t2l7WkrKHa9y6spYBNQTv41x21/so99xuK5I4N0FjIKIJShTmnIrBP4BEIRLUBSQ8oiLBKL5ilL8MishDEf9Q7+3K6CYBZE1cYv9pzne+853f73e+75xzD+ieUDx/Q8OGK1MsE/P7u0F3vsVCTAbFE4oWlBbkW4vyQJaDpb97XndhT8EP1YiRpQTdAlFCVRC0dcmSgui00YclNYVWGSQiWmFkiGidoyOBpkaatAM6oam6yqkSZgvW+jCeBU4euCkXIZAcQQDDqlyLGVV9GEPwvIfleKKKg5yXII1+hJIwqCCdUXQfRgLSiQMvDpxR4KKdbpqi7E7gjGG2VqghUVUMFzvA/Gm4dHqsloX15lAZhKCmG0EwfzBQH2kOBGvrQtFqR1Ysf0aHiM7oSTSyVaPy0NbKSEl482lQ2puOJDkOIoQ5/EMzjAxKB66BuQP4aam9LCQg5yZZpwsCjs+JkvWqJjP6zWGYFpHHhbQrDRVd1FO3EtQQg22HnJ5phYwQwVqb+bckyUiiIELNh9UtDqwIhMOYP4DaGC0gMHhUlKFkaIiHW2pxygsAy0EXwAUO8BRDVmUmGoqWUXnUTDWqwoumZsgWUvXF0EANR2tDZWljODUrzcbkuoko28+d0ZDyemLmmg4tYlJvU8xlhbIhhC3dvPUKDI/WdU1kkzocjjC6Iy2RUTWJhMhjozvTqZjJni7kw9p0PUE7HJ2dnfZOyq5qqx0kAIRjeVNjhGuDMoOZvmatp/3FWw/AxTQVDhojkUjrqYSBpctIVQOAshrzuwBFkSCj+0hY/tHWfxiyODtGFkSuCoSneEi6WC/JuHiGcLpzUSH+TJI6TByQZVK4zGhxqCckhoM4Z+RZUoaayNOUSyApjwBxvsor4E6vIOCsi6/CCQFCACHLcl7P/6lQbjfVI5DToJ6bXM9VnvPh9jXLOLGxlZD5urWRaFs4trhdWaYm1XBLaIG4tD0IHgTeqrXs8ibf7VbDDcnXSKKhTNSYPycCmLWeMxEaVKRDfkz0IpyagGFVErnU+FpgSuPDjKanIlCSDMOYSAYSiWCO9upc0fuX28Sd8c7hGfXfnE83ZIXMlB1frMzxyAjAJES7eQLZOVV2qGatM8b1wzSvSqMeE2/RuLiOK9YGySG2Ij905bSrJl076uDsGkRqUjMu2/Zm8wYWVeNQMc4zXVMlCWqtxJjrWZaTOsNKcLwVdg4SXGTG2WFLuEmXk/R4XNSYeHHpo3TVeNuScrIVF9bf2bXaMfIb35+X/hE9lkOgx/J+vsUCqkElUQHunVCwtLCgxIpEHdpFRrAjcbVifLpq0B6HqQQjavkz8y4ObGmosdY1Pz//0Wjq5EtH80qynhj6V4I5w48MxQXE5KwXB3DX9Z4iYursKaQTeIETuJxuioqBiuu9hUR5YRk2taO5cseqV2N0QfG6gdIDSzyvbAdThp0slqK8wh5LntC18dQm9t1L5xad0s6nyh4R5qVmf1Bd3lTSRy/au+TM4ZkfPXH4yMJLh2KVn1a+dXzO4ILeB7Zd/m7vtLddu37d+PXga48/1jPnyemDL8QH7uaOX3V+dv/cdX3WWXOPPGydt61j87TYwvK/ystmHeuT4k998nR8wFp14vR7ux+6qJdXb9/6zvQ3nq3bHDp88tt++cLOsxNDv1svlPaWbdpxTDi70FHSy9zj+8PaHdhycPDljvUVZ/cdbPy4K7rii/0/r3+udc/R+IW+PSf2BkP4gfs+PL+I2P3j7P0r63d1/iR/XirD2vbfJu1+8zLe2/TL6ZYXJ33/zRruq2Dq0vr9FV9e2Vqy7xk04+rOGWdeP/fn0Fr+DdSlNWf8EQAA',
          'X-EBAY-C-MARKETPLACE-ID':'EBAY_US',
          'X-EBAY-C-ENDUSERCTX':'affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>'
        }
      }
    )
    response.json()
    .then(data =>{
        try{
            totals = data['total']
            if(totals == 0){}
            else{
            dataFromEbay[stuff] = data['itemSummaries'];
            }
        }
        catch(error){
            // console.log(error)
        }
    })
}

function main(){
    const raw = {};
    let year ="1984";
    let make = "Porsche";
    let model = "944";
    let part = "rear view mirror";

    partGPT(make+ " "+ model, part, year)

    .then(async data => {
       console.log(data)
       console.log("fetching eBay listings...")
        for(let x = 0; x < data['compatible_with'].length; x++){
            let ebay_search_prompt = data['compatible_with'][x].car_year + " " + data['compatible_with'][x].car_brand + " " + data['compatible_with'][x].car_model;
            await (ebay_search(ebay_search_prompt, part));
        }
        fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(dataFromEbay, null, 2));
        Object.keys(dataFromEbay).forEach(brand =>{
           const _dataFromEbay = {
                            "listings": []
                            };
            Object.keys(dataFromEbay[brand]).forEach(listing =>{
                try{
                    if(dataFromEbay[brand][listing].title.toLowerCase().includes(part.toLowerCase())){
                        let listingTitle = dataFromEbay[brand][listing].title
                        let href = dataFromEbay[brand][listing].itemHref;
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
                }
                catch(error){}
            })
            raw[brand] = _dataFromEbay;
             
        })
        console.log(raw);
        fs.writeFileSync('./full_ebay_exchanges.json', JSON.stringify(raw, null, 2));
        
    })
    .catch(error => {
        console.error('Error:', error);
 });
}

main();