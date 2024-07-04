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
const F_PORT = 5454;

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
const BOUNS_HEALTH = [0, 50, 100, 150];

const NONE = "NONE";
const DONE = "DONE";

/********* Shut Setting *************/

const SHOT_CYCLE = FRAME; // every 1 sec shut
const BONUS_SHOT_CYCLE = [0, -2, -4, -8]; // every 1 sec shut

const BULLET_LIFE = Math.floor(FRAME * 1.5); // 2 sec life
const BONUS_BULLET_LIFE = [0, 3, 6, 9]; // every 1 sec shut

const BULLET_SPEED = 2;
const CREAT_TIME = FRAME * 3; // 3 sec defense

const BULLET_DAMAGE = 50;
// const BOUNS_DAMAGE = [0, 10, 40, 60]; // 40, 50, 80, 100
const BOUNS_DAMAGE = [0, 0, 0, 0];

/********* Map Setting *************/
let mapInited = NONE;
let mapData = new Map();

/********* default Setting *************/

const getStartPoint = (BOARD_SIZE, team) => {
  let tmpx, tmpy;

  /************************
   * +----------------+
   * |        |       |
   * | TEAM1  | TEAM2 |
   * |        |       |
   * +----------------+
   ***********************/
  if (team === TEAM1) tmpx = (Math.floor(Date.now() * Math.random()) % 20) + 3;
  else tmpx = BOARD_SIZE - (Math.floor(Date.now() * Math.random()) % 20) - 3;
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
    // level 0, 1   ------
    stack.push(createBullet(item.x, item.y, item.direction, item));
  } else {
    // level 2, 3    ===
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
      // level 3   <
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
    level: item.level,
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

const mapValue = (point) => {
  return mapData.get(point);
};

const availableMove = (tank) => {
  let tmpItem = { x: tank.x, y: tank.y };
  let tmpPoint = [
    (tmpItem.x - 1) * 1000 + (tmpItem.y - 1),
    (tmpItem.x - 1) * 1000 + (tmpItem.y + 1),
    (tmpItem.x + 1) * 1000 + (tmpItem.y - 1),
    (tmpItem.x + 1) * 1000 + (tmpItem.y + 1),
  ];
  if (tank.direction === UP)
    tmpPoint.push((tmpItem.x + 1) * 1000 + (tmpItem.y - 2)),
      tmpPoint.push((tmpItem.x - 1) * 1000 + (tmpItem.y - 2));
  if (tank.direction === DOWN)
    tmpPoint.push((tmpItem.x + 1) * 1000 + (tmpItem.y + 2)),
      tmpPoint.push((tmpItem.x - 1) * 1000 + (tmpItem.y + 2));
  if (tank.direction === LEFT)
    tmpPoint.push((tmpItem.x - 2) * 1000 + (tmpItem.y - 1)),
      tmpPoint.push((tmpItem.x - 2) * 1000 + (tmpItem.y + 1));
  if (tank.direction === RIGHT)
    tmpPoint.push((tmpItem.x + 2) * 1000 + (tmpItem.y - 1)),
      tmpPoint.push((tmpItem.x + 2) * 1000 + (tmpItem.y + 1));
  // console.log(tmpPoint);
  if (
    mapValue(tmpPoint[0]) === undefined &&
    mapValue(tmpPoint[1]) === undefined &&
    mapValue(tmpPoint[2]) === undefined &&
    mapValue(tmpPoint[3]) === undefined &&
    mapValue(tmpPoint[4]) === undefined &&
    mapValue(tmpPoint[5]) === undefined
  )
    return true;
  return false;
};

const setInputDir = (item) => {
  let tmpItem = item;
  if (item.y < 3 && item.direction === UP) return item;
  if (item.x < 3 && item.direction === LEFT) return item;
  if (item.x > BOARD_SIZE - 3 && item.direction === RIGHT) return item;
  if (item.y > BOARD_SIZE - 3 && item.direction === DOWN) return item;

  if (availableMove(item)) return tankMove(item);
  else return item;
};

const isCrach = (bullet, tank) => {
  if (bullet.socketID === tank.socketID) return false;
  if (Math.abs(bullet.x - tank.x) <= 1 && Math.abs(bullet.y - tank.y) <= 1)
    return true;
  else return false;
};

const isCrashWithBlock = (bullet, block) => {
  if (bullet.x === block.x && bullet.y === block.y) return true;
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
          if (item.defenseTime === 0) {
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
    for (block of BlockBody)
      if (isCrashWithBlock(bullet, block)) {
        bullet.life = 0;
      }
  }
};

const mainLoop = () => {
  if (mapInited === NONE) initMapDate();
  updateUser();
  checkCrash();
  updateStack();
};

const initMapDate = () => {
  mapInited = DONE;
  for (block of BlockBody) {
    mapData.set(block.x * 1000 + block.y, 1);
  }
  console.log("map data inited...");
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
    item.defenseTime > 0 ? { ...item, defenseTime: item.defenseTime - 1 } : item
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

const isUserExist = (id) => {
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
    defenseTime: CREAT_TIME,
    BULLET_LIFE: BULLET_LIFE,
    damage: BULLET_DAMAGE,
  };
};

/***************** SOCKET **********************/
socketIO.on("connect", (socket) => {
  console.log("connected with client");

  socket.on("newUser", (data) => {
    let newUser = createUser(data);
    if (isUserExist(newUser.socketID)) {
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
            // x: item.x + xdelte(data.direction),
            // y: item.y + ydelte(data.direction),
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

// Map 1

const BlockBody = [
  { x: 30, y: 30 },
  { x: 30, y: 31 },
  { x: 30, y: 32 },
  { x: 30, y: 33 },
  { x: 30, y: 34 },
  { x: 30, y: 35 },
  { x: 30, y: 36 },
  { x: 30, y: 37 },
  { x: 30, y: 38 },
  { x: 30, y: 39 },
  { x: 30, y: 40 },
  { x: 30, y: 41 },
  { x: 30, y: 42 },
  { x: 30, y: 43 },
  { x: 30, y: 44 },
  { x: 30, y: 45 },
  { x: 30, y: 46 },
  { x: 30, y: 47 },
  { x: 31, y: 30 },
  { x: 32, y: 30 },
  { x: 33, y: 30 },
  { x: 34, y: 30 },
  { x: 35, y: 30 },
  { x: 36, y: 30 },
  { x: 37, y: 30 },
  { x: 38, y: 30 },
  { x: 39, y: 30 },
  { x: 40, y: 30 },
  { x: 41, y: 30 },
  { x: 42, y: 30 },
  { x: 43, y: 30 },
  { x: 44, y: 30 },
  { x: 45, y: 30 },
  { x: 46, y: 30 },
  { x: 47, y: 30 },
  { x: 31, y: 31 },
  { x: 31, y: 32 },
  { x: 31, y: 33 },
  { x: 31, y: 34 },
  { x: 31, y: 35 },
  { x: 31, y: 36 },
  { x: 31, y: 37 },
  { x: 31, y: 38 },
  { x: 31, y: 39 },
  { x: 31, y: 40 },
  { x: 31, y: 41 },
  { x: 31, y: 42 },
  { x: 31, y: 43 },
  { x: 31, y: 44 },
  { x: 31, y: 45 },
  { x: 31, y: 46 },
  { x: 31, y: 47 },
  { x: 32, y: 31 },
  { x: 33, y: 31 },
  { x: 34, y: 31 },
  { x: 35, y: 31 },
  { x: 36, y: 31 },
  { x: 37, y: 31 },
  { x: 38, y: 31 },
  { x: 39, y: 31 },
  { x: 40, y: 31 },
  { x: 41, y: 31 },
  { x: 42, y: 31 },
  { x: 43, y: 31 },
  { x: 44, y: 31 },
  { x: 45, y: 31 },
  { x: 46, y: 31 },
  { x: 47, y: 31 },
  { x: 80, y: 30 },
  { x: 79, y: 30 },
  { x: 78, y: 30 },
  { x: 77, y: 30 },
  { x: 76, y: 30 },
  { x: 75, y: 30 },
  { x: 74, y: 30 },
  { x: 73, y: 30 },
  { x: 72, y: 30 },
  { x: 71, y: 30 },
  { x: 70, y: 30 },
  { x: 69, y: 30 },
  { x: 68, y: 30 },
  { x: 67, y: 30 },
  { x: 66, y: 30 },
  { x: 65, y: 30 },
  { x: 64, y: 30 },
  { x: 81, y: 30 },
  { x: 81, y: 31 },
  { x: 81, y: 32 },
  { x: 81, y: 33 },
  { x: 81, y: 34 },
  { x: 81, y: 35 },
  { x: 81, y: 36 },
  { x: 81, y: 37 },
  { x: 81, y: 38 },
  { x: 81, y: 39 },
  { x: 81, y: 40 },
  { x: 81, y: 41 },
  { x: 81, y: 42 },
  { x: 81, y: 43 },
  { x: 81, y: 44 },
  { x: 81, y: 45 },
  { x: 81, y: 46 },
  { x: 81, y: 47 },
  { x: 79, y: 31 },
  { x: 78, y: 31 },
  { x: 77, y: 31 },
  { x: 76, y: 31 },
  { x: 75, y: 31 },
  { x: 74, y: 31 },
  { x: 73, y: 31 },
  { x: 72, y: 31 },
  { x: 71, y: 31 },
  { x: 70, y: 31 },
  { x: 69, y: 31 },
  { x: 68, y: 31 },
  { x: 67, y: 31 },
  { x: 66, y: 31 },
  { x: 65, y: 31 },
  { x: 64, y: 31 },
  { x: 80, y: 31 },
  { x: 80, y: 32 },
  { x: 80, y: 33 },
  { x: 80, y: 34 },
  { x: 80, y: 35 },
  { x: 80, y: 36 },
  { x: 80, y: 37 },
  { x: 80, y: 38 },
  { x: 80, y: 39 },
  { x: 80, y: 40 },
  { x: 80, y: 41 },
  { x: 80, y: 42 },
  { x: 80, y: 43 },
  { x: 80, y: 44 },
  { x: 80, y: 45 },
  { x: 80, y: 46 },
  { x: 80, y: 47 },
  { x: 30, y: 81 },
  { x: 30, y: 80 },
  { x: 30, y: 79 },
  { x: 30, y: 78 },
  { x: 30, y: 77 },
  { x: 30, y: 76 },
  { x: 30, y: 75 },
  { x: 30, y: 74 },
  { x: 30, y: 73 },
  { x: 30, y: 72 },
  { x: 30, y: 71 },
  { x: 30, y: 70 },
  { x: 30, y: 69 },
  { x: 30, y: 68 },
  { x: 30, y: 67 },
  { x: 30, y: 66 },
  { x: 30, y: 65 },
  { x: 30, y: 64 },
  { x: 31, y: 81 },
  { x: 32, y: 81 },
  { x: 33, y: 81 },
  { x: 34, y: 81 },
  { x: 35, y: 81 },
  { x: 36, y: 81 },
  { x: 37, y: 81 },
  { x: 38, y: 81 },
  { x: 39, y: 81 },
  { x: 40, y: 81 },
  { x: 41, y: 81 },
  { x: 42, y: 81 },
  { x: 43, y: 81 },
  { x: 44, y: 81 },
  { x: 45, y: 81 },
  { x: 46, y: 81 },
  { x: 47, y: 81 },
  { x: 31, y: 80 },
  { x: 31, y: 79 },
  { x: 31, y: 78 },
  { x: 31, y: 77 },
  { x: 31, y: 76 },
  { x: 31, y: 75 },
  { x: 31, y: 74 },
  { x: 31, y: 73 },
  { x: 31, y: 72 },
  { x: 31, y: 71 },
  { x: 31, y: 70 },
  { x: 31, y: 69 },
  { x: 31, y: 68 },
  { x: 31, y: 67 },
  { x: 31, y: 66 },
  { x: 31, y: 65 },
  { x: 31, y: 64 },
  { x: 32, y: 80 },
  { x: 33, y: 80 },
  { x: 34, y: 80 },
  { x: 35, y: 80 },
  { x: 36, y: 80 },
  { x: 37, y: 80 },
  { x: 38, y: 80 },
  { x: 39, y: 80 },
  { x: 40, y: 80 },
  { x: 41, y: 80 },
  { x: 42, y: 80 },
  { x: 43, y: 80 },
  { x: 44, y: 80 },
  { x: 45, y: 80 },
  { x: 46, y: 80 },
  { x: 47, y: 80 },
  { x: 80, y: 81 },
  { x: 79, y: 81 },
  { x: 78, y: 81 },
  { x: 77, y: 81 },
  { x: 76, y: 81 },
  { x: 75, y: 81 },
  { x: 74, y: 81 },
  { x: 73, y: 81 },
  { x: 72, y: 81 },
  { x: 71, y: 81 },
  { x: 70, y: 81 },
  { x: 69, y: 81 },
  { x: 68, y: 81 },
  { x: 67, y: 81 },
  { x: 66, y: 81 },
  { x: 65, y: 81 },
  { x: 64, y: 81 },
  { x: 81, y: 81 },
  { x: 81, y: 80 },
  { x: 81, y: 79 },
  { x: 81, y: 78 },
  { x: 81, y: 77 },
  { x: 81, y: 76 },
  { x: 81, y: 75 },
  { x: 81, y: 74 },
  { x: 81, y: 73 },
  { x: 81, y: 72 },
  { x: 81, y: 71 },
  { x: 81, y: 70 },
  { x: 81, y: 69 },
  { x: 81, y: 68 },
  { x: 81, y: 67 },
  { x: 81, y: 66 },
  { x: 81, y: 65 },
  { x: 81, y: 64 },
  { x: 79, y: 80 },
  { x: 78, y: 80 },
  { x: 77, y: 80 },
  { x: 76, y: 80 },
  { x: 75, y: 80 },
  { x: 74, y: 80 },
  { x: 73, y: 80 },
  { x: 72, y: 80 },
  { x: 71, y: 80 },
  { x: 70, y: 80 },
  { x: 69, y: 80 },
  { x: 68, y: 80 },
  { x: 67, y: 80 },
  { x: 66, y: 80 },
  { x: 65, y: 80 },
  { x: 64, y: 80 },
  { x: 80, y: 80 },
  { x: 80, y: 79 },
  { x: 80, y: 78 },
  { x: 80, y: 77 },
  { x: 80, y: 76 },
  { x: 80, y: 75 },
  { x: 80, y: 74 },
  { x: 80, y: 73 },
  { x: 80, y: 72 },
  { x: 80, y: 71 },
  { x: 80, y: 70 },
  { x: 80, y: 69 },
  { x: 80, y: 68 },
  { x: 80, y: 67 },
  { x: 80, y: 66 },
  { x: 80, y: 65 },
  { x: 80, y: 64 },
  { x: 37, y: 1 },
  { x: 37, y: 2 },
  { x: 37, y: 3 },
  { x: 37, y: 4 },
  { x: 37, y: 5 },
  { x: 37, y: 6 },
  { x: 37, y: 7 },
  { x: 37, y: 8 },
  { x: 37, y: 9 },
  { x: 37, y: 10 },
  { x: 37, y: 11 },
  { x: 37, y: 12 },
  { x: 37, y: 13 },
  { x: 37, y: 14 },
  { x: 37, y: 15 },
  { x: 37, y: 16 },
  { x: 37, y: 17 },
  { x: 74, y: 1 },
  { x: 74, y: 2 },
  { x: 74, y: 3 },
  { x: 74, y: 4 },
  { x: 74, y: 5 },
  { x: 74, y: 6 },
  { x: 74, y: 7 },
  { x: 74, y: 8 },
  { x: 74, y: 9 },
  { x: 74, y: 10 },
  { x: 74, y: 11 },
  { x: 74, y: 12 },
  { x: 74, y: 13 },
  { x: 74, y: 14 },
  { x: 74, y: 15 },
  { x: 74, y: 16 },
  { x: 74, y: 17 },
  { x: 36, y: 1 },
  { x: 36, y: 2 },
  { x: 36, y: 3 },
  { x: 36, y: 4 },
  { x: 36, y: 5 },
  { x: 36, y: 6 },
  { x: 36, y: 7 },
  { x: 36, y: 8 },
  { x: 36, y: 9 },
  { x: 36, y: 10 },
  { x: 36, y: 11 },
  { x: 36, y: 12 },
  { x: 36, y: 13 },
  { x: 36, y: 14 },
  { x: 36, y: 15 },
  { x: 36, y: 16 },
  { x: 36, y: 17 },
  { x: 75, y: 1 },
  { x: 75, y: 2 },
  { x: 75, y: 3 },
  { x: 75, y: 4 },
  { x: 75, y: 5 },
  { x: 75, y: 6 },
  { x: 75, y: 7 },
  { x: 75, y: 8 },
  { x: 75, y: 9 },
  { x: 75, y: 10 },
  { x: 75, y: 11 },
  { x: 75, y: 12 },
  { x: 75, y: 13 },
  { x: 75, y: 14 },
  { x: 75, y: 15 },
  { x: 75, y: 16 },
  { x: 75, y: 17 },
  { x: 37, y: 111 },
  { x: 37, y: 110 },
  { x: 37, y: 109 },
  { x: 37, y: 108 },
  { x: 37, y: 107 },
  { x: 37, y: 106 },
  { x: 37, y: 105 },
  { x: 37, y: 104 },
  { x: 37, y: 103 },
  { x: 37, y: 102 },
  { x: 37, y: 101 },
  { x: 37, y: 100 },
  { x: 37, y: 99 },
  { x: 37, y: 98 },
  { x: 37, y: 97 },
  { x: 37, y: 96 },
  { x: 37, y: 95 },
  { x: 37, y: 94 },
  { x: 74, y: 111 },
  { x: 74, y: 110 },
  { x: 74, y: 109 },
  { x: 74, y: 108 },
  { x: 74, y: 107 },
  { x: 74, y: 106 },
  { x: 74, y: 105 },
  { x: 74, y: 104 },
  { x: 74, y: 103 },
  { x: 74, y: 102 },
  { x: 74, y: 101 },
  { x: 74, y: 100 },
  { x: 74, y: 99 },
  { x: 74, y: 98 },
  { x: 74, y: 97 },
  { x: 74, y: 96 },
  { x: 74, y: 95 },
  { x: 74, y: 94 },
  { x: 36, y: 111 },
  { x: 36, y: 110 },
  { x: 36, y: 109 },
  { x: 36, y: 108 },
  { x: 36, y: 107 },
  { x: 36, y: 106 },
  { x: 36, y: 105 },
  { x: 36, y: 104 },
  { x: 36, y: 103 },
  { x: 36, y: 102 },
  { x: 36, y: 101 },
  { x: 36, y: 100 },
  { x: 36, y: 99 },
  { x: 36, y: 98 },
  { x: 36, y: 97 },
  { x: 36, y: 96 },
  { x: 36, y: 95 },
  { x: 36, y: 94 },
  { x: 75, y: 111 },
  { x: 75, y: 110 },
  { x: 75, y: 109 },
  { x: 75, y: 108 },
  { x: 75, y: 107 },
  { x: 75, y: 106 },
  { x: 75, y: 105 },
  { x: 75, y: 104 },
  { x: 75, y: 103 },
  { x: 75, y: 102 },
  { x: 75, y: 101 },
  { x: 75, y: 100 },
  { x: 75, y: 99 },
  { x: 75, y: 98 },
  { x: 75, y: 97 },
  { x: 75, y: 96 },
  { x: 75, y: 95 },
  { x: 75, y: 94 },
];
