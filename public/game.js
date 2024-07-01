const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");

/*********Transfer*************/

socket.on("connect", () => {
  console.log("connected with server.");
});

socket.on("newUserResponse", (newUser) => {
  if (newUser.socketID === socket.id) {
    init(newUser);
  }
});

const sendMessage = () => {
  const input = document.getElementById("name");
  const data = {
    userName: input.value,
    socketID: socket.id,
  };
  socket.emit("newUser", data);
};

/*********GAME Setting*************/
let gameOver = false;
const FLAME = Math.floor(1000 / 20); // every 50ms render
const BOARD_SIZE = 180;
let users = [];
let stack = [];

/*********TANK Setting*************/
const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";
let TANK_DIR;
let tankBody = [];
let level;
let SHOT_CYCLE;
let SHOT_TIME;
let BULLET_LIFE;
let BULLET_DAMAGE;

const init = (newUser) => {
  console.log("initializing");
  const middlePoint = { x: newUser.x, y: newUser.y };
  console.log(middlePoint);
  tankBody = [
    { x: middlePoint.x - 1, y: newUser.y },
    { x: middlePoint.x - 1, y: newUser.y - 1 },
    { x: middlePoint.x, y: newUser.y + 1 },
    { x: middlePoint.x, y: newUser.y },
    { x: middlePoint.x, y: newUser.y - 1 },
    { x: middlePoint.x + 1, y: newUser.y },
    { x: middlePoint.x + 1, y: newUser.y - 1 },
  ];
  TANK_DIR = newUser.direction;
  level = newUser.TANK_LEVEL;
  SHOT_CYCLE = newUser.SHOT_CYCLE;
  BULLET_LIFE = newUser.BULLET_LIFE;
  BULLET_DAMAGE = newUser.BULLET_DAMAGE;
  SHOT_TIME = newUser.SHOT_TIME;
  console.log(tankBody);
  let gameLoop = setInterval(main, FLAME);
};

/*********  ACTION  *************/
const main = () => {
  getInputData();
  shut();
  update();
  draw();
  // if (gameOver) {
  //   alert("Game Over. Your Score is " + tankBody.length);
  //   clearInterval(gameLoop);
  // }
};

const shut = () => {
  if (SHOT_TIME === 0) {
    makeBullet();
    SHOT_TIME = SHOT_CYCLE;
  } else SHOT_TIME -= 1;
};

const makeBullet = () => {
  const bullet = {
    x: tankBody[3].x,
    y: tankBody[3].y,
    dir: TANK_DIR,
    life: BULLET_LIFE,
    damage: BULLET_DAMAGE,
  };
  stack.push(bullet);
};

const getInputData = () => {
  window.addEventListener("keydown", handleSet, false);
};

const update = () => {
  updateStack();
  gameOver = isGameOver();
};

const draw = () => {
  gameBoard.innerHTML = "";
  drawBullet(gameBoard);
  drawTank(gameBoard);

  // let healthTxt = "Health " + TANK_HEALTH;

  // healthBoard.innerHTML = healthTxt;
};

const updateStack = () => {
  for (item of stack) {
    bulletMove(item);
  }
  stack = stack.filter(
    (item) =>
      item.life > 0 &&
      item.x <= BOARD_SIZE &&
      item.y <= BOARD_SIZE &&
      item.x >= 0 &&
      item.y >= 0
  );
};
const bulletMove = (item) => {
  if (item.dir === UP) item.y -= 1;
  if (item.dir === DOWN) item.y += 1;
  if (item.dir === LEFT) item.x -= 1;
  if (item.dir === RIGHT) item.x += 1;
  item.life -= 1;
};

const isGameOver = () => {
  //   return tankOutOfBounds() || tankIntersectSelf() || tankMeetMine();
  // return tankIntersectSelf();
};

const rotate = (_x, _y, _dir) => {
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
  if (event.key === "ArrowUp") setInputDir(0, -1, UP);
  else if (event.key === "ArrowDown") setInputDir(0, 1, DOWN);
  else if (event.key === "ArrowRight") setInputDir(1, 0, RIGHT);
  else if (event.key === "ArrowLeft") setInputDir(-1, 0, LEFT);
};

const setInputDir = (_x, _y, _dir) => {
  if (TANK_DIR !== _dir) {
    rotate(tankBody[3].x, tankBody[3].y, _dir);
  }
  const middlePoint = tankBody[3];
  if (middlePoint.x < 3 && _dir === LEFT) return;
  if (middlePoint.x > BOARD_SIZE - 3 && _dir === RIGHT) return;
  if (middlePoint.y < 3 && _dir === UP) return;
  if (middlePoint.y > BOARD_SIZE - 3 && _dir === DOWN) return;

  for (let i = 0; i < tankBody.length; i++) {
    tankBody[i].x += _x;
    tankBody[i].y += _y;
  }

  TANK_DIR = _dir;
};

const drawTank = (gmaeBoard) => {
  for (segment of tankBody) {
    // const segment = tankBody[i];
    const tankElement = document.createElement("div");
    tankElement.style.gridRowStart = segment.y;
    tankElement.style.gridColumnStart = segment.x;
    tankElement.classList.add("tank");
    gmaeBoard.appendChild(tankElement);
  }
};

const drawBullet = (gameboard) => {
  for (segment of stack) {
    const bulletElement = document.createElement("div");
    bulletElement.style.gridRowStart = segment.y;
    bulletElement.style.gridColumnStart = segment.x;
    bulletElement.classList.add("food");
    gameboard.appendChild(bulletElement);
  }
};
