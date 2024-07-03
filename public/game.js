const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");

/*********GAME Setting*************/
let gameOver = false;
const FLAME = 1000;

const ME = "ME";
const OTHER = "OTHER";

const ALIVE = "ALIVE";
const BREAK = "BREAK";
const DEATH = "DEATH";

const TEAM1 = "TEAM1";
const TEAM2 = "TEAM2";

const UP = "UP";
const DOWN = "DOWN";
const LEFT = "LEFT";
const RIGHT = "RIGHT";

let myTeam = "";
let TANK_DIR;
let users = [];
let stack = [];
let T1S = 0;
let T2S = 0;
let level;
let health;
let damage;

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
  // console.log(users);
  stack = data.stack;
  T1S = data.T1S;
  T2S = data.T2S;
  for (item of users) if (item.socketID === socket.id) init(item);
  draw();
});

/*********login*************/
const handleTeam1 = () => {
  const team1 = document.getElementById("t1");
  team1.classList.remove("noneTeam");
  team1.classList.add("selectedTeam");

  const team2 = document.getElementById("t2");
  team2.classList.remove("selectedTeam");
  team2.classList.add("noneTeam");
  myTeam = TEAM1;
};

const handleTeam2 = () => {
  const team1 = document.getElementById("t1");
  team1.classList.remove("selectedTeam");
  team1.classList.add("noneTeam");

  const team2 = document.getElementById("t2");
  team2.classList.remove("noneTeam");
  team2.classList.add("selectedTeam");
  myTeam = TEAM2;
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
    if (!data.team.trim()) alert("select your team.");
    else alert("Input user name.");
  }
};

/*********TANK Setting*************/

const init = (newUser) => {
  TANK_DIR = newUser.direction;
  level = newUser.level;
  health = newUser.health;
  damage = newUser.damage;

  let gameLoop = setInterval(main, FLAME);

  inputScore(newUser);
  inputState(level, health, damage);
  inputTeamScore();
};

/*********  ACTION  *************/
const main = () => {
  getInputData();
};

const inputScore = (newUser) => {
  let score = document.getElementById("score");
  score.innerHTML = "";
  let kills = document.createElement("div");
  kills.innerHTML = newUser.kill;
  score.appendChild(kills);
};

const inputState = (level, health, damage) => {
  let levelboard = document.getElementById("level-board");
  levelboard.innerHTML = "";
  let levels = document.createElement("div");
  let str = level + 1 + " level";
  levels.innerHTML = str;
  levels.classList.add("tank-state");
  levelboard.appendChild(levels);

  let healthboard = document.getElementById("health-board");
  healthboard.innerHTML = "";
  let healths = document.createElement("div");
  str = health + " health";
  healths.innerHTML = str;
  healths.classList.add("tank-state");
  healthboard.appendChild(healths);

  let damageboard = document.getElementById("damage-board");
  damageboard.innerHTML = "";
  let damages = document.createElement("div");
  str = damage + " damage";
  damages.innerHTML = str;
  damages.classList.add("tank-state");
  damageboard.appendChild(damages);
};

const inputTeamScore = () => {
  let t1Txt = document.getElementById("t1-txt"); // score of Team 1
  t1Txt.innerHTML = "";
  let kills1 = document.createElement("div");
  kills1.innerHTML = T1S;
  t1Txt.appendChild(kills1);

  let t2Txt = document.getElementById("t2-txt"); // score of Team 2
  t2Txt.innerHTML = "";
  let kills2 = document.createElement("div");
  kills2.innerHTML = T2S;
  t2Txt.appendChild(kills2);

  let vs = document.getElementById("vs"); // vs text :
  vs.innerHTML = "";
  let txt = document.createElement("div");
  txt.innerHTML = ":";
  vs.appendChild(txt);
};

const getInputData = () => {
  window.addEventListener("keydown", handleSet, false);
};

const draw = () => {
  gameBoard.innerHTML = "";
  drawBullet(gameBoard, stack);

  for (item of users) {
    const tankBody = [];
    item.alive === ALIVE
      ? staticStateTank(tankBody, item.x, item.y, item.direction)
      : breakStateTank(tankBody, item.x, item.y);

    const who = item.socketID === socket.id ? ME : OTHER;
    drawTank(gameBoard, tankBody, who, item.team, item.userName);
  }
};

const isGameOver = () => {
  //   return tankOutOfBounds() || tankIntersectSelf() || tankMeetMine();
  // return tankIntersectSelf();
};

const staticStateTank = (tankBody, _x, _y, _dir) => {
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

const breakStateTank = (tankBody, _x, _y) => {
  tankBody[0] = { x: _x - 1, y: _y - 1 };
  tankBody[1] = { x: _x - 1, y: _y + 1 };
  tankBody[2] = { x: _x, y: _y };
  tankBody[3] = { x: _x + 1, y: _y - 1 };
  tankBody[4] = { x: _x + 1, y: _y + 1 };
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

const drawTank = (gmaeBoard, tankBody, who, team) => {
  for (segment of tankBody) {
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
