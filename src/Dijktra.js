class PathfindingList {
    constructor() {
        this.items = [];
    }

    add(item) {
        this.items.push(item);
    }

    remove(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    contains(node) {
        return this.items.some(record => record.node === node);
    }

    find(node) {
        return this.items.find(record => record.node === node);
    }

    smallestElement() {
        return this.items.reduce((smallest, item) => {
            return (smallest == null || item.costSoFar < smallest.costSoFar) ? item : smallest;
        }, null);
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

export function pathfindDijkstra(graph, start, end) {
    class NodeRecord {
        constructor(node) {
            this.node = node;
            this.connection = null; // La conexión que lleva a este nodo
            this.costSoFar = Infinity; // Inicializamos con infinito
        }
    }

    const startRecord = new NodeRecord(start);
    startRecord.costSoFar = 0; // El nodo inicial tiene un costo de 0
    const open = new PathfindingList();
    open.add(startRecord);
    const closed = new PathfindingList();

    let current = null;
    let endNodeRecord = null;

    while (!open.isEmpty()) {
        current = open.smallestElement();
        
        if (current.node === end) {
            break; // Llegamos al nodo final
        }
        if(current.node == null){
            console.log("aqui")
        }
        const connections = graph.getConnections(current.node);

        for (const connection of connections) {
            const endNode = connection.getToNode(); // Nodo de destino
            const endNodeCost = current.costSoFar + connection.getCost(); // Costo acumulado

            if (closed.contains(endNode)) {
                continue;
            } else if (open.contains(endNode)) {
                endNodeRecord = open.find(endNode);
                if (endNodeRecord.costSoFar <= endNodeCost) {
                    continue; // Si el costo es peor, ignoramos este camino
                }
            } else {
                endNodeRecord = new NodeRecord(endNode); // Creamos un nuevo registro si no existe
            }

            // Actualizamos el costo y la conexión
            endNodeRecord.costSoFar = endNodeCost;
            endNodeRecord.connection = connection; // Guardamos la conexión que lleva a este nodo

            if (!open.contains(endNode)) {
                open.add(endNodeRecord); // Agregamos a la lista de abiertos si es necesario
            }
        }

        open.remove(current); // Eliminamos el nodo actual de la lista abierta
        closed.add(current); // Lo agregamos a la lista cerrada
    }

    // Si no encontramos un camino al nodo final, devolvemos null
    if (current.node !== end) {
        return null;
    }

    // Compilar el camino de regreso
    const path = [];
    while (current.node !== start) {
        path.push(current.connection); // Guardamos la conexión
        current = closed.find(current.connection.fromNode); // Retrocedemos usando el nodo de origen
    }

    return path.reverse(); // Invertimos el camino para obtener el orden correcto
}