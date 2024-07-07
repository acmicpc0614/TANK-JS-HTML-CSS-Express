const gameBoard = document.getElementById("game-board");
const healthBoard = document.getElementById("health-bar");

/*********GAME Setting*************/
let gameOver = false;
const FLAME = 100;

const REGENERATION = "REGENERATION";
const LEVEL_UPDATE = "LEVEL_UPDATE";
const DEFENSE_TIEM_ADD = "DEFENSE_TIEM_ADD";
const OMNI_SHUT = "OMNI_SHUT";
const STOP_ITEM = "STOP_ITEM";
const OPPOSITE_ITEM = "OPPOSITE_ITEM";
const DEATH_ITEM = "DEATH_ITEM";

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

const NONE = "NONE";
const DONE = "DONE";

let myTeam = "";
let TANK_DIR;
let users = [];
let tmpUsers = [];
let stack = [];
let activeItems = [];
let T1S = 0;
let T2S = 0;
let level;
let health;
let damage;
let statusContent = "";

const d1x = [2, 1, -2, -1];
const d1y = [1, -2, -1, 2];

const d2x = [-2, -2, 2, 2];
const d2y = [-2, 2, -2, 2];

const d3x = [-2, 2, 0, 0];
const d3y = [0, 0, -2, 2];

const d4x = [1, -2, -1, 2];
const d4y = [2, -1, -2, -1];

const ad1x = [-1, 0, 1, 1, 1, 0, -1, -1];
const ad1y = [1, 1, 1, 0, -1, -1, -1, 0];

const ITEM_ROTATE_EFFECT = NONE;

/********* Transfer *************/

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
  tmpUsers = users.map((item) => ({
    userName: item.userName,
    kill: item.kill,
    team: item.team,
  }));
  activeItems = data.activeItems;
  stack = data.stack;
  T1S = data.T1S;
  T2S = data.T2S;
  statusContent = data.statusContent;
  for (item of users) if (item.socketID === socket.id) init(item);
  draw();
});

socket.on("stateOfGameOver", (data) => {
  let msg = data.msg;
  alert(msg);
});

/********* login *************/
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

/********* TANK Setting *************/

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

/********* State Setting *************/

const inputScore = (newUser) => {
  let score = document.getElementById("score");
  score.innerHTML = "";
  let kills = document.createElement("div");
  kills.innerHTML = newUser.kill;
  score.appendChild(kills);
};

const inputState = (level, health, damage) => {
  // level state
  let levelboard = document.getElementById("level-board");
  levelboard.innerHTML = "";
  let levels = document.createElement("div");
  let str = level + 1 + " level";
  levels.innerHTML = str;
  levels.classList.add("tank-state");
  levelboard.appendChild(levels);

  // health state
  let fillNumber = health / 50;
  // let resNumber = health % 50 ? 1 : 0;
  let resNumber = 0;
  let emptyNumber = 5 - fillNumber - resNumber;
  let healthboard = document.getElementById("health-board");
  healthboard.innerHTML = "";
  let healths = document.createElement("div");
  str = "";
  for (let i = 0; i < fillNumber - resNumber; i++) str += "💖";
  // if (resNumber > 0) str += "💔";
  for (let i = 0; i < emptyNumber; i++) str += "🤍";
  healths.innerHTML = str;
  healths.classList.add("tank-state");
  healthboard.appendChild(healths);

  // damage state
  // let damageboard = document.getElementById("damage-board");
  // damageboard.innerHTML = "";
  // let damages = document.createElement("div");
  // str = damage + " damage";
  // damages.innerHTML = str;
  // damages.classList.add("tank-state");
  // damageboard.appendChild(damages);
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

  let StatusElement = document.getElementById("state-content");
  StatusElement.innerHTML = "";
  let stateTxt = document.createElement("div");
  stateTxt.innerHTML = statusContent;
  stateTxt.classList.add("state-content");
  StatusElement.appendChild(stateTxt);

  tmpUsers.sort(function (a, b) {
    return b.kill - a.kill;
  });

  let scr1 = document.getElementById("rank-1");
  scr1.innerHTML = "";
  let scrText1 = document.createElement("div");
  scrText1.innerHTML = `${tmpUsers[0].userName} : ${tmpUsers[0].kill} - ${tmpUsers[0].team}`;
  scrText1.classList.add("rank-1");
  scr1.appendChild(scrText1);

  let scr2 = document.getElementById("rank-2");
  scr2.innerHTML = "";
  let scrText2 = document.createElement("div");
  scrText2.innerHTML = `${tmpUsers[1].userName} : ${tmpUsers[1].kill} - ${tmpUsers[1].team}`;
  scrText2.classList.add("rank-2");

  scr2.appendChild(scrText2);

  let scr3 = document.getElementById("rank-3");
  scr3.innerHTML = "";
  let scrText3 = document.createElement("div");
  scrText3.innerHTML = `${tmpUsers[2].userName} : ${tmpUsers[2].kill} - ${tmpUsers[2].team}`;
  scrText3.classList.add("rank-3");

  scr3.appendChild(scrText3);
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
  drawBlock(gameBoard, BlockBody);

  for (item of activeItems) {
    const activeItemBody = [];
    activeItemBodyMake(activeItemBody, item.x, item.y, item.time);
    drawActiveItems(gameBoard, activeItemBody, item.type);
  }

  for (item of users) {
    const tankBody = [];
    const itemEffectBody = [];
    if (item.alive === ALIVE) {
      staticStateTank(tankBody, item.x, item.y, item.direction);
      if (item.activeTime > 0)
        activeItemEffect(itemEffectBody, item.x, item.y, item.activeTime);
    } else breakStateTank(tankBody, item.x, item.y);

    const who = item.socketID === socket.id ? ME : OTHER;
    drawTank(gameBoard, tankBody, who, item.team, item.userName);
    if (item.alive === ALIVE && item.activeTime > 0)
      drawEffect(gameBoard, itemEffectBody, item.activeType);
  }
};

const activeItemEffect = (itemEffectBody, _x, _y, activeTime) => {
  let tmp = activeTime;
  for (let i = 0; i < 5; i++) {
    if (tmp % 12 < 3) itemEffectBody[i] = { x: _x + d1x[i], y: _y + d1y[i] };
    else if (tmp % 12 < 6)
      itemEffectBody[i] = { x: _x + d2x[i], y: _y + d2y[i] };
    else if (tmp % 12 < 9)
      itemEffectBody[i] = { x: _x + d3x[i], y: _y + d3y[i] };
    else itemEffectBody[i] = { x: _x + d4x[i], y: _y + d4y[i] };
  }
};

const activeItemBodyMake = (activeItemBody, _x, _y, activeTime) => {
  let tmp = Math.floor((activeTime % 32) / 4);
  activeItemBody[0] = { x: _x, y: _y };

  if (ITEM_ROTATE_EFFECT === NONE)
    activeItemBody[1] = { x: _x + ad1x[tmp], y: _y + ad1y[tmp] };
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
      ? bulletElement.classList.add(`team1-${segment.level + 1}`)
      : bulletElement.classList.add(`team2-${segment.level + 1}`);
    gameboard.appendChild(bulletElement);
  }
};

const drawBlock = (gameboard, BlockBody) => {
  for (block of BlockBody) {
    const blockElement = document.createElement("div");
    blockElement.style.gridRowStart = block.y;
    blockElement.style.gridColumnStart = block.x;
    blockElement.classList.add("block-body");
    gameboard.appendChild(blockElement);
  }
};

const drawActiveItems = (gameBoard, activeItemBody, activeType) => {
  // this is Effect maker for Item
  // console.log(activeItemBody, activeType);
  for (item of activeItemBody) {
    const itemElement = document.createElement("div");
    itemElement.style.gridRowStart = item.y;
    itemElement.style.gridColumnStart = item.x;
    if (activeType === REGENERATION) itemElement.classList.add("regeneration");
    if (activeType === LEVEL_UPDATE) itemElement.classList.add("level-update");
    if (activeType === DEFENSE_TIEM_ADD)
      itemElement.classList.add("defense-item");
    if (activeType === OMNI_SHUT) itemElement.classList.add("omni-shut");
    if (activeType === STOP_ITEM) itemElement.classList.add("omni-shut");
    if (activeType === OPPOSITE_ITEM) itemElement.classList.add("level-update");
    if (activeType === DEATH_ITEM) itemElement.classList.add("regeneration");
    gameBoard.appendChild(itemElement);
  }
};

const drawEffect = (gameBoard, itemEffectBody, activeType) => {
  // this is Effect maker for tank
  for (item of itemEffectBody) {
    const itemElement = document.createElement("div");
    itemElement.style.gridRowStart = item.y;
    itemElement.style.gridColumnStart = item.x;
    if (activeType === REGENERATION) itemElement.classList.add("regeneration");
    if (activeType === LEVEL_UPDATE) itemElement.classList.add("level-update");
    if (activeType === DEFENSE_TIEM_ADD)
      itemElement.classList.add("defense-item");
    if (activeType === OMNI_SHUT) itemElement.classList.add("omni-shut");
    gameBoard.appendChild(itemElement);
  }
};
