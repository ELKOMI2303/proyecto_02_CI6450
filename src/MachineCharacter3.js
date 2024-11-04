import { SimpleQueue } from "./PriorityQueue";
import { nearCharacter } from "./Helpers";
import { State } from "./StateMachine";
import { Vector } from "./Vector";
import { pathfindDijkstra } from "./Dijktra";
import { Seek } from "./Seek";
import { checkCollides,isNearTarget } from "./Helpers";


export class DetectState extends State {
    constructor(character, graph, graphic, map, currentFrame, priorityQueue) {
        super("Detect");
        this.character = character; // Personaje kinemático
        this.graph = graph; // Grafo de nodos
        this.map = map; // Mapa
        this.currentFrame = currentFrame; // Marco actual
        this.shortestPath = null; // Ruta más corta
        this.priorityQueue = priorityQueue; // Cola de prioridad con posiciones de pokeballs como Vectores (x, y)
        this.targetPosition = null; // Posición de la última pokebola retirada
        this.movingToTarget = false; // Indica si el personaje está avanzando hacia la posición

        // Acciones y transiciones
        this.addAction(() => this.explore());
        this.addEntryAction(() => console.log("Iniciando exploración"));
        this.addExitAction(() => {
            console.log("Saliendo de la exploración");
            this.routeGraphics.clear();
        });

        this.routeGraphics = graphic; // Gráficos para la ruta
        this.routeGraphics.lineStyle(4, 0x00ffff, 1); // Estilo de línea azul
    }

    explore() {
        // Verificar si hay una pokebola en la cola de prioridad
        if (!this.movingToTarget && this.priorityQueue.size() > 0) {
            this.targetPosition = this.priorityQueue.peek(); // Obtener y quitar la última posición de la cola
            this.character.setPokeballPosition(new Vector(this.targetPosition.x*16,this.targetPosition.y*16))
            console.log(`Pokebola retirada en: ${this.targetPosition.x}, ${this.targetPosition.y}`);
            this.calculatePathToPosition(this.targetPosition);
            this.movingToTarget = true; // Indicar que se está moviendo hacia la posición
        }

        // Si ya estamos avanzando hacia un objetivo, verificar si hemos llegado o estamos cerca
        if (this.movingToTarget && isNearTarget(this.targetPosition,this.character)) {
            console.log("Llegamos a la posición de la pokebola. Transición al estado ColocarPokeball...");
            this.movingToTarget = false; // Resetear el estado de movimiento
            // Aquí puedes incluir la lógica para activar la transición al estado `ColocarPokeball`
        }

        // Lógica de movimiento si hay un objetivo
        if (this.shortestPath !== null && this.shortestPath.length > 0 && this.movingToTarget) {
            this.followPath();
        }
    }

    calculatePathToPosition(position) {
        const startNodeName = `${Math.floor(this.character.kinematicSteering.position.x / 16)},${Math.floor(this.character.kinematicSteering.position.y / 16)}`;
        const targetNodeName = `${position.x},${position.y}`;
        const nodeA = this.graph.getNode(startNodeName);
        const nodeB = this.graph.getNode(targetNodeName);

        if (nodeA == null || nodeB == null) {
            console.log(`Nodo inicial o de destino no encontrado: ${startNodeName}, ${targetNodeName}`);
            return;
        }

        this.shortestPath = pathfindDijkstra(this.graph, nodeA, nodeB);
        this.currentTargetIndex = 0; // Reiniciar índice de destino
        this.drawRoute();
    }

    followPath() {
        const currentEdge = this.shortestPath[this.currentTargetIndex];
        const targetNodeName = currentEdge.getToNode().name;
        const targetNode = this.graph.getNode(targetNodeName);
        const targetX = targetNode.x * 16; // Convertir a píxeles
        const targetY = targetNode.y * 16; // Convertir a píxeles

        const targetKinematic = {
            position: new Vector(targetX, targetY),
            velocity: new Vector(0, 0),
            orientation: this.character.kinematicSteering.orientation // Mantener la orientación actual
        };

        const seekBehavior = new Seek(this.character.kinematicSteering, targetKinematic, 20); // Aceleración máxima de 20
        const steering = seekBehavior.getSteering();

        if (this.isCollidingWithWall(this.character.kinematicSteering.position, steering.linear)) {
            steering.linear = this.avoidWall(steering.linear);
        }

        this.character.kinematicSteering.update(steering, this.currentFrame, 20);

        const currentPosition = this.character.kinematicSteering.position;
        const directionX = targetX - currentPosition.x;
        const directionY = targetY - currentPosition.y;
        const distance = Math.sqrt(directionX ** 2 + directionY ** 2);
        const distanceThreshold = 16;

        if (distance < distanceThreshold) {
            this.currentTargetIndex++;
            if (this.currentTargetIndex >= this.shortestPath.length) {
                this.movingToTarget = false; // Detener movimiento cuando se alcanza el objetivo
                this.character.kinematicSteering.velocity = new Vector(0, 0);
            }
        }
    }

    drawRoute() {
        this.routeGraphics.clear();
        this.routeGraphics.lineStyle(4, 0x00ffff, 1);

        if (!this.shortestPath || this.shortestPath.length === 0) {
            return;
        }

        for (let i = 0; i < this.shortestPath.length - 1; i++) {
            const currentEdge = this.shortestPath[i];
            const nextEdge = this.shortestPath[i + 1];

            const currentNode = this.graph.getNode(currentEdge.getToNode().name);
            const nextNode = this.graph.getNode(nextEdge.getToNode().name);

            const currentX = currentNode.x * 16 + 8;
            const currentY = currentNode.y * 16 + 8;
            const nextX = nextNode.x * 16 + 8;
            const nextY = nextNode.y * 16 + 8;

            this.routeGraphics.lineBetween(currentX, currentY, nextX, nextY);
        }
    }

    // Comprobar si el personaje está colisionando con una pared
    isCollidingWithWall(position, direction) {
        const futureX = Math.floor((position.x + direction.x) / 16); // Convertir a coordenadas de tile
        const futureY = Math.floor((position.y + direction.y) / 16);
        return checkCollides(futureX, futureY, this.map); // Usar checkCollides para verificar
    }

    // Ajustar la dirección para evitar paredes
    avoidWall(direction) {
        // Ajustar ligeramente la dirección para evitar paredes
        const adjustmentAngle = Math.PI / 8; // Ajustar este ángulo según sea necesario
        const adjustedDirection = new Vector(
            direction.x * Math.cos(adjustmentAngle) - direction.y * Math.sin(adjustmentAngle),
            direction.x * Math.sin(adjustmentAngle) + direction.y * Math.cos(adjustmentAngle)
        );
        return adjustedDirection.normalize(); // Asegurarse de que la dirección siga siendo un vector unitario
    }

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
}


export class detectionNpcState extends State {
    constructor(character, player,currentFrame) {
      super("detectionNpc");
      this.character = character;
      this.player = player;
      this.alarmStartTime = null;
      this.currentFrame = currentFrame;
  
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
  
      // Verificar si el jugador sigue dentro del campo de visión
      if (!nearCharacter(this.character, this.player)) {
        console.log("Player out of range, returning to detection");
        return; // El estado de patrullaje se activará automáticamente cuando se ejecute la máquina de estados.
      }
  
    }

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
  }



  export class PlacementStatePokeball extends State {
    constructor(character, map, scene, priorityQueue) {
        super("Placement");
        this.character = character;
        this.map = map;
        this.scene = scene;
        this.priorityQueue = priorityQueue;

        this.addEntryAction(() => {
            console.log("Colocación activada");
            this.character.showCollectionMark(); // Mostrar icono de colocación
            // Colocar el tile de la Pokéball después de 4 segundos
            setTimeout(() => {
                this.placePokeballTile();
            }, 4000); // 4 segundos
        });

        this.addExitAction(() => {
            console.log("Saliendo del estado de colocación");
            this.character.hideCollectionMark(); // Ocultar icono de colocación
        });
    }

    placePokeballTile() {
        const layer = this.map.getLayer("nivel1").tilemapLayer; // Obtener el layer

        // Obtener la próxima posición de la Pokéball de la cola de prioridad
        const pokeballPosition = this.priorityQueue.dequeue();

        // Verificar si hay una posición válida
        if (pokeballPosition) {
            // Calcular la posición en tiles
            const tileX = pokeballPosition.x * 16;
            const tileY = pokeballPosition.y * 16;

            // Colocar el tile usando coordenadas del mundo
            const tile =layer.putTileAtWorldXY('143', tileX, tileY);
            tile.properties = {
                pokeball: true
            }
            // Refrescar el layer para que se redibuje el mapa
            layer.setCollisionByExclusion([-1], true); // Actualizar las colisiones si es necesario
            this.scene.cameras.main.refresh;
        }
    }
}
