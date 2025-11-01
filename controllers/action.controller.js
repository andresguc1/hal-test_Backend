// controllers/action.controller.js
// ==========================================================
// 🧠 Conectores de acciones individuales al Playwright MCP
// ==========================================================

import { callTool } from '../services/mcp.service.js';

/**
 * Función auxiliar para limpiar la respuesta del MCP.
 * Esto previene el SyntaxError si el resultado contiene caracteres malformados.
 */
const getCleanResult = (result) => {
    try {
        // Serializa y deserializa para forzar un JSON válido
        return JSON.parse(JSON.stringify(result));
    } catch (e) {
        console.error(
            '⚠️ Error al limpiar/parsear resultado del MCP. Devolviendo objeto de error:',
            e,
        );
        return {
            status: 'error',
            message: 'Fallo al parsear resultado del MCP: La respuesta contiene JSON malformado.',
        };
    }
};

// ==========================================================
// 1. LAUNCH BROWSER (launch_browser)
// ==========================================================

export const launchBrowserAction = async (req, res, next) => {
    try {
        const options = req.body;

        // Limpiar y procesar la cadena de argumentos (args) si existe
        const argsArray = options.args
            ? options.args
                  .split(',')
                  .map((arg) => arg.trim())
                  .filter((arg) => arg.length > 0)
            : [];

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'launch_browser';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            browserType: options.browserType,
            headless: options.headless,
            slowMo: options.slowMo,
            ...(argsArray.length > 0 && { args: argsArray }),
            // Incluimos executablePath por si se usa
            ...(options.executablePath && { executablePath: options.executablePath }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Navegador '${options.browserType}' lanzado vía MCP.`);

        res.status(200).json({
            success: true,
            // Usamos comillas dobles escapadas para que no rompa el JSON
            message: `Navegador "${options.browserType}" lanzado con éxito vía MCP.`,
            action: 'launch_browser',
            data: { ...options, args: argsArray, status: 'launched' },
            mcp_result: getCleanResult(result), // ⬅️ Aplicamos la limpieza
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 2. OPEN URL (open_url)
// ==========================================================

export const openUrlAction = async (req, res, next) => {
    try {
        // Asegúrate de que browserId esté incluido en la desestructuración
        const { url, waitUntil, timeout, browserId } = req.body;

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'open_url';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            url,
            waitUntil,
            timeout,
            // Pasamos el ID del navegador si existe
            ...(browserId && { browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] URL abierta en MCP: ${url}`);

        res.status(200).json({
            success: true,
            message: `URL "${url}" abierta con éxito vía MCP.`,
            action: 'open_url',
            data: req.body,
            mcp_result: getCleanResult(result), // ⬅️ Aplicamos la limpieza
        });
    } catch (error) {
        // next(error) pasa el control al manejador de errores global
        next(error);
    }
};

// ==========================================================
// 3. CLOSE BROWSER (close_browser)
// ==========================================================

export const closeBrowserAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'close_browser';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            force: options.forceClose,
            clear: options.clearContext,
            // Pasamos el ID del navegador si existe
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Navegador cerrado vía MCP.`);

        res.status(200).json({
            success: true,
            message: `Navegador cerrado con éxito vía MCP.`,
            action: 'close_browser',
            data: req.body,
            mcp_result: getCleanResult(result), // ⬅️ Aplicamos la limpieza
        });
    } catch (error) {
        next(error);
    }
};

// Exportamos todas las acciones para que el router las pueda importar
export default {
    launchBrowserAction,
    openUrlAction,
    closeBrowserAction,
};
