const express = require("express");
const https = require("https");
const fs = require("fs");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const userRoute = require("./api/routes/user");
const socketServer = require("./sockets/socketServer");

require("dotenv").config();

// settings
const app = express();
const port = process.env.PORT || 443;

// middlewares
app.use(express.json());
app.use("/api", userRoute);

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
const server = https.createServer(options, app);

// Inicia el servidor HTTPS
server.listen(port, () => {
  console.log("Server listening to", port);

  // Inicia el servidor de sockets
  const io = socketIo(server);
  socketServer(io);
});