const express = require("express");

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});