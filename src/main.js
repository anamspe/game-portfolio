import { scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 952,
    "walk-down": { from: 952, to: 955, loop: true, speed: 8 },
    "idle-side": 991,
    "walk-side": { from: 991, to: 994, loop: true, speed: 8 },
    "idle-up": 1030,
    "walk-up": { from: 1030, to: 1033, loop: true, speed: 8 },
  }
});

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
  // load Map and convert to json object
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  // add map to canvas, set position and scale it - make it bigger using scaleFactor from constants
  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  // create player and set starting animation
  const player = k.make([k.sprite("spritesheet", { anim: "idle-down" }), k.area({
    // control shape of the hitbox
    shape: new k.Rect(k.vec2(0, 3), 10, 10),
  }),
  // makes it a tangible object that can collide with boundaries:
  k.body(),
  // set anchor point
  k.anchor("center"),
  // set spawn point
  k.pos(),
  k.scale(scaleFactor),
  // set player properties
  {
    speed: 250,
    direction: "down",
    isInDialogue: false, // not able to move while in dialogue
  },
    // tag for debug
    "player",
  ]);

  // check layers within the map and set boundaries and static objects in the map
  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name, // object or boundary name tag
        ]);

        // if player collides with specific object/boundary
        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            displayDialogue("TODO", () => player.isInDialogue = false);            
          });
        }
      }
      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor
          );
          k.add(player);
          continue;
        }
      }
    }
  }

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k)
  })

  // config cam movement
  k.onUpdate(() => {
    k.camPos(player.pos.x, player.pos.y + 100);
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    // Set player movements when they click/tap
    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed)

    
  })
});

k.go("main");