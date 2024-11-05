const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json()); // Parse JSON bodies

// Endpoint to receive POST requests from Twilio
app.post('/twilio-webhook', async (req, res) => {
    try {
        const twilioData = req.body;

        // Process data or forward it to Zoho CRM
        const zohoResponse = await axios.post('https://www.zohoapis.com/crm/v2/your_endpoint', {
            // Data for Zoho CRM
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken 1000.4cc978123a3f7046dff1cde4c7a95632.14d940cbb3a049371b078ddffd79db78`
            }
        });

        res.status(200).send('Received and processed');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Error processing request');
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
