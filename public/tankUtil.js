const GRID_SIZE = 1000;

const onTank = (position) => {
  for (segment of tankBody) if (equalPositions(position, segment)) return true;
  return false;
};

const onMine = (position) => {
  for (segment of mine) if (equalPositions(position, segment)) return true;
  return false;
};

const equalPositions = (pos1, pos2) => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

const growTank = () => {
  tankBody.push({ ...tankBody[tankBody.length - 1] });
};

const getNewFoodPosition = () => {
  let randomFoodPosition = randomGridPosition();
  while (onTank(randomFoodPosition) && onMine()) {
    randomFoodPosition = randomGridPosition();
  }
  return randomFoodPosition;
};

const randomGridPosition = () => {
  return {
    x: Math.floor(Math.random() * GRID_SIZE) + 1,
    y: Math.floor(Math.random() * GRID_SIZE) + 1,
  };
};

const tankOutOfBounds = () => {
  const segment = tankBody[0];
  return (
    segment.x < 1 ||
    segment.x > GRID_SIZE ||
    segment.y < 1 ||
    segment.y > GRID_SIZE
  );
};

const tankIntersectSelf = () => {
  for (let i = 1; i < tankBody.length; i++) {
    if (equalPositions(tankBody[0], tankBody[i])) return true;
  }
  return false;
};

const tankMeetMine = () => {
  for (let i = 0; i < mine.length; i++) {
    if (equalPositions(tankBody[0], mine[i])) return true;
  }
  return false;
};
