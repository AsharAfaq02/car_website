const EbayAuthToken = require('ebay-oauth-nodejs-client');
const scopes = 'https://api.ebay.com/oauth/api_scope';
const ebayAuthToken = new EbayAuthToken({
    clientId: 'AsharAfa-Timeless-PRD-3900bce50-fc0d3a26',
    clientSecret: 'PRD-900bce5033e7-adcc-4c7d-8a14-a433',
    redirectUri: 'Ashar_Afaq-AsharAfa-Timele-inbgqtjw'
});
    ebayAuthToken.getApplicationToken('PRODUCTION').then(token=>{
        const accessToken = JSON.parse(token).access_token;
        const timeout = JSON.parse(token).expires_in;
        console.log(accessToken);
        console.log(timeout);
    })