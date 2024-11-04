export class Node {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.connections = []; // Lista de conexiones que salen de este nodo
    }
    addConnection(connection) {
        this.connections.push(connection);
    }
}
export class Connection {
    constructor(fromNode, toNode, cost) {
        this.fromNode = fromNode; // Nodo de origen
        this.toNode = toNode; // Nodo de destino
        this.cost = cost; // Costo de la conexión
    }

    getCost() {
        return this.cost;
    }

    getToNode() {
        return this.toNode;
    }

    getFromNode() {
        return this.fromNode;
    }
}

export class Graph {
    constructor() {
        this.nodes = new Map(); // Usamos un mapa para almacenar los nodos con sus conexiones
    }
    // Método para añadir un nodo al grafo
    addNode(node) {
        if (!this.nodes.has(node.name)) {
            this.nodes.set(node.name, node);
        }
    }
    // Método para añadir una conexión entre nodos
    addConnection(fromNodeName, toNodeName, cost) {
        const fromNode = this.nodes.get(fromNodeName);
        const toNode = this.nodes.get(toNodeName);
        if (fromNode && toNode) {
            const connection = new Connection(fromNode, toNode, cost);
            fromNode.addConnection(connection); // Añadimos la conexión al nodo de origen
        }
    }
    // Devuelve las conexiones salientes de un nodo dado
    getConnections(fromNode) {
        if (this.nodes.has(fromNode.name)) {
            return this.nodes.get(fromNode.name).connections;
        }
        return [];
    }

    getNode(nodeName) {
        return this.nodes.get(nodeName) || null; // Devuelve el nodo o null si no existe
    }
}
