const express = require("express");
const https = require("https");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoute = require("./routes/user");

// settings
const app = express();
const port = process.env.PORT || 443; // Cambia el puerto a 443 para HTTPS

// middlewares
app.use(express.json());
app.use("/api", userRoute);

// routes
app.get("/", (req, res) => {
  res.send("Welcome to my API");
});

// mongodb connection
mongoose
  .connect("mongodb+srv://brian24ce:tSoNj89mpoFK0THv@cluster0.nutanip.mongodb.net/checkers?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.error(error));

// Configura opciones para el servidor HTTPS
const options = {
  key: fs.readFileSync("server.key"), 
  cert: fs.readFileSync("server.cert")
};

// Crea el servidor HTTPS
https.createServer(options, app).listen(port, () => {
  console.log("Server listening to", port);
});
