const express = require("express");

const server = express();

const cors = require("cors");
const { DefaultSerializer } = require("v8");
const { kill } = require("process");
const { dir } = require("console");
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
const F_PORT = 3333;
client.get("/", (req, res) => {
  res.send("client is running");
});

let users = [];
let stack = [];
let T1S = 0;
let T2S = 0;

/*********TANK Setting*************/

const BOARD_SIZE = 111;
const TIMEperS = 50;
const FRAME = Math.floor(1000 / TIMEperS); // every 50ms render

const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";

const ALIVE = "ALIVE";
const BREAK = "BREAK";
const DEATH = "DEATH";

const TEAM1 = "TEAM1";
const TEAM2 = "TEAM2";

const para = [0, 10, 23, 30];
const TANK_SPEED = 5;
const TANK_LEVEL = 0;
let TANK_HEALTH = 100 + Math.min(para[TANK_LEVEL] * 2, 50);

/*********Shot Setting*************/

const SHOT_CYCLE = 20;
const BULLET_DAMAGE = 40;
const BULLET_LIFE = 40;
const BULLET_SPEED = 5;
const CREAT_TIME = FRAME * 3; // 2 sec defense

/*********default Setting******* ******/

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
    life: BULLET_LIFE,
    socketID: item.socketID,
    // damage: BULLET_DAMAGE,
  };
  stack.push(bullet);
};

const updateStack = () => {
  for (item of stack) {
    bulletMove(item);
  }
  let tmp = [];
  tmp = stack.filter(
    (item) =>
      item.life > 0 &&
      item.x <= BOARD_SIZE &&
      item.y <= BOARD_SIZE &&
      item.x >= 0 &&
      item.y >= 0
  );
  stack = [];
  stack = tmp;
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

  return item;
};

const xdelte = (direction) => {
  let tmp = 0;
  if (direction === LEFT) tmp = -1;
  else if (direction === RIGHT) tmp = 1;
  else tmp = 0;
  return tmp;
};

const ydelte = (direction) => {
  let tmp = 0;
  if (direction === UP) tmp = -1;
  else if (direction === DOWN) tmp = 1;
  else tmp = 0;
  return tmp;
};

const setInputDir = (item) => {
  if (item.x < 3 && item.direction === LEFT) return item;
  if (item.x > BOARD_SIZE - 3 && item.direction === RIGHT) return item;
  if (item.y < 3 && item.direction === UP) return item;
  if (item.y > BOARD_SIZE - 3 && item.direction === DOWN) return item;

  return tankMove(item);
};

const isCrach = (bullet, tank) => {
  if (bullet.socketID === tank.socketID) return false;
  if (Math.abs(bullet.x - tank.x) <= 1 && Math.abs(bullet.y - tank.y) <= 1)
    return true;
  else return false;
};
const isCrashWithBullet = (but1, but2) => {
  if (but1.socketID === but2.socketID) return false;
  if (but1.x === but2.x && but1.y === but2.y) return true;
  return false;
};

const checkCrash = () => {
  for (bullet of stack) {
    for (item of users) {
      const tank = { x: item.x, y: item.y };
      if (isCrach(bullet, item)) {
        bullet.life = 0;
        // increateKill(bullet);
        if (bullet.team !== item.team) {
          users = users.map((item) =>
            item.socketID === bullet.socketID
              ? { ...item, kill: item.kill + 1 }
              : item
          );
          if (item.defensetime === 0) {
            item.alive = BREAK;
            if (bullet.team === TEAM1) T1S += 1;
            else T2S += 1;
          }
        }
      }
    }
    for (bullet2 of stack) {
      if (isCrashWithBullet(bullet, bullet2)) {
        bullet.life = 0;
        bullet.life2 = 0;
      }
    }
  }
};

const mainLoop = () => {
  updateUser();
  updateStack();
  checkCrash();
};

const updateUser = () => {
  users = users.map((item) =>
    item.alive === BREAK ? { ...item, alive: DEATH } : item
  );
  users = users.map((item) =>
    item.defensetime > 0 ? { ...item, defensetime: item.defensetime - 1 } : item
  );
  for (item of users) {
    shut(item);
  }
};

const isExist = (id) => {
  let tmp = true;
  for (item of users) {
    if (item.socketID === id) tmp = false;
  }
  return tmp;
};

let broadcast = setInterval(() => {
  mainLoop();
  users = users.filter((item) => item.alive !== DEATH);
  const data = {
    users: users,
    stack: stack,
    T1S: T1S,
    T2S: T2S,
  };
  socketIO.emit("stateOfUsers", data);
}, FRAME);

// const handleChange = (item, data) => {
//   item = { ...item, direction: data.direction };
//   tankMove(item);
// };

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
      alive: ALIVE,

      direction: getStartDirection(),
      x: getStartPoint(BOARD_SIZE).x,
      y: getStartPoint(BOARD_SIZE).y,

      shotCycle: SHOT_CYCLE,
      shottime: 0,
      defensetime: CREAT_TIME,
      BULLET_LIFE: BULLET_LIFE,
    };
    if (isExist(newUser.socketID)) {
      users.push(newUser);
      console.log(newUser.userName, " is connected in Team ", newUser.team);
      socketIO.emit("newUserResponse", newUser);
    }
  });

  socket.on("test", () => {
    console.log("working now");
  });

  socket.on("changeDirection", (data) => {
    users = users.map((item) =>
      item.socketID === data.socketID
        ? {
            ...item,
            direction: data.direction,
            x: item.x + xdelte(data.direction),
            y: item.y + ydelte(data.direction),
          }
        : item
    );
  });

  socket.on("forward", (data) => {
    users = users.map((item) =>
      item.socketID === data.socketID ? setInputDir(item) : item
    );
  });
});

client_http.listen(F_PORT, () => {
  console.log(`Client listening on ${F_PORT}`);
});
