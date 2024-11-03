import { State } from "./StateMachine.js";
import {Seek} from "./Seek.js"
import { checkCollides } from "./Helpers.js";

import { pathfindDijkstra } from "./Dijktra.js";
import { KinematicSteeringBehaviors } from "./Kinematic.js";
import { Vector } from "./Vector.js";
import { canSeePlayer,isPlayerFarAway } from "./Helpers.js";

export class PatrolState extends State {
    constructor(character, graph, graphic, map,currentFrame) {
      super("Patrullar");
      this.character = character;
      this.graph = graph; // Grafo que contiene los nodos
      this.currentTarget = "14,4"; // Punto inicial
      this.shortestPath = null;
      this.map = map;
      this.currentFrame = currentFrame;
  
      // Crear el gráfico para la ruta
      this.routeGraphics = graphic;
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

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
  
    // Método para calcular el camino
    calculatePath(target) {
      const startNodeName = `${Math.floor(
        this.character.kinematicSteering.position.x / 16
      )},${Math.floor(this.character.kinematicSteering.position.y / 16)}`;
      const nodeA = this.graph.getNode(startNodeName);
      const nodeB = this.graph.getNode(target);
  
      if (nodeA == null || nodeB == null) {
        console.log(
          `Nodo inicial o final no encontrado: ${startNodeName}, ${target}`
        );
        return;
      }
  
      this.shortestPath = pathfindDijkstra(this.graph, nodeA, nodeB);
      //console.log(`Ruta calculada desde ${startNodeName} a ${target}`);
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
  
      const currentEdge = this.shortestPath[this.currentTargetIndex];
      const targetNodeName = currentEdge.getToNode().name;
      const targetNode = this.graph.getNode(targetNodeName);
      const targetX = targetNode.x * 16; // Convertir tile a píxeles
      const targetY = targetNode.y * 16; // Convertir tile a píxeles
  
      // Obtener la posición actual del NPC
      const currentPosition = this.character.kinematicSteering.position;
  
      // Calcular la dirección hacia el siguiente nodo
      const directionX = targetX - currentPosition.x;
      const directionY = targetY - currentPosition.y;
  
      // Calcular la distancia al siguiente nodo
      const distance = Math.sqrt(directionX ** 2 + directionY ** 2);
      const distanceThreshold = 14; // Ajustar este valor según sea necesario
  
      // Cambiar de objetivo si está cerca
      if (distance < distanceThreshold) {
        this.currentTargetIndex++; // Avanzar al siguiente nodo en la ruta
  
        if (this.currentTargetIndex >= this.shortestPath.length) {
          const nextTarget = this.currentTarget === "14,4" ? "1,4" : "14,4";
          this.calculatePath(nextTarget);
          this.currentTarget = nextTarget;
          this.character.kinematicSteering.velocity = new Vector(0, 0); // Detener al personaje
        }
      } else {
        // Normalizar la dirección solo si la distancia no es cero
        if (distance > 0) {
          const normalizedDirection = new Vector(
            directionX / distance,
            directionY / distance
          );
  
          // Actualizar la orientación del NPC
          this.character.kinematicSteering.orientation = Math.atan2(
            normalizedDirection.y,
            normalizedDirection.x
          );
  
          // Calcular la posición del próximo tile
          const nextTileX = Math.floor(
            (currentPosition.x +
              normalizedDirection.x *
                this.character.kinematicSteering.velocity.x) /
              this.map.tileWidth
          );
          const nextTileY = Math.floor(
            (currentPosition.y +
              normalizedDirection.y *
                this.character.kinematicSteering.velocity.y) /
              this.map.tileHeight
          );
  
          // Verificar si hay colisión en el siguiente tile
          if (!checkCollides(nextTileX, nextTileY, this.map)) {
            // Si no hay colisión, mover al NPC
            const speed = 20; // Ajusta la velocidad según sea necesario
            this.character.kinematicSteering.velocity =
              normalizedDirection.scale(speed); // Establecer la velocidad
            this.character.update(
              this.character.kinematicSteering,
              this.currentFrame,
              15
            );
          } else {
            // Si hay colisión, detener al NPC
            this.character.kinematicSteering.velocity = new Vector(0, 0); // Detener el personaje
          }
        }
      }
    }
  }
  
  export class AlarmState extends State {
    constructor(character, player,currentFrame) {
      super("Alarm");
      this.character = character;
      this.player = player;
      this.alarmStartTime = null;
  
      // Añadir acciones de entrada y salida
      this.addEntryAction(() => {
        console.log("Entrnado en el esatdo alarma");
        this.character.showExclamationMark();
        this.character.kinematicSteering.velocity = new Vector(0, 0); // Detener al personaje
        this.alarmStartTime = this.character.scene.time.now; // Registrar el tiempo de inicio de la alarma
      });
  
      this.addExitAction(() => {
        console.log("Exiting Alarm State");
        this.character.hideExclamationMark();
      });
  
      // Añadir acciones específicas del estado
      this.addAction(() => this.checkAlarmState());
    }
  
    checkAlarmState() {
      const currentTime = this.character.scene.time.now;
  
      // Verificar si el jugador sigue dentro del campo de visión
      if (!canSeePlayer(this.character, this.player)) {
        console.log("Player out of range, returning to patrol");
        return; // El estado de patrullaje se activará automáticamente cuando se ejecute la máquina de estados.
      }
  
      // Verificar si han pasado 5 segundos desde que se activó la alarma
      if (currentTime - this.alarmStartTime >= 5000) {
        console.log("5 seconds passed, transitioning to chase");
        return; // La transición al estado de persecución se activará automáticamente.
      }
    }

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
  }
  
  export class ChaseState extends State {
    constructor(character, player,currentFrame) {
      super("Perseguir");
      this.character = character; // Personaje que persigue
      this.player = player; // El jugador que está siendo perseguido
      this.currentFrame =this.currentFrame
  
      this.kinematicPlayer = new KinematicSteeringBehaviors(
        new Vector(0, 0),
        new Vector(0, 0),
        0
      ); // Inicializar el kinematic
  
      // Añadir acciones específicas del estado
      this.addAction(() => this.chase());
      // Añadir acciones de entrada y salida
      this.addEntryAction(() => {
        console.log("Iniciando persecución");
      });
      this.addExitAction(() => {
        console.log("Saliendo de la persecución");
      });
    }
  
    // Método para calcular si el jugador está dentro del rango de persecución
    isPlayerInRange() {
      const dx = this.character.kinematicSteering.position.x - this.player.x;
      const dy = this.character.kinematicSteering.position.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      const tileSize = 16; // Asumiendo que cada tile es de 16x16
      const threshold = 5 * tileSize; // 5 casillas
  
      return distance < threshold;
    }
  
    // Método para verificar si el jugador está en la misma casilla
    isPlayerInSameTile() {
      const characterTileX = Math.floor(
        this.character.kinematicSteering.position.x / 16
      );
      const characterTileY = Math.floor(
        this.character.kinematicSteering.position.y / 16
      );
      const playerTileX = Math.floor(this.player.x / 16);
      const playerTileY = Math.floor(this.player.y / 16);
  
      return characterTileX === playerTileX && characterTileY === playerTileY;
    }
  
    chase() {
      // Verificar si el jugador está dentro del rango de persecución
      if (!this.isPlayerInRange()) {
        // Si el jugador se aleja, el comportamiento puede cambiar a otra lógica
        // No cambiar el estado, pero podrías decidir cómo manejar la lógica aquí
        console.log("El jugador se ha alejado.");
        return;
      }
  
      // Actualizar la posición del Kinematic del jugador
      this.kinematicPlayer.position = new Vector(this.player.x, this.player.y);
  
      // Obtener el steering de Seek
      const seekBehavior = new Seek(
        this.character.kinematicSteering,
        this.kinematicPlayer,
        30
      );
      const steering = seekBehavior.getSteering();
  
      // Actualizar el personaje con el steering calculado
      this.character.update(steering, this.currentFrame, 30);
  
      // Si el jugador está en la misma casilla, mantener la persecución
      if (this.isPlayerInSameTile()) {
        console.log(
          "El jugador está en la misma casilla, manteniendo persecución."
        );
      }
    }

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
      }
  }
  
  export class ReturnState extends State {
    constructor(character) {
      super("Regresar");
      this.character = character;
  
      this.addAction(() => "regresando");
      this.addEntryAction(() => console.log("Regresando a Patrullaje"));
      this.addExitAction(() => console.log("Saliendo del regreso"));
    }
  }