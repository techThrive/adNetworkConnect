const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("AdNetwork Connect Running");
});

app.post("/alert", (req, res) => {
  console.log("Alert Received");
  console.log(req.body);
  res.status(200).send("OK");
});

app.get("/send-test", async (req, res) => {
  try {

    const response = await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      {
        countryCode: "+91",
        phoneNumber: "8147110152",
        type: "Template",
        template: {
          name: "icc_championship_2",
          languageCode: "en"
        }
      },
      {
        headers: {
          Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (err) {

    console.error(err.response?.data || err.message);

    res.status(500).json(
      err.response?.data || { error: err.message }
    );
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});