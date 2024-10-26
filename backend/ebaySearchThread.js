const { parentPort } = require("worker_threads");
const EbayAuthToken = require("ebay-oauth-nodejs-client");

async function ebay_token() {
    let token = null;
    const ebayAuthToken = new EbayAuthToken({
        clientId: "AsharAfa-Timeless-PRD-3900bce50-fc0d3a26",
        clientSecret: "PRD-900bce5033e7-adcc-4c7d-8a14-a433",
        redirectUri: "Ashar_Afaq-AsharAfa-Timele-inbgqtjw",
    });

    await ebayAuthToken.getApplicationToken("PRODUCTION").then((token1) => {
        const accessToken = JSON.parse(token1).access_token;
        token = accessToken;
    });
    return token;
}
async function ebay_search(build, part) {
    let token = await ebay_token();
    try {
        let prompt = build + " " + part;
        let url = "https://api.ebay.com/buy/browse/v1/item_summary/search?q=" + prompt + "&limit=10";
        let response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                "X-EBAY-C-ENDUSERCTX": "affiliateCampaignId=<ePNCampaignId>,affiliateReferenceId=<referenceId>",
            },
        });
        return response.json();
    } catch (error) {}
}

parentPort.on("message", async (data) => {
    let entry = data[0] + " " + data[1];
    let mainQuery = data[2];
    await ebay_search(data[0], data[1]).then((data) => {
        totals = data["total"];
        if (totals == 0) {
            parentPort.postMessage([entry, "no-data", mainQuery, "done"]);
        } else if (totals > 0) {
            parentPort.postMessage([entry, data, mainQuery, "done"]);
        }
    });
});
