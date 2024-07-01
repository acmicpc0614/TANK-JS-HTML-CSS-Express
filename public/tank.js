// const TANK_SPEED = 5;
// const tankBody = [
//   { x: 110, y: 10 },
//   { x: 110, y: 9 },
//   { x: 111, y: 11 },
//   { x: 111, y: 10 },
//   { x: 111, y: 9 },
//   { x: 112, y: 10 },
//   { x: 112, y: 9 },
// ];
// // const TANK_DIR = DOWN;

// const UP = "UP";
// const DOWN = "DOWN";
// const LEFT = "LEFT";
// const RIGHT = "RIGHT";
// const STOP = "STOP";

// let inputDir = { x: 0, y: 0, dir: STOP };

// const setInputDir = (_x, _y, _dir) => {
//   inputDir = { x: _x, y: _y, dir: _dir };
// };

// const handleSet = (event) => {
//   console.log("handleSet");
//   if (event.key === "ArrowUp") setInputDir(0, -1, UP);
//   else if (event.key === "ArrowDown") setInputDir(0, 1, DOWN);
//   else if (event.key === "ArrowRight") setInputDir(1, 0, RIGHT);
//   else if (event.key === "ArrowLeft") setInputDir(-1, 0, LEFT);
// };

// const getInputDir = () => {
//   window.addEventListener("keydown", handleSet, false);
//   window.removeEventListener("keydown", handleSet, false);

//   return inputDir;
// };

// const updateTank = () => {
//   const tankDir = getInputDir();
//   for (let i = 0; i < tankBody.length; i++) {
//     tankBody[i].x += tankDir.x;
//     tankBody[i].y += tankDir.y;
//   }
// };

// const drawTank = (gmaeBoard) => {
//   for (segment of tankBody) {
//     // const segment = tankBody[i];
//     const tankElement = document.createElement("div");
//     tankElement.style.gridRowStart = segment.y;
//     tankElement.style.gridColumnStart = segment.x;
//     tankElement.classList.add("tank");
//     gmaeBoard.appendChild(tankElement);
//   }
// };
