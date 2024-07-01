const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");
/*********GAME Setting*************/
let gameOver = false;
const FLAME = Math.floor(1000 / 50);
const BOARD_SIZE = 180;

/*********TANK Setting*************/
const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";
let TANK_DIR = DOWN;
const para = [3.5, 3, 2.6, 2];
const TANK_SPEED = 5;
const TANK_LEVEL = 3;
let TANK_HEALTH = 100 + Math.floor(100 / para[TANK_LEVEL]);

const tankBody = [
  { x: 110, y: 10 },
  { x: 110, y: 9 },
  { x: 111, y: 11 },
  { x: 111, y: 10 },
  { x: 111, y: 9 },
  { x: 112, y: 10 },
  { x: 112, y: 9 },
];

/*********Shot Setting*************/
let SHOT_CYCLE = Math.floor(FLAME * para[TANK_LEVEL]);
let SHOT_TIME = 0;
const BULLET_DAMAGE = 40;
const BULLET_LIFE = 100 + Math.floor(100 / para[TANK_LEVEL]);
const BULLET_SPEED = 5;

let stack = [];

/*********  ACTION  *************/
const main = () => {
  getInputData();
  shut();
  update();
  draw();
  if (gameOver) {
    alert("Game Over. Your Score is " + tankBody.length);
    clearInterval(gameLoop);
  }
};

let gameLoop = setInterval(main, FLAME);

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
  return tankIntersectSelf();
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
