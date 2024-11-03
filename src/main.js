import { Graph, Node, Connection } from "../src/Graph.js";
import { Vector } from "./Vector.js";
import { canSeePlayer, isPlayerFarAway } from "./Helpers.js";
import { KinematicCharacter } from "./Kinematic.js";

import { getNextTilePosition, checkCollides } from "./Helpers.js";

import Phaser from "phaser";
import { Transition, StateMachine } from "./StateMachine.js";
import { Character } from "./Character.js";
import {
  AlarmState,
  PatrolState,
  ReturnState,
  ChaseState,
} from "./MachineCharacter2.js";
import { ExploreState } from "./MachineCharacter1.js";

import { checkForNearbyPokeball } from "./Helpers.js";

var currentFrame;
var map;

var buttons = document.querySelectorAll(".arcade-button");
buttons.forEach((button) => {
  // Obtenemos el valor del atributo 'data-game-option'
  const option = button.getAttribute("data-game-option");
  button.addEventListener("click", () => {
    startPhaserGame(option);
  });
});
var graph;
var nodes = {};
function startPhaserGame(option) {
  // Oculta el menú
  document.getElementById("menu").style.display = "none";

  // Inicia el juego en Phaser
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
    scene: {
      preload: preloadGame,
      create: createGame,
      update: updateGame,
    },
  };
  const game = new Phaser.Game(config);

  function preloadGame() {
    this.load.tilemapTiledJSON("map", "./map/map_pokemon.tmj");

    this.load.image("tiles", "./map/tileset.png");

    this.load.image("exclamation", "./public/exclamation.png");

    this.load.spritesheet("player", "./public/player.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("trainer1", "./public/trainer1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("trainer2", "./public/trainer2.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  function createGame() {
    this.input.keyboard.on("keydown-ESC", returnToMenu);

    map = this.make.tilemap({
      key: "map",
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset = map.addTilesetImage("tileset", "tiles"); // 'tileset' is the name defined in th

    // Crear capas del mapa usando los nombres de Tiled
    const grass = map.createLayer("grass", tileset, 0, 0);
    const valor1 = map.createLayer("nivel1", tileset, 0, 0);
    const valor2 = map.createLayer("nivel2", tileset, 0, 0);
    const valor3 = map.createLayer("nivel3", tileset, 0, 0);

    valor1.setCollisionByProperty({ collides: true });
    valor2.setCollisionByProperty({ collides: true });
    valor3.setCollisionByProperty({ collides: true });

    graph = new Graph();
    const mapWidth = 25; // Ancho del mapa
    const mapHeight = 25; // Altura del mapa

    // Añadir nodos al grafo a partir de la capa de césped y verificar capas superiores
    const grassLayer = map.getLayer("grass").data; // Nombre de la capa de césped
    const objectLayers = [
      map.getLayer("nivel1").data, // Añade aquí tus capas de objetos
      map.getLayer("nivel2").data, // Añade aquí tus capas de árboles u otros obstáculos
    ];

    // Crear un objeto Graphics para dibujar los nodos
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff9999, 0.75); // Color rojo para los puntos

    // Primero, añadir todos los nodos
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const index = y * mapWidth + x;
        const tile = grassLayer[y][x]; // Accede al tile utilizando x e y
        const nodeName = `${x},${y}`;

        // Verificar si la posición no está ocupada en las capas superiores y si el tile no tiene propiedad 'collides'
        let isOccupied = false;

        // Verificar la propiedad 'collides' en la capa de césped
        const tileProperties = tile.properties || {};
        if (tileProperties.collides && tileProperties.collides === true) {
          isOccupied = true;
        }

        if (!isOccupied) {
          for (let layer of objectLayers) {
            const upperTile = layer[y][x];
            if (
              upperTile &&
              upperTile.properties &&
              upperTile.properties.collides
            ) {
              isOccupied = true;
              break;
            }
          }
        }

        // Añadir nodo solo si no está ocupado en capas superiores y el tile en césped no tiene 'collides: true'
        if (!isOccupied) {
          const node = new Node(nodeName, x, y);
          graph.addNode(node);

          // Pintar un punto en el mapa para indicar el nodo

          graphics.fillCircle(
            x * map.tileWidth + map.tileWidth / 2,
            y * map.tileHeight + map.tileHeight / 2,
            5
          );
        }
      }
    }

    // Luego, añadir las conexiones entre nodos existentes
    graph.nodes.forEach((node) => {
      const [x, y] = node.name.split(",").map(Number);

      const neighbors = [
        { dx: 1, dy: 0 }, // derecha
        { dx: -1, dy: 0 }, // izquierda
        { dx: 0, dy: 1 }, // abajo
        { dx: 0, dy: -1 }, // arriba
      ];

      neighbors.forEach((neighbor) => {
        const nx = x + neighbor.dx;
        const ny = y + neighbor.dy;
        const neighborName = `${nx},${ny}`;

        if (graph.nodes.has(neighborName)) {
          const cost = 1; // Define el costo según tus necesidades
          graph.addConnection(node.name, neighborName, cost);
        }
      });
    });
    // Obtener la cámara principal
    const camera = this.cameras.main;

    // Ajustar el zoom de la cámara
    camera.setZoom(2); // Duplicar el tamaño de todo

    // Centrar la cámara en una posición específica del mapa
    camera.centerOn(200, 200);

    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("player", {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

    //##############################################################
    this.anims.create({
      key: "walk_down1",
      frames: this.anims.generateFrameNumbers("trainer1", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_left1",
      frames: this.anims.generateFrameNumbers("trainer1", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_right1",
      frames: this.anims.generateFrameNumbers("trainer1", {
        start: 8,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_up1",
      frames: this.anims.generateFrameNumbers("trainer1", {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

    //####################################################
    this.anims.create({
      key: "walk_down2",
      frames: this.anims.generateFrameNumbers("trainer2", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_left2",
      frames: this.anims.generateFrameNumbers("trainer2", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_right2",
      frames: this.anims.generateFrameNumbers("trainer2", {
        start: 8,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_up2",
      frames: this.anims.generateFrameNumbers("trainer2", {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

    const player = this.physics.add
      .sprite(3 * 16, 10 * 16, "player")
      .setScale(0.35);
    const cursors = this.input.keyboard.createCursorKeys();
    this.player = player;
    this.cursors = cursors;
    this.map = map;
    //#############################CHARACTER 1 #######################################
    const characterSprite1 = this.physics.add
      .sprite(7 * 16, 21 * 16, "trainer1")
      .setScale(0.35);

    this.character1= characterSprite1
    const character1 = new Character(characterSprite1);
    this.kinematiccharacter1 = new KinematicCharacter(character1, this);

    const explore = new ExploreState(
      this.kinematiccharacter1,
      graph,
      this.add.graphics(),
      map,
      currentFrame
    );

    // const alarm1 = new AlarmState1(this.kinematiccharacter1, player, currentFrame);

    explore.addTransition(
      new Transition(
        () =>
          checkForNearbyPokeball(
            this.kinematiccharacter1.kinematicSteering.position,
            map
          ),
        null
      )
    );

    this.explore = explore;

    this.stateMachine1 = new StateMachine(explore);

    //#############################CHARACTER 2###############################################
    // Crear el personaje patrullando
    const characterSprite2 = this.physics.add
      .sprite(10 * 16, 4 * 16, "trainer2")
      .setScale(0.35);
    this.character2 = characterSprite2;

    const character2 = new Character(characterSprite2);
    this.kinematiccharacter2 = new KinematicCharacter(character2, this);

    const patrol = new PatrolState(
      this.kinematiccharacter2,
      graph,
      this.add.graphics(),
      map,
      currentFrame
    );
    const alarm = new AlarmState(
      this.kinematiccharacter2,
      player,
      currentFrame
    );
    const chase = new ChaseState(
      this.kinematiccharacter2,
      player,
      currentFrame
    );
    const returnState = new ReturnState(this.kinematiccharacter2, currentFrame);

    this.alarm = alarm;
    this.patrol = patrol;
    this.chase = chase;
    // Transiciones de estado
    patrol.addTransition(
      new Transition(
        () => canSeePlayer(this.kinematiccharacter2, player),
        alarm
      )
    ); // De patrullaje a alarma
    alarm.addTransition(
      new Transition(
        () => !canSeePlayer(this.kinematiccharacter2, player),
        patrol
      )
    ); // De alarma a patrullaje
    alarm.addTransition(
      new Transition(
        () =>
          canSeePlayer(this.kinematiccharacter2, player) &&
          this.kinematiccharacter.scene.time.now - alarm.alarmStartTime >= 5000,
        chase
      )
    ); // De alarma a persecución
    chase.addTransition(
      new Transition(
        () => isPlayerFarAway(this.kinematiccharacter2, player),
        returnState
      )
    ); // De persecución a regreso
    returnState.addTransition(
      new Transition(
        () => isPlayerFarAway(this.kinematiccharacter2, player),
        patrol
      )
    ); // De regreso a patrullaje

    this.stateMachine2 = new StateMachine(patrol);
    //#######################################CHARACTER 2 #########################################
  }

  function updateGame(time, delta) {
    const {
      player,
      cursors,
      map,
      character1,
      character2,
      kinematiccharacter2,
      chase,
      patrol,
      alarm,
      kinematiccharacter1,
      explore
    } = this;

    currentFrame = delta / 1000;

    // Verificar colisiones antes de mover al jugador
    const nextTile = getNextTilePosition(
      player.x,
      player.y,
      cursors,
      map,
      player
    );
    const collides = checkCollides(nextTile.tileX, nextTile.tileY, map);

    alarm.setCurrentFrame(currentFrame);
    chase.setCurrentFrame(currentFrame);
    patrol.setCurrentFrame(currentFrame);
    explore.setCurrentFrame(currentFrame);

    player.setVelocity(0);
    if (!collides) {
      // Si no hay colisión, permitir el movimiento del jugador
      if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("walk_left", true);
      } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play("walk_right", true);
      } else if (cursors.up.isDown) {
        player.setVelocityY(-160);
        player.anims.play("walk_up", true);
      } else if (cursors.down.isDown) {
        player.setVelocityY(160);
        player.anims.play("walk_down", true);
      } else {
        player.anims.stop();
      }
    }

    // Aquí actualizamos la máquina de estados
    const actions1 = this.stateMachine1.update();

    // Ejecutar las acciones devueltas por la máquina de estados
    actions1.forEach((action) => action());

    character1.x = kinematiccharacter1.kinematicSteering.position.x;
    character1.y = kinematiccharacter1.kinematicSteering.position.y;

    setRotation1(kinematiccharacter1.kinematicSteering.orientation, character1);



    // Aquí actualizamos la máquina de estados
    const actions2 = this.stateMachine2.update();

    // Ejecutar las acciones devueltas por la máquina de estados
    actions2.forEach((action) => action());

    character2.x = kinematiccharacter2.kinematicSteering.position.x;
    character2.y = kinematiccharacter2.kinematicSteering.position.y;

    setRotation2(kinematiccharacter2.kinematicSteering.orientation, character2);
  }

  function returnToMenu() {
    // Destruir la instancia del juego
    game.destroy(true);

    // Mostrar el menú nuevamente
    document.getElementById("menu").style.display = "block";
  }
}

function setRotation2(orientation, character) {
  // Ajustar los rangos de orientación a direcciones específicas
  if (orientation >= -Math.PI / 4 && orientation < Math.PI / 4) {
    character.anims.play("walk_right2", true); // Derecha
  } else if (orientation >= Math.PI / 4 && orientation < (3 * Math.PI) / 4) {
    character.anims.play("walk_up2", true); // Arriba
  } else if (orientation >= (-3 * Math.PI) / 4 && orientation < -Math.PI / 4) {
    character.anims.play("walk_down2", true); // Abajo
  } else {
    character.anims.play("walk_left2", true); // Izquierda
  }
}


function setRotation1(orientation, character) {
  // Ajustar los rangos de orientación a direcciones específicas
  if (orientation >= -Math.PI / 4 && orientation < Math.PI / 4) {
    character.anims.play("walk_right1", true); // Derecha
  } else if (orientation >= Math.PI / 4 && orientation < (3 * Math.PI) / 4) {
    character.anims.play("walk_up1", true); // Arriba
  } else if (orientation >= (-3 * Math.PI) / 4 && orientation < -Math.PI / 4) {
    character.anims.play("walk_down1", true); // Abajo
  } else {
    character.anims.play("walk_left1", true); // Izquierda
  }
}

