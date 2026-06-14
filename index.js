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

  // 1. Extract dynamic data from the Observium payload.
  // We use fallback strings just in case the JSON is missing a field.
  const alertTitle = req.body.TITLE || "Network Alert";
  const alertState = req.body.ALERT_STATE || "Unknown State";
  
  // Combine them into the single string your template expects
  const dynamicMessage = `${alertTitle} is currently ${alertState}`;

  try {
    // 2. Make the API call to Interakt
    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      {
        countryCode: "+91",
        phoneNumber: "8310077987", // Your target engineer's number
        type: "Template",
        template: {
          name: "icc_championship_6", // Make sure this template in Interakt supports dynamic variables!
          languageCode: "en",
          bodyValues: [
            dynamicMessage // <--- This replaces "Santanuda test msg" with real Observium data
          ]
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