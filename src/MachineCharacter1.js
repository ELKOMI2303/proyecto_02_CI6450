import { State } from "./StateMachine.js";
import {Seek} from "./Seek.js"
import { pathfindDijkstra } from "./Dijktra.js";
import { KinematicSteeringBehaviors } from "./Kinematic.js";
import { Vector } from "./Vector.js";
import {checkForNearbyPokeball,checkCollides } from "./Helpers.js";

export class ExploreState extends State {
    constructor(character, graph, graphic, map, currentFrame) {
        super("Explore");
        this.character = character; // Personaje kinemático
        this.graph = graph; // Grafo de nodos
        this.map = map; // Mapa
        this.currentFrame = currentFrame; // Marco actual
        this.currentTarget = this.getRandomTarget(); // Objetivo aleatorio inicial
        this.shortestPath = null; // Ruta más corta
        this.currentTargetIndex = 0; // Índice de destino actual
        this.routeGraphics = graphic; // Gráficos para la ruta
        this.routeGraphics.lineStyle(3, 0x0000ff, 1); // Estilo de línea azul

        this.addAction(() => this.explore());
        this.addEntryAction(() => {
            console.log("Iniciando exploración");
            this.calculatePath(this.currentTarget);
        });
        this.addExitAction(() => {
            console.log("Saliendo de la exploración");
            this.routeGraphics.clear();
        });
    }

    getRandomTarget() {
        // Obtener todos los nodos del grafo
        const nodeNames = Array.from(this.graph.nodes.keys());
    
        // Seleccionar un nodo aleatorio
        const randomIndex = Math.floor(Math.random() * nodeNames.length);
        return nodeNames[randomIndex]; // Retornar el nombre del nodo aleatorio
    }

    calculatePath(target) {
        const startNodeName = `${Math.floor(this.character.kinematicSteering.position.x / 16)},${Math.floor(this.character.kinematicSteering.position.y / 16)}`;
        const nodeA = this.graph.getNode(startNodeName);
        const nodeB = this.graph.getNode(target);

        if (nodeA == null || nodeB == null) {
            console.log(`Nodo inicial o de destino no encontrado: ${startNodeName}, ${target}`);
            return;
        }

        this.shortestPath = pathfindDijkstra(this.graph, nodeA, nodeB);
        this.currentTargetIndex = 0; // Reiniciar índice de destino
        this.drawRoute();
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

    explore() {
        if (this.shortestPath === null || this.shortestPath.length === 0) {
            this.currentTarget = this.getRandomTarget();
            this.calculatePath(this.currentTarget);
            return;
        }

        const currentEdge = this.shortestPath[this.currentTargetIndex];
        const targetNodeName = currentEdge.getToNode().name;
        const targetNode = this.graph.getNode(targetNodeName);
        const targetX = targetNode.x * 16; // Convertir tile a píxeles
        const targetY = targetNode.y * 16; // Convertir tile a píxeles

        const targetKinematic = {
            position: new Vector(targetX, targetY),
            velocity: new Vector(0, 0),
            orientation: this.character.kinematicSteering.orientation // Mantener la orientación actual
        };

        const seekBehavior = new Seek(this.character.kinematicSteering, targetKinematic, 20); // Max acceleration set to 20
        const steering = seekBehavior.getSteering();

        // Comprobar colisiones antes de actualizar la posición
        if (this.isCollidingWithWall(this.character.kinematicSteering.position, steering.linear)) {
            // Ajustar dirección para evitar colisiones
            steering.linear = this.avoidWall(steering.linear);
        }

        // Actualizar la posición del personaje
        this.character.kinematicSteering.update(steering, this.currentFrame, 20);

        // Obtener la posición actual del NPC
        const currentPosition = this.character.kinematicSteering.position;

        // Calcular la dirección hacia el siguiente nodo
        const directionX = targetX - currentPosition.x;
        const directionY = targetY - currentPosition.y;

        // Calcular la distancia al siguiente nodo
        const distance = Math.sqrt(directionX ** 2 + directionY ** 2);
        const distanceThreshold = 16; // Ajustar este valor según sea necesario

        if (distance < distanceThreshold) {
            this.currentTargetIndex++; // Avanzar al siguiente nodo en la ruta

            if (this.currentTargetIndex >= this.shortestPath.length) {
                this.currentTarget = this.getRandomTarget(); // Obtener un nuevo objetivo aleatorio
                this.calculatePath(this.currentTarget);
                this.character.kinematicSteering.velocity = new Vector(0, 0); // Detener al personaje
            }
        }

        // Verificar si hay pokebolas cercanas
        if (checkForNearbyPokeball(this.character.kinematicSteering.position, this.map)) {
            this.character.kinematicSteering.velocity = new Vector(0, 0); // Detener al personaje
            console.log("¡Pokebola detectada! Transición al estado de alarma...");
            return; // La máquina de estados manejará la transición a alarma
        }
    }

    drawRoute() {
        this.routeGraphics.clear(); // Limpiar gráficos anteriores
        this.routeGraphics.lineStyle(2, 0x00ff00, 1); // Estilo de línea verde

        if (!this.shortestPath || this.shortestPath.length === 0) {
            return;
        }

        for (let i = 0; i < this.shortestPath.length - 1; i++) {
            const currentEdge = this.shortestPath[i];
            const nextEdge = this.shortestPath[i + 1];

            const currentNode = this.graph.getNode(currentEdge.getToNode().name);
            const nextNode = this.graph.getNode(nextEdge.getToNode().name);

            const currentX = currentNode.x * 16 + 8; // Coordenadas centradas
            const currentY = currentNode.y * 16 + 8;
            const nextX = nextNode.x * 16 + 8;
            const nextY = nextNode.y * 16 + 8;

            this.routeGraphics.lineBetween(currentX, currentY, nextX, nextY);
        }
    }

    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
}