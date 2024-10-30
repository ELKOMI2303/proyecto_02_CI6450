import { Graph, Node, Connection } from "../src/Graph.js";
import { Vector } from "./Vector.js";
import {
  KinematicSteeringBehaviors,
  Staticc,
  SteeringOutput,
} from "./Kinematic.js";

import { pathfindDijkstra } from "./Dijktra.js";

import Phaser from "phaser";
import { State,Transition, StateMachine } from "./StateMachine.js";
import { Seek } from "./Seek.js";


var kinematicnode = null;
var SeekCh1;
var currentFrame;
var currentNode;

class PatrolState extends State {
    constructor(character, graph, graphic) {
        super("Patrullar");
        this.character = character;
        this.graph = graph; // Grafo que contiene los nodos
        this.currentTarget = "14,4"; // Punto inicial
        this.shortestPath = null;
       

        // Crear el gráfico para la ruta
        this.routeGraphics = graphic
        this.routeGraphics.lineStyle(2, 0x00ff00, 1); // Estilo de línea verde

        // Añadir acciones específicas del estado
        this.addAction(() => this.patrol());
        // Añadir acciones de entrada y salida
        this.addEntryAction(() => {
            console.log("Inicio de Patrullaje");
            this.calculatePath(this.currentTarget); // Calcular la ruta al iniciar el estado
        });
        this.addExitAction(() => {
            console.log("Saliendo del Patrullaje");
            this.routeGraphics.clear(); // Limpiar la ruta al salir del estado
        });
    }

    // Método para calcular el camino
    calculatePath(target) {
        const startNodeName = `${Math.floor(this.character.position.x / 16)},${Math.floor(this.character.position.y / 16)}`;
        const nodeA = this.graph.getNode(startNodeName);
        const nodeB = this.graph.getNode(target);

        if (nodeA == null || nodeB == null) {
            console.log(`Nodo inicial o final no encontrado: ${startNodeName}, ${target}`);
            return;
        }

        this.shortestPath = pathfindDijkstra(this.graph, nodeA, nodeB);
        console.log(`Ruta calculada desde ${startNodeName} a ${target}`);
        this.currentTargetIndex = 0; // Reiniciar el índice de destino

        // Dibujar la ruta calculada
        this.drawRoute();
    }

    // Método para dibujar la ruta en el mapa
    drawRoute() {
        this.routeGraphics.clear(); // Limpiar gráficos anteriores
        this.routeGraphics.lineStyle(2, 0x00ff00, 1); // Estilo de línea verde

        if (!this.shortestPath || this.shortestPath.length === 0) {
            return;
        }

        // Dibujar la ruta entre los nodos
        for (let i = 0; i < this.shortestPath.length - 1; i++) {
            const currentEdge = this.shortestPath[i];
            const nextEdge = this.shortestPath[i + 1];

            const currentNode = this.graph.getNode(currentEdge.getToNode().name);
            const nextNode = this.graph.getNode(nextEdge.getToNode().name);

            const currentX = currentNode.x * 16 + 8; // Coordenadas centradas
            const currentY = currentNode.y * 16 + 8;
            const nextX = nextNode.x * 16 + 8;
            const nextY = nextNode.y * 16 + 8;

            // Dibujar línea entre los nodos
            this.routeGraphics.lineBetween(currentX, currentY, nextX, nextY);
        }
    }

    patrol() {
        if (this.shortestPath === null || this.shortestPath.length === 0) {
            const nextTarget = this.currentTarget === "14,4" ? "1,4" : "14,4";
            this.calculatePath(nextTarget);
            this.currentTarget = nextTarget;
            return;
        }

        // Obtener el objetivo actual
        const currentEdge = this.shortestPath[this.currentTargetIndex];
        const targetNodeName = currentEdge.getToNode().name;
        const targetNode = this.graph.getNode(targetNodeName);
        const targetX = targetNode.x * 16; // Convertir tile a píxeles
        const targetY = targetNode.y * 16; // Convertir tile a píxeles

        // Calcular la dirección hacia el objetivo
        const directionX = targetX - this.character.position.x;
        const directionY = targetY - this.character.position.y;
        // Calcular la distancia al objetivo
        const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

        // Umbral para considerar que hemos llegado al nodo
        const distanceThreshold = 14; // Ajustar este valor según sea necesario

        // Si estamos cerca del objetivo, cambiar al siguiente
        if (distance < distanceThreshold) {
            this.currentTargetIndex++; // Avanzar al siguiente nodo en la ruta

            // Si hemos llegado al final del camino, recalcular el camino al siguiente nodo
            if (this.currentTargetIndex >= this.shortestPath.length) {
                const nextTarget = this.currentTarget === "14,4" ? "1,4" : "14,4";
                this.calculatePath(nextTarget);
                this.currentTarget = nextTarget;

                // Detener al personaje
                this.character.velocity = new Vector(0, 0);
            }
        } else {
            // Mover el personaje hacia el objetivo usando el comportamiento de Seek
            if (kinematicnode == null) {
                const positionnode = new Staticc(new Vector(targetX, targetY), Math.PI / 2);
                const velocitynode = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
                kinematicnode = new KinematicSteeringBehaviors(positionnode, velocitynode, 0);
                SeekCh1 = new Seek(this.character, kinematicnode, 15);
            } else {
                kinematicnode.position = new Vector(targetX, targetY);
            }
            const steering = SeekCh1.getSteering();
            this.character.update(steering, currentFrame, 15);
        }
    }
}


class ChaseState extends State {
    constructor(character) {
        super("Perseguir");
        this.character = character;

        this.addAction(() => console.log("persiguiendo"));
        this.addEntryAction(() => console.log("Inicio de Persecución"));
        this.addExitAction(() => console.log("Saliendo de la Persecución"));
    }
}

class ReturnState extends State {
    constructor(character) {
        super("Regresar");
        this.character = character;

        this.addAction(() => "regresando");
        this.addEntryAction(() => console.log("Regresando a Patrullaje"));
        this.addExitAction(() => console.log("Saliendo del regreso"));
    }
}


function getWorldCoordinates(tileX, tileY, tileSize) {
    const worldX = tileX * tileSize + tileSize / 2;
    const worldY = tileY * tileSize + tileSize / 2;
    return { worldX, worldY };
  }


  function getTileCoordinates(x, y, tileSize) {
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    return { tileX, tileY };
  }


var buttons = document.querySelectorAll(".arcade-button");
buttons.forEach((button) => {
  // Obtenemos el valor del atributo 'data-game-option'
  const option = button.getAttribute("data-game-option");
  button.addEventListener("click", () => {
    startPhaserGame(option);
  });
});
var graph
var nodes = {}
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

    this.load.spritesheet("trainer", "./public/trainer1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("trainer2", "./public/trainer1.png", {
        frameWidth: 64,
        frameHeight: 64,
      });
  }

  function createGame() {
    this.input.keyboard.on("keydown-ESC", returnToMenu);

    var map = this.make.tilemap({
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
    graphics.fillStyle(0xff0000, 1); // Color rojo para los puntos

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
      frames: this.anims.generateFrameNumbers("trainer", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("trainer", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("trainer", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("trainer", {
        start: 12,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

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
        frames: this.anims.generateFrameNumbers("trainer2", { start: 8, end: 11 }),
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


    const player = this.physics.add.sprite(100, 100, 'trainer').setScale(0.30); 
    const cursors = this.input.keyboard.createCursorKeys(); 
    this.player = player; 
    this.cursors = cursors;
    this.map = map;

    const character = this.physics.add.sprite( 14*16,4*16, 'trainer2').setScale(0.30); // Personaje que patrulla
    this.character = character

    var positionCharacter = new Staticc(new Vector(character.x, character.y),Math.PI/2);
    var velocityCharacter = new Vector(0, 0); // Inicialmente moviéndose hacia la derecha
    this.kinematiccharacter= new KinematicSteeringBehaviors(
        positionCharacter,
        velocityCharacter,
        0
      );



    const patrol = new PatrolState(this.kinematiccharacter,graph,this.add.graphics());
    const chase = new ChaseState(character);
    const returnState = new ReturnState(character);

    // Añadir transiciones
    patrol.addTransition(new Transition(() => canSeePlayer(character, player), chase));
    chase.addTransition(new Transition(() => !canSeePlayer(character, player) || isPlayerFarAway(character, player), returnState));
    returnState.addTransition(new Transition(() => isPlayerFarAway(character, player), patrol));

    this.stateMachine = new StateMachine(patrol);

  }

  function updateGame(time, delta) {
    const { player, cursors,map,character,kinematiccharacter } = this;

    currentFrame = delta/1000;


     const tileX = Math.floor(player.x / map.tileWidth);
     const tileY = Math.floor(player.y / map.tileHeight);

     const nextTilePos = getNextTilePosition(player.x, player.y, cursors, map);
     const collides = checkCollides(nextTilePos.tileX, nextTilePos.tileY, map);

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
    const actions = this.stateMachine.update();
    
    // Ejecutar las acciones devueltas por la máquina de estados
    actions.forEach(action => action());


    character.x = kinematiccharacter.position.x;
    character.y = kinematiccharacter.position.y;
   
    setRotation(kinematiccharacter.orientation,character);


  }

  function returnToMenu() {
    // Destruir la instancia del juego
    game.destroy(true);

    // Mostrar el menú nuevamente
    document.getElementById("menu").style.display = "block";
  }
}


// Función para verificar si el personaje puede ver al jugador
function canSeePlayer(character, player) {
    const distance = Phaser.Math.Distance.Between(character.x, character.y, player.x, player.y);
    return distance < 3*16; // Dentro del rango de visión y a 3 casillas
}

// Función para verificar si el jugador se aleja más de 5 casillas
function isPlayerFarAway(character, player) {
    const distance = Phaser.Math.Distance.Between(character.x, character.y, player.x, player.y);
    return distance > 5*16; // Retorna verdadero si el jugador está a más de 5 casillas
}

function setRotation(orientation, character) {
    // Redondear la orientación a los ángulos principales
    const roundedOrientation = Math.floor(orientation * 2 / Math.PI) * (Math.PI / 2);

    // Cambiar animación según la orientación redondeada
    switch (roundedOrientation) {
        case Math.PI / 2: // Arriba
            character.anims.play("walk_up2", true);
            break;
        case -Math.PI / 2: // Abajo
            character.anims.play("walk_down2", true);
            break;
        case Math.PI: // Izquierda
        case -Math.PI:
            character.anims.play("walk_left2", true);
            break;
        case 0: // Derecha
            character.anims.play("walk_right2", true);
            break;
        default:
            character.anims.stop();
            break;
    }
}



// Función para obtener la próxima posición de tile en función de la dirección del jugador
function getNextTilePosition(x, y, cursors, map) {
    const tileWidth = map.tileWidth;
    const tileHeight = map.tileHeight;
  
    let tileX = Math.floor(x / tileWidth);
    let tileY = Math.floor(y / tileHeight);
  
    if (cursors.left.isDown) {
      tileX -= 1;
    } else if (cursors.right.isDown) {
      tileX += 1;
    } else if (cursors.up.isDown) {
      tileY -= 1;
    } else if (cursors.down.isDown) {
      tileY += 1;
    }
  
    return { tileX, tileY };
  }
  
  // Función para verificar si un tile tiene la propiedad 'collides: true'
  function checkCollides(tileX, tileY, map) {
    const tile = map.getTileAt(tileX, tileY, true, "nivel1"); // Cambiar la capa si es necesario
    const tile2 = map.getTileAt(tileX, tileY, true, "grass");
    if (tile && tile.properties.collides) {
      return true;
    }

    if (tile2 && tile2.properties.collides) {
        return true;
      }
  

    return false;
  }