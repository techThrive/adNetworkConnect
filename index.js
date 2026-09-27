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

  // 1. Extract dynamic data from the Observium payload for the 10 template variables
  const ticketId = String(req.body.TICKET_ID || req.body.ALERT_ID || req.body.id || `AD-${Date.now().toString().slice(-6)}`);
  const alertState = String(req.body.ALERT_STATE || "ALERT");
  const alertSeverity = String(req.body.ALERT_SEVERITY || req.body.PRIORITY || "critical");
  const alertMessage = String(req.body.ALERT_MESSAGE || req.body.MESSAGE || "Interface link status down");
  const title = String(req.body.TITLE || req.body.SUBJECT || "Network Incident Alert");
  const timestamp = String(req.body.ALERT_TIMESTAMP || new Date().toISOString().replace("T", " ").substring(0, 19));
  const duration = String(req.body.DURATION || "00:00:00");
  const deviceHostname = String(req.body.DEVICE_HOSTNAME || req.body.CLIENT_NAME || "core-sw-01.adnetwork.ind.in");
  const conditions = String(req.body.CONDITIONS || "Threshold condition violated");
  const metrics = String(req.body.METRICS || "traffic_in=0bps, traffic_out=0bps");

  const bodyValues = [
    ticketId,        // {{1}} Ticket ID
    alertState,      // {{2}} State
    alertSeverity,   // {{3}} Severity
    alertMessage,    // {{4}} Message
    title,           // {{5}} Title
    timestamp,       // {{6}} Time
    duration,        // {{7}} Duration
    deviceHostname,  // {{8}} Device
    conditions,      // {{9}} Conditions
    metrics          // {{10}} Metrics
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
          name: process.env.ALERT_TEMPLATE_NAME || "cnci_1st_campus", // Interakt template name
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