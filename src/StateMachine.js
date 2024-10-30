export class State {
    constructor(name) {
        this.name = name;
        this.actions = [];
        this.entryActions = [];
        this.exitActions = [];
        this.transitions = [];
    }

    getActions() {
        return this.actions;
    }

    getEntryActions() {
        return this.entryActions;
    }

    getExitActions() {
        return this.exitActions;
    }

    getTransitions() {
        return this.transitions;
    }

    addAction(action) {
        this.actions.push(action);
    }

    addEntryAction(action) {
        this.entryActions.push(action);
    }

    addExitAction(action) {
        this.exitActions.push(action);
    }

    addTransition(transition) {
        this.transitions.push(transition);
    }
}

export class Transition {
    constructor(condition, targetState) {
        this.condition = condition;
        this.targetState = targetState;
        this.actions = [];
    }

    getActions() {
        return this.actions;
    }

    addAction(action) {
        this.actions.push(action);
    }

    isTriggered() {
        return this.condition();
    }

    getTargetState() {
        return this.targetState;
    }
}

export class StateMachine {
    constructor(initialState) {
        this.currentState = initialState;
    }

    update() {
        let triggered = null;

        // Verificar transiciones
        for (let transition of this.currentState.getTransitions()) {
            if (transition.isTriggered()) {
                triggered = transition;
                break;
            }
        }

        // Si hay una transición activada
        if (triggered) {
            // Obtener el estado objetivo
            const targetState = triggered.getTargetState();

            // Ejecutar acciones de salida del estado actual
            const exitActions = this.currentState.getExitActions();
            exitActions.forEach(action => action());

            // Ejecutar acciones de transición (si las hay)
            const transitionActions = triggered.getActions();
            transitionActions.forEach(action => action());

            // Cambiar al nuevo estado
            this.currentState = targetState;

            // Ejecutar acciones de entrada del nuevo estado
            const entryActions = targetState.getEntryActions();
            entryActions.forEach(action => action());

            // Retornar todas las acciones ejecutadas
            return [...exitActions, ...transitionActions, ...entryActions];
        } else {
            // No hay transición activada, retornar acciones del estado actual
            return this.currentState.getActions();
        }
    }
}
