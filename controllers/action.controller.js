// controllers/action.controller.js
// ==========================================================
// 🧠 Conectores de acciones individuales al Playwright MCP
// ==========================================================

import { callTool } from '../services/mcp.service.js';

// ==========================================================
// 1. OPEN URL (page.goto)
// ==========================================================

export const openUrlAction = async (req, res, next) => {
    try {
        const { url, waitUntil, timeout } = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'page.goto';

        // 2. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, { url, waitUntil, timeout });

        console.log(`[ACTION] URL abierta en MCP: ${url}`);

        res.status(200).json({
            success: true,
            message: `URL '${url}' abierta con éxito vía MCP.`,
            action: 'open_url',
            data: req.body,
            mcp_result: result,
        });
    } catch (error) {
        // next(error) pasa el control al manejador de errores global
        next(error);
    }
};

// ==========================================================
// 2. LAUNCH BROWSER (browser.launch)
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

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'browser.launch';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            browserType: options.browserType,
            headless: options.headless,
            slowMo: options.slowMo,
            ...(argsArray.length > 0 && { args: argsArray }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Navegador '${options.browserType}' lanzado vía MCP.`);

        res.status(200).json({
            success: true,
            message: `Navegador '${options.browserType}' lanzado con éxito vía MCP.`,
            action: 'launch_browser',
            data: { ...options, args: argsArray, status: 'launched' },
            mcp_result: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 3. CLOSE BROWSER (browser.close)
// ==========================================================

export const closeBrowserAction = async (req, res, next) => {
    try {
        // La acción close_browser tiene un body, aunque el MCP no lo requiera directamente.
        const { forceClose, clearContext } = req.body;

        // 1. Mapear el nodo a la herramienta MCP. El MCP puede no requerir argumentos
        const toolName = 'browser.close';

        // 2. Llamar al cliente MCP (puedes pasarle opciones si el MCP las soporta)
        const result = await callTool(toolName, { force: forceClose, clear: clearContext });

        console.log(`[ACTION] Navegador cerrado vía MCP.`);

        res.status(200).json({
            success: true,
            message: `Navegador cerrado con éxito vía MCP.`,
            action: 'close_browser',
            data: req.body,
            mcp_result: result,
        });
    } catch (error) {
        next(error);
    }
};

// ... Aquí se agregarán más acciones como clickAction, typeTextAction, etc.
