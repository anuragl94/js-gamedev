import "./lib/polyfills";
import Game, { PhysicsEntity } from "./lib/engine";
import baseTemplate from "./templates/base";

document.body.innerHTML += baseTemplate;


console.clear();
const fpsCounterEl = document.getElementById("fps-counter");
const timeCounterEl = document.getElementById("time-counter");

const game = new Game(
  {
    height: document.body.clientHeight,
    width: document.body.clientWidth * 2
  },
  document.getElementById("game-area")
);
game.time = 0;

const PLAYER_SIZE = 64;
const PLAYER_HSPEED = 5;
const PLAYER_YSPEED = 10;
const DPAD = {
  up: false,
  down: false,
  left: false,
  right: false
};

const player = new PhysicsEntity({
  x: PLAYER_SIZE * 4,
  y: Math.floor(game.height / 2) - (PLAYER_SIZE / 2),
  height: PLAYER_SIZE,
  width: PLAYER_SIZE
});

player.cssClass = "player";
player.sprite = "https://art.pixilart.com/eed75aa54e6c6f6.png";
player.collisions = true;

player.addEvent("KEY_W_DOWN,KEY_SPACE_DOWN", () => {
  DPAD.up = true;
  if (player.gravity_y === 0) {
    player.velocity_y = -PLAYER_YSPEED;
  }
});
player.addEvent("KEY_W_UP", () => {
  DPAD.up = false;
});
player.addEvent("KEY_S_DOWN", () => {
  DPAD.down = true;
});
player.addEvent("KEY_S_UP", () => {
  DPAD.down = false;
});
player.addEvent("KEY_A_DOWN", () => {
  DPAD.left = true;
  player.scale_x = -1;
});
player.addEvent("KEY_A_UP", () => {
  DPAD.left = false;
});
player.addEvent("KEY_D_DOWN", () => {
  DPAD.right = true;
  player.scale_x = 1;
});
player.addEvent("KEY_D_UP", () => {
  DPAD.right = false;
});
player.addEvent("KEY_ESCAPE_DOWN", () => {
  window.location.reload();
});

player.addEvent("STEP", () => {
  player.velocity_x = (DPAD.left ? -PLAYER_HSPEED : 0) + (DPAD.right ? PLAYER_HSPEED : 0);
  player.velocity_y = Math.clamp(player.velocity_y, -PLAYER_YSPEED, PLAYER_YSPEED);

  fpsCounterEl.innerText = game.fps;
  timeCounterEl.innerText = (++game.time / game.fps).toFixed(2);
  const collisionDir = game.checkCollision(player);
  if (collisionDir.y === true) {
    player.gravity_y = 0;
    player.velocity_y = 0;
  } else {
    player.gravity_y = 0.5;
  }
});

player.addEvent("OUT_OF_BOUNDS", () => {
  if (player.dead) {
    return;
  }

  player.gravity_y = 0;
  player.dead = true;
  var audio = new Audio("https://quicksounds.com/uploads/tracks/231740186_1024745317_1238142249.mp3");
  audio.currentTime = 0.45; // just to offset silence in the example audio I've used
  audio.play();
  audio.addEventListener("ended", function () {
    window.location.reload();
  });
});

game.addEntity(player);

const solidBlock = new PhysicsEntity({
  x: 0,
  y: Math.floor(game.height) - (PLAYER_SIZE * 4),
  height: PLAYER_SIZE * 4,
  width: game.width
});

solidBlock.collisions = true;

solidBlock.cssClass = "solid-block";
solidBlock.sprite = "https://lh3.googleusercontent.com/Cll2ysceEJGsBJx-YMqNCzoXYp7MI8_utNzdo9Mh_5EzEolkghmdQ83sdH-RQA9MWiXHe-AyfE05EggrGc-ykEetZZsjW4yWlog=s400";
game.addEntity(solidBlock);

/* Bugs to fix, as an exercise
 1. xscale is erratic when you mash A & D together
 2. Mario becomes spiderman if collision is horizontal
*/