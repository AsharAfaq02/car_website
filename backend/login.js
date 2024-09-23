const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const PORT = 3000;

// eBay API credentials
const EBAY_CLIENT_ID = 'AsharAfa-Timeless-PRD-3900bce50-fc0d3a26';
const EBAY_CLIENT_SECRET = 'PRD-900bce5033e7-adcc-4c7d-8a14-a433';
const REDIRECT_URI = 'Ashar_Afaq-AsharAfa-Timele-inbgqtjw'; // Your redirect URI

// Step 1: Redirect to eBay for authorization
app.get('/login', (req, res) => {
    const redirectUri = `https://auth.ebay.com/oauth2/authorize?` +
    `client_id=${EBAY_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&`+
    `scope=https://api.ebay.com/oauth/api_scope`
    res.redirect(redirectUri);
});

// Step 2: Handle the callback from eBay
app.get('/', async (req, res) => {
    const authCode = req.query.code;
    console.log(authCode);
    try{
        console.log('areyoutrying')
        const accessToken = await getAccessToken(authCode);
        console.log(accessToken)

        
    }
    catch(error) {}

    // if (!authCode) {
    //     return res.status(400).send('Authorization code is required');
    // }

    // try {
    //     const accessToken = await getAccessToken(authCode);
    //     res.json({ accessToken }); // You can save or use the access token as needed
    // } catch (error) {
    //     console.error('Error getting access token:', error.response ? error.response.data : error.message);
    //     res.status(500).send('Error getting access token');
    // }
});

// Function to get access token using authorization code
async function getAccessToken(authCode) {
    console.log('areyoucalled')
    console.log(`Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`);
    const response = app.post('https://api.ebay.com/identity/v1/oauth2/token', 
        querystring.stringify({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: REDIRECT_URI,
        }), 
        
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`,
            },
        }
    );

    console.log(response)
    return response;
    // return response.data.access_token;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
