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
const F_PORT = 5555;
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
let SHOT_CYCLE = Math.floor(50 - TANK_LEVEL * 2);
const BULLET_DAMAGE = 40;
const BULLET_LIFE = 100 + Math.floor(100 / para[TANK_LEVEL]);
const BULLET_SPEED = 5;
BOARD_SIZE = 400;

const getStartPoint = (BOARD_SIZE) => {
  let tmpx = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 30)) + 10;
  let tmpy = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 30)) + 10;
  return { x: tmpx, y: tmpy };
};
const getStartDirection = () => {
  let tmp = Math.floor(Date.now() * Math.random()) % 4;
  if (tmp === 0) return UP;
  if (tmp === 1) return DOWN;
  if (tmp === 2) return LEFT;
  if (tmp === 3) return RIGHT;
};

const shut = (item) => {
  if (item.shottime === 0) {
    makeBullet(item);
    item.shottime = item.shotCycle;
  } else item.shottime -= 1;
};

const makeBullet = (item) => {
  const bullet = {
    x: item.x,
    y: item.y,
    direction: item.direction,
    team: item.team,
    // life: BULLET_LIFE,
    // damage: BULLET_DAMAGE,
  };
  stack.push(bullet);
};

const updateStack = () => {
  for (item of stack) {
    bulletMove(item);
  }
  stack = stack.filter(
    (item) =>
      // item.life > 0 &&
      item.x <= BOARD_SIZE && item.y <= BOARD_SIZE && item.x >= 0 && item.y >= 0
  );
};
const bulletMove = (item) => {
  if (item.direction === UP) item.y -= 2;
  if (item.direction === DOWN) item.y += 2;
  if (item.direction === LEFT) item.x -= 2;
  if (item.direction === RIGHT) item.x += 2;
  item.life -= 1;
};

const tankMove = (item) => {
  if (item.direction === UP) item.y -= 1;
  if (item.direction === DOWN) item.y += 1;
  if (item.direction === LEFT) item.x -= 1;
  if (item.direction === RIGHT) item.x += 1;
};

const setInputDir = (item) => {
  if (item.x < 3 && item.direction === LEFT) return;
  if (item.x > BOARD_SIZE - 3 && item.direction === RIGHT) return;
  if (item.y < 3 && item.direction === UP) return;
  if (item.y > BOARD_SIZE - 3 && item.direction === DOWN) return;

  tankMove(item);
};

const mainLoop = () => {
  updateUser();
  updateStack();
};

const updateUser = () => {
  for (item of users) {
    setInputDir(item);
    shut(item);
  }
};

/*****************SOCKET**********************/
socketIO.on("connect", (socket) => {
  console.log("connected with client");

  socket.on("newUser", (data) => {
    let newUser = {
      userName: data.userName,
      team: data.team || 1,

      socketID: data.socketID,
      level: TANK_LEVEL,
      kill: 0,
      death: 0,
      health: TANK_HEALTH,

      direction: getStartDirection(),
      x: getStartPoint(BOARD_SIZE).x,
      y: getStartPoint(BOARD_SIZE).y,

      shotCycle: SHOT_CYCLE,
      shottime: 0,
      BULLET_LIFE: BULLET_LIFE,
    };
    users.push(newUser);
    console.log(newUser.userName, " is connected in Team ", newUser.team);
    socketIO.emit("newUserResponse", newUser);
  });

  let boradCast = setInterval(() => {
    mainLoop();
    const data = { users: users, stack: stack };
    socketIO.emit("stateOfUsers", data);
  }, 50);

  socket.on("test", () => {
    console.log("working now");
  });

  socket.on("changeDirection", (data) => {
    users = users.map((item) =>
      item.socketID === data.socketID
        ? { ...item, direction: data.direction }
        : item
    );
  });
});

client_http.listen(F_PORT, () => {
  console.log(`Client listening on ${F_PORT}`);
});
