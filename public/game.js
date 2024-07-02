const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");

/*********GAME Setting*************/
let gameOver = false;
const FLAME = 1000; // every 50ms render
const BOARD_SIZE = 180;
let users = [];
let stack = [];
const ME = "ME";
const OTHER = "OTHER";
const ALIVE = "ALIVE";
const DEATH = "DEATH";
const TEAM1 = "TEAM1";
const TEAM2 = "TEAM2";
let myTeam = "";

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

const handleTeam1 = () => {
  const team1 = document.getElementById("t1");
  team1.classList.remove("noneTeam");
  team1.classList.add("selectedTeam");

  const team2 = document.getElementById("t2");
  team2.classList.remove("selectedTeam");
  team2.classList.add("noneTeam");
  myTeam = TEAM1;
  // console.log("Team 1 selected");
};

const handleTeam2 = () => {
  const team1 = document.getElementById("t1");
  team1.classList.remove("selectedTeam");
  team1.classList.add("noneTeam");

  const team2 = document.getElementById("t2");
  team2.classList.remove("noneTeam");
  team2.classList.add("selectedTeam");
  myTeam = TEAM2;
  // console.log("Team 2 selected");
};

const sendMessage = () => {
  const input = document.getElementById("name");
  const data = {
    userName: input.value,
    socketID: socket.id,
    team: myTeam,
  };
  if (data.userName.trim() && data.team.trim()) {
    socket.emit("newUser", data);
  } else {
    alert("Input data.");
  }
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
  let gameLoop = setInterval(main, FLAME);

  inputScore(newUser);
};

/*********  ACTION  *************/
const main = () => {
  getInputData();
};

const inputScore = (newUser) => {
  let score = document.getElementById("score");
  score.innerHTML = "";
  let kills = document.createElement("h1");
  kills.innerHTML = newUser.kill;
  score.appendChild(kills);
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
    drawTank(gameBoard, tankBody, who, item.team, item.userName);
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

const drawTank = (gmaeBoard, tankBody, who, team, name) => {
  for (segment of tankBody) {
    // const segment = tankBody[i];

    const tankElement = document.createElement("div");
    tankElement.style.gridRowStart = segment.y;
    tankElement.style.gridColumnStart = segment.x;
    who === ME
      ? tankElement.classList.add("tank-me")
      : team === TEAM1
      ? tankElement.classList.add("tank")
      : tankElement.classList.add("tank2");
    gmaeBoard.appendChild(tankElement);
  }
};

const drawBullet = (gameboard, stack) => {
  // console.log(stack);
  for (segment of stack) {
    const bulletElement = document.createElement("div");
    bulletElement.style.gridRowStart = segment.y;
    bulletElement.style.gridColumnStart = segment.x;
    segment.team === TEAM1
      ? bulletElement.classList.add("food")
      : bulletElement.classList.add("food2");
    gameboard.appendChild(bulletElement);
  }
};
