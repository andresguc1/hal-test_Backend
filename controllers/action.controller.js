// controllers/action.controller.js
// ==========================================================
// 🧠 Conectores de acciones individuales al Playwright MCP
// ==========================================================

import { callTool } from '../services/mcp.service.js';
import { chromium } from 'playwright';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

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

// Mapa en memoria
const browsers = new Map();

export const launchBrowserAction = async (req, res, next) => {
    try {
        console.log('[ACTION] Iniciando lanzamiento de navegador...');
        console.log('[REQUEST DATA]', req.body || {});

        // Lanzar navegador visible (sin visitar páginas)
        const browser = await chromium.launch({ headless: false });

        // Generar un ID más corto (por ejemplo, primeros 8 caracteres de un UUID)
        const browserId = randomUUID().split('-')[0]; // ej: "a3f9b0c1"

        // Guardar la instancia en memoria
        browsers.set(browserId, browser);

        console.log(`[SUCCESS] Navegador lanzado con ID: ${browserId}`);

        // Crear carpeta de almacenamiento si no existe
        const storageDir = path.resolve('./storages');
        await fs.mkdir(storageDir, { recursive: true });

        // Crear objeto con información del navegador
        const data = {
            browserId,
            status: 'success',
            launchedAt: new Date().toISOString(),
            requestData: req.body || {},
        };

        // Guardar JSON en ./storages/<browserId>.json
        const filePath = path.join(storageDir, `${browserId}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

        // Crear objeto de respuesta
        const response = {
            success: true,
            message: 'Navegador lanzado correctamente.',
            browserId,
            filePath,
        };

        // Log completo de la respuesta
        console.log('[RESPONSE DATA]', response);

        // Enviar respuesta al cliente
        res.status(200).json(response);
    } catch (error) {
        console.error('[ERROR] Fallo al lanzar el navegador:', error.message);

        try {
            const storageDir = path.resolve('./storages');
            await fs.mkdir(storageDir, { recursive: true });

            const failData = {
                status: 'failed',
                error: error.message,
                failedAt: new Date().toISOString(),
                requestData: req.body || {},
            };

            const failFile = path.join(storageDir, `error_${Date.now()}.json`);
            await fs.writeFile(failFile, JSON.stringify(failData, null, 2), 'utf8');
        } catch (saveErr) {
            console.error('[WARN] No se pudo guardar el JSON de error:', saveErr.message);
        }

        const errorResponse = {
            success: false,
            message: 'Error al lanzar el navegador.',
            error: error.message,
        };

        console.log('[RESPONSE DATA - ERROR]', errorResponse);

        res.status(500).json(errorResponse);
        next(error);
    }
};

// ==========================================================
// 2. OPEN URL (open_url)
// ==========================================================

export const openUrlAction = async () => {};

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

// ==========================================================
// 4. DRAG AND DROP (drag_drop)
// ==========================================================

export const dragDropAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'drag_drop';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            sourceSelector: options.sourceSelector,
            targetSelector: options.targetSelector,
            steps: options.steps,
            force: options.force,
            // Pasa el ID del navegador si fue proporcionado
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Drag & Drop ejecutado desde ${options.sourceSelector} a ${options.targetSelector}.`,
        );

        res.status(200).json({
            success: true,
            message: `Drag & Drop ejecutado con éxito.`,
            action: 'drag_drop',
            data: options,
            mcp_result: getCleanResult(result), // Usamos la función de limpieza JSON
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 5. RESIZE VIEWPORT (resize_viewport)
// ==========================================================

export const resizeViewportAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'resize_viewport';

        // 2. Argumentos para el MCP: Solo enviar los campos relevantes
        const mcpArgs = {
            // El MCP debe manejar la lógica: si deviceEmulation existe, la usa. Si no, usa width/height.
            deviceEmulation: options.deviceEmulation || undefined,
            width: options.width,
            height: options.height,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const resizeTarget = options.deviceEmulation
            ? `emulación de dispositivo: ${options.deviceEmulation}`
            : `a ${options.width}x${options.height}`;

        console.log(`[ACTION] Viewport redimensionado ${resizeTarget}.`);

        res.status(200).json({
            success: true,
            message: `ViewPort redimensionado ${resizeTarget} con éxito.`,
            action: 'resize_viewport',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 6. FIND ELEMENT (find_element)
// ==========================================================

export const findElementAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP (snake_case)
        const toolName = 'find_element';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            selectorType: options.selectorType,
            timeout: options.timeout,
            visible: options.visible,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Búsqueda de elemento por '${options.selectorType}': ${options.selector} ejecutada.`,
        );

        res.status(200).json({
            success: true,
            message: `Elemento encontrado con éxito.`,
            action: 'find_element',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 7. GET / SET CONTENT (get_set_content)
// ==========================================================

export const getSetContentAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'get_set_content';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            action: options.action,
            // Solo incluimos 'value' si la acción es 'set'
            ...(options.action === 'set' && { value: options.value }),
            // Solo incluimos 'clearBeforeSet' si la acción es 'set'
            ...(options.action === 'set' && { clearBeforeSet: options.clearBeforeSet }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const actionMsg =
            options.action === 'set'
                ? `asignado el valor "${options.value}"`
                : 'contenido extraído';

        console.log(`[ACTION] Contenido del selector ${options.selector}: ${actionMsg}.`);

        res.status(200).json({
            success: true,
            message: `Acción ${options.action} ejecutada: ${actionMsg}.`,
            action: 'get_set_content',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 8. WAIT FOR ELEMENT (wait_for_element)
// ==========================================================

export const waitForElementAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'wait_for_element';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            condition: options.condition,
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Esperando selector '${options.selector}' hasta que sea ${options.condition}.`,
        );

        res.status(200).json({
            success: true,
            message: `Elemento '${options.selector}' ha cumplido la condición '${options.condition}'.`,
            action: 'wait_for_element',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 9. EXECUTE JAVASCRIPT (execute_js)
// ==========================================================

export const executeJsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'execute_js';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            script: options.script,
            returnValue: options.returnValue,
            // Solo se incluye variableName si returnValue es true
            ...(options.returnValue && { variableName: options.variableName }),
            // Se incluye args si existe
            ...(options.args && { args: options.args }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const returnMsg = options.returnValue
            ? `y el resultado guardado en ${options.variableName}`
            : 'sin esperar retorno';

        console.log(`[ACTION] Script JavaScript ejecutado: ${returnMsg}.`);

        res.status(200).json({
            success: true,
            message: `Script JavaScript ejecutado con éxito ${returnMsg}.`,
            action: 'execute_js',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 10. CLICK (click)
// ==========================================================

export const clickAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'click';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            button: options.button,
            clickCount: options.clickCount,
            modifiers: options.modifiers,
            timeout: options.timeout,
            force: options.force,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const actionDesc =
            options.clickCount > 1 ? `${options.clickCount} clics` : `clic (${options.button})`;

        console.log(`[ACTION] Ejecutado ${actionDesc} en el selector: ${options.selector}.`);

        res.status(200).json({
            success: true,
            message: `Acción ${actionDesc} ejecutada con éxito.`,
            action: 'click',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 11. TYPE TEXT (type_text)
// ==========================================================

export const typeTextAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'type_text';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            text: options.text,
            clearBeforeType: options.clearBeforeType,
            delay: options.delay,
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Texto ingresado en selector '${options.selector}'.`);

        res.status(200).json({
            success: true,
            message: `Texto ingresado con éxito en el selector: ${options.selector}.`,
            action: 'type_text',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 12. SELECT OPTION (select_option)
// ==========================================================

export const selectOptionAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'select_option';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            selectionCriteria: options.selectionCriteria,
            selectionValue: options.selectionValue,
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Opción seleccionada por ${options.selectionCriteria} en selector '${options.selector}'.`,
        );

        res.status(200).json({
            success: true,
            message: `Opción seleccionada con éxito en el selector: ${options.selector}.`,
            action: 'select_option',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 13. SUBMIT FORM (submit_form)
// ==========================================================

export const submitFormAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'submit_form';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            waitForNavigation: options.waitForNavigation,
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const navigationMsg = options.waitForNavigation
            ? 'esperando navegación'
            : 'sin esperar navegación';

        console.log(`[ACTION] Formulario enviado desde '${options.selector}', ${navigationMsg}.`);

        res.status(200).json({
            success: true,
            message: `Formulario enviado con éxito desde: ${options.selector}.`,
            action: 'submit_form',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 14. SCROLL (scroll)
// ==========================================================

export const scrollAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'scroll';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            // El selector puede ser nulo, en cuyo caso se desplaza la página principal.
            ...(options.selector && { selector: options.selector }),
            direction: options.direction,
            amount: options.amount,
            behavior: options.behavior,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const target = options.selector
            ? `en el elemento '${options.selector}'`
            : 'en la página principal';

        console.log(
            `[ACTION] Desplazamiento de ${options.amount}px ${options.direction} ${target}.`,
        );

        res.status(200).json({
            success: true,
            message: `Desplazamiento completado ${target}.`,
            action: 'scroll',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 15. UPLOAD FILE (upload_file)
// ==========================================================

export const uploadFileAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'upload_file';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            files: options.files, // Se envía el string de rutas al MCP para su procesamiento
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Archivos subidos al selector: ${options.selector}.`);

        res.status(200).json({
            success: true,
            message: `Archivos subidos con éxito al input: ${options.selector}.`,
            action: 'upload_file',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 16. WAIT VISIBLE (wait_visible)
// ==========================================================

export const waitVisibleAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'wait_visible';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            selector: options.selector,
            timeout: options.timeout,
            scrollIntoView: options.scrollIntoView,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const scrollMsg = options.scrollIntoView ? 'con scroll' : 'sin scroll';

        console.log(`[ACTION] Esperando visibilidad de '${options.selector}' ${scrollMsg}.`);

        res.status(200).json({
            success: true,
            message: `El elemento '${options.selector}' es visible.`,
            action: 'wait_visible',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 17. WAIT NAVIGATION (wait_navigation)
// ==========================================================

export const waitNavigationAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'wait_navigation';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            // Incluir url solo si no está vacía o nula
            ...(options.url && { url: options.url }),
            timeout: options.timeout,
            waitUntil: options.waitUntil,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const urlMsg = options.url ? ` a la URL/patrón: '${options.url}'` : ' de cualquier URL.';

        console.log(`[ACTION] Esperando navegación ${urlMsg} hasta '${options.waitUntil}'.`);

        res.status(200).json({
            success: true,
            message: `Navegación completa ${urlMsg}.`,
            action: 'wait_navigation',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 18. WAIT NETWORK (wait_network)
// ==========================================================

export const waitNetworkAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'wait_network';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            idleTime: options.idleTime,
            timeout: options.timeout,
            includeResources: options.includeResources,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const resourceMsg = options.includeResources
            ? 'incluyendo recursos'
            : 'excluyendo recursos';

        console.log(
            `[ACTION] Esperando inactividad de red por ${options.idleTime}ms, ${resourceMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Red inactiva por ${options.idleTime}ms.`,
            action: 'wait_network',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================

export const waitConditionalAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'wait_conditional';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            conditionScript: options.conditionScript,
            polling: options.polling,
            timeout: options.timeout,
            // Incluir args si existe
            ...(options.args && { args: options.args }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(`[ACTION] Esperando que se cumpla la condición JavaScript...`);

        res.status(200).json({
            success: true,
            message: `Condición JavaScript cumplida antes del timeout.`,
            action: 'wait_conditional',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 20. TAKE SCREENSHOT (take_screenshot)
// ==========================================================

export const takeScreenshotAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'take_screenshot';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            // El selector puede ser opcional
            ...(options.selector && { selector: options.selector }),
            // La ruta puede ser opcional (el MCP deberá generar un nombre si no se proporciona)
            ...(options.path && { path: options.path }),
            // fullPage solo se considera si no hay selector, pero se pasa de todas formas
            fullPage: options.fullPage,
            format: options.format,
            // quality solo se usa si el formato es jpeg, pero se pasa
            quality: options.quality,
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const target = options.selector || (options.fullPage ? 'toda la página' : 'el viewport');
        const pathMsg = options.path
            ? `y guardada en '${options.path}'`
            : 'y devuelta en el resultado';

        console.log(`[ACTION] Captura de ${target} tomada en formato ${options.format}.`);

        res.status(200).json({
            success: true,
            message: `Captura de pantalla de ${target} tomada ${pathMsg}.`,
            action: 'take_screenshot',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 21. SAVE DOM (save_dom)
// ==========================================================

export const saveDomAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'save_dom';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            // El selector es opcional.
            ...(options.selector && { selector: options.selector }),
            // path y variableName son mutuamente excluyentes/condicionales
            ...(options.path && { path: options.path }),
            ...(options.variableName && { variableName: options.variableName }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const target = options.selector ? `el selector '${options.selector}'` : 'toda la página';

        let outputMsg;
        if (options.path) {
            outputMsg = `guardado en el archivo: '${options.path}'`;
        } else if (options.variableName) {
            outputMsg = `guardado en la variable: '${options.variableName}'`;
        } else {
            // Esto no debería pasar gracias a la validación condicional de Joi
            outputMsg = 'y no se especificó destino.';
        }

        console.log(`[ACTION] DOM de ${target} procesado y ${outputMsg}.`);

        res.status(200).json({
            success: true,
            message: `DOM de ${target} procesado con éxito.`,
            action: 'save_dom',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 22. LOG ERRORS (log_errors)
// ==========================================================

export const logErrorsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'log_errors';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            logToFile: options.logToFile,
            // filePath solo se incluye si está presente (Joi ya garantizó que no está vacío si logToFile es true)
            ...(options.filePath && { filePath: options.filePath }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        let outputMsg;
        if (options.logToFile && options.filePath) {
            outputMsg = `registrando en el archivo: '${options.filePath}'.`;
        } else {
            outputMsg = 'y registrando en la consola/resultado de la prueba.';
        }

        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(`[ACTION] Iniciada escucha de errores ${durationMsg}, ${outputMsg}`);

        res.status(200).json({
            success: true,
            message: `Escucha de errores de consola/excepciones iniciada ${durationMsg}.`,
            action: 'log_errors',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 23. LISTEN EVENTS (listen_events)
// ==========================================================

export const listenEventsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'listen_events';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            eventType: options.eventType,
            // Incluir selector solo si existe y no es evento de red/custom global
            ...(options.selector &&
                (options.eventType === 'click' ||
                    options.eventType === 'input' ||
                    options.eventType === 'change' ||
                    options.eventType === 'submit') && { selector: options.selector }),
            logToFile: options.logToFile,
            // filePath solo si logToFile es true (Joi ya validó que exista en ese caso)
            ...(options.logToFile && options.filePath && { filePath: options.filePath }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const target = options.selector ? ` en el selector '${options.selector}'` : ' globalmente';

        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(
            `[ACTION] Iniciada escucha del evento '${options.eventType}' ${target}, ${durationMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Escucha del evento '${options.eventType}' iniciada ${durationMsg}.`,
            action: 'listen_events',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 24. INTERCEPT REQUEST (intercept_request)
// ==========================================================

export const interceptRequestAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'intercept_request';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            urlPattern: options.urlPattern,
            // method se pasa si no es la cadena vacía por defecto
            ...(options.method && { method: options.method }),
            action: options.action,
            // responseMock solo se incluye si la acción es 'mock'
            ...(options.action === 'mock' && { responseMock: options.responseMock }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const methodMsg = options.method ? `(${options.method})` : '';
        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(
            `[ACTION] Interceptación de ${options.urlPattern} ${methodMsg} establecida a la acción: ${options.action}.`,
        );

        res.status(200).json({
            success: true,
            message: `Regla de intercepción de red establecida para '${options.urlPattern}' con acción '${options.action}' ${durationMsg}.`,
            action: 'intercept_request',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 25. MOCK RESPONSE (mock_response)
// ==========================================================

export const mockResponseAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'mock_response';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            urlPattern: options.urlPattern,
            ...(options.method && { method: options.method }),
            responseBody: options.responseBody,
            status: options.status,
            ...(options.headers && { headers: options.headers }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const methodMsg = options.method ? `(${options.method})` : '';
        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(
            `[ACTION] Mock de respuesta para ${options.urlPattern} ${methodMsg} establecido a STATUS ${options.status}.`,
        );

        res.status(200).json({
            success: true,
            message: `Mock de respuesta establecido para '${options.urlPattern}' (Status: ${options.status}) ${durationMsg}.`,
            action: 'mock_response',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 26. BLOCK RESOURCE (block_resource)
// ==========================================================

export const blockResourceAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'block_resource';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            urlPattern: options.urlPattern,
            // Incluir resourceType solo si no es la cadena vacía por defecto
            ...(options.resourceType && { resourceType: options.resourceType }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const typeMsg = options.resourceType
            ? `el tipo '${options.resourceType}'`
            : 'cualquier tipo';
        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(
            `[ACTION] Regla de bloqueo de recursos para '${options.urlPattern}' (${typeMsg}) establecida.`,
        );

        res.status(200).json({
            success: true,
            message: `Regla de bloqueo establecida para '${options.urlPattern}' (${typeMsg}) ${durationMsg}.`,
            action: 'block_resource',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 27. MODIFY HEADERS (modify_headers)
// ==========================================================

export const modifyHeadersAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'modify_headers';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            urlPattern: options.urlPattern,
            headers: options.headers, // JSON String
            // Incluir method solo si no es la cadena vacía por defecto
            ...(options.method && { method: options.method }),
            timeout: options.timeout,
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const methodMsg = options.method ? `(${options.method})` : '';
        const durationMsg = options.timeout > 0 ? `por ${options.timeout}ms` : 'indefinidamente';

        console.log(
            `[ACTION] Regla de modificación de cabeceras para '${options.urlPattern}' ${methodMsg} establecida.`,
        );

        res.status(200).json({
            success: true,
            message: `Regla de modificación de cabeceras establecida para '${options.urlPattern}' ${durationMsg}.`,
            action: 'modify_headers',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 28. MANAGE COOKIES (manage_cookies)
// ==========================================================

export const manageCookiesAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'manage_cookies';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            action: options.action,
            ...(options.cookiesData && { cookiesData: options.cookiesData }),
            ...(options.domainFilter && { domainFilter: options.domainFilter }),
            ...(options.pathFilter && { pathFilter: options.pathFilter }),
            ...(options.variableName && { variableName: options.variableName }),
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        let message;
        switch (options.action) {
            case 'get':
                message = `Cookies obtenidas y guardadas en la variable: '${options.variableName}'.`;
                break;
            case 'set':
                message = 'Cookies establecidas/modificadas con éxito.';
                break;
            case 'delete':
                message = 'Cookies eliminadas con éxito.';
                break;
            case 'clear': {
                const filterMsg = options.domainFilter
                    ? ` en el dominio '${options.domainFilter}'`
                    : 'en todos los dominios';
                message = `Todas las cookies limpiadas ${filterMsg}.`;
                break;
            }
            default:
                message = 'Acción de cookies ejecutada.';
        }

        console.log(`[ACTION] Acción de cookies: ${options.action} ejecutada.`);

        res.status(200).json({
            success: true,
            message: message,
            action: 'manage_cookies',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 29. MANAGE STORAGE (manage_storage)
// ==========================================================

export const manageStorageAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'manage_storage';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            storageType: options.storageType,
            action: options.action,
            // Incluir key, value y variableName si existen (Joi ya validó la obligatoriedad)
            ...(options.key && { key: options.key }),
            ...(options.value && { value: options.value }),
            ...(options.variableName && { variableName: options.variableName }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        let message;
        const storage = options.storageType === 'local' ? 'LocalStorage' : 'SessionStorage';
        const keyMsg = options.key ? ` la clave '${options.key}'` : ' todo el almacenamiento';

        switch (options.action) {
            case 'get':
                message = `Valor obtenido de ${storage} y guardado en la variable: '${options.variableName}'.`;
                break;
            case 'set':
                message = `Valor establecido en ${storage} para la clave '${options.key}'.`;
                break;
            case 'delete':
                message = `Clave '${options.key}' eliminada de ${storage}.`;
                break;
            case 'clear':
                message = `Todo el contenido de ${storage} ha sido limpiado.`;
                break;
            default:
                message = `Acción de gestión de ${storage} (${options.action}) ejecutada.`;
        }

        console.log(
            `[ACTION] Gestión de almacenamiento: ${options.action} en ${storage}${keyMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: message,
            action: 'manage_storage',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 30. INJECT TOKENS (inject_tokens)
// ==========================================================

export const injectTokensAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'inject_tokens';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            target: options.target,
            key: options.key,
            value: options.value,
            // Incluir urlPattern solo si existe (es relevante para header y cookie)
            ...(options.urlPattern && { urlPattern: options.urlPattern }),
            // Incluir cookiePath solo si existe (es relevante para cookie)
            ...(options.cookiePath && { cookiePath: options.cookiePath }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const destination =
            options.target === 'header'
                ? `Header para: ${options.urlPattern}`
                : `${options.target} (Key: ${options.key})`;

        console.log(`[ACTION] Token inyectado en ${destination}.`);

        res.status(200).json({
            success: true,
            message: `Token inyectado con éxito en ${options.target} con clave '${options.key}'.`,
            action: 'inject_tokens',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 31. PERSIST SESSION (persist_session)
// ==========================================================

export const persistSessionAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'persist_session';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            action: options.action,
            path: options.path,
            // Solo pasamos las inclusiones si la acción es 'save'.
            // El MCP debe ignorarlas si la acción es 'load'.
            ...(options.action === 'save' && {
                includeLocalStorage: options.includeLocalStorage,
                includeSessionStorage: options.includeSessionStorage,
            }),
            // Pasa el ID del navegador
            ...(options.browserId && { browserId: options.browserId }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const actionLabel = options.action === 'save' ? 'guardado' : 'cargado';

        console.log(`[ACTION] Estado de sesión ${actionLabel} ${options.path}.`);

        res.status(200).json({
            success: true,
            message: `Estado de la sesión (${options.action}) ${actionLabel} desde/hacia el archivo: ${options.path}.`,
            action: 'persist_session',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 32. CREATE CONTEXT (create_context)
// ==========================================================

export const createContextAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'create_context';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            // Todos los campos son opcionales excepto browserId (ya validado por Joi)
            ...(options.storageState && { storageState: options.storageState }),
            // Viewport se incluye si ambos están presentes (Joi ya validó esto)
            ...(options.viewportWidth &&
                options.viewportHeight && {
                    viewport: `${options.viewportWidth},${options.viewportHeight}`,
                }),
            ...(options.userAgent && { userAgent: options.userAgent }),
            ...(options.geolocation && { geolocation: options.geolocation }),
            ...(options.permissions && { permissions: options.permissions }),
            ...(options.locale && { locale: options.locale }),
            // Pasa el ID del navegador padre
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        // NOTA: El resultado del MCP debe devolver el nuevo contextId creado.
        const newContextId = result?.contextId || 'N/A';
        const browserMsg = options.browserId ? ` en el navegador ${options.browserId}` : '';

        console.log(`[ACTION] Nuevo contexto creado (ID: ${newContextId})${browserMsg}.`);

        res.status(200).json({
            success: true,
            message: `Contexto de navegación creado con ID: ${newContextId}.`,
            action: 'create_context',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 33. CLEANUP STATE (cleanup_state)
// ==========================================================

export const cleanupStateAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'cleanup_state';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            target: options.target,
            includeCookies: options.includeCookies,
            includeLocalStorage: options.includeLocalStorage,
            includeSessionStorage: options.includeSessionStorage,
            includeIndexedDB: options.includeIndexedDB,
            includePermissions: options.includePermissions,
            // Pasa el ID del navegador
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const targetLabel = options.target === 'context' ? 'Todo el Contexto' : 'Página Actual';

        console.log(`[ACTION] Limpieza de estado (${targetLabel}) iniciada.`);

        res.status(200).json({
            success: true,
            message: `Limpieza de estado (${targetLabel}) aplicada al navegador/contexto.`,
            action: 'cleanup_state',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 34. HANDLE HOOKS (handle_hooks)
// ==========================================================

export const handleHooksAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'handle_hooks';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            hookType: options.hookType,
            // actionName solo si existe (solo relevante para *Action)
            ...(options.actionName && { actionName: options.actionName }),
            callbackCode: options.callbackCode,
            once: options.once,
            // Pasa el ID del navegador
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const filterMsg = options.actionName
            ? ` en la acción '${options.actionName}'`
            : ' en todas las acciones del tipo';
        const onceMsg = options.once ? ' (Una sola vez)' : '';

        console.log(`[ACTION] Hook '${options.hookType}' registrado${filterMsg}${onceMsg}.`);

        res.status(200).json({
            success: true,
            message: `Hook '${options.hookType}' registrado con éxito.${onceMsg}`,
            action: 'handle_hooks',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 35. CONTROL EXCEPTIONS (control_exceptions)
// ==========================================================

export const controlExceptionsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'control_exceptions';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            exceptionType: options.exceptionType,
            action: options.action,
            // maxRetries solo si action es 'retry' (Joi ya validó que exista en ese caso)
            ...(options.action === 'retry' && { maxRetries: options.maxRetries }),
            // logFile solo si action es 'log' o 'retry' (Joi ya validó que exista en ese caso)
            ...(options.logFile &&
                (options.action === 'log' || options.action === 'retry') && {
                    logFile: options.logFile,
                }),
            // Pasa el ID del navegador
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        let detailMsg = `Acción: '${options.action}'.`;
        if (options.action === 'retry') {
            detailMsg = `Acción: Reintentar (${options.maxRetries} veces) y registrar en '${options.logFile}'.`;
        } else if (options.action === 'log') {
            detailMsg = `Acción: Registrar en '${options.logFile}'.`;
        }

        console.log(
            `[ACTION] Regla de excepción para '${options.exceptionType}' establecida. ${detailMsg}`,
        );

        res.status(200).json({
            success: true,
            message: `Regla de control de excepciones para '${options.exceptionType}' establecida.`,
            action: 'control_exceptions',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 36. READ DATA (read_data)
// ==========================================================

export const readDataAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'read_data';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            sourceType: options.sourceType,
            path: options.path,
            variableName: options.variableName,
            encoding: options.encoding,

            // Incluir sheetName solo para Excel (Joi ya validó su existencia)
            ...(options.sourceType === 'excel' && { sheetName: options.sheetName }),

            // Incluir hasHeader para CSV y Excel
            ...((options.sourceType === 'csv' || options.sourceType === 'excel') && {
                hasHeader: options.hasHeader,
            }),

            // Pasa el ID del navegador (contexto de ejecución)
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Datos de ${options.sourceType.toUpperCase()} leídos y guardados en '${options.variableName}'.`,
        );

        res.status(200).json({
            success: true,
            message: `Datos de ${options.sourceType.toUpperCase()} leídos desde '${options.path}' y guardados en la variable '${options.variableName}'.`,
            action: 'read_data',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 37. SAVE RESULTS (save_results)
// ==========================================================

export const saveResultsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'save_results';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            destinationType: options.destinationType,
            path: options.path,
            dataVariableName: options.dataVariableName,
            encoding: options.encoding,

            // Incluir sheetName y includeHeader para Excel
            ...(options.destinationType === 'excel' && {
                sheetName: options.sheetName,
                includeHeader: options.includeHeader,
            }),

            // Incluir includeHeader para CSV
            ...(options.destinationType === 'csv' && { includeHeader: options.includeHeader }),

            // Pasa el ID del navegador (contexto de ejecución)
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Datos de la variable '${options.dataVariableName}' guardados como ${options.destinationType.toUpperCase()} en '${options.path}'.`,
        );

        res.status(200).json({
            success: true,
            message: `Datos de la variable '${options.dataVariableName}' guardados con éxito en '${options.path}' como ${options.destinationType.toUpperCase()}.`,
            action: 'save_results',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 38. HANDLE DOWNLOADS (handle_downloads)
// ==========================================================

export const handleDownloadsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'handle_downloads';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            action: options.action,
            timeout: options.timeout,
            browserId: options.browserId,

            // Incluir path si la acción es 'save' o 'saveAndValidate'
            ...(options.path &&
                (options.action === 'save' || options.action === 'saveAndValidate') && {
                    path: options.path,
                }),

            // Incluir expectedFileName si la acción es 'validate' o 'saveAndValidate'
            ...(options.expectedFileName &&
                (options.action === 'validate' || options.action === 'saveAndValidate') && {
                    expectedFileName: options.expectedFileName,
                }),

            // Incluir tamaños si existen
            ...(options.minSizeKB && { minSizeKB: options.minSizeKB }),
            ...(options.maxSizeKB && { maxSizeKB: options.maxSizeKB }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        let detailMsg;
        switch (options.action) {
            case 'wait':
                detailMsg = 'esperando la descarga.';
                break;
            case 'save':
                detailMsg = `guardando el archivo en '${options.path}'.`;
                break;
            case 'validate':
                detailMsg = `validando propiedades del archivo '${options.expectedFileName}'.`;
                break;
            case 'saveAndValidate':
                detailMsg = `guardando en '${options.path}' y validando '${options.expectedFileName}'.`;
                break;
            default:
                detailMsg = 'ejecutando acción de descarga.';
        }

        console.log(`[ACTION] Manejo de descarga: ${detailMsg}`);

        res.status(200).json({
            success: true,
            message: `Acción de descarga (${options.action}) completada.`,
            action: 'handle_downloads',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 39. CALL LLM (call_llm)
// ==========================================================

export const callLlmAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'call_llm';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            model: options.model,
            prompt: options.prompt,
            variableName: options.variableName,
            temperature: options.temperature,
            browserId: options.browserId,

            // Incluir maxTokens si existe
            ...(options.maxTokens && { maxTokens: options.maxTokens }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Generación de texto completada con ${options.model}. Resultado guardado en '${options.variableName}'.`,
        );

        res.status(200).json({
            success: true,
            message: `Respuesta generada por el modelo ${options.model} guardada en la variable '${options.variableName}'.`,
            action: 'call_llm',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 40. GENERATE DATA (generate_data)
// ==========================================================

export const generateDataAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'generate_data';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            model: options.model,
            prompt: options.prompt,
            variableName: options.variableName,
            temperature: options.temperature,
            expectedFormat: options.expectedFormat,
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Generación de datos estructurados (${options.expectedFormat.toUpperCase()}) completada con ${options.model}. Resultado en '${options.variableName}'.`,
        );

        res.status(200).json({
            success: true,
            message: `Datos de prueba generados en formato ${options.expectedFormat.toUpperCase()} por el modelo ${options.model} y guardados en '${options.variableName}'.`,
            action: 'generate_data',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 41. VALIDATE SEMANTIC (validate_semantic)
// ==========================================================

export const validateSemanticAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'validate_semantic';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            model: options.model,
            sourceTextVariable: options.sourceTextVariable,
            validationPrompt: options.validationPrompt,
            expectedAnswer: options.expectedAnswer,
            validationTimeout: options.validationTimeout,
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        // Asumiendo que el resultado del MCP incluye un campo con el resultado del LLM.
        console.log(
            `[ACTION] Validación semántica con ${options.model} completada. Resultado: ${result.validation_result || 'N/A'}`,
        );

        res.status(200).json({
            success: true,
            message: `Validación semántica del texto en '${options.sourceTextVariable}' usando el modelo ${options.model} completada.`,
            action: 'validate_semantic',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 42. RUN TESTS (run_tests)
// ==========================================================

export const runTestsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'run_tests';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            testSuite: options.testSuite,
            parallel: options.parallel,
            retries: options.retries,
            reportFormat: options.reportFormat,
            timeout: options.timeout,
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const parallelMsg = options.parallel ? ' (en paralelo)' : '';
        const retriesMsg = options.retries > 0 ? ` con ${options.retries} reintentos` : '';

        console.log(
            `[ACTION] Ejecución de tests iniciada para '${options.testSuite}'${parallelMsg}${retriesMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Ejecución de la suite de tests '${options.testSuite}' iniciada. El reporte final será en formato ${options.reportFormat.toUpperCase()}.`,
            action: 'run_tests',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 43. CLI PARAMS (cli_params)
// ==========================================================

export const cliParamsAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'cli_params';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            paramName: options.paramName,
            paramType: options.paramType,
            required: options.required,
            browserId: options.browserId,

            // Incluir opcionales si existen
            ...(options.defaultValue && { defaultValue: options.defaultValue }),
            ...(options.validationCode && { validationCode: options.validationCode }),
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const reqMsg = options.required ? ' (OBLIGATORIO)' : '';
        const defMsg = options.defaultValue
            ? ` con valor por defecto: ${options.defaultValue}`
            : '';

        console.log(
            `[ACTION] Parámetro CLI '${options.paramName}' (${options.paramType})${reqMsg} registrado${defMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Parámetro CLI '${options.paramName}' registrado para ser reconocido por la línea de comandos.`,
            action: 'cli_params',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 44. RETURN CODE (return_code)
// ==========================================================

export const returnCodeAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'return_code';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            successField: options.successField,
            exitOnFail: options.exitOnFail,
            customCodes: options.customCodes,
            verbose: options.verbose,
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const exitMsg = options.exitOnFail
            ? ' y detendrá el proceso al fallar'
            : ' sin detener el proceso al fallar';

        console.log(
            `[ACTION] Configuración de códigos de salida aplicada. Campo de éxito: '${options.successField}'${exitMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Configuración de códigos de salida aplicada. El proceso ${options.exitOnFail ? 'se detendrá' : 'no se detendrá'} al detectar un fallo.`,
            action: 'return_code',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 45. INTEGRATE CI (integrate_ci)
// ==========================================================

export const integrateCIAction = async (req, res, next) => {
    try {
        const options = req.body;

        // 1. Mapear el nodo a la herramienta MCP
        const toolName = 'integrate_ci';

        // 2. Argumentos para el MCP
        const mcpArgs = {
            provider: options.provider,
            saveArtifacts: options.saveArtifacts,
            outputPath: options.outputPath,
            uploadReports: options.uploadReports,
            envVariables: options.envVariables,
            retryOnFail: options.retryOnFail,
            verbose: options.verbose,
            browserId: options.browserId,
        };

        // 3. Llamar al cliente MCP con los argumentos
        const result = await callTool(toolName, mcpArgs);

        const retryMsg =
            options.retryOnFail > 0 ? ` con ${options.retryOnFail} reintentos globales` : '';
        const artifactMsg = options.saveArtifacts
            ? ` guardando artefactos en ${options.outputPath}`
            : '';

        console.log(
            `[ACTION] Integración CI configurada para ${options.provider.toUpperCase()}${retryMsg}${artifactMsg}.`,
        );

        res.status(200).json({
            success: true,
            message: `Configuración de integración continua para '${options.provider.toUpperCase()}' aplicada.`,
            action: 'integrate_ci',
            data: options,
            mcp_result: getCleanResult(result),
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 46. CLOSE CONTEXT (close_context)
// ==========================================================

export const closeContextAction = async (req, res, next) => {
    try {
        const options = req.body;
        const toolName = 'close_context';

        const mcpArgs = {
            browserId: options.browserId,
        };

        const result = await callTool(toolName, mcpArgs);

        console.log(
            `[ACTION] Contexto/página con ID ${options.browserId} cerrado y recursos liberados.`,
        );

        res.status(200).json({
            success: true,
            message: `Contexto de navegación ID ${options.browserId} cerrado con éxito.`,
            action: 'close_context',
            data: options,
            mcp_result: getCleanResult(result),
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
    dragDropAction,
    resizeViewportAction,
    findElementAction,
    getSetContentAction,
    waitForElementAction,
    executeJsAction,
    clickAction,
    typeTextAction,
    selectOptionAction,
    submitFormAction,
    scrollAction,
    uploadFileAction,
    waitVisibleAction,
    waitNavigationAction,
    waitNetworkAction,
    waitConditionalAction,
    takeScreenshotAction,
    saveDomAction,
    logErrorsAction,
    listenEventsAction,
    interceptRequestAction,
    mockResponseAction,
    blockResourceAction,
    modifyHeadersAction,
    manageCookiesAction,
    manageStorageAction,
    injectTokensAction,
    persistSessionAction,
    createContextAction,
    cleanupStateAction,
    handleHooksAction,
    controlExceptionsAction,
    readDataAction,
    saveResultsAction,
    handleDownloadsAction,
    callLlmAction,
    generateDataAction,
    validateSemanticAction,
    runTestsAction,
    cliParamsAction,
    returnCodeAction,
    integrateCIAction,
};
