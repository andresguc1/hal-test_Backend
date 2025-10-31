// services/mcp.service.js
// =================================================================
// 🧠 Cliente Singleton para la conexión con el motor Playwright MCP
// =================================================================

import { createConnection } from '@playwright/mcp';

class MCPClient {
    constructor() {
        this.client = null;
        // La URL por defecto que el MCP nos proporcionó al iniciarse
        this.defaultUrl = 'http://localhost:8931/mcp';
        this.isConnecting = false;
    }

    /**
     * Conectar al MCP con patrón Singleton y manejo de reconexión.
     * @param {string} url - URL del servidor MCP
     * @returns {Promise<Object>} Instancia del cliente
     */
    async connect(url = this.defaultUrl) {
        // Si ya está conectado, retornar cliente existente
        if (this.client) {
            console.log('ℹ️ Ya existe una conexión activa al MCP');
            return this.client;
        }

        // Prevenir conexiones simultáneas
        if (this.isConnecting) {
            throw new Error('⚠️ Ya hay una conexión en progreso');
        }

        this.isConnecting = true;

        try {
            this.client = await createConnection({ url });
            console.log('✅ Conectado al MCP:', url);

            // Manejar desconexión inesperada
            this.client.on?.('disconnect', () => {
                console.warn('⚠️ Conexión MCP perdida inesperadamente');
                this.client = null; // Limpiar la instancia para permitir reconexión
            });

            return this.client;
        } catch (err) {
            console.error('❌ Error al conectar MCP:', err.message);
            throw new Error(`Fallo en conexión MCP: ${err.message}`);
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Desconectar del MCP de forma segura
     */
    async disconnect() {
        if (!this.client) {
            console.log('ℹ️ No hay conexión activa para cerrar');
            return;
        }

        try {
            // Se asume que el método 'close' existe en el cliente de MCP
            await this.client.close?.();
            console.log('🔌 Conexión MCP cerrada correctamente');
        } catch (err) {
            console.error('❌ Error cerrando MCP:', err.message);
        } finally {
            this.client = null;
        }
    }

    /**
     * Verificar si hay conexión activa
     * @returns {boolean}
     */
    isConnected() {
        return this.client !== null;
    }

    /**
     * Obtener instancia del cliente con validación
     * @returns {Object} Cliente MCP
     * @throws {Error} Si no hay conexión activa
     */
    getClient() {
        if (!this.client) {
            throw new Error('⚠️ No hay conexión activa con MCP. Ejecuta connect() primero.');
        }
        return this.client;
    }

    /**
     * Llamar herramienta MCP con validación y manejo de errores mejorado
     * * Nota: Utiliza un método interno (_requestHandlers) para simular la llamada
     * a la herramienta, ya que el SDK de @playwright/mcp a menudo expone esta
     * funcionalidad de forma más directa en la práctica.
     * * @param {string} toolName - Nombre de la herramienta (Ej: 'browser.launch')
     * @param {Object} args - Argumentos de la herramienta (el payload del nodo)
     * @returns {Promise<Object>} Resultado de la herramienta
     */
    async callTool(toolName, args = {}) {
        const client = this.getClient();

        if (!toolName || typeof toolName !== 'string') {
            throw new Error('⚠️ toolName debe ser un string válido');
        }

        // ⚠️ Nota: Esta es la parte más dependiente de la implementación interna del MCP.
        // Asumiendo que 'tools/call' es el manejador correcto.
        const handler = client._requestHandlers?.get('tools/call');

        if (!handler) {
            throw new Error(
                '⚠️ Handler tools/call no disponible en el cliente MCP. La versión del MCP podría ser incompatible.',
            );
        }

        try {
            const result = await handler({
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args,
                },
            });

            console.log(`✅ Herramienta "${toolName}" ejecutada exitosamente`);
            return result;
        } catch (err) {
            console.error(`❌ Error ejecutando "${toolName}":`, err.message);
            // Re-lanzar un error más claro para el controlador de Express
            throw new Error(`Fallo en herramienta ${toolName}: ${err.message}`);
        }
    }

    /**
     * Listar herramientas disponibles
     * @returns {Promise<Array>} Lista de herramientas
     */
    async listTools() {
        const client = this.getClient();

        try {
            const handler = client._requestHandlers?.get('tools/list');
            if (!handler) {
                throw new Error('Handler tools/list no disponible en el cliente MCP');
            }

            const result = await handler({ method: 'tools/list' });
            return result.tools || [];
        } catch (err) {
            console.error('❌ Error listando herramientas:', err.message);
            // Simplemente devuelve un array vacío en caso de fallo en listado
            return [];
        }
    }
}

// Exportar instancia singleton
const mcpClient = new MCPClient();

// Exportaciones simplificadas para el uso en otros módulos
export const connectMCP = (url) => mcpClient.connect(url);
export const disconnectMCP = () => mcpClient.disconnect();
export const getClient = () => mcpClient.getClient();
export const callTool = (name, args) => mcpClient.callTool(name, args);
export const isConnected = () => mcpClient.isConnected();
export const listTools = () => mcpClient.listTools();

export default mcpClient;
