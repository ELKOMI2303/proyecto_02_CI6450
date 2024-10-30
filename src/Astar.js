class NodeRecord {
    constructor(node) {
      this.node = node;
      this.connection = null;
      this.costSoFar = Infinity; // Costo acumulado hasta el momento
      this.estimatedTotalCost = Infinity; // Costo estimado total (incluyendo heurística)
    }
  }
  
  class PathfindingList {
    constructor() {
      this.records = [];
    }
  
    // Método para agregar un nodo a la lista
    add(record) {
      this.records.push(record);
    }
  
    // Encuentra el nodo con el costo total estimado más bajo
    smallestElement() {
      let smallest = this.records[0];
      for (let record of this.records) {
        if (record.estimatedTotalCost < smallest.estimatedTotalCost) {
          smallest = record;
        }
      }
      return smallest;
    }
  
    // Verifica si la lista contiene un nodo específico
    contains(node) {
      return this.records.some(record => record.node === node);
    }
  
    // Encuentra un nodo en la lista
    find(node) {
      return this.records.find(record => record.node === node);
    }
  
    // Elimina un nodo de la lista
    remove(record) {
      this.records = this.records.filter(r => r !== record);
    }
  
    isEmpty() {
      return this.records.length === 0;
    }
  }
  
  function pathfindAStar(graph, start, end, heuristic) {
    // Inicializa el registro para el nodo de inicio
    const startRecord = new NodeRecord(start);
    startRecord.costSoFar = 0;
    startRecord.estimatedTotalCost = heuristic.estimate(start, end); // Costo estimado al final desde el inicio
  
    // Inicializa las listas de abiertos y cerrados
    const open = new PathfindingList();
    const closed = new PathfindingList();
    open.add(startRecord);
  
    let current = null;
  
    // Itera mientras haya nodos en la lista abierta
    while (!open.isEmpty()) {
      // Encuentra el nodo con el menor costo estimado
      current = open.smallestElement();
  
      // Si hemos llegado al nodo objetivo, termina
      if (current.node === end) {
        break;
      }
  
      // Obtiene las conexiones salientes del nodo actual
      const connections = graph.getConnections(current.node);
  
      for (const connection of connections) {
        const endNode = connection.getToNode();
        const endNodeCost = current.costSoFar + connection.getCost();
  
        let endNodeRecord;
        let endNodeHeuristic;
  
        // Si el nodo está en la lista cerrada, podría necesitarse omitirlo o eliminarlo de cerrados
        if (closed.contains(endNode)) {
          endNodeRecord = closed.find(endNode);
  
          // Si no encontramos un mejor camino, saltamos este nodo
          if (endNodeRecord.costSoFar <= endNodeCost) {
            continue;
          }
  
          // Eliminamos el registro de la lista cerrada para procesarlo de nuevo
          closed.remove(endNodeRecord);
  
          // Calculamos el valor heurístico
          endNodeHeuristic = endNodeRecord.estimatedTotalCost - endNodeRecord.costSoFar;
  
        } else if (open.contains(endNode)) {
          // Si el nodo está en abiertos y no encontramos un mejor camino, lo saltamos
          endNodeRecord = open.find(endNode);
          if (endNodeRecord.costSoFar <= endNodeCost) {
            continue;
          }
  
          // Calculamos el valor heurístico
          endNodeHeuristic = endNodeRecord.estimatedTotalCost - endNodeRecord.costSoFar;
  
        } else {
          // Nodo nuevo, creamos un registro para él
          endNodeRecord = new NodeRecord(endNode);
          endNodeHeuristic = heuristic.estimate(endNode, end);
        }
  
        // Actualizamos el costo y la conexión en el registro del nodo
        endNodeRecord.costSoFar = endNodeCost;
        endNodeRecord.connection = connection;
        endNodeRecord.estimatedTotalCost = endNodeCost + endNodeHeuristic;
  
        // Añadimos el nodo a la lista abierta si no está ya presente
        if (!open.contains(endNode)) {
          open.add(endNodeRecord);
        }
      }
  
      // Terminamos de procesar el nodo actual, lo movemos de abiertos a cerrados
      open.remove(current);
      closed.add(current);
    }
  
    // Si no llegamos al nodo final, devolvemos null (no hay solución)
    if (current.node !== end) {
      return null;
    }
  
    // Reconstruimos el camino
    const path = [];
    while (current.node !== start) {
      path.push(current.connection);
      current = closed.find(current.connection.getFromNode());
    }
  
    return path.reverse(); // Invertimos el camino para devolverlo en el orden correcto
  }
  


  class Heuristic {
    constructor(goalNode) {
      this.goalNode = goalNode; // Nodo objetivo
    }
  
    // Estima el costo para ir de 'fromNode' a 'goalNode'
    estimate(fromNode) {
      return this.estimateBetween(fromNode, this.goalNode);
    }
  
    // Método para estimar el costo entre dos nodos específicos.
    // Aquí puedes ajustar el cálculo de la distancia según tus necesidades (por ejemplo, Manhattan, Euclidiana, etc.)
    estimateBetween(fromNode, toNode) {
      // Supongamos que los nodos tienen propiedades `x` y `y` para calcular la distancia en un plano 2D (heurística Euclidiana)
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      return Math.sqrt(dx * dx + dy * dy); // Distancia euclidiana
    }
  }