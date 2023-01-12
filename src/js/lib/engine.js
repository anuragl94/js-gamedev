const MAX_FRAMES_PER_SECOND = 60; // I'm just going to assume this because I can

function getKeyName(key) {
  // don't come to me complaining about this if-else statement
  if (/^[a-z]$/.test(key)) {
    return `KEY_${key.toUpperCase()}`;
  } else if (key === " ") {
    return `KEY_SPACE`;
  } else {
    return `KEY_${key.toUpperCase()}`;
  }
}

export default class Engine {
  // I feel that my FPS logic is flawed, but it's a start
  fps = MAX_FRAMES_PER_SECOND;
  #frame = 0;
  #mouse = {
    x: 0,
    y: 0
  };
  get mouse() {
    return { ...this.mouse };
  }
  get canExecuteThisFrame() {
    return this.#frame % Math.floor(MAX_FRAMES_PER_SECOND / this.fps) === 0;
  }
  height;
  width;
  entities = new Set();
  _el;
  #listeners = new Map();
  triggerEventOnEntities(eventName, ...args) {
    if (!eventName) {
      return;
    }
    for (const entity of this.entities) {
      if (entity.actions.has(eventName)) {
        entity.actions.get(eventName).apply(entity, args);
      }
    }
  }
  bindListeners() {
    this.#listeners.set(
      "onkeydown",
      window.addEventListener(
        "keydown",
        (e) => {
          e.preventDefault();
          const keyName = getKeyName(e.key);
          if (!e.repeat) {
            // console.log(`Key "${keyName}" pressed [event: keydown]`);
            this.triggerEventOnEntities(`${keyName}_DOWN`);
          } else {
            // console.log(`Key "${keyName}" repeating [event: keydown]`);
            this.triggerEventOnEntities(`${keyName}_DOWN`);
          }
        },
        false
      )
    );
    this.#listeners.set(
      "onkeyup",
      window.addEventListener(
        "keyup",
        (e) => {
          e.preventDefault();
          const keyName = getKeyName(e.key);
          // console.log(`Key "${getKeyName(e.key)}" released [event: keyup]`);
          this.triggerEventOnEntities(`${keyName}_UP`);
        },
        false
      )
    );
    this.#listeners.set(
      "onmousemove",
      window.addEventListener(
        "mousemove",
        (e) => {
          this.#mouse.x = e.clientX;
          this.#mouse.y = e.clientY;
        },
        false
      )
    );
  }
  // --- //
  constructor(options = {}, mount) {
    this.height = options.height;
    this.width = options.width;
    this._el = mount;
    this.initialize();
    const executeEveryFrame = () => {
      window.requestAnimationFrame(() => {
        if (this.canExecuteThisFrame) {
          this.draw();
        }
        this.#frame = (1 + this.#frame) % MAX_FRAMES_PER_SECOND;

        this.triggerEventOnEntities("STEP", this.#frame);

        for (const entity of this.entities) {
          if (
            (entity.x + entity.width < 0) ||
            (entity.x > this.width) ||
            (entity.y + entity.height < 0) ||
            (entity.y > this.height)
          ) {
            if (entity.actions.has("OUT_OF_BOUNDS")) {
              entity.actions.get("OUT_OF_BOUNDS").apply(entity);
            }
          } else {
            if (entity.actions.has("IN_BOUNDS")) {
              entity.actions.get("IN_BOUNDS").apply(entity);
            }
          }
        }
        executeEveryFrame();
      });
    };
    executeEveryFrame();
  }
  draw() {
    // console.info("Render");
    for (const entity of this.entities) {
      entity.velocity_x += entity.gravity_x;
      entity.velocity_y += entity.gravity_y;
      entity.x += entity.velocity_x;
      entity.y += entity.velocity_y;
      entity._el.style.top = `${entity.y}px`;
      entity._el.style.left = `${entity.x}px`;
      entity._el.style.width = `${entity.width}px`;
      entity._el.style.height = `${entity.height}px`;
      if (entity.sprite) {
        entity._el.style.backgroundImage = `url(${entity.sprite})`;
        entity._el.style.transform = `scale3d(${entity.scale_x}, ${entity.scale_y}, 1) rotate3d(0, 0, 1, ${entity.angle || 0}deg)`;
      } else {
        entity._el.style.backgroundImage = `none`;
      }
      if (entity.cssClass) {
        entity._el.setAttribute("data-class", entity.cssClass);
      } else {
        entity._el.removeAttribute("data-class");
      }
    }
  }
  addEntity(entity) {
    entity._el = document.createElement("div");
    entity._el.classList.add("entity");
    this._el.appendChild(entity._el);
    this.entities.add(entity);
  }
  removeEntity(entity) {
    this._el.removeChild(entity._el);
    this.entities.delete(entity);
  }
  initialize() {
    this._el.style.width = `${this.width}px`;
    this._el.style.height = `${this.height}px`;
    this.bindListeners();
  }
  #checkOverlap(entity1, entity2) {
    const div1 = entity1._el;
    const div2 = entity2._el;
    const [d1bounds, d2bounds] = [div1, div2].map((d) =>
      d.getBoundingClientRect()
    );
    return (
      d1bounds.x < d2bounds.x + d2bounds.width &&
      d1bounds.x + d1bounds.width > d2bounds.x &&
      d1bounds.y < d2bounds.y + d2bounds.height &&
      d1bounds.height + d1bounds.y > d2bounds.y
    );
  }
  checkCollision(entity) {
    if (entity.collisions === true) {
      // RIP performance
      const otherPhysicsEntity = [...this.entities].find(otherEntity => (
        otherEntity.collisions === true &&
        entity !== otherEntity &&
        this.#checkOverlap(entity, otherEntity)
      ));
      if (otherPhysicsEntity) {
        return {
          x: true, // mmm TODO
          y: true, // also TODO
          other: otherPhysicsEntity
        }
      }
    }
    return {
      x: false,
      y: false
    }
  }
}

export class Entity {
  x = 0;
  y = 0;
  gravity_x = 0;
  gravity_y = 0;
  velocity_x = 0;
  velocity_y = 0;
  height = 0;
  width = 0;
  sprite;
  scale_x = 1;
  scale_y = 1;
  angle = 0;
  actions = new Map();
  cssClass = "";
  constructor(options = {}) {
    this.height = options.height;
    this.width = options.width;
    this.x = options.x;
    this.y = options.y;
  }
  addEvent(keyevents, action) {
    const eventNames = keyevents.split(",");
    eventNames.forEach(keyevent => {
      this.actions.set(`${keyevent}`, action.bind(this));
    })
  }
  destroy() {

  }
}

export class PhysicsEntity extends Entity {
  collisions = false;
  constructor(options = {}) {
    super(options);
    this.collisions = options.collisions;
  }
}