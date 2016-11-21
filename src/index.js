/**
 * fx-maze
 *
 * TODO: see https://github.com/lmorchard/fx-maze/issues
 */
import Dat from 'dat-gui';
import Stats from 'stats.js';

import { requestAnimFrame } from './lib/utils';
import Input from './lib/input';

// Utilities Section

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// a simple minded stack structure used to store breadcrumbs
function Stack() {
  this.stack = [];
  this.pop = function(){
    return this.stack.pop();
  };
  this.push = function(a_thing){
    return this.stack.push(a_thing);
  };
  this.top = function() {
    if (this.stack.length > 0) {
      return this.stack[this.stack.length - 1];
    }
    return [0, 0];
  };
  this.noCloser = function(x, y, topDistance, otherDistance) {
    if (this.stack.length == 0) return true;
    if (distanceFrom(x, y, this.stack[this.stack.length - 1][0], this.stack[this.stack.length - 1][1]) < topDistance)
      return false;

    for (let i = 0; i < this.stack.length - 1; i++)
      if (distanceFrom(x, y, this.stack[i][0], this.stack[i][1]) < otherDistance)
         return false;
    return true;
  }
}

const DEBUG = false;
const TICK = 1000 / 60;
const PI2 = Math.PI * 2;

// TODO: Load this from an external JSON URL for Issue #13
const greenMap = {
  name: 'green',

  baseMapTilePath: 'mazes/Firefox',
  tileWidth: 500, tileHeight: 500,
  width: 4000, height: 4000,
  numberOfTileRows: Math.ceil(4000 / 500),
  numberOfTileColumns: Math.ceil(4000 / 500),
  tiles: {},

  pathSrc: 'mazes/Firefox.green.png',
  solutionColor: "#0f0",
  pathData: [],

  startX: 499, startY: 430,
  startHeadingX: 509, startHeadingY: 420,
  startArrowButt: [530,397],
  startArrowPoint: [509, 420],
  startArrowLeftWing: [522, 419],
  startArrowRightWing: [509, 407],
  startMessageBase: [509, 420],

  endX: 3258, endY: 430,
  endHeadingX: 3256, endHeadingY: 417,
  endArrowButt: [3256, 417],
  endArrowPoint: [3256, 385],
  endArrowLeftWing: [3247,396],
  endArrowRightWing: [3265, 397],
  endMessageBase: [3256, 417],
};

const greenMapBackwards = {
  name: 'green-backwards',

  baseMapTilePath: greenMap.baseMapTilePath,
  tileWidth: greenMap.tileWidth, tileHeight: greenMap.tileHeight,
  width: greenMap.width, height: greenMap.height,
  numberOfTileRows: greenMap.numberOfTileRows,
  numberOfTileColumns: greenMap.numberOfTileColumns,
  tiles: greenMap.tiles,

  pathSrc: 'mazes/Firefox.green.png',
  solutionColor: "#0f0",
  pathData: [],

  startX: 3258, startY: 430,
  startHeadingX: 3258, startHeadingY: 417,
  startArrowButt: [3259, 385],
  startArrowPoint: [3258, 417],
  startArrowLeftWing: [3249, 407],
  startArrowRightWing: [3266, 408],
  startMessageBase: [3258, 417],

  endX: 499, endY: 430,
  endHeadingX: 509, endHeadingY: 420,
  endArrowButt: [509, 420],
  endArrowPoint: [530, 397],
  endArrowLeftWing: [515,399],
  endArrowRightWing: [529, 413],
  endMessageBase: [509, 420],
};

const redMap = {
  name: 'red',

  baseMapTilePath: greenMap.baseMapTilePath,
  tileWidth: greenMap.tileWidth, tileHeight: greenMap.tileHeight,
  width: greenMap.width, height: greenMap.height,
  numberOfTileRows: greenMap.numberOfTileRows,
  numberOfTileColumns: greenMap.numberOfTileColumns,
  tiles: greenMap.tiles,

  pathSrc: 'mazes/Firefox.red.png',
  solutionColor: "#f00",
  pathData: greenMap.pathData,

  startX: 486, startY: 424,
  startHeadingX: 490, startHeadingY: 410,
  startArrowButt: [498, 380],
  startArrowPoint: [490, 410],
  startArrowLeftWing: [501, 403],
  startArrowRightWing: [485, 398],
  startMessageBase: [490, 410],

  endX: 3228, endY: 428,
  endHeadingX: 3214, endHeadingY: 416,
  endArrowButt: [3214, 416],
  endArrowPoint: [3190, 393],
  endArrowLeftWing: [3192,408],
  endArrowRightWing: [3204, 395],
  endMessageBase: [3214, 416],
};

const redMapBackwards = {
  name: 'red-backwards',

  baseMapTilePath: greenMap.baseMapTilePath,
  tileWidth: greenMap.tileWidth, tileHeight: greenMap.tileHeight,
  width: greenMap.width, height: greenMap.height,
  numberOfTileRows: greenMap.numberOfTileRows,
  numberOfTileColumns: greenMap.numberOfTileColumns,
  tiles: greenMap.tiles,

  pathSrc: 'mazes/Firefox.red.png',
  solutionColor: "#f00",
  pathData: greenMap.pathData,

  startX: 3228, startY: 428,
  startHeadingX: 3214, startHeadingY: 416,
  startArrowButt: [3190, 393],
  startArrowPoint: [3214, 416],
  startArrowLeftWing: [3212,401],
  startArrowRightWing: [3200, 415],
  startMessageBase: [3214, 416],

  endX: 486, endY: 424,
  endHeadingX: 490, endHeadingY: 410,
  endArrowButt: [490, 410],
  endArrowPoint: [498, 380],
  endArrowLeftWing: [487, 388],
  endArrowRightWing: [505, 392],
  endMessageBase: [490, 410],

};

const violetMap = {
  name: 'violet',

  baseMapTilePath: greenMap.baseMapTilePath,
  tileWidth: greenMap.tileWidth, tileHeight: greenMap.tileHeight,
  width: greenMap.width, height: greenMap.height,
  numberOfTileRows: greenMap.numberOfTileRows,
  numberOfTileColumns: greenMap.numberOfTileColumns,
  tiles: greenMap.tiles,

  pathSrc: 'mazes/Firefox.violet.png',
  solutionColor: "#e0f",
  pathData: greenMap.pathData,

  startX: 2802, startY: 212,
  startHeadingX: 2816, startHeadingY: 212,
  startArrowButt: [2843, 192],
  startArrowPoint: [2816, 206],
  startArrowLeftWing: [2830, 209],
  startArrowRightWing: [2822, 194],
  startMessageBase: [2822, 194], // shift up & right to avoid end arrow

  endX: 2776, endY: 200,
  endHeadingX: 2757, endHeadingY: 206,
  endArrowButt: [2770, 187],
  endArrowPoint: [2757, 159],
  endArrowLeftWing: [2751,171],
  endArrowRightWing: [2769, 163],
  endMessageBase: [2770, 187],
};

const blueMap = {
  name: 'blue',

  baseMapTilePath: greenMap.baseMapTilePath,
  tileWidth: greenMap.tileWidth, tileHeight: greenMap.tileHeight,
  width: greenMap.width, height: greenMap.height,
  numberOfTileRows: greenMap.numberOfTileRows,
  numberOfTileColumns: greenMap.numberOfTileColumns,
  tiles: greenMap.tiles,

  pathSrc: 'mazes/Firefox.blue.png',
  solutionColor: "#2ee",
  pathData: greenMap.pathData,

  startX: 2776, startY: 200,
  startHeadingX: 2770, startHeadingY: 187,
  startArrowPoint: [2770, 187],
  startArrowButt: [2757, 159],
  startArrowLeftWing: [2773, 174],
  startArrowRightWing: [2757, 181],
  startMessageBase: [2776, 187],

  endX: 2881, endY: 3822,
  endHeadingX: 2881, endHeadingY: 3833,
  endArrowButt: [2881, 3833],
  endArrowPoint: [2880, 3854],
  endArrowLeftWing: [2873,3846],
  endArrowRightWing: [2887, 3847],
  endMessageBase: [2881, 3933], // shift way down to print under arrow
};

// repeats in the possibleGames variable are to make some solutions rarer than others
const possibleGames = [greenMap, greenMap, greenMap, greenMap, redMap, redMap, redMap, redMapBackwards, greenMapBackwards, blueMap, blueMap, violetMap ];
var map = possibleGames[getRandomInt(0, possibleGames.length)];
const animationStartPoints = [[5000, 4000], [-1000, -1000], [0, 5000], [5000, -500]];
const animationStartPoint = animationStartPoints[getRandomInt(0, animationStartPoints.length)];

// the game has states:
//    gamePlay -- in this state the user has control of the cursor
//    openAnimation -- used at the beginning where the movement of the cursor is scripted
//    endAnimation -- used ath the end of the game when a maze is solved

// gamePlay -- this is the bodies of the event loops for user game control and screen display
const gamePlay = {
  init: init,

  // this method is the repeated command control loop.  It gets the commands from the user
  //  acts on  them, and then updates the state of the player
  update(dt) {
    if (DEBUG) { statsUpdate.begin(); }

    getCurrentCommands(dt, player, camera);
    actOnCurrentCommands(dt, player, camera);
    updatePlayerZoom(dt);
    updatePlayerMotion(dt);
    updateDebug();
    if (DEBUG) { statsUpdate.end(); }
  },

  // this method is repeated for each frame displayed.  It draws all the screen
  // components, manages the camera perspective.
  draw(dt) {
    if (DEBUG) { statsDraw.begin(); }
    clearCanvas();
    ctx.save();
    drawMaze(dt);
    followAndZoom(dt);
    drawArrows(dt);
    drawUsedPaths(dt);
    drawBreadCrumbs(dt);
    drawPlayer(dt);
    ctx.restore();
    drawDebug(dt);
    if (DEBUG) { statsDraw.end(); }
  }
}

// openAnimation -- this is the code used in the event loops when the opening
// animation is running.
const openAnimation = {
  animationState: 0,
  animationTimer: false,

  init: init,
  update(dt) {
    if (DEBUG) { statsUpdate.begin(); }
    camera = animationCamera;
    // we get commands, but don't act on them
    // this allows any input to interrupt the opening animation
    getCurrentCommands(dt, player, camera);
    updatePlayerFromScript(dt);
    updatePlayerZoom(dt);
    updatePlayerMotionFromScript(dt);
    updateDebug();
    if (
      DEBUG) { statsUpdate.end(); }
  },
  draw(dt) {
    if (DEBUG) { statsDraw.begin(); }
    clearCanvas();
    ctx.save();
    drawMaze(dt);
    followAndZoom(dt);
    drawArrows(dt);
    drawMessages(dt);
    drawPlayer(dt);
    ctx.restore();
    drawDebug(dt);
    if (DEBUG) { statsDraw.end(); }
  }
}

const endAnimation = {
  animationState: 100,
  animationTimer: false,

  init: init,
  update(dt) {
    if (DEBUG) { statsUpdate.begin(); }
    camera = animationCamera;
    // we get commands, but don't act on them
    // this allows any input to interrupt the opening animation
    getCurrentCommands(dt, player, camera);
    updatePlayerFromScript(dt);
    updatePlayerZoom(dt);
    updatePlayerMotionFromScript(dt);
    updateDebug();
    if (
      DEBUG) { statsUpdate.end(); }
  },
  draw(dt) {
    if (DEBUG) { statsDraw.begin(); }
    clearCanvas();
    ctx.save();
    drawMaze(dt);
    followAndZoom(dt);
    drawArrows(dt);
    drawMessages(dt);
    drawPlayer(dt);
    ctx.restore();
    drawDebug(dt);
    if (DEBUG) { statsDraw.end(); }
  }
}

// the game begins with the opening animation
// When any game state finishes, it is the current game state's responsilibity to set
// the next state.
var gameState = openAnimation;

// Cameras
//    gameCameraNoAutoZoom -- a camera that gives the use the control of the zoom level
//    gameCameraWithAutoZoom -- the original camera that autamatically zoomed in and out
//    animationCamera -- the camera used during the scripted animations
var gameCameraNoAutoZoom = { name: 'game_no_auto_zoom', x: 0, y: 0, z: 1.0, zmin: 1.0, zmax: 1.0, referenceZ: false, zdelay: 0, zdelaymax: 500 };
var gameCameraWithAutoZoom = { name: 'game_auto_zoom', x: 0, y: 0, z: 0.75, zmin: 0.75, zmax: 5, zdelay: 0, zdelaymax: 500 };
var animationCamera = { name: 'animation', x: 0, y: 0, z: 0.75, zmin: 0.75, zmax: 3.75, zdelay: 0, zdelaymax: 500 };
var camera = animationCamera;

// player
const player = {
  // position related data
  x: 0,
  y: 0,
  x_history: [],
  y_history: [],
  restoredX: 0,  // location of most recent jump to breadcrumb
  restoredY: 0,  // location of most recent jump to breadcrumb
  // an array of lists of multisegmented lines indicating where the player has been
  used_paths: [],
  // the most recent data as to where the player has been
  current_path: [],

  // perspective data
  forceZoomIn: false,

  // movement related data
  r: Math.PI * (3/2),
  v: 0,
  maxSpeed: 130 / 1000,
  vibrating: 0,
  vibrateBaseLocation: [0,0],

  // player game state information
  breadcrumb_stack: new Stack(),
  color: 4095,
  colorHintingTimer: false,
  colorHinting: true,
};


const updateTimer = { };
const drawTimer = { };
const debugIn = { tileGrid: false };
const debugOut = { avg: '', keys: '', gamepad: '', gamepadAxis0: '', gamepadAxis1: '', gameState: '' };

let gui, statsDraw, statsUpdate;

const loadingDiv = document.getElementById('loading');

const theCanvas = document.getElementById('viewport');
const ctx = theCanvas.getContext('2d');

const offscreenCanvas = document.createElement("canvas");
const offscreenContext = offscreenCanvas.getContext('2d');

function switchToGamePlayMode() {
  window.scrollTo(0,0);
  loadingDiv.style.visibility = 'hidden';
  let children = loadingDiv.children;
  for (let i = 0; i < children.length; i++)
    children[i].style.visibility = 'hidden';

  theStartButton.style.visibility = 'hidden';
  theCanvas.style.visibility = "visible";
  init();
}

function load() {
  // HACK: Render the whole path map at original scale and grab image data
  // array to consult for navigation. Seems wasteful of memory, but performs
  // way better than constant getImageData() calls

  const activateStartButton = e => {
    offscreenCanvas.width = map.width;
    offscreenCanvas.height = map.height;
    offscreenContext.drawImage(map.pathImg, 0, 0);
    map.pathData = offscreenContext.getImageData(0, 0, map.width, map.height).data;
    const theStartButton = document.getElementById('theStartButton');
    theStartButton.onclick = switchToGamePlayMode;
    theStartButton.style.visibility = "visible";
    map.pathImg.removeEventListener('load', activateStartButton);
  }

  map.pathImg = new Image();
  // as soon as the path image is loaded, show the start button
  map.pathImg.addEventListener("load", activateStartButton);
  map.pathImg.src = map.pathSrc;
  map.tileCols = Math.ceil(map.width / map.tileWidth);
  map.tileRows = Math.ceil(map.height / map.tileHeight);

}

function init() {
  // setting the canvas width before the play has hit the start button makes the
  // start page text very very small in the FF for iOS.  Not enlarging the canvas
  // until the game starts, solves that problem.

  ctx.canvas.width = map.width;
  ctx.canvas.height = map.height;
  ctx.globalCompositeOperation = 'mulitply';

  expandCanvas();
  window.addEventListener('resize', expandCanvas);

  Input.init();
  initPlayer();
  initDebugGUI();
  initTimer(updateTimer);
  initTimer(drawTimer);

  setTimeout(update, TICK);
  requestAnimFrame(draw);
}

function update() {
  handleTimer('update', Date.now(), updateTimer, true, dt => {
    gameState.update(dt)
  });
  setTimeout(update, TICK);
}

function draw(ts) {
  handleTimer('draw', ts, drawTimer, false, dt => {
    gameState.draw(dt)
  });
  requestAnimFrame(draw);
}

function initTimer(timer) {
  timer.last = null;
  timer.accum = 0;
}

function handleTimer(type, now, timer, fixed, cb) {
  if (!timer.last) { timer.last = now; }
  const delta = Math.min(now - timer.last, TICK * 3);
  timer.last = now;

  if (!fixed) { return cb(delta); }

  timer.accum += delta;
  while (timer.accum > TICK) {
    cb(TICK);
    timer.accum -= TICK;
  }
}

function clearCanvas(dt) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function followAndZoom(dt) {
  ctx.translate(
    (ctx.canvas.width / 2) - (player.x * camera.z),
    (ctx.canvas.height / 2) - (player.y * camera.z)
  );
  ctx.scale(camera.z, camera.z);
}

function expandCanvas() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

function drawDebug(dt) {
}

function drawMaze(dt) {
  ctx.globalCompositeOperation = 'source-over'
  // Find the rectangle of visible map
  const mapX = player.x - (ctx.canvas.width / 2 / camera.z);
  const mapY = player.y - (ctx.canvas.height / 2 / camera.z);
  const mapW = ctx.canvas.width / camera.z;
  const mapH = ctx.canvas.height / camera.z;

  // Find the start/end indices for tiles in visible map
  const colStart = Math.floor(mapX / map.tileWidth);
  const rowStart = Math.floor(mapY / map.tileHeight);
  const colEnd = Math.ceil(colStart + (mapW / map.tileWidth));
  const rowEnd = Math.ceil(rowStart + (mapH / map.tileHeight));

  const scaledTileWidth = map.tileWidth * camera.z;
  const scaledTileHeight = map.tileHeight * camera.z;

  // Calculate the offset where tile drawing should begin
  let drawOffX = (mapX % map.tileWidth) * camera.z;
  if (drawOffX < 0) { drawOffX = scaledTileWidth + drawOffX; }
  let drawOffY = (mapY % map.tileHeight) * camera.z;
  if (drawOffY < 0) { drawOffY = scaledTileHeight + drawOffY; }

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      const x = ((col - colStart) * scaledTileWidth) - drawOffX;
      const y = ((row - rowStart) * scaledTileHeight) - drawOffY;

      if (col >= 0 && row >= 0 && col < map.tileCols && row < map.tileRows) {
        const tileKey = `${row}x${col}`;
        if (!map.tiles[tileKey]) {
          const img = new Image();
          img.src = `${map.baseMapTilePath}/${tileKey}.png`;
          map.tiles[tileKey] = img;
        }
        ctx.drawImage(map.tiles[tileKey],
          0, 0, map.tileWidth, map.tileHeight,
          x, y, map.tileWidth * camera.z, map.tileHeight * camera.z
        );
      }

      if (DEBUG && debugIn.tileGrid) {
        ctx.strokeStyle = (col >= 0 && row >= 0 && col < map.tileCols && row < map.tileRows) ? '#0a0' : '#a00';
        ctx.strokeRect(x, y, map.tileWidth * camera.z, map.tileHeight * camera.z);

        ctx.strokeStyle = '#fff';
        ctx.strokeText(`${row}x${col}`, x + 12, y + 12);
      }
    }
  }
}

function drawArrows(dt) {
  ctx.save();
  ctx.lineWidth = "4";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = map.solutionColor;
  ctx.beginPath();
  ctx.moveTo(map.startArrowButt[0], map.startArrowButt[1]);
  ctx.lineTo(map.startArrowPoint[0], map.startArrowPoint[1]);
  ctx.lineTo(map.startArrowLeftWing[0], map.startArrowLeftWing[1]);
  ctx.moveTo(map.startArrowPoint[0], map.startArrowPoint[1]);
  ctx.lineTo(map.startArrowRightWing[0], map.startArrowRightWing[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(map.endArrowButt[0], map.endArrowButt[1]);
  ctx.lineTo(map.endArrowPoint[0], map.endArrowPoint[1]);
  ctx.lineTo(map.endArrowLeftWing[0], map.endArrowLeftWing[1]);
  ctx.moveTo(map.endArrowPoint[0], map.endArrowPoint[1]);
  ctx.lineTo(map.endArrowRightWing[0], map.endArrowRightWing[1]);
  ctx.stroke();
  ctx.restore();
}

function draw_a_path(a_path) {
  if (typeof a_path == "undefined") {
    console.log('trouble');
    return;
  }
  if (a_path.length > 1) {

    ctx.moveTo(a_path[0], a_path[1]);
    for (let j = 2; j < a_path.length; j+=2) {
      ctx.lineTo(a_path[j], a_path[j+1]);
    }
  }
}

function drawUsedPaths(dt) {
  ctx.save();

  ctx.lineWidth = "8";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = map.solutionColor;
  ctx.globalCompositeOperation = 'color-burn';

  // update used paths
  let lastX = player.current_path[player.current_path.length - 2];
  let lastY = player.current_path[player.current_path.length - 1];
  if (Math.abs(lastX - player.x) > 6 || Math.abs(lastY - player.y) > 6) {
    player.current_path.push(Math.round(player.x));
    player.current_path.push(Math.round(player.y));
  }

  ctx.beginPath();
  draw_a_path(player.current_path);

  const mapX = player.x - (ctx.canvas.width / 2 / camera.z);
  const mapY = player.y - (ctx.canvas.height / 2 / camera.z);
  const mapW = ctx.canvas.width / camera.z;
  const mapH = ctx.canvas.height / camera.z;

  // Find the start/end indices for tiles in visible map
  const rowStart = Math.floor(mapY / map.tileHeight) - 1;
  const rowEnd = Math.ceil(rowStart + (mapH / map.tileHeight)) + 1;

  const colStart = Math.floor(mapX / map.tileWidth) - 1;
  const colEnd = Math.ceil(colStart + (mapW / map.tileWidth)) + 1;

  // column
  for (let i = colStart; i <= colEnd; i++) {
    if (i >= 0 && i < map.numberOfTileColumns)
      for (let j = rowStart; j <= rowEnd; j++)
        if (j >= 0 && j < map.numberOfTileRows) {
          let usedPathsForThisTile = player.used_paths[i][j];
          for (let k = 0; k < usedPathsForThisTile.length; k++)
            draw_a_path(usedPathsForThisTile[k]);
        }
  }
  ctx.stroke();

  if (player.current_path.length > 60) {
    let columnNumber = Math.trunc(player.current_path[0] / map.tileWidth);
    let rowNumber = Math.trunc(player.current_path[1] / map.tileHeight);
    player.used_paths[columnNumber][rowNumber].push(player.current_path);
    player.current_path = [player.x, player.y];
  }

  ctx.restore();
}

function drawBreadCrumbs(dt) {
  ctx.save();

  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  for (let i = 0; i < player.breadcrumb_stack.stack.length; i++) {
    let [x, y] = player.breadcrumb_stack.stack[i];
    ctx.fillText(i.toString(), x, y);
  }

  ctx.restore();
}

function initPlayer() {
  if (player.colorHintingTimer) {
    window.clearInterval(player.colorHintingTimer);
    player.colorHintingTimer = false;
    player.colorOverride = false;
  }
  player.x = map.startX;
  player.y = map.startY;
  player.current_path = [player.x, player.y];
  player.r = Math.atan2(map.startY - map.startHeadingY, map.startX - map.startHeadingX);
  player.v = 0;
  player.color = 4095;
  player.sprite = {
   rings: [
    { t: 0, delay: 0,   startR: 0, endR: 50, startO: 1.0, endO: 0.0, endT: 3000 },
    { t: 0, delay: 300, startR: 0, endR: 50, startO: 1.0, endO: 0.0, endT: 3000 },
    { t: 0, delay: 600, startR: 0, endR: 50, startO: 1.0, endO: 0.0, endT: 3000 }
   ]
  };
  // create a big column ordered grid of lists that mirror the size and shape of the tile
  // maps for use in saving sets of used paths.  This will allow optimization of drawing
  // only the used paths that are actually in view
  player.used_paths = [];
  for (let i = 0; i < map.numberOfTileColumns; i++) {
    player.used_paths.push([]); // the X dimension
    for (let j = 0; j < map.numberOfTileRows; j++)
      player.used_paths[i].push([]);  // the Y dimension
  }
}

// The openning animation is also a state system.  The states are numbered and can be advanced
// either by this timer function or by directly changing the animation varible
function incrementAnimationState() {
  if (openAnimation.animationTimer) {
    window.clearInterval(openAnimation.animationTimer);
    openAnimation.animationTimer = false;
  }
  openAnimation.animationState += 1;
}

function hasKeys(aMapping) {
  return Object.keys(aMapping).length > 0;
}

function abortIntro() {
  if (playerWantsAttention()) {
    if (openAnimation.animationTimer) {
      window.clearInterval(openAnimation.animationTimer);
      openAnimation.animationTimer = false;
    }
    if (player.colorHintingTimer) {
      window.clearInterval(player.colorHintingTimer);
      player.colorHintingTimer = false;
      player.colorOverride = false;
      player.color = 4094;
    }
    // jump to the last animation state if the user interrupts the animation
    openAnimation.animationState = 11;
  }
}

function updatePlayerFromScript(dt) {
  let animationState = openAnimation.animationState;
  abortIntro();
  if (openAnimation.animationState == 0) {
    player.forceZoomIn = true;
    player.x = animationStartPoint[0];
    player.y = animationStartPoint[1];
    if (!openAnimation.animationTimer) {
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 5000);
    }
  } else if (animationState == 1) {
    player.forceZoomIn = false;

  } else if (animationState == 2) {
    player.r = Math.atan2(map.startY - map.startHeadingY, map.startX - map.startHeadingX);
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer)
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 1e000);

  } else if (animationState == 3) {
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer)
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 3000);

  } else if (animationState == 4) {
    player.forceZoomIn = false;

  } else if (animationState == 5) {
    player.r = Math.atan2(map.endHeadingY - map.endY, map.endHeadingX - map.endX);
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer)
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 3000);

  } else if (animationState == 6) {
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer)
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 3000);

  } else if (animationState == 7) {
    player.forceZoomIn = false;

  } else if (animationState == 8) {
    player.forceZoomIn = true;
    player.r = Math.atan2(map.startY - map.startHeadingY, map.startX - map.startHeadingX);
    if (!openAnimation.animationTimer) {
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 4000);
      player.colorOverride = true;
      player.colorHintingTimer = window.setInterval(degradeHintingColor, 200);
    }

  } else if (animationState == 9) {
    if (player.colorHintingTimer) {
      window.clearInterval(player.colorHintingTimer);
      player.colorHintingTimer = false;
      player.colorOverride = false;
    }
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer)
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 5000);

  } else if (animationState == 10) {
    player.x = map.startX;
    player.y = map.startY;
    player.r = Math.atan2(map.startY - map.startHeadingY, map.startX - map.startHeadingX);
    player.forceZoomIn = true;
    if (!openAnimation.animationTimer) {
      openAnimation.animationTimer = window.setInterval(incrementAnimationState, 2000);
      player.colorOverride = true;
      player.colorHintingTimer = window.setInterval(upgradeHintingColor, 150);
    }

  } else if (animationState == 11) {
    player.forceZoomIn = false;
    if (player.colorHintingTimer) {
      window.clearInterval(player.colorHintingTimer);
      player.colorHintingTimer = false;
      player.colorOverride = false;
    }
    initPlayer();
    camera = gameCameraNoAutoZoom;
    gameState = gamePlay;
    animationState = 100;
  }
}

function updatePlayerMotionFromScript(dt) {
  let animationState = openAnimation.animationState;
  if (animationState == 1) {
    let distanceFromStart = distanceFrom(player.x, player.y, map.startX, map.startY);
    player.r = Math.atan2(map.startY - player.y, (map.startX + distanceFromStart / 2.0) - player.x);
    player.v = 0;
    let tx = Math.cos(player.r) * player.maxSpeed * 5 * dt + player.x;
    let ty = Math.sin(player.r) * player.maxSpeed * 5 * dt + player.y;

    if (distanceFrom(tx, ty, map.startX, map.startY) < distanceFrom(tx, ty, player.x, player.y)) {
      tx = map.startX;
      ty = map.startY;
      incrementAnimationState();
    }
    player.x = tx;
    player.y = ty;

  } if (animationState == 4) {
    let distanceFromEnd = distanceFrom(player.x, player.y, map.endX, map.endY);
    player.r = Math.atan2((map.endY + distanceFromEnd / 2.0) - player.y, (map.endX) - player.x);
    player.v = 0;
    let tx = Math.cos(player.r) * player.maxSpeed * 5 * dt + player.x;
    let ty = Math.sin(player.r) * player.maxSpeed * 5 * dt + player.y;

    if (distanceFrom(tx, ty, map.endX, map.endY) < distanceFrom(tx, ty, player.x, player.y)) {
      tx = map.endX;
      ty = map.endY;
      incrementAnimationState();
    }
    player.x = tx;
    player.y = ty;

  } if (animationState == 7) {
    let distanceFromStart = distanceFrom(player.x, player.y, map.startX, map.startY);
    player.r = Math.atan2(map.startY + distanceFromStart / 2.0 - player.y, map.startX - player.x);
    player.v = 0;
    let tx = Math.cos(player.r) * player.maxSpeed * 6 * dt + player.x;
    let ty = Math.sin(player.r) * player.maxSpeed * 6 * dt + player.y;

    if (distanceFrom(tx, ty, map.startX, map.startY) < distanceFrom(tx, ty, player.x, player.y)) {
      tx = map.startX;
      ty = map.startY;
      incrementAnimationState();
    }
    player.x = tx;
    player.y = ty;
  }
}

function drawMessages(dt) {
  let animationState = openAnimation.animationState;
  if (animationState == 0) {
    ctx.save();
    ctx.strokeStyle = '#0bf';
    ctx.fillStyle = '#0bf';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("The Firefox Maze", player.x, player.y - 20);
    ctx.strokeStyle = '#fb0';
    ctx.fillStyle = '#fb0';
    ctx.fillText("by   Les Orchard   &   K Lars Lohn", player.x, player.y + 20);
    ctx.fillText("Art by K Lars Lohn", player.x, player.y + 35);
    ctx.fillText("Firefox® by the Mozilla Foundation", player.x, player.y + 50);
    ctx.fillText("(used by an employee with tacit assent)", player.x, player.y + 65);
    ctx.restore();
  } else if (animationState == 3) {
    ctx.save();
    ctx.strokeStyle = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("You're going to start here...", map.startMessageBase[0], map.startMessageBase[1] - 42);
    ctx.restore();

  } else if (animationState == 5) {
    ctx.save();
    ctx.strokeStyle = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("The goal is to exit here.",  map.endMessageBase[0], map.endMessageBase[1] - 52);
    ctx.restore();

  } else if (animationState == 6) {
    ctx.save();
    ctx.strokeStyle = '#ff0';
    ctx.fillStyle = '#ff0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("Take all the time you need...", map.endMessageBase[0], map.endMessageBase[1] - 52);
    ctx.restore();

  } else if (animationState == 8) {
    ctx.save();
    ctx.strokeStyle = '#f00';
    ctx.fillStyle = '#f00';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("If the cursor gradually turns", map.startMessageBase[0], map.startMessageBase[1] - 62);
    ctx.fillText("red, you're on the wrong path", map.startMessageBase[0], map.startMessageBase[1] - 42);
    ctx.restore();

  } else if (animationState == 9) {
    ctx.save();
    ctx.strokeStyle = '#ff0';
    ctx.fillStyle = '#ff0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("Jump back to the numbered", map.startMessageBase[0], map.startMessageBase[1] - 57);
    ctx.fillText("breadcrumbs until it turns white again", map.startMessageBase[0], map.startMessageBase[1] - 42);
    ctx.restore();

  } else if (animationState == 10) {
    ctx.save();
    ctx.strokeStyle = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText("GO!", map.startX, map.startY - 52);
    ctx.restore();

  }
}

function updatePlayerZoom(dt) {
  let zoomInDelta = 0;
  let zoomOutDelta = 0;
  if (player.v !== 0 || player.forceZoomIn) {
    camera.zdelay = camera.zdelaymax;
    camera.z += 0.3;
    if (camera.z > camera.zmax) {
      camera.z = camera.zmax;
    }
  } else {
    if (camera.zdelay > 0) {
      camera.zdelay -= dt;
      return;
    }
    camera.z -= 0.2;
    if (camera.z < camera.zmin) {
      camera.z = camera.zmin;
    }
  }
}

function updatePlayerMotion(dt) {
  let dx = 0;
  let dy = 0;

  if (player.vibrating > 10) {
    var [px, py] = player.vibrateBaseLocation;
  } else {
    var [px, py] = [player.x, player.y];
  }

  let tx = Math.cos(player.r) * player.v * dt + px;
  let ty = Math.sin(player.r) * player.v * dt + py;

  // is the player even moving?
  if (px == tx && py == ty) {
    player.vibrating = 0;
    return;
  }

  let breadcrumbFound = false;

  //prevent overrun
  dx = tx - px;
  dy = ty - py;
  let largerDelta = Math.max(Math.abs(dx), Math.abs(dy));
  let dxStep = dx / largerDelta;
  let dyStep = dy / largerDelta;

  // check every point along the player path to ensure
  // that no boundary wall was crossed
  let overrunX = px;
  let overrunY = py;
  for (let i = 1; i <= largerDelta ; i++) {
    let testX = Math.round(dxStep * i + px);
    let testY = Math.round(dyStep * i + py);
    if (isPassableAt(testX, testY)) {
      overrunX = testX;
      overrunY = testY;
      if (pixelIsRedAt(testX, testY)) {
        breadcrumbFound = true;
        markBreadcrumbAsUsed(testX, testY);
     }

    } else {
      tx = overrunX;
      ty = overrunY;

      break;
    }
  }

  [tx, ty] = suggestBetter(tx, ty);
  if (!isPassableAt(tx, ty)) return;

  if (breadcrumbFound)
    player.breadcrumb_stack.push([Math.round(tx), Math.round(ty)]);

  // stop vibration
  let vdx = Math.abs(player.x - tx);
  let vdy = Math.abs(player.y - ty);
  if (vdx < 2 && vdy < 2) {
    player.vibrating += 1;
    if (player.vibrating > 10) {
      player.vibrateBaseLocation = [tx, ty];
      return;
    }
    player.x = tx;
    player.y = ty;
    return;
  }

  player.x = tx;
  player.y = ty;
  player.vibrating = 0;


}

function redPixel(x, y) {
  return map.pathData[4 * (Math.round(x) + (Math.round(y) * map.width))]
}

function pixelIsRedAt(x, y) {
  try {
    return map.pathData[4 * (Math.round(x) + (Math.round(y) * map.width))] > 128;
  } catch (err) {
    return false;
  }
}

function floodPixelData(x, y, isOrignalValueFn, newValue) {
  let workQueueX = [];
  let workQueueY = [];
  workQueueX.push(x);
  workQueueY.push(y);
  while (workQueueX.length) {
    let testX = workQueueX.pop();
    let testY = workQueueY.pop();
    let position = 4 * (Math.round(testX) + (Math.round(testY) * map.width));
    if (isOrignalValueFn(map.pathData[position])) {
      // this routine will inefficeintly put pixels already tested into the
      // queue - however fixing that makes the algorithm significantly more
      // complicated

      map.pathData[position] = newValue;
      workQueueX.push(testX + 1);
      workQueueY.push(testY + 1);

      workQueueX.push(testX + 1);
      workQueueY.push(testY);

      workQueueX.push(testX + 1);
      workQueueY.push(testY - 1);

      workQueueX.push(testX);
      workQueueY.push(testY + 1);

      workQueueX.push(testX + 1);
      workQueueY.push(testY - 1);

      workQueueX.push(testX - 1);
      workQueueY.push(testY + 1);

      workQueueX.push(testX - 1);
      workQueueY.push(testY);

      workQueueX.push(testX - 1);
      workQueueY.push(testY - 1);
    }
  }
}

function markBreadcrumbAsUsed(x, y) {
  floodPixelData(x, y, v => v > 128, 100)
}

function markBreadcrumbAsAvailable(x, y) {
  floodPixelData(x, y, v => v == 100, 255)
}


function pixelIsGreenAt(x, y) {
  try {
    return map.pathData[4 * (Math.round(x) + (Math.round(y) * map.width)) + 1] > 128;
  } catch (err) {
    return false;
  }
}

function pixelIsBlueAt(x, y) {
  try {
    return map.pathData[4 * (Math.round(x) + (Math.round(y) * map.width)) + 2] > 128;
  } catch (err) {
    console.log(err);
    return false;
  }
}
const isPassableAt = pixelIsBlueAt;

function distanceFrom(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function suggestBetter(x, y) {
  var i;
  var xAxis = [
    [x-4, isPassableAt(x-4, y)],
    [x-3, isPassableAt(x-3, y)],
    [x-2, isPassableAt(x-2, y)],
    [x-1, isPassableAt(x-1, y)],
    [x,   isPassableAt(x,   y)],
    [x+1, isPassableAt(x+1, y)],
    [x+2, isPassableAt(x+2, y)],
    [x+3, isPassableAt(x+3, y)],
    [x+4, isPassableAt(x+4, y)],
  ];
  for (i = 4; i >= 0; i--)
    if (!xAxis[i][1])
      break;
  let lowX = i;
  for (i = 4; i < xAxis.length; i++)
    if (!xAxis[i][1])
      break;
  let highX = i;
  let middleX =  Math.trunc((highX - lowX) / 2 + lowX);

  var yAxis = [
    [y-4, isPassableAt(xAxis[middleX][0], y-4)],
    [y-3, isPassableAt(xAxis[middleX][0], y-3)],
    [y-2, isPassableAt(xAxis[middleX][0], y-2)],
    [y-1, isPassableAt(xAxis[middleX][0], y-1)],
    [y,   isPassableAt(xAxis[middleX][0], y)],
    [y+1, isPassableAt(xAxis[middleX][0], y+1)],
    [y+2, isPassableAt(xAxis[middleX][0], y+2)],
    [y+3, isPassableAt(xAxis[middleX][0], y+3)],
    [y+4, isPassableAt(xAxis[middleX][0], y+4)],
  ];
  for (i = 4; i >= 0; i--)
    if (!yAxis[i][1])
      break;
  let lowY = i;
  for (i = 4; i < xAxis.length; i++)
    if (!yAxis[i][1])
      break;
  let highY = i;
  let middleY =  Math.trunc((highY - lowY) / 2 + lowY);
  let betterX = xAxis[middleX][0];
  let betterY = yAxis[middleY][0];
  return [betterX, betterY];
}

function degradeHintingColor() {
  if (player.color > 3840) {
    player.color -= 17;
  } else {
    window.clearInterval(player.colorHintingTimer);
    player.colorHintingTimer = false;
  }
}

function upgradeHintingColor() {
  if (player.color < 4094) {
    player.color += 17;
  }
}

function drawPlayer(dt) {
  let inSolutionPath = pixelIsGreenAt(player.x, player.y);

  if (player.colorHinting && !player.colorHintingTimer && !inSolutionPath && !player.colorOverride) {
    // degrade the player color every 60 seconds with a timer
    player.colorHintingTimer = window.setInterval(degradeHintingColor, 20000);
  }
  if (inSolutionPath && !player.colorOverride) {
    // the player has moved back onto a solution path
    // kill the timer and restore the color
    if (player.colorHintingTimer) window.clearInterval(player.colorHintingTimer);
    player.colorHintingTimer = false;
    player.color = 4095;
  }

  let color_str = "#".concat(player.color.toString(16));
  ctx.strokeStyle = color_str;
  ctx.fillStyle = color_str;

  var drawR = player.r;

  let px = Math.round(player.x);
  let py = Math.round(player.y);

  if (player.v != 0) {
    // Try coming up with a short travel history segment for a
    // smoothed avatar rotation
    player.x_history.unshift(px);
    player.y_history.unshift(py);
    if (player.x_history.length > 20) {
      player.x_history.pop();
    }
    if (player.y_history.length > 20) {
      player.y_history.pop();
    }
    drawR = Math.atan2(
      player.y_history[0] - player.y_history[player.y_history.length - 1],
      player.x_history[0] - player.x_history[player.x_history.length - 1]
    );
  } else if (player.x_history.length) {
    // if the player is not moving, the history is irrelevant
    player.x_history.pop();
    player.y_history.pop();
  }


  // Draw a little arrowhead avatar
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(drawR);
  ctx.lineWidth = '1.5';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-5, 5);
  ctx.lineTo(0, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(5, 0);
  ctx.stroke();
  ctx.fill();
  ctx.restore();

  // When we're zoomed out, animate a ripple to call attention to the avatar.
  if (camera.z < 0.8) {
    player.sprite.rings.forEach(ring => {
      if (ring.delay > 0) { return ring.delay -= dt; }

      ring.t += dt;
      if (ring.t >= ring.endT) { ring.t = 0; }

      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = lerp(ring.startO, ring.endO, ring.t / ring.endT);
      ctx.arc(px, py,
              lerp(ring.startR, ring.endR, ring.t / ring.endT),
              0, PI2);
      ctx.stroke();
      ctx.restore();
    });
  }
}


const directions = {
  r: 0,
  ur: Math.PI * (7/4),
  u: Math.PI * (3/2),
  ul: Math.PI * (5/4),
  l: Math.PI,
  dl: Math.PI * (3/4),
  d: Math.PI * (1/2),
  dr: Math.PI * (1/4)
};

// Commands to implement
// ATTENTION  -- continuous
// MOVE direction, speed-factor  -- continuous
// BACKUP -- single
// ZOOM up-down-int -- continuous
// AUTOZOOM on-off -- single
// SAVE  -- single
// QUIT  -- single

// input sources
// KEYBOARD
// MOUSE
// GAME-CONTROLLER
// TOUCH
// MOTION

/*
Each method of fetching data from the user has its own section below.  They are considered
indepentently in turn.  Each section interprets its input type and translates into commands.
Once each has completed the task, the commands are merged into one command object and those
are executed.
*/

// Keyboard Section

const KeyboardCommands = {
  name: 'keyboard',
  attention: false,
  moveDirection: 0,
  moveSpeedFactor: 0,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function createKeyboardCommands (dt, playerX, playerY, camera) {
  KeyboardCommands.attention = false;
  KeyboardCommands.moveDirection = false;
  KeyboardCommands.moveSpeedFactor = false;
  KeyboardCommands.backup = false;
  KeyboardCommands.zoom = false;
  KeyboardCommands.autozoom = false;
  KeyboardCommands.save = false;

  // Query cursor keys & WASD
  const dleft  = (Input.keys[65] || Input.keys[37]);
  const dright = (Input.keys[68] || Input.keys[39]);
  const dup    = (Input.keys[87] || Input.keys[38]);
  const ddown  = (Input.keys[83] || Input.keys[40]);
  const dir = (dup ? 'u' : (ddown ? 'd' : '')) +
    (dleft ? 'l' : (dright ? 'r' : ''));

  if (dir) {
    KeyboardCommands.moveDirection = directions[dir];
    KeyboardCommands.moveSpeedFactor = 1;
    KeyboardCommands.attention = true;
  } else {
    KeyboardCommands.moveDirection = false;
    KeyboardCommands.moveSpeedFactor = false;
  }

  if (Input.keys[8]) {  // backspace for backup
    KeyboardCommands.attention = true;
    KeyboardCommands.backup = true;
    delete Input.keys[8]
  }
  if (Input.keys[46]) { // also for backup
    KeyboardCommands.attention = true;
    KeyboardCommands.backup = true;
    delete Input.keys[46]}

  if (Input.keys[90]) {  // Z key for Auto-zoom toggling
    KeyboardCommands.attention = true;
    KeyboardCommands.auto_zoom = true;
    delete Input.keys[90]
  }

  if (Input.keys[61]) {  // =/+ for zoom in
    KeyboardCommands.attention = true;
    KeyboardCommands.zoom = 0.1;
    delete Input.keys[61]
  }

  if (Input.keys[173]) {  // - for zoom out
    KeyboardCommands.attention = true;
    KeyboardCommands.zoom = -0.1;
    delete Input.keys[173]
  }

  // TODO: keyboard command for save
  // TODO: keyboard command for quit

}

// Mouse section

const MouseCommands = {
  name: 'mouse',
  attention: false,
  moveDirection: 0,
  moveSpeedFactor: 0,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function createMouseCommands (dt, playerX, playerY, camera) {
  MouseCommands.attention = false;
  MouseCommands.moveSpeedFactor = false;
  MouseCommands.moveDirection = false;
  MouseCommands.backup = false;
  MouseCommands.zoom = false;
  MouseCommands.auto_zoom = false;

  if (Input.mouse.down === 0) {  // left mouse for move
    const mx = playerX - (ctx.canvas.width / 2 / camera.z) + (Input.mouse.x / camera.z);
    const my = playerY - (ctx.canvas.height / 2 / camera.z) + (Input.mouse.y / camera.z);
    let distance = distanceFrom(playerX, playerY, mx, my);
    if (distance > 40) distance = 40;
    MouseCommands.moveSpeedFactor = distance / 40;
    MouseCommands.moveDirection = Math.atan2(my - playerY, mx - playerX);
    MouseCommands.attention = true;
  } else if (Input.mouse.down == 2) {  // right mouse for backup
    MouseCommands.backup = true;
    Input.mouse.down = false;  // kill repeats
    MouseCommands.attention = true;
  } else if (Input.mouse.down == 1) {   // middle mouse for autozoom
    MouseCommands.auto_zoom = true;
    Input.mouse.down = false;  // kill repeats
    MouseCommands.attention = true;
  } else if (Input.mouse.wheel) {  // wheel for zoom
    MouseCommands.zoom = Input.mouse.wheel / 10.0;
    MouseCommands.attention = true;
    Input.mouse.wheel = false;
  }

  // TODO: mouse command for autozoom
  // TODO: mouse command for save
  // TODO: mouse command for quit

}

// game controller section

const GameControllerCommands = {
  name: 'game-controller',
  attention: false,
  moveDirection: 0,
  moveSpeedFactor: 0,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function createGameControllerCommands (dt, playerX, playerY, camera) {
  GameControllerCommands.attention = false;
  GameControllerCommands.moveSpeedFactor = false;
  GameControllerCommands.moveDirection = false;
  GameControllerCommands.backup = false;
  GameControllerCommands.zoom = false;
  GameControllerCommands.auto_zoom = false;

  if (Object.keys(Input.gamepad).length) GameControllerCommands.attention = true;

  const dleft = Input.gamepad.button13;
  const dright = Input.gamepad.button14;
  const dup = Input.gamepad.button11;
  const ddown = Input.gamepad.button12;
  const dir = (dup ? 'u' : (ddown ? 'd' : '')) +
    (dleft ? 'l' : (dright ? 'r' : ''));
  if (dir) { // movement
    GameControllerCommands.moveDirection = directions[dir];
    GameControllerCommands.moveSpeedFactor = 1;
    GameControllerCommands.attention = true;
  } else {
    GameControllerCommands.moveDirection = false;
    GameControllerCommands.moveSpeedFactor = 0;
  }
  if (Input.gamepad.button6 || Input.gamepad.button2) {
    if (typeof Input.gamepad.backup == "undefined") {
      Input.gamepad.backup = true;
      GameControllerCommands.backup = true;
    }
  } else if (typeof Input.gamepad.backup != "undefined")
    delete Input.gamepad.backup;

  if (Input.gamepad.button3) {
    if (typeof Input.gamepad.auto_zoom == "undefined") {
      Input.gamepad.auto_zoom = true;
      GameControllerCommands.auto_zoom = true;
    }
  } else if (typeof Input.gamepad.auto_zoom != "undefined")
    delete Input.gamepad.auto_zoom;

  if (Input.gamepad.button0) {  // green button 0 for zoom in
    if (typeof Input.gamepad.zoom == "undefined") {
      Input.gamepad.zoom = true;
      GameControllerCommands.zoom = 0.1;
    }
  } else if (typeof Input.gamepad.zoom != "undefined")
    delete Input.gamepad.zoom;

  if (Input.gamepad.button1) {  // red button 1 for zoom in
    if (typeof Input.gamepad.zoom == "undefined") {
      Input.gamepad.zoom = true;
      GameControllerCommands.zoom = -0.1;
    }
  } else if (typeof Input.gamepad.zoom != "undefined")
    delete Input.gamepad.zoom;


  if (typeof(Input.gamepad.axis0) != 'undefined' && typeof(Input.gamepad.axis1) != 'undefined') {
    // Gamepad analog stick for rotation & velocity
    const jx = Math.abs(Input.gamepad.axis0) > 0.2 ? Input.gamepad.axis0 : 0;
    const jy = Math.abs(Input.gamepad.axis1) > 0.2 ? Input.gamepad.axis1 : 0;
    if (Math.abs(jx) > 0 || Math.abs(jy) > 0) {
      GameControllerCommands.attention = true;
      GameControllerCommands.moveSpeedFactor = 1; // TODO: velocity from stick intensity?
      GameControllerCommands.moveDirection = Math.atan2(Input.gamepad.axis1, Input.gamepad.axis0);
    }
  }

  // TODO: game controller command for save
  // TODO: game controller command for quit
}


// touch section

const TouchCommands = {
  name: 'touch',
  attention: false,
  moveDirection: 0,
  moveSpeedFactor: 0,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function createTouchCommands (dt, playerX, playerY, camera) {
  TouchCommands.attention = false;
  TouchCommands.moveSpeedFactor = false;
  TouchCommands.moveDirection = false;
  TouchCommands.backup = false;
  TouchCommands.zoom = false;
  TouchCommands.auto_zoom = false;

  let timestamp = Date.now();
  let touches = Object.keys(Input.touchEventTracker);
  if (touches.length == 1) {  // move command
    const mx = playerX - (ctx.canvas.width / 2 / camera.z) + (Input.touchEventTracker[touches[0]].x / camera.z);
    const my = playerY - (ctx.canvas.height / 2 / camera.z) + (Input.touchEventTracker[touches[0]].y / camera.z);
    let distance = distanceFrom(playerX, playerY, mx, my);
    if (distance > 40) distance = 40;
    TouchCommands.attention = true;
    TouchCommands.moveSpeedFactor = distance / 40;
    TouchCommands.moveDirection = Math.atan2(my - playerY, mx - playerX);

  } else if (touches.length == 2) { // zoom or backup command
    TouchCommands.attention = true;
    let first = Input.touchEventTracker[touches[0]];
    let second = Input.touchEventTracker[touches[1]];
    let changeInDistanceFromStart = distanceFrom(first.x, first.y, second.x, second.y) - distanceFrom(first.xStart, first.yStart, second.xStart, second.yStart);
    if (Math.abs(changeInDistanceFromStart) > 10) {
      TouchCommands.zoom = changeInDistanceFromStart / 500; // mostly normalized to 0.0 to 1.0
      if (TouchCommands.zoom > 1.2) TouchCommands.zoom = 1.2;
    }
    if (first.ended || second.ended) // it was a 2 finger tap
      if (timestamp - first.timestamp < 1000 && Math.abs(changeInDistanceFromStart) < 10) {
        TouchCommands.backup = true;
      }
  } else if (touches.length == 3) {  // auto_zoom command
    TouchCommands.attention = true;
    TouchCommands.auto_zoom = true;
  }

  // kill the ended touch trackers
  let n = 0;
  for (let i = 0; i < touches.length; i++) {
    if (Input.touchEventTracker[touches[i]].ended || (timestamp - Input.touchEventTracker[touches[i]].timestamp) > 90000 ) {
      delete Input.touchEventTracker[touches[i]];
    }
  }

  // TODO: game controller command for save
  // TODO: game controller command for quit
}

// movement / gyroscope / shake section

const MovementCommands = {
  name: 'movement',
  attention: false,
  moveDirection: false,
  moveSpeedFactor: false,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function createMovementCommands (dt, playerX, playerY, camera) {
  // TODO: movement command for moving
  // TODO: movement command for backup
  // TODO: movement command for zoom
  // TODO: movement command for autozoom
  // TODO: movement command for save
  // TODO: movement command for quit

}

// consolidated commands section

function mergeCommands(candidate, target) {
  if (candidate.attention) {
    target.attention = candidate.attention ? candidate.attention : target.attention;
    target.moveDirection = candidate.moveDirection ? candidate.moveDirection : target.moveDirection;
    target.moveSpeedFactor = candidate.moveSpeedFactor ? candidate.moveSpeedFactor : target.moveSpeedFactor;
    target.backup = candidate.backup ? candidate.backup : target.backup;
    target.auto_zoom = candidate.auto_zoom ? candidate.auto_zoom : target.auto_zoom;
    target.zoom = candidate.zoom ? candidate.zoom : target.zoom;
    target.save = candidate.save ? candidate.save : target.save;
    target.quit = candidate.quit ? candidate.quit : target.quit;
  }
}

const InputCommandFunctions = [ createKeyboardCommands,  createMouseCommands, createGameControllerCommands, createTouchCommands, createMovementCommands ];
const InputCommands = [ KeyboardCommands , MouseCommands , GameControllerCommands, TouchCommands, MovementCommands  ];

var Commands = {
  attention: false,
  moveDirection: false,
  moveSpeedFactor: false,
  backup: false,
  zoom: false,
  auto_zoom: false,
  save: false,
  quit: false,
};

function getCurrentCommands(dt, player, currentCamera) {

  Commands.attention = false;
  Commands.moveDirection = false;
  Commands.moveSpeedFactor = false;
  Commands.backup = false;
  Commands.zoom = false;
  Commands.auto_zoom = false;
  Commands.save = false;
  Commands.quit = false;

  Input.update(dt);
  InputCommandFunctions.forEach(e => e(dt, player.x, player.y, currentCamera));
  InputCommands.forEach(e => mergeCommands(e, Commands));
}

function playerWantsAttention() {
  return Commands.attention;
}

function actOnCurrentCommands(dt, player, currentCamera) {
  if (Commands.moveSpeedFactor) {
    player.v = player.maxSpeed * Commands.moveSpeedFactor;
    player.r = Commands.moveDirection;
  } else {
    player.v = 0;
  }
  if (Commands.backup) {
    if (player.breadcrumb_stack.stack.length > 0) {
      let columnNumber = Math.trunc(player.current_path[0] / map.tileWidth);
      let rowNumber = Math.trunc(player.current_path[1] / map.tileHeight);
      player.used_paths[columnNumber][rowNumber].push(player.current_path);
      [player.x, player.y] = player.breadcrumb_stack.pop();
      markBreadcrumbAsAvailable(player.x, player.y);
      player.current_path = [player.x, player.y];
      player.restoredX = player.x;
      player.restoredY = player.y;
    }
  }
  if (Commands.zoom && currentCamera == gameCameraNoAutoZoom) {
    try {
      if (currentCamera.referenceZ == false)   // == false because must disambiguate from case 0
        currentCamera.referenceZ = currentCamera.z;
      let newZ = currentCamera.referenceZ * (1 + Commands.zoom);
      if (newZ < 0.1) newZ = 0.1;
      if (newZ > 8.0) newZ = 8.0;
      currentCamera.z = newZ;
      currentCamera.zmin = currentCamera.z;
      currentCamera.zmax = currentCamera.z;

    } catch (err) {
      console.log(err.toString());
    }
  } else
    camera.referenceZ = false;
  if (Commands.auto_zoom) {
    camera = (camera == gameCameraNoAutoZoom) ? gameCameraWithAutoZoom : gameCameraNoAutoZoom;
    currentCamera = camera;
  }
}


// Linear interpolation from v0 to v1 over t[0..1]
function lerp(v0, v1, t) {
  return (1-t)*v0 + t*v1;
}

function initDebugGUI() {
  if (!DEBUG) { return; }

  statsDraw = new Stats();
  statsDraw.showPanel(0);
  document.body.appendChild(statsDraw.dom);

  statsUpdate = new Stats();
  statsUpdate.showPanel(0);
  document.body.appendChild(statsUpdate.dom);
  statsUpdate.dom.style.top = '48px';

  gui = new Dat.GUI();

  const listenAll = (folder, obj, keys) => {
    if (!keys) { keys = Object.keys(obj); }
    keys.forEach(k => folder.add(obj, k).listen());
  };

  const fdebug = gui.addFolder('debug');
  fdebug.open();
  listenAll(fdebug, debugIn);
  listenAll(fdebug, debugOut);

  const ftouch = gui.addFolder('touch');
  // ftouch.open();
  listenAll(ftouch, Input.touch);

  const fplayer = gui.addFolder('player');
  fplayer.open();
  listenAll(fplayer, player, ['x', 'y', 'r', 'v', 'color', 'colorHinting', 'vibrating']);

  const fcamera = gui.addFolder('camera');
  // fcamera.open();
  listenAll(fcamera, camera, ['x', 'y', 'z', 'zdelay']);

  const fmouse = gui.addFolder('mouse');
  // fmouse.open();
  listenAll(fmouse, Input.mouse);
}

function updateDebug(dt) {
  if (!DEBUG) { return; }

  Object.assign(debugOut, {
    keys: JSON.stringify(Input.keys),
    gamepad: JSON.stringify(Input.gamepad),
    gamepadAxis0: Input.gamepad.axis0,
    gamepadAxis1: Input.gamepad.axis1
  });
}

window.addEventListener('load', load);
