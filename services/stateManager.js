/**
 * Manages global variables for the automation flow.
 * Variables are stored in memory using a Map for efficient access.
 * * Este módulo exporta una instancia única (Singleton) llamada globalStateManager.
 */
class StateManager {
    constructor() {
        this.variables = new Map();
        console.log('[StateManager] Initialized.');
    }

    /**
     * Establece el valor de una variable global de flujo.
     * @param {string} name - El nombre de la variable.
     * @param {*} value - El valor a almacenar (puede ser string, número, objeto, etc.).
     */
    setVariable(name, value) {
        this.variables.set(name, value);
        const length = typeof value === 'string' || Array.isArray(value) ? value.length : 'N/A';
        console.log(
            `[StateManager] Variable set: ${name} (Type: ${typeof value}, Size/Length: ${length})`,
        );
    }

    /**
     * Obtiene el valor de una variable global de flujo.
     * @param {string} name - El nombre de la variable.
     * @returns {*} El valor almacenado, o undefined si no se encuentra.
     */
    getVariable(name) {
        return this.variables.get(name);
    }

    /**
     * Elimina una variable global.
     * @param {string} name - El nombre de la variable.
     * @returns {boolean} True si la variable existía y fue eliminada, false en caso contrario.
     */
    deleteVariable(name) {
        return this.variables.delete(name);
    }

    /**
     * Devuelve todas las variables almacenadas.
     * @returns {Object} Un objeto plano que contiene todas las variables.
     */
    getAllVariables() {
        return Object.fromEntries(this.variables);
    }

    /**
     * Limpia todas las variables almacenadas.
     */
    clearAllVariables() {
        this.variables.clear();
        console.log('[StateManager] All variables cleared.');
    }
}

// Exportar la instancia única del gestor de estado para que sea compartida en toda la aplicación.
export const globalStateManager = new StateManager();
