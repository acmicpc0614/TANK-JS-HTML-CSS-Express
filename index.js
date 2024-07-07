const GAME_LIMIT = 100;
const PORT = 8800;
const F_PORT = 3200;


const express = require("express");
const server = express();
const cors = require("cors");

const server_http = require("http").Server(server);

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


client.get("/", (req, res) => {
    res.send("client is running");
});

let users = [];
let stack = [];
let activeItems = [];
let T1S = 0;
let T2S = 0;
let statusContent = "";

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
const BONUS_BULLET_LIFE = [0, 8, 8, 12]; // every 1 sec shut

const BULLET_SPEED = 2;
const CREAT_TIME = FRAME * 3; // 3 sec defense

const BULLET_DAMAGE = 50;
// const BOUNS_DAMAGE = [0, 10, 40, 60]; // 40, 50, 80, 100
const BOUNS_DAMAGE = [0, 0, 0, 0];

/********* Map Setting *************/
const BlockBody = require("./public/maps/map1");
let mapInited = NONE;
let mapData = new Map();

/********* Active Item Setting *************/
const ACTIVE_ITEM_CREATE_TIME = 30; // every this time create item...

const OMNI_SHUT = "OMNI_SHUT"; // omni direction shut *
const OMNI_SHUT_TIME = FRAME * 5;
const OMNI_SHUT_CYCLE = 5;
const OMNI_DIR = [UP, DOWN, LEFT, RIGHT, UL, UR, DL, DR];

const REGENERATION = "REGENERATION";
const REGENERATION_TIME = FRAME * 2;
const REGENERATION_HEALTH = 200;

const LEVEL_UPDATE = "LEVEL_UPDATE";
const LEVEL_UPDATE_TIME = FRAME * 2;

const DEFENSE_TIEM_ADD = "DEFENSE_TIEM_ADD";
const DEFENSE_TIEM_ADD_TIME = FRAME * 10;

const STOP_ITEM = "STOP_ITEM";
const STOP_ITEM_TIME = FRAME * 8;

const OPPOSITE_ITEM = "OPPOSITE_ITEM";
const OPPOSITE_ITEM_TIME = FRAME * 8;

const DEATH_ITEM = "DEATH_ITEM";

const ACTIVE_ITEM_TYPES = [
    OMNI_SHUT,
    REGENERATION,
    LEVEL_UPDATE,
    DEFENSE_TIEM_ADD,
    STOP_ITEM,
    OPPOSITE_ITEM,
    DEATH_ITEM,
];
// const ACTIVE_ITEM_TYPES = [DEATH_ITEM, DEATH_ITEM];
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
    if (item.activeType === OMNI_SHUT && item.activeTime > 0) {
        for (dir of OMNI_DIR) stack.push(createBullet(item.x, item.y, dir, item));
    } else if (item.level <= 1) {
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
        userName: item.userName
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

const getOppositDir = (dir) => {
    if (dir === UP) return DOWN;
    if (dir === DOWN) return UP;
    if (dir === RIGHT) return LEFT;
    if (dir === LEFT) return RIGHT;
};

const setInputDir = (item) => {

    if (item.activeType === STOP_ITEM && item.activeTime > 0) return item; // if stop item, dont move tank
    if (item.y < 3 && item.direction === UP) return item;
    if (item.x < 3 && item.direction === LEFT) return item;
    if (item.x > BOARD_SIZE - 3 && item.direction === RIGHT) return item;
    if (item.y > BOARD_SIZE - 3 && item.direction === DOWN) return item;

    if (item.activeType === OPPOSITE_ITEM && item.activeTime > 0)
    // if Opposite item, chage direct
        item.direction = getOppositDir(item.direction);

    // if tank's next position is not block, tank move
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
                            // statusContent = `😂${bullet.userName} ⚔ ${item.userName}☠`;
                            statusContent = ` ${item.userName} killed by ${bullet.userName}`;
                            users = users.map(
                                (
                                    user // user is who attach the item
                                ) =>
                                user.socketID === bullet.socketID ?
                                {...user, kill: user.kill + 1 } :
                                user
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

    for (tank of users) {
        for (item of activeItems)
            if (isCrach(item, tank) && tank.activeTime < 1) {
                tank.activeType = item.type;
                item.time = 0;
                if (item.type === OMNI_SHUT) {
                    // console.log("omni shut item...");
                    tank.activeTime = OMNI_SHUT_TIME;
                    tank.shotCycle = OMNI_SHUT_CYCLE;
                } else if (item.type === REGENERATION) {
                    // console.log("regeneration item...");
                    tank.activeTime = REGENERATION_TIME;
                    tank.health = REGENERATION_HEALTH;
                } else if (item.type === LEVEL_UPDATE) {
                    // console.log("level update item...");
                    tank.activeTime = LEVEL_UPDATE_TIME;
                    tank.level = Math.min(tank.level + 1, 3);
                    tank.health = TANK_HEALTH + BOUNS_HEALTH[tank.level];
                } else if (item.type === DEFENSE_TIEM_ADD) {
                    // console.log("defense item...");
                    tank.activeTime = DEFENSE_TIEM_ADD_TIME;
                    tank.defenseTime = DEFENSE_TIEM_ADD_TIME;
                } else if (item.type === STOP_ITEM) {
                    tank.activeTime = STOP_ITEM_TIME;
                } else if (item.type === OPPOSITE_ITEM) {
                    tank.activeTime = OPPOSITE_ITEM_TIME;
                } else if (item.type === DEATH_ITEM) {
                    tank.activeTime = DEATH_ITEM;
                    tank.alive = BREAK;
                }
            }
    }
};

const mainLoop = () => {
    if (mapInited === NONE) initMapDate();
    updateUser();
    checkCrash();
    updateStack();
    updateActiveItems();
    checkIsGameOver();
};

const checkIsGameOver = () => {
    // if (Math.floor(Date.now() % 20000) <= TIMEperS)
    //   console.log("Team1 : Team2", T1S, T2S);
    if (GAME_LIMIT <= Math.max(T1S, T2S)) {
        let WinTeam = "";
        T1S === T2S ?
            (WinTeam = "Draw") :
            T1S > T2S ?
            (WinTeam = "Team 1 is WIN.") :
            (WinTeam = "Team 2 is WIN.");
        const data = {
            msg: WinTeam,
        };
        clearInterval(broadcast);
        socketIO.emit("stateOfGameOver", data);
        console.log("Stoped______________");
        users = [];
        stack = [];
        activeItems = [];
        T1S = 0;
        T2S = 0;
    }
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
        item.alive === BREAK ? {...item, alive: DEATH } : item
    );
    // level update
    users = users.map((item) => updateLevelwithKill(item));
    // if tank is defenseTime, decrease defenseTime
    users = users.map((item) =>
        item.defenseTime > 0 ? {...item, defenseTime: item.defenseTime - 1 } : item
    );
    // tank's active item time --
    users = users.map((item) =>
        item.activeTime > 0 ?
        {...item, activeTime: item.activeTime - 1 } :
        {
            ...item,
            shotCycle: SHOT_CYCLE,
        }
    );

    for (item of users) {
        if (item.activeType === STOP_ITEM && item.activeTime > 0) continue; //if stop item, dont shut
        else shut(item);
    }
};

const updateActiveItems = () => {
    let randNumber = Date.now();

    if (randNumber % (FRAME * ACTIVE_ITEM_CREATE_TIME) === 0) {
        createActiveItems();
    }
    activeItems = activeItems.map((item) =>
        item.time > 0 ? {...item, time: item.time - 1 } : item
    );
    activeItems = activeItems.filter((item) => item.time !== 0);
};

const getRandomActiveItem = () => {
    let num = Math.floor(Date.now() * Math.random()) % ACTIVE_ITEM_TYPES.length;
    return ACTIVE_ITEM_TYPES[num];
};

const createActiveItems = () => {
    let sizeofActiveItem = Math.max(Math.floor(users.length / 3 + 1), 1);

    // create active item as (n / 3)
    for (let i = 0; i < sizeofActiveItem; i++) {
        const item = {
            type: getRandomActiveItem(),
            time: FRAME * 10,
            x: createActiveItemsPosition().x,
            y: createActiveItemsPosition().y,
        };
        activeItems.push(item);
    }
};

const createActiveItemsPosition = () => {
    let tmpx, tmpy;
    tmpx = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 70)) + 35;
    tmpy = (Math.floor(Date.now() * Math.random()) % (BOARD_SIZE - 10)) + 5;
    return { x: tmpx, y: tmpy };
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
        shotCycle: item.shotCycle - BONUS_SHOT_CYCLE[_level - 1] + BONUS_SHOT_CYCLE[_level],
        BULLET_LIFE: item.BULLET_LIFE -
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
        activeItems: activeItems,
        T1S: T1S,
        T2S: T2S,
        statusContent: statusContent
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

        activeType: NONE,
        activeTime: 0,
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
        // console.log("Change", Date.now());
        users = users.map((item) =>
            item.socketID === data.socketID ?
            {
                ...item,
                direction: data.direction,
                // x: item.x + xdelte(data.direction),
                // y: item.y + ydelte(data.direction),
            } :
            item
        );

    });

    socket.on("forward", (data) => {
        // console.log("forward ...");
        // console.log("forward",Date.now());
        users = users.map((item) =>
            item.socketID === data.socketID ? setInputDir(item) : item
        );
        // console.log("forward",Date.now());
    });
});

client_http.listen(F_PORT, () => {
    console.log(`Client listening on ${F_PORT}`);
});