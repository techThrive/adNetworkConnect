const express = require("express");
const axios = require("axios");

const app = express();

// Middleware to parse incoming JSON from Observium
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AdNetwork Connect Running");
});

// The single, merged Observium Receiving Door
app.post("/alert", async (req, res) => {
  console.log("Alert Received from Observium");
  console.log(req.body);

  // 1. Extract dynamic data from the Observium payload for the 6 template variables
  const ticketId = String(req.body.TICKET_ID || req.body.ALERT_ID || req.body.id || `AD-${Date.now().toString().slice(-6)}`);
  const clientName = String(req.body.CLIENT_NAME || req.body.DEVICE_HOSTNAME || "Help Desk");
  const category = String(req.body.CATEGORY || req.body.ENTITY_TYPE || "Network Support");
  const priority = String(req.body.PRIORITY || req.body.ALERT_STATE || "High");
  const subject = String(req.body.SUBJECT || req.body.TITLE || "Internet Issue");
  const portalLink = String(req.body.PORTAL_LINK || req.body.ALERT_URL || "helpdesk.adnetwork.ind.in").replace(/^https?:\/\//, "");

  const bodyValues = [
    ticketId,    // {{1}} Ticket ID
    clientName,  // {{2}} Client Name
    category,    // {{3}} Category
    priority,    // {{4}} Priority
    subject,     // {{5}} Subject
    portalLink   // {{6}} Portal Link
  ];

  try {
    // 2. Make the API call to Interakt
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      {
        countryCode: "+91",
        phoneNumber: process.env.ALERT_PHONE_NUMBER || "9830038713", // Your target engineer's number
        type: "Template",
        template: {
          name: process.env.ALERT_TEMPLATE_NAME || "new_ticket_alert", // Interakt template name
          languageCode: "en",
          bodyValues: bodyValues
        }
      },
      {
        headers: {
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SUCCESS: Message sent to WhatsApp", response.data);
    
    // 3. Tell Observium we successfully received and processed the webhook
    res.status(200).send("Alert processed and WhatsApp message sent");

  } catch (err) {
    console.error("ERROR sending to Interakt", err.response?.data || err.message);
    
    // Tell Observium something went wrong with our third-party connection
    res.status(500).json(
      err.response?.data || { error: err.message }
    );
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});