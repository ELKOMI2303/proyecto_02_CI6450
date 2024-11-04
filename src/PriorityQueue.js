export class SimpleQueue {
    constructor() {
        this.queue = [];
    }

    // Agrega un elemento al final de la cola
    enqueue(item) {
        this.queue.push(item);
    }

    // Elimina y retorna el primer elemento de la cola
    dequeue() {
        if (this.isEmpty()) {
            throw new Error("La cola está vacía");
        }
        return this.queue.shift();
    }

    // Retorna el primer elemento de la cola sin eliminarlo
    peek() {
        if (this.isEmpty()) {
            throw new Error("La cola está vacía");
        }
        return this.queue[0];
    }

    // Verifica si la cola está vacía
    isEmpty() {
        return this.queue.length === 0;
    }

    // Retorna el tamaño de la cola
    size() {
        return this.queue.length;
    }
}
