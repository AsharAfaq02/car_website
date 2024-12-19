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
Then, in the compatible_with section, list cars from various brands\
that have the same equipment manucafturer, and return the "+part+" from a car that the "+year+" "+vehicle+" also uses.\
compare the Size and dimensions, Material and construction, Performance specifications (e.g., power, torque, speed), Connection points (bolt pattern, electrical connectors, etc.), Weight.\
The first entry in this list should be the same as the interchange_base details.\
For each of the other 9 cars that use the same "+part+" equivelant to the "+year+" "+vehicle+", provide:\
'car_year': The year of the compatible car (must be an integer).\
'car_brand': The brand of the compatible car.\
'car_model': The model of the compatible car.\
Constraints:\
No Repeats: Ensure that there are no duplicate cars in the compatible_with list.\
Car Year: The car_year of each compatible car should not be greater than the current year.\
Accuracy: There should never be any cars that do not use a matching part as the one provided. If so, do not input it.\
Response Format: Provide only the JSON object, where I can parse this valid JSON, and no other quotations, spaces, dots or extra symbols or descriptors. Write perfect JSON object only, and no `` or quotations added."

    const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
    { "role": "system", "content": "you find different cars from various brands that are built by the same equipment manufacturer and use a functional equivelant "+part+" as the one in the "+year+" "+vehicle+". Make sure that you do not return parts that are not functional equivelants. Then you return a VALID JSON with information about those cars ONLY." },
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
  
async function mainInterchange(year, make, model, part) {
  let msSent = 0;
  let msRecieved = 0;
  let msComparisonSent = 0;
  let msComparisonRecieved = 0;
  const worker = new Worker("./ebaySearchThread.js");
  const comparisonWorker = new Worker("./TitleComparisonThread.js");

  try {
      let data = await partGPT(year, make, model, part);

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
                  part
              ];
              worker.postMessage(dataToEbayThread);
              msSent++;
          }
      }
  } catch (error) {}

  worker.on("message", (result) => {
    if (result[2] == "done") {
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

module.exports = { mainInterchange };
