const OpenAI = require("openai");
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
const { Worker } = require('worker_threads');
const myEmitter = require('./myEmitter');


async function partGPT(year, make, model, part) {
  let vehicle = make+' '+model;
  let failed = true;
  while (failed){
  try{
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
Then, in the compatible_with section, only list cars from different brands and companies\
that use an identical "+part+" as the "+year+" "+vehicle+". \
The first entry in this list should be the same as the interchange_base details.\
For each of the other 9 cars, provide:\
'car_year': The year of the compatible car (must be an integer).\
'car_brand': The brand of the compatible car.\
'car_model': The model of the compatible car.\
Constraints:\
No Repeats: Ensure that there are no duplicate cars in the compatible_with list.\
Car Year: The car_year of each compatible car should not be greater than the current year.\
Response Format: Provide only the JSON object as specified. Do not include any extra text, tags, or quotations. Write perfect JSON object that is parseable."

    const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
    { "role": "system", "content": "find cars from different brands that only use the identical "+part+" as in the "+year+" "+vehicle+"." },
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

async function suggestion(year, make, model, part){
    try{
        console.log('fetching suggestions from chatGPT')
        content_string = 
  "Return a list of 6 single word part suggestions to append to an eBay search query for the item described as "+year+" "+make+" "+model+" "+part+".\
  The suggestions should include generic attributes such as color, kit, specific components, or area of install. Make sure to list searches relevant to\
  the year of the car as well Output only the list of suggestions, with no additional text, numbering, or letters.";  
        const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
        { "role": "system", "content": "You return suggestions to make a query about car parts more specific" },
        { "role": "user", "content": content_string }
        ]});
        gpt_output = await completion.choices[0].message['content'];
        gpt_array = gpt_output.split(',')  
        gpt_array = {'suggestions': gpt_array}

        return gpt_array;
      
      }catch(error){}
}
  
async function mainInterchange(year, make, model, part, suggestion) {
  let mainQuery = part + " " + suggestion;
  let msSent = 0;
  let msRecieved = 0;
  let msComparisonSent = 0;
  let msComparisonRecieved = 0;
  const worker = new Worker("./ebaySearchThread.js");
  const comparisonWorker = new Worker("./TitleComparisonThread.js");

  try {
      let data = await partGPT(year, make, model, part + " " + suggestion);

      if (data) {
          for (let x = 0; x < data["compatible_with"].length; x++) {
              let ebaySearchPrompt =
                  data["compatible_with"][x].car_year +
                  " " +
                  data["compatible_with"][x].car_brand +
                  " " +
                  data["compatible_with"][x].car_model;

              let dataToEbayThread = [
                  ebaySearchPrompt,
                  part + " " + suggestion,
                  mainQuery,
              ];
              worker.postMessage(dataToEbayThread);
              msSent++;
          }
      }
  } catch (error) {}

  worker.on("message", (result) => {
    if (result[3] == "done") {
        msRecieved++;
    }
    myEmitter.emit("event", result);
      if (result[1].itemSummaries) {
          Object(result[1].itemSummaries).forEach((element) => {
              comparisonWorker.postMessage([result[2], element.title]);
              msComparisonSent++;
          });
      }
      if (msSent == msRecieved) {
          myEmitter.emit("event", "end of stream");
          setTimeout(() => {
              worker.terminate();
              msSent = 0;
              msRecieved = 0;
          }, 1000);
      }
  });

comparisonWorker.on("message", (result) => {
myEmitter.emit("comparisons", result[0]);
      if (result[1] == "done") {
          msComparisonRecieved++;
      }
      if (msComparisonSent == msComparisonRecieved) {
          myEmitter.emit("comparisons", "end of comparisons");
          setTimeout(() => {
              comparisonWorker.terminate();
              msComparisonRecieved = 0;
              msComparisonSent = 0;
          }, 1000);
      }
  });
}

module.exports = { mainInterchange, suggestion };
