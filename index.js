const express = require("express");
const server = express();
const cors = require("cors");

const server_http = require("http").Server(server);
const PORT = 8800;
const socketIO = require("socket.io")(server_http, {
  cors: ["*"],
});

server.use(cors());
server.get("/", (req, res) => {
  res.send("server is running");
});
server_http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

/********* C L I E N T *************/
const client = express();
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
const FRAME = Math.floor(1000 / TIMEperS); // every 20ms render

const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";

const UL = "UL";
const UR = "UR";
const DL = "DL";
const DR = "DR";

const ALIVE = "ALIVE";
const BREAK = "BREAK";
const DEATH = "DEATH";

const TEAM1 = "TEAM1";
const TEAM2 = "TEAM2";

const TANK_SPEED = 1;
const TANK_LEVEL = 0;

const TANK_HEALTH = 100;
const BOUNS_HEALTH = [0, 50, 50, 100];

/*********Shut Setting*************/

const SHOT_CYCLE = FRAME; // every 1 sec shut
const BONUS_SHOT_CYCLE = [0, -2, -4, -8]; // every 1 sec shut

const BULLET_LIFE = FRAME * 2; // 2 sec life
const BONUS_BULLET_LIFE = [0, 3, 6, 9]; // every 1 sec shut

const BULLET_SPEED = 2;
const CREAT_TIME = FRAME * 3; // 3 sec defense

const BULLET_DAMAGE = 50;
// const BOUNS_DAMAGE = [0, 10, 20, 50];
const BOUNS_DAMAGE = [0, 0, 0, 0];

/********* default Setting *************/

const getStartPoint = (BOARD_SIZE, team) => {
  let tmpx, tmpy;
  const HALF_BOARD_SIZE = Math.floor(BOARD_SIZE / 2) - 1;

  /************************
   * +----------------+
   * |        |       |
   * | TEAM1  | TEAM2 |
   * |        |       |
   * +----------------+
   ***********************/
  if (team === TEAM1)
    tmpx =
      (Math.floor(Date.now() * Math.random()) % (HALF_BOARD_SIZE - 20)) + 10;
  else
    tmpx =
      (Math.floor(Date.now() * Math.random()) % (HALF_BOARD_SIZE - 20)) +
      10 +
      HALF_BOARD_SIZE;

  tmpy = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 30)) + 10;
  return { x: tmpx, y: tmpy };
};

const getStartDirection = () => {
  let tmp = Math.floor(Date.now() * Math.random()) % 4;
  if (tmp === 0) return UP;
  if (tmp === 1) return DOWN;
  if (tmp === 2) return LEFT;
  if (tmp === 3) return RIGHT;
};

/********* shut Code *************/

const shut = (item) => {
  if (item.shottime === 0) {
    makeBullet(item);
    item.shottime = item.shotCycle;
  } else item.shottime -= 1;
};

const makeBullet = (item) => {
  if (item.level <= 1) {
    // level 0, 1
    stack.push(createBullet(item.x, item.y, item.direction, item));
  } else {
    // level 2, 3
    let tmpx1 = item.x;
    let tmpx2 = item.x;
    let tmpy1 = item.y;
    let tmpy2 = item.y;
    if (xdelte(item.direction)) {
      tmpy1 -= 1;
      tmpy2 += 1;
    } else {
      tmpx1 -= 1;
      tmpx2 += 1;
    }
    stack.push(createBullet(tmpx1, tmpy1, item.direction, item));
    stack.push(createBullet(tmpx2, tmpy2, item.direction, item));

    if (item.level > 2) {
      let dir1;
      let dir2;
      if (item.direction === UP) {
        dir1 = UR;
        dir2 = UL;
      }
      if (item.direction === DOWN) {
        dir1 = DR;
        dir2 = DL;
      }
      if (item.direction === LEFT) {
        dir1 = DL;
        dir2 = UL;
      }
      if (item.direction === RIGHT) {
        dir1 = UR;
        dir2 = DR;
      }
      stack.push(createBullet(tmpx1, tmpy1, dir1, item));
      stack.push(createBullet(tmpx2, tmpy2, dir2, item));
    }
  }
};

const createBullet = (_x, _y, _dir, item) => {
  return {
    x: _x,
    y: _y,
    direction: _dir,
    team: item.team,
    life: item.BULLET_LIFE,
    socketID: item.socketID,
    damage: item.damage,
  };
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
  if (item.direction === UP) item.y -= BULLET_SPEED;
  if (item.direction === DOWN) item.y += BULLET_SPEED;
  if (item.direction === LEFT) item.x -= BULLET_SPEED;
  if (item.direction === RIGHT) item.x += BULLET_SPEED;
  if (item.direction === UL) {
    item.y -= BULLET_SPEED;
    item.x -= BULLET_SPEED;
  }
  if (item.direction === UR) {
    item.y -= BULLET_SPEED;
    item.x += BULLET_SPEED;
  }
  if (item.direction === DL) {
    item.y += BULLET_SPEED;
    item.x -= BULLET_SPEED;
  }
  if (item.direction === DR) {
    item.y += BULLET_SPEED;
    item.x += BULLET_SPEED;
  }

  item.life -= 1;
};

/********* Tank Action *************/

const tankMove = (item) => {
  if (item.direction === UP) item.y -= TANK_SPEED;
  if (item.direction === DOWN) item.y += TANK_SPEED;
  if (item.direction === LEFT) item.x -= TANK_SPEED;
  if (item.direction === RIGHT) item.x += TANK_SPEED;
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
  if (item.y < 3 && item.direction === UP) return item;
  if (item.x < 3 && item.direction === LEFT) return item;
  if (item.x > BOARD_SIZE - 3 && item.direction === RIGHT) return item;
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
      // crash between Tank & bullet
      if (isCrach(bullet, item)) {
        bullet.life = 0; // remove bullet
        if (bullet.team !== item.team) {
          if (item.defensetime === 0) {
            if (item.health - bullet.damage < 1) {
              item.alive = BREAK;
              users = users.map(
                (
                  user // user is who attach the item
                ) =>
                  user.socketID === bullet.socketID
                    ? { ...user, kill: user.kill + 1 }
                    : user
              );
              if (bullet.team === TEAM1) T1S += 1;
              else T2S += 1;
            } else {
              item.health = item.health - bullet.damage;
            }
          }
        }
      }
    }
    for (bullet2 of stack) {
      // crash between bullet & bullet
      if (isCrashWithBullet(bullet, bullet2)) {
        bullet.life = 0;
        bullet.life2 = 0;
      }
    }
  }
};

const mainLoop = () => {
  updateUser();
  checkCrash();
  updateStack();
};

const updateUser = () => {
  // this takes long time~ must reduce TL
  // tank is broken, change it to DEATH
  users = users.map((item) =>
    item.alive === BREAK ? { ...item, alive: DEATH } : item
  );
  // level update
  users = users.map((item) => updateLevelwithKill(item));
  // if tank is defenseTime, decrease defenseTime
  users = users.map((item) =>
    item.defensetime > 0 ? { ...item, defensetime: item.defensetime - 1 } : item
  );
  for (item of users) {
    shut(item);
  }
};

const updateLevelwithKill = (item) => {
  if (item.kill >= 6 && item.level < 3) return updateTankWithBonus(item, 3);
  else if (item.kill >= 4 && item.level < 2)
    return updateTankWithBonus(item, 2);
  else if (item.kill >= 2 && item.level < 1)
    return updateTankWithBonus(item, 1);
  else return item;
};

const updateTankWithBonus = (item, _level) => {
  return {
    ...item,
    level: _level,
    health: item.health - BOUNS_HEALTH[_level - 1] + BOUNS_HEALTH[_level],
    shotCycle:
      item.shotCycle - BONUS_SHOT_CYCLE[_level - 1] + BONUS_SHOT_CYCLE[_level],
    BULLET_LIFE:
      item.BULLET_LIFE -
      BONUS_BULLET_LIFE[_level - 1] +
      BONUS_BULLET_LIFE[_level],
    damage: item.damage - BOUNS_DAMAGE[_level - 1] + BOUNS_DAMAGE[_level],
  };
};

const isExist = (id) => {
  let tmp = true; // if there is no same user, return true
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

const createUser = (data) => {
  return {
    userName: data.userName,
    team: data.team || 1,
    socketID: data.socketID,

    level: TANK_LEVEL,
    kill: 0,
    death: 0,
    health: TANK_HEALTH,
    alive: ALIVE,

    direction: getStartDirection(),
    x: getStartPoint(BOARD_SIZE, data.team).x,
    y: getStartPoint(BOARD_SIZE, data.team).y,

    shotCycle: SHOT_CYCLE,
    shottime: 0,
    defensetime: CREAT_TIME,
    BULLET_LIFE: BULLET_LIFE,
    damage: BULLET_DAMAGE,
  };
};

/*****************SOCKET**********************/
socketIO.on("connect", (socket) => {
  console.log("connected with client");

  socket.on("newUser", (data) => {
    let newUser = createUser(data);
    if (isExist(newUser.socketID)) {
      users.push(newUser);
      console.log(newUser.userName, " is connected in Team ", newUser.team);
      console.log("There are ", users.length, " users...");
      socketIO.emit("newUserResponse", newUser);
    }
  });

  socket.on("test", () => {
    console.log("working now");
  });

  socket.on("changeDirection", (data) => {
    // console.log("change ...");
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
    // console.log("forward ...");
    users = users.map((item) =>
      item.socketID === data.socketID ? setInputDir(item) : item
    );
  });
});

client_http.listen(F_PORT, () => {
  console.log(`Client listening on ${F_PORT}`);
});
