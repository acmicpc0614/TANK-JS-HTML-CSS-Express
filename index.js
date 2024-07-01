const express = require("express");

const server = express();

const cors = require("cors");
const server_http = require("http").Server(server);
const PORT = 8800;
const socketIO = require("socket.io")(server_http, {
  cors: "*",
});

server.use(cors());
server.get("/", (req, res) => {
  res.send("server is running");
});
server_http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const client = express();
// client.use("/public/index.html", express.static("public"));
client.use(express.static("public"));
const client_http = require("http").Server(client);
const F_PORT = 2223;
client.get("/", (req, res) => {
  res.send("client is running");
});

let users = [];
let stack = [];
const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";

socketIO.on("connect", (socket) => {
  console.log("connected with client");

  socket.on("newUser", (data) => {
    const newUser = {
      userName: data.userName,
      team: data.team || 1,
      direction: DOWN,
      socketID: data.socketID,
      level: 1,
      kill: 0,
      death: 0,
    };
    users.push(newUser);
    console.log(newUser.userName, " is connected in Team ", newUser.team);
    socketIO.emit("newUserResponse", users);
  });

  socket.on("test", () => {
    console.log("working now");
  });
});

client_http.listen(F_PORT, () => {
  console.log(`Client listening on ${F_PORT}`);
});
