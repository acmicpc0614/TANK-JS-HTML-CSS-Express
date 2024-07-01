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

/*********TANK Setting*************/
const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";
let TANK_DIR = DOWN;
const para = [0, 10, 23, 30];
const TANK_SPEED = 5;
const TANK_LEVEL = 0;
let TANK_HEALTH = 100 + Math.min(para[TANK_LEVEL] * 2, 50);

/*********Shot Setting*************/
let SHOT_CYCLE = Math.floor(300 - TANK_LEVEL * 2);
const BULLET_DAMAGE = 40;
const BULLET_LIFE = 100 + Math.floor(100 / para[TANK_LEVEL]);
const BULLET_SPEED = 5;
BOARD_SIZE = 180;

const getStartPoint = (BOARD_SIZE) => {
  let tmpx = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 30)) + 10;
  let tmpy = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 30)) + 10;
  return { x: tmpx, y: tmpy };
};

socketIO.on("connect", (socket) => {
  console.log("connected with client");

  socket.on("newUser", (data) => {
    const newUser = {
      userName: data.userName,
      team: data.team || 1,
      direction: DOWN,
      socketID: data.socketID,
      level: TANK_LEVEL,
      kill: 0,
      death: 0,
      x: getStartPoint(BOARD_SIZE).x,
      y: getStartPoint(BOARD_SIZE).y,
      health: TANK_HEALTH,
      shotCycle: SHOT_CYCLE,
      shottime: 0,
      BULLET_LIFE: BULLET_LIFE,
    };
    users.push(newUser);
    console.log(newUser.userName, " is connected in Team ", newUser.team);
    socketIO.emit("newUserResponse", newUser);
    socketIO.emit("stateOfUsers", users);
  });

  socket.on("test", () => {
    console.log("working now");
  });
});

client_http.listen(F_PORT, () => {
  console.log(`Client listening on ${F_PORT}`);
});
