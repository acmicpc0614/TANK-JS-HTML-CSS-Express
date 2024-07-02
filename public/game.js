const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");

/*********GAME Setting*************/
let gameOver = false;
const FLAME = Math.floor(1000 / 20); // every 50ms render
const BOARD_SIZE = 180;
let users = [];
let stack = [];
const ME = "ME";
const OTHER = "OTHER";
const ALIVE = "ALIVE";
const DEATH = "DEATH";

/*********Transfer*************/

socket.on("connect", () => {
  console.log("connected with server.");
});

socket.on("newUserResponse", (newUser) => {
  if (newUser.socketID === socket.id) {
    init(newUser);
  }
});

socket.on("stateOfUsers", (data) => {
  users = data.users;
  stack = data.stack;

  for (item of users) if (item.socketID === socket.id) init(item);
  draw();
});

const sendMessage = () => {
  const input = document.getElementById("name");
  const data = {
    userName: input.value,
    socketID: socket.id,
  };
  socket.emit("newUser", data);
};

/*********TANK Setting*************/
const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";
let TANK_DIR;
let level;
let SHOT_CYCLE;
let SHOT_TIME;
let BULLET_LIFE;
let BULLET_DAMAGE;

const init = (newUser) => {
  // console.log("initializing");

  TANK_DIR = newUser.direction;
  level = newUser.TANK_LEVEL;
  SHOT_CYCLE = newUser.SHOT_CYCLE;
  BULLET_LIFE = newUser.BULLET_LIFE;
  BULLET_DAMAGE = newUser.BULLET_DAMAGE;
  SHOT_TIME = newUser.SHOT_TIME;
  let gameLoop = setInterval(main, FLAME + 1000);
};

/*********  ACTION  *************/
const main = () => {
  getInputData();
};

const getInputData = () => {
  window.addEventListener("keydown", handleSet, false);
};

const draw = () => {
  gameBoard.innerHTML = "";
  drawBullet(gameBoard, stack);
  // console.log(users.length);
  for (item of users) {
    const tankBody = [];
    rotate(tankBody, item.x, item.y, item.direction);
    const who = item.socketID === socket.id ? ME : OTHER;
    drawTank(gameBoard, tankBody, who);
  }

  // let healthTxt = "Health " + TANK_HEALTH;

  // healthBoard.innerHTML = healthTxt;
};

const isGameOver = () => {
  //   return tankOutOfBounds() || tankIntersectSelf() || tankMeetMine();
  // return tankIntersectSelf();
};

const rotate = (tankBody, _x, _y, _dir) => {
  if (_dir === UP) {
    tankBody[0] = { x: _x - 1, y: _y };
    tankBody[1] = { x: _x - 1, y: _y + 1 };
    tankBody[2] = { x: _x, y: _y + 1 };
    tankBody[3] = { x: _x, y: _y };
    tankBody[4] = { x: _x, y: _y - 1 };
    tankBody[5] = { x: _x + 1, y: _y };
    tankBody[6] = { x: _x + 1, y: _y + 1 };
  } else if (_dir === DOWN) {
    tankBody[0] = { x: _x - 1, y: _y };
    tankBody[1] = { x: _x - 1, y: _y - 1 };
    tankBody[2] = { x: _x, y: _y + 1 };
    tankBody[3] = { x: _x, y: _y };
    tankBody[4] = { x: _x, y: _y - 1 };
    tankBody[5] = { x: _x + 1, y: _y };
    tankBody[6] = { x: _x + 1, y: _y - 1 };
  } else if (_dir === LEFT) {
    tankBody[0] = { x: _x - 1, y: _y };
    tankBody[1] = { x: _x + 1, y: _y - 1 };
    tankBody[2] = { x: _x, y: _y + 1 };
    tankBody[3] = { x: _x, y: _y };
    tankBody[4] = { x: _x, y: _y - 1 };
    tankBody[5] = { x: _x + 1, y: _y };
    tankBody[6] = { x: _x + 1, y: _y + 1 };
  } else if (_dir === RIGHT) {
    tankBody[0] = { x: _x - 1, y: _y };
    tankBody[1] = { x: _x - 1, y: _y + 1 };
    tankBody[2] = { x: _x, y: _y + 1 };
    tankBody[3] = { x: _x, y: _y };
    tankBody[4] = { x: _x, y: _y - 1 };
    tankBody[5] = { x: _x + 1, y: _y };
    tankBody[6] = { x: _x - 1, y: _y - 1 };
  }
};

const handleSet = (event) => {
  if (event.key === "ArrowUp") setDirection(UP);
  else if (event.key === "ArrowDown") setDirection(DOWN);
  else if (event.key === "ArrowRight") setDirection(RIGHT);
  else if (event.key === "ArrowLeft") setDirection(LEFT);
};
const setDirection = (direction) => {
  const data = {
    socketID: socket.id,
    direction: direction,
  };
  if (TANK_DIR === direction) {
    socket.emit("forward", data);
  } else socket.emit("changeDirection", data);
};

const drawTank = (gmaeBoard, tankBody, who) => {
  for (segment of tankBody) {
    // const segment = tankBody[i];

    const tankElement = document.createElement("div");
    tankElement.style.gridRowStart = segment.y;
    tankElement.style.gridColumnStart = segment.x;
    who === ME
      ? tankElement.classList.add("tank-me")
      : tankElement.classList.add("tank");
    gmaeBoard.appendChild(tankElement);
  }
};

const drawBullet = (gameboard, stack) => {
  for (segment of stack) {
    const bulletElement = document.createElement("div");
    bulletElement.style.gridRowStart = segment.y;
    bulletElement.style.gridColumnStart = segment.x;
    bulletElement.classList.add("food");
    gameboard.appendChild(bulletElement);
  }
};
