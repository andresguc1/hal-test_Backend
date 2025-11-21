// controllers/action.controller.js - OPTIMIZADO Y CORREGIDO
// ==========================================================
// 🧠 Conectores de acciones individuales al Playwright
// ==========================================================

import { callTool } from '../services/mcp.service.js';
import { chromium } from 'playwright';
import { devices } from '@playwright/test';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// ==========================================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================================

const storageDir = path.resolve('./storages');
const MAX_BROWSERS = 10; // Límite para prevenir fugas de memoria
const TRACE_BATCH_SIZE = 10; // Número de trazas antes de flush
const TRACE_FLUSH_INTERVAL = 5000; // ms
const PLAYWRIGHT_DEVICES = devices; // Constante global para los dispositivos

// Cache de trazas en memoria para escritura batch
let traceBuffer = [];
let lastFlushTime = Date.now();

// ==========================================================
// GESTIÓN MEJORADA DE BROWSERS
// ==========================================================

class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.lastAccessed = new Map();
    }

    set(id, browser) {
        // Limitar número de browsers para prevenir fugas
        if (this.browsers.size >= MAX_BROWSERS) {
            this.evictOldest();
        }
        this.browsers.set(id, browser);
        this.lastAccessed.set(id, Date.now());
    }

    get(id) {
        if (!id) return this.getLatest();
        this.lastAccessed.set(id, Date.now());
        return this.browsers.get(id);
    }

    getLatest() {
        const ids = Array.from(this.browsers.keys());
        return ids.length > 0 ? this.browsers.get(ids[ids.length - 1]) : null;
    }

    delete(id) {
        this.browsers.delete(id);
        this.lastAccessed.delete(id);
    }

    evictOldest() {
        let oldest = null;
        let oldestTime = Infinity;

        for (const [id, time] of this.lastAccessed.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldest = id;
            }
        }

        if (oldest) {
            const entry = this.browsers.get(oldest);
            if (entry) {
                const browser = entry.browser || entry;
                browser.close().catch(() => {});
            }
            this.delete(oldest);
            console.log(`[EVICT] Browser ${oldest} evicted due to limit`);
        }
    }

    has(id) {
        return this.browsers.has(id);
    }

    keys() {
        return this.browsers.keys();
    }
}

const browserManager = new BrowserManager();

// ==========================================================
// UTILIDADES OPTIMIZADAS
// ==========================================================

/**
 * Versión optimizada de limpieza de resultados
 * Evita doble serialización innecesaria
 */
const getCleanResult = (result) => {
    if (!result || typeof result !== 'object') {
        return result;
    }

    // Solo serializar si hay riesgo de caracteres malformados
    try {
        // Verificación rápida: si ya es JSON válido, retornarlo
        JSON.stringify(result);
        return result;
    } catch (error) {
        // 'error' is defined
        // 🚀 FIX: Log the actual error object
        console.error('⚠️ Resultado MCP con JSON malformado, intentando limpiar', error);
        try {
            // Intento de limpieza profunda solo si falla
            return JSON.parse(JSON.stringify(result));
        } catch {
            return {
                status: 'error',
                message: 'Fallo al parsear resultado del MCP',
            };
        }
    }
};

/**
 * Sistema de trazabilidad optimizado con batch writes
 */
async function writeTrace(data) {
    traceBuffer.push({
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
    });

    const now = Date.now();
    const shouldFlush =
        traceBuffer.length >= TRACE_BATCH_SIZE || now - lastFlushTime >= TRACE_FLUSH_INTERVAL;

    if (shouldFlush) {
        await flushTraces();
    }
}

async function flushTraces() {
    if (traceBuffer.length === 0) return;

    const traces = [...traceBuffer];
    traceBuffer = [];
    lastFlushTime = Date.now();

    // Escritura asíncrona sin bloquear
    setImmediate(async () => {
        try {
            await fs.mkdir(storageDir, { recursive: true });

            // Escribir todas las trazas en paralelo
            await Promise.allSettled(
                traces.map(async (trace, idx) => {
                    const fileName = `trace_${trace.action}_${Date.now()}_${idx}.json`;
                    const filePath = path.join(storageDir, fileName);
                    await fs.writeFile(filePath, JSON.stringify(trace, null, 2), 'utf8');
                }),
            );
        } catch (err) {
            console.error('[WARN] Error al escribir trazas:', err.message);
        }
    });
}

// Flush periódico automático
setInterval(() => {
    flushTraces().catch((err) => console.error('[WARN] Error en flush automático:', err.message));
}, TRACE_FLUSH_INTERVAL);

// Flush al cerrar proceso
process.on('beforeExit', () => {
    flushTraces().catch(() => {});
});

/**
 * Validación común de browser
 */
function validateBrowser(browserId) {
    const ids = Array.from(browserManager.keys());

    if (!browserId && ids.length === 0) {
        return {
            error: true,
            status: 400,
            message: 'No hay navegadores activos. Llama a launch_browser primero.',
        };
    }

    const id = browserId || ids[ids.length - 1];
    const entry = browserManager.get(id);

    if (!entry) {
        return {
            error: true,
            status: 404,
            message: `No se encontró navegador con ID: ${id}`,
        };
    }

    return { error: false, browserId: id, entry };
}

/**
 * Obtener contexto de forma eficiente
 * 🔥 CORRECCIÓN 1: Comprobar conexión del browser al inicio para evitar errores.
 */
async function getOrCreateContext(browser) {
    // 1. **VERIFICACIÓN CRUCIAL DE CONEXIÓN**
    if (typeof browser.isConnected === 'function' && !browser.isConnected()) {
        throw new Error('El browser está desconectado o cerrado.');
    }

    // Verificar que el browser no esté cerrado
    try {
        // Verificar si browser tiene método contexts
        if (typeof browser.contexts !== 'function') {
            throw new Error('El browser no tiene el método contexts()');
        }

        const contexts = browser.contexts();

        // Si hay contextos existentes, validar el primero
        if (Array.isArray(contexts) && contexts.length > 0) {
            const ctx = contexts[0];

            // Validar que el contexto es válido y tiene páginas
            try {
                if (typeof ctx.pages === 'function') {
                    const pages = ctx.pages();
                    if (Array.isArray(pages) && pages.length > 0) {
                        console.log('[INFO] Reutilizando contexto existente con páginas activas');
                        return ctx;
                    }
                }
            } catch (err) {
                console.log('[WARN] Contexto existente inválido, creando nuevo:', err.message);
            }
        }
    } catch (err) {
        console.error('[ERROR] Error al verificar contextos:', err.message);
        throw new Error(`Browser puede estar cerrado o inválido: ${err.message}`);
    }

    // Crear nuevo contexto
    if (typeof browser.newContext === 'function') {
        console.log('[INFO] Creando nuevo contexto de navegación');
        try {
            const newContext = await browser.newContext();
            console.log('[SUCCESS] Contexto creado exitosamente');
            return newContext;
        } catch (err) {
            console.error('[ERROR] No se pudo crear contexto:', err.message);

            // Error específico cuando el browser está cerrado
            if (err.message.includes('Browser closed') || err.message.includes('Target closed')) {
                throw new Error(
                    'El browser ha sido cerrado. Por favor, lanza un nuevo browser con launch_browser.',
                );
            }

            throw new Error(`No se pudo crear contexto: ${err.message}`);
        }
    }

    throw new Error('El browser no soporta crear contextos (método newContext no disponible)');
}

/**
 * Wrapper genérico para acciones MCP
 */
async function executeMcpAction(req, res, toolName, mcpArgsBuilder, successMessage) {
    try {
        const options = req.body;
        const mcpArgs = mcpArgsBuilder(options);

        const result = await callTool(toolName, mcpArgs);

        // Trazabilidad no bloqueante
        writeTrace({
            action: toolName,
            data: options,
            status: 'success',
        });

        const response = {
            success: true,
            message: successMessage(options),
            action: toolName,
            data: options,
            mcp_result: getCleanResult(result),
        };

        console.log(`[ACTION] ${toolName} ejecutado exitosamente`);
        return res.status(200).json(response);
    } catch (error) {
        console.error(`[ERROR] ${toolName}:`, error.message);

        writeTrace({
            action: toolName,
            error: error.message,
            status: 'error',
        });

        return res.status(500).json({
            success: false,
            message: `Error en ${toolName}`,
            error: error.message,
        });
    }
}

// async function getActiveBrowserContext(browserId) {
//     // Asume que 'browserManager' y 'getOrCreateContext' están disponibles en el ámbito
//     const ids = Array.from(browserManager.keys());

//     if (ids.length === 0) return null;

//     // Si no se proporciona un ID, usa el ID del último navegador registrado
//     const id = browserId || ids[ids.length - 1];
//     const entry = browserManager.get(id);

//     if (!entry) return null;

//     // Obtener la instancia del navegador (puede ser el objeto 'browser' o el 'entry' mismo)
//     const browserInstance = entry.browser || entry;

//     try {
//         // Obtener o crear el contexto predeterminado (o el único) del navegador
//         const context = await getOrCreateContext(browserInstance);
//         const pages = context.pages();

//         if (pages.length === 0) return null;

//         // Usar la última página abierta como la "página activa"
//         const page = pages[pages.length - 1];

//         // Verificar si la página está cerrada antes de devolverla
//         if (page.isClosed && page.isClosed()) return null;

//         return { page, browserId: id };
//     } catch (err) {
//         console.error('[ERROR] Error al obtener contexto activo:', err.message);
//         return null;
//     }
// }

// Función utilitaria para procesar la cadena de rutas de archivos
const processFilePaths = (filesString) => {
    if (!filesString || typeof filesString !== 'string') return [];

    // Divide por coma, limpia espacios y filtra entradas vacías.
    return filesString
        .split(',')
        .map((path) => path.trim())
        .filter((path) => path.length > 0);
};

// ==========================================================
// ACCIONES OPTIMIZADAS
// ==========================================================

export const launchBrowserAction = async (req, res) => {
    try {
        console.log('[ACTION] Iniciando lanzamiento de navegador...');

        // Opciones del body (si las hay)
        const { headless = false, slowMo, timeout } = req.body || {};

        // chromium.launch() mantiene el browser vivo y crea contexto por defecto
        const browser = await chromium.launch({
            headless,
            ...(slowMo && { slowMo }),
            ...(timeout && { timeout }),
        });

        console.log('[INFO] Browser lanzado exitosamente');

        const browserId = randomUUID().split('-')[0];

        // Guardar instancia del browser
        browserManager.set(browserId, {
            browser,
            launchMethod: 'launch', // Indicar método usado
        });

        console.log(`[SUCCESS] Navegador lanzado con ID: ${browserId}`);

        // Guardar metadata de forma no bloqueante
        setImmediate(async () => {
            try {
                await fs.mkdir(storageDir, { recursive: true });
                const data = {
                    browserId,
                    status: 'open',
                    launchedAt: new Date().toISOString(),
                    launchMethod: 'launch',
                    headless,
                    requestData: req.body || {},
                };
                const filePath = path.join(storageDir, `${browserId}.json`);
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            } catch (err) {
                console.error('[WARN] Error al guardar metadata:', err.message);
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Navegador lanzado correctamente.',
            browserId,
            headless,
        });
    } catch (error) {
        console.error('[ERROR] Fallo al lanzar el navegador:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al lanzar el navegador.',
            error: error.message,
        });
    }
};

export const openUrlAction = async (req, res) => {
    try {
        const { url, waitUntil = 'load', timeout = 30000 } = req.body ?? {};

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'url es requerida.',
            });
        }

        // Validar y obtener browser
        let browserId;
        const ids = Array.from(browserManager.keys());

        if (ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay navegadores activos. Llama a launch_browser primero.',
            });
        }

        browserId = ids[ids.length - 1];
        const entry = browserManager.get(browserId);

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: `No se encontró navegador con ID: ${browserId}`,
            });
        }

        const browser = entry.browser || entry;

        // Verificar que el browser esté conectado
        try {
            if (typeof browser.isConnected === 'function' && !browser.isConnected()) {
                browserManager.delete(browserId);
                return res.status(400).json({
                    success: false,
                    message: 'El browser ha sido desconectado. Por favor, lanza un nuevo browser.',
                    hint: 'Usa POST /api/actions/launch_browser',
                });
            }
        } catch (checkErr) {
            console.log('[WARN] No se pudo verificar conexión del browser:', checkErr.message);
        }

        // Obtener o crear contexto (usa la versión robusta de getOrCreateContext)
        let context;
        try {
            context = await getOrCreateContext(browser);
        } catch (contextError) {
            console.error('[ERROR] Error al obtener contexto:', contextError.message);

            // Si el browser está cerrado, limpiar del manager
            if (
                contextError.message.includes('Browser closed') ||
                contextError.message.includes('cerrado')
            ) {
                browserManager.delete(browserId);
            }

            return res.status(500).json({
                success: false,
                message: 'Error al obtener contexto de navegación',
                error: contextError.message,
                hint: 'El browser puede estar cerrado. Lanza un nuevo browser con launch_browser.',
            });
        }

        // 🔥 CORRECCIÓN 2: Reutilizar la página principal o crear una si no existe.
        // Esto evita crear una nueva página en cada llamada, manteniendo viva la referencia del contexto.
        const pages = context.pages();
        let page;

        if (pages.length > 0) {
            // Reutiliza la primera página activa (la principal) para mantener la referencia viva
            page = pages[0];
            console.log('[INFO] Reutilizando página principal existente para navegación.');
        } else {
            // Si no hay páginas, crea la primera
            page = await context.newPage();
            console.log('[INFO] Creando nueva página para navegación.');
        }

        const start = Date.now();
        // Opcional: Asegurar que la página está al frente
        await page.bringToFront().catch(() => {});

        await page.goto(url, { waitUntil, timeout });
        const duration = Date.now() - start;

        writeTrace({
            action: 'open_url',
            url,
            browserId,
            status: 'success',
            durationMs: duration,
        });

        console.log(`[SUCCESS] URL abierta (${duration}ms): ${url}`);

        return res.status(200).json({
            success: true,
            message: 'URL abierta correctamente.',
            url,
            durationMs: duration,
            browserId,
        });
    } catch (error) {
        console.error('[ERROR] openUrlAction:', error.message);

        writeTrace({
            action: 'open_url',
            error: error.message,
            status: 'error',
        });

        return res.status(500).json({
            success: false,
            message: 'Error al abrir la URL.',
            error: error.message,
        });
    }
};

export const closeBrowserAction = async (req, res) => {
    try {
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        browserId = validation.browserId;
        const entry = validation.entry;
        const browserInstance = entry.browser || entry;

        console.log(`[INFO] Cerrando browser ${browserId}...`);

        // Cerrar todos los contextos primero
        const closePromises = [];

        if (typeof browserInstance.contexts === 'function') {
            const contexts = browserInstance.contexts();
            console.log(`[INFO] Cerrando ${contexts.length} contexto(s)...`);

            for (const ctx of contexts) {
                closePromises.push(
                    ctx
                        .close()
                        .catch((err) =>
                            console.log('[WARN] Error al cerrar contexto:', err.message),
                        ),
                );
            }
        }

        // Esperar que se cierren los contextos
        await Promise.allSettled(closePromises);

        // Cerrar el browser
        try {
            await browserInstance.close();
            console.log(`[INFO] Browser cerrado exitosamente`);
        } catch (err) {
            console.log('[WARN] Error al cerrar browser:', err.message);
        }

        // Remover del manager
        browserManager.delete(browserId);

        writeTrace({
            action: 'close_browser',
            browserId,
            status: 'success',
        });

        console.log(`[SUCCESS] Navegador ${browserId} cerrado completamente`);

        return res.status(200).json({
            success: true,
            message: 'Navegador cerrado correctamente.',
            browserId,
        });
    } catch (error) {
        console.error('[ERROR] closeBrowserAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al cerrar el navegador.',
            error: error.message,
        });
    }
};

// ==========================================================
// ACCIONES SIMPLIFICADAS
// ==========================================================

export const clickAction = async (req, res, next) => {
    try {
        // 1. Obtener y Validar la Entrada (Asumimos que el middleware Joi ya validó req.body)
        const { selector, button, clickCount, modifiers, timeout, force, browserId } = req.body;

        console.log('[ACTION] clickAction iniciado.', {
            selector,
            browserId,
            button,
            clickCount,
        });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        // [ASUMIDO] validateBrowser es una función helper que verifica el ID y devuelve la entrada/ID.
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        const targetBrowserId = validation.browserId;
        const entry = validation.entry;
        const browserInstance = entry.browser || entry;

        // 3. Obtener la Página Activa (Usando Contexto)
        // [ASUMIDO] getOrCreateContext y el manejo de páginas es robusto.
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let pageInstance;

        if (pages.length === 0) {
            throw new Error('No hay páginas activas en el contexto para ejecutar la acción click.');
        }

        // Usamos la última página activa como objetivo
        pageInstance = pages[pages.length - 1];

        if (pageInstance.isClosed && pageInstance.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        // 4. Configurar Opciones de la Acción Playwright
        const clickOptions = {
            button: button,
            clickCount: clickCount,
            modifiers: modifiers, // Puede ser undefined si no se envió, Playwright lo maneja.
            timeout: timeout,
            force: force,
            // Playwright permite 'delay', 'position', 'noWaitAfter', que podrían añadirse al schema si son necesarios.
        };

        // 5. Ejecutar la Acción Playwright
        await pageInstance.click(selector, clickOptions);

        // 6. Registrar Trazabilidad
        // [ASUMIDO] writeTrace es una función helper.
        writeTrace({
            action: 'click',
            browserId: targetBrowserId,
            status: 'success',
            selector,
            details: clickOptions,
        });

        // 7. Respuesta Exitosa
        const response = {
            success: true,
            message: `Clic exitoso en selector '${selector}' para browserId: ${targetBrowserId}.`,
            browserId: targetBrowserId,
            data: clickOptions,
        };
        console.log('[RESPONSE DATA]', response);
        return res.status(200).json(response);
    } catch (error) {
        // 8. Manejo de Errores (incluye errores de Playwright, como selector no encontrado)
        const errorMessage = error?.message || String(error);

        // Registrar error en la traza
        writeTrace({
            action: 'click',
            browserId: req.body?.browserId,
            status: 'error',
            selector: req.body?.selector,
            error: errorMessage,
        });

        console.error(`[ERROR] clickAction (Selector: ${req.body?.selector}):`, errorMessage);

        const errorResponse = {
            success: false,
            message: `Error al ejecutar click en selector '${req.body?.selector}': ${errorMessage.substring(0, 100)}...`,
            error: errorMessage,
        };
        res.status(500).json(errorResponse);
        return next(error);
    }
};

export const typeTextAction = async (req, res, next) => {
    try {
        // 1. Obtener y Validar la Entrada (Asumimos que el middleware Joi ya validó req.body)
        const { selector, text, clearBeforeType, delay, timeout, browserId } = req.body;

        console.log('[ACTION] typeTextAction iniciado.', {
            selector,
            browserId,
            delay,
            clearBeforeType,
        });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        const targetBrowserId = validation.browserId;
        const entry = validation.entry;
        const browserInstance = entry.browser || entry;

        // 🚨 VERIFICACIÓN DE VIGOROSIDAD DEL NAVEGADOR
        // Asegura que la instancia de Playwright Browser esté conectada antes de continuar.
        if (typeof browserInstance.isConnected === 'function' && !browserInstance.isConnected()) {
            throw new Error(
                'El navegador Playwright está desconectado. La instancia ha sido cerrada o ha perdido la conexión.',
            );
        }

        // 3. Obtener la Página Activa
        // [ASUMIDO] getOrCreateContext maneja la conexión al motor de Playwright.
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let pageInstance;

        if (pages.length === 0) {
            throw new Error(
                'No hay páginas activas en el contexto para ejecutar la acción de escribir texto.',
            );
        }

        // Usamos la última página activa como objetivo
        pageInstance = pages[pages.length - 1];

        if (pageInstance.isClosed && pageInstance.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        // 4. Configurar Opciones y Ejecutar la Acción Playwright
        const actionOptions = {
            timeout: timeout,
        };

        if (delay > 0) {
            // A. Usar page.type() para simular pulsación humana con delay.

            if (clearBeforeType) {
                // Borrar el campo antes de escribir.
                await pageInstance.fill(selector, '', actionOptions);
                console.log(`[INFO] Campo borrado antes de escribir en selector: ${selector}.`);
            }

            await pageInstance.type(selector, text, {
                ...actionOptions,
                delay: delay,
            });

            console.log(`[ACTION] Texto ingresado usando page.type() con delay: ${delay}ms.`);
        } else {
            // B. Usar page.fill() para la entrada de texto más rápida.
            await pageInstance.fill(selector, text, actionOptions);

            console.log(`[ACTION] Texto ingresado usando page.fill().`);
        }

        // 5. Registrar Trazabilidad
        writeTrace({
            action: 'type_text',
            browserId: targetBrowserId,
            status: 'success',
            selector,
            textLength: text.length,
            delay: delay,
        });

        // 6. Respuesta Exitosa
        const response = {
            success: true,
            message: `Texto ingresado exitosamente en selector '${selector}' para browserId: ${targetBrowserId}.`,
            browserId: targetBrowserId,
            textLength: text.length,
        };
        console.log('[RESPONSE DATA]', response);
        return res.status(200).json(response);
    } catch (error) {
        // 7. Manejo de Errores
        const errorMessage = error?.message || String(error);

        // Si el error indica desconexión, limpiar el estado del BrowserManager
        if (errorMessage.includes('desconectada') || errorMessage.includes('closed')) {
            browserManager.delete(req.body?.browserId);
            console.log(
                `[WARN] Browser ID ${req.body?.browserId} eliminado del manager debido a desconexión.`,
            );
        }

        writeTrace({
            action: 'type_text',
            browserId: req.body?.browserId,
            status: 'error',
            selector: req.body?.selector,
            error: errorMessage,
        });

        console.error(`[ERROR] typeTextAction (Selector: ${req.body?.selector}):`, errorMessage);

        const errorResponse = {
            success: false,
            message: `Error al ingresar texto en selector '${req.body?.selector}'.`,
            error: errorMessage,
        };
        res.status(500).json(errorResponse);
        return next(error);
    }
};

export const scrollAction = async (req, res) => {
    try {
        const { selector, direction, amount, behavior, browserId: rawBrowserId } = req.body ?? {};

        // === MANEJO DE INSTANCIA DE NAVEGADOR (Asumimos que estas funciones son correctas) ===
        let browserId = rawBrowserId;
        if (browserId === '' || browserId === null) browserId = undefined;

        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay páginas activas en el contexto para ejecutar la acción de scroll.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        const finalBrowserId = targetBrowserId;
        const start = Date.now();
        // === FIN DE MANEJO DE INSTANCIA DE NAVEGADOR ===

        let dx = 0;
        let dy = 0;

        switch (direction) {
            case 'down':
                dy = amount;
                break;
            case 'up':
                dy = -amount;
                break;
            case 'right':
                dx = amount;
                break;
            case 'left':
                dx = -amount;
                break;
        }

        let message = '';

        if (selector) {
            // Caso 1: Desplazamiento dentro de un elemento específico

            try {
                // Esperamos un máximo de 5 segundos para que el elemento aparezca en el DOM
                await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
            } catch (_) {
                // CORRECCIÓN: Usar '_' en lugar de 'e'
                // Si el elemento no se encuentra, lanzamos un error claro
                throw new Error(
                    `El elemento contenedor no se encontró con el selector: ${selector}.`,
                );
            }

            // Usamos page.evaluate() para ejecutar JS que encuentre el elemento y lo desplace.
            await page.evaluate(
                ({ selector, dx, dy, behavior }) => {
                    /* global document */ // CORRECCIÓN: Suprimir el error 'no-undef' para document
                    const element = document.querySelector(selector);

                    if (!element) {
                        throw new Error(`Elemento no encontrado con selector: ${selector}`);
                    }

                    element.scrollBy({
                        left: dx,
                        top: dy,
                        behavior: behavior,
                    });
                },
                { selector, dx, dy, behavior },
            );

            message = `Desplazamiento de ${amount}px (${direction}) aplicado al elemento: ${selector}.`;
        } else {
            // Caso 2: Desplazamiento de la ventana principal

            // Usamos page.evaluate() para desplazar la ventana principal
            await page.evaluate(
                ({ dx, dy, behavior }) => {
                    /* global window */ // CORRECCIÓN: Suprimir el error 'no-undef' para window
                    window.scrollBy({
                        left: dx,
                        top: dy,
                        behavior: behavior,
                    });
                },
                { dx, dy, behavior },
            );

            message = `Desplazamiento de la ventana principal por ${amount}px (${direction}).`;
        }

        const duration = Date.now() - start;

        writeTrace({
            action: 'scroll',
            selector: selector || 'window',
            direction,
            amount,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: message,
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] scrollAction:', error.message);

        writeTrace({
            action: 'scroll',
            error: error.message,
            status: 'error',
        });

        return res.status(500).json({
            success: false,
            message: 'Error al ejecutar la acción de desplazamiento.',
            error: error.message,
            selector: req.body.selector,
        });
    }
};

export const waitVisibleAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'wait_visible',
        (opts) => ({
            selector: opts.selector,
            timeout: opts.timeout,
            scrollIntoView: opts.scrollIntoView,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Elemento ${opts.selector} visible`,
    );

export const takeScreenshotAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'take_screenshot',
        (opts) => ({
            ...(opts.selector && { selector: opts.selector }),
            ...(opts.path && { path: opts.path }),
            fullPage: opts.fullPage,
            format: opts.format,
            quality: opts.quality,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Screenshot capturado en formato ${opts.format}`,
    );

// ==========================================================
// MANAGE TABS OPTIMIZADO
// ==========================================================

export const manageTabsAction = async (req, res, next) => {
    try {
        // 1. Desestructurar y Normalizar Entrada
        let { action, tabIndex, url, browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        console.log('[ACTION] manageTabsAction iniciado.', {
            action,
            browserId,
            tabIndex,
            url,
        });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const entry = validation.entry;
        const browserInstance = entry.browser || entry;

        // 3. Obtener la Página Activa (Usando Contexto) 🆕
        let context;
        try {
            // Reutilizamos la función robusta getOrCreateContext
            context = await getOrCreateContext(browserInstance);
        } catch (contextError) {
            console.error(
                '[ERROR] Error al obtener contexto para gestión de pestañas:',
                contextError.message,
            );
            if (contextError.message.includes('cerrado')) {
                browserManager.delete(targetBrowserId);
            }
            return res.status(500).json({
                success: false,
                message: 'Error al obtener contexto de navegación para gestionar pestañas.',
                error: contextError.message,
            });
        }

        // Obtener todas las páginas del contexto para las acciones
        const pages = context.pages();
        let pageInstance; // Usado para 'new' y como referencia

        if (pages.length === 0 && action !== 'new') {
            return res.status(400).json({
                success: false,
                message: 'No hay páginas activas para ejecutar esta acción.',
            });
        }

        let data = null;

        // 4. Lógica Principal: Ejecutar la Acción Solicitada
        switch (action) {
            case 'new':
                // Crea una nueva pestaña y navega
                pageInstance = await context.newPage();
                await pageInstance.goto(url);
                console.log(`[ACTION] Creando nueva pestaña en: ${url}`);
                data = { newUrl: url, newIndex: pages.length };
                break;

            case 'switch':
                // Cambia el enfoque a la pestaña por índice
                if (tabIndex >= pages.length)
                    throw new Error(`Índice de pestaña ${tabIndex} fuera de rango.`);
                await pages[tabIndex].bringToFront();
                console.log(`[ACTION] Cambiando a pestaña en índice: ${tabIndex}`);
                break;

            case 'close':
                // Cierra la pestaña por índice
                if (tabIndex >= pages.length)
                    throw new Error(`Índice de pestaña ${tabIndex} fuera de rango.`);
                await pages[tabIndex].close();
                console.log(`[ACTION] Cerrando pestaña en índice: ${tabIndex}`);
                break;

            case 'list':
                // Lista todas las pestañas
                data = await Promise.all(
                    pages.map(async (p, i) => ({
                        index: i,
                        url: p.url(),
                        title: await p.title().catch(() => 'N/A'),
                    })),
                );
                console.log('[ACTION] Listando pestañas.');
                break;

            default:
                throw new Error(`Acción desconocida: ${action}`);
        }

        // 5. Registrar Trazabilidad
        writeTrace({
            action: 'manage_tabs',
            browserId: targetBrowserId,
            subAction: action,
            status: 'success',
            tabIndex: tabIndex !== undefined ? tabIndex : 'N/A',
            url: url !== undefined ? url : 'N/A',
        });

        // 6. Respuesta Exitosa
        const response = {
            success: true,
            message: `Acción '${action}' en pestañas procesada correctamente para browserId: ${targetBrowserId}.`,
            browserId: targetBrowserId,
            data: data,
        };
        console.log('[RESPONSE DATA]', response);
        return res.status(200).json(response);
    } catch (error) {
        console.error(
            `[ERROR] manageTabsAction (Action: ${req.body?.action}):`,
            error?.message || error,
        );

        const errorResponse = {
            success: false,
            message: `Error al ejecutar la acción '${req.body?.action}' en pestañas.`,
            error: error?.message || String(error),
        };
        console.log('[RESPONSE DATA - ERROR]', errorResponse);
        res.status(500).json(errorResponse);
        return next(error);
    }
};

// ==========================================================
// ACCIONES
// ==========================================================

export const dragDropAction = async (req, res) => {
    // Declaramos estas variables fuera del try para que sean accesibles en el catch
    let sourceSelector;
    let targetSelector;
    let finalBrowserId;

    try {
        // Los valores ya están validados por Joi
        const { steps, force } = req.body ?? {};
        ({ sourceSelector, targetSelector } = req.body ?? {}); // Asignación de variables declaradas

        // === INICIO DE CORRECCIÓN: Obtener Browser y Page (Reemplazando getActiveBrowserContext) ===
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        // 1. Obtener y Validar la Instancia del Navegador
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'No hay páginas activas en el contexto para ejecutar la acción drag and drop.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        finalBrowserId = targetBrowserId; // Asignamos aquí
        const start = Date.now();
        // === FIN DE CORRECCIÓN ===

        console.log(
            `[INFO] Arrastrando ${sourceSelector} a ${targetSelector}. Pasos: ${steps}, Forzar: ${force}`,
        );

        // 3. Ejecución de Playwright: page.dragAndDrop()
        await page.dragAndDrop(sourceSelector, targetSelector, {
            steps: steps,
            force: force,
            timeout: 30000,
        });

        const duration = Date.now() - start;

        writeTrace({
            action: 'drag_drop',
            sourceSelector,
            targetSelector,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: `Elemento ${sourceSelector} arrastrado y soltado correctamente en ${targetSelector}.`,
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] dragDropAction:', error.message);

        writeTrace({
            action: 'drag_drop',
            error: error.message,
            status: 'error',
        });

        // Si el error indica que no se encontraron los selectores
        const status = error.message.includes('No node found') ? 404 : 500;

        return res.status(status).json({
            success: false,
            message: 'Error al ejecutar la acción de arrastrar y soltar.',
            error: error.message,
            sourceSelector: sourceSelector, // Ahora accesibles
            targetSelector: targetSelector, // Ahora accesibles
        });
    }
};

export const resizeViewportAction = async (req, res, next) => {
    try {
        // 1. Desestructurar y Normalizar Entrada
        let { browserId, deviceEmulation, width, height } = req.body ?? {};

        if (browserId === '' || browserId === null) browserId = undefined;
        if (deviceEmulation === '' || deviceEmulation === null) deviceEmulation = undefined;

        console.log('[ACTION] resizeViewportAction iniciado.', {
            browserId,
            deviceEmulation,
            width,
            height,
        });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        // [ASUMIDO] validateBrowser maneja la obtención del ID, entry y browserInstance.
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        const targetBrowserId = validation.browserId;
        const entry = validation.entry;
        const browserInstance = entry.browser || entry;

        let currentViewport = { width, height, emulation: deviceEmulation || 'N/A' };

        // ==========================================================
        // 3. Lógica Principal: Emulación vs. Redimensionamiento Manual
        // ==========================================================

        if (deviceEmulation) {
            // A. MODO EMULACIÓN COMPLETA (Requiere nuevo contexto)

            const deviceSettings = PLAYWRIGHT_DEVICES[deviceEmulation];

            if (!deviceSettings) {
                throw new Error(
                    `Configuración de dispositivo no encontrada para: ${deviceEmulation}. Dispositivos válidos: ${Object.keys(PLAYWRIGHT_DEVICES).join(', ')}`,
                );
            }

            console.log(`[ACTION] Aplicando emulación completa de: ${deviceEmulation}`);

            // 3.1. Obtener URL actual (para re-navegar después de la emulación)
            let currentUrl = 'about:blank';
            try {
                // Si la acción previa falló, el objeto 'page' puede no ser válido, usamos una verificación try/catch.
                const activePage =
                    entry.page ||
                    (entry.context
                        ? entry.context.pages()[entry.context.pages().length - 1]
                        : null);
                if (activePage && !activePage.isClosed()) {
                    currentUrl = activePage.url();
                }
            } catch (e) {
                console.log('[WARN] No se pudo obtener la URL de la página activa.' + e);
            }

            // 3.2. Cerrar el contexto antiguo y liberar recursos
            if (entry.context) {
                await entry.context
                    .close()
                    .catch((err) =>
                        console.log('[WARN] Error al cerrar contexto antiguo:', err.message),
                    );
                console.log('[INFO] Contexto antiguo cerrado para aplicar emulación.');
            }

            // 3.3. Crear Nuevo Contexto con Emulación
            const newContext = await browserInstance.newContext({
                ...deviceSettings,
            });
            const newPage = await newContext.newPage();

            // Re-navegar a la URL anterior
            await newPage.goto(currentUrl);

            // 3.4. Actualizar BrowserManager con el nuevo Contexto y Página
            entry.context = newContext;
            entry.page = newPage;
            browserManager.set(targetBrowserId, entry); // Actualizar la referencia

            // Actualizar variables de respuesta
            currentViewport.width = deviceSettings.viewport.width;
            currentViewport.height = deviceSettings.viewport.height;
        } else {
            // B. MODO REDIMENSIONAMIENTO MANUAL (width/height)

            // 3.1. Obtener la página activa (más robusto)
            const context = await getOrCreateContext(browserInstance);
            const pages = context.pages();
            let pageInstance = null;

            if (pages.length > 0) {
                pageInstance = pages[pages.length - 1];
            }

            if (!pageInstance || (pageInstance.isClosed && pageInstance.isClosed())) {
                pageInstance = await context.newPage();
                console.log('[INFO] Creando nueva página para setViewport (no había activa).');
            }

            if (!pageInstance || typeof pageInstance.setViewport !== 'function') {
                throw new Error(
                    'La instancia de página activa no tiene el método setViewport. Revise la conexión Playwright.',
                );
            }

            // 3.2. Aplicar el Viewport
            const viewport = { width, height };
            await pageInstance.setViewport(viewport);
            console.log(`[ACTION] Viewport ajustado manualmente a: ${width}x${height}`);

            currentViewport.emulation = 'manual';
        }

        // 4. Registrar Trazabilidad
        writeTrace({
            action: 'resize_viewport',
            browserId: targetBrowserId,
            status: 'success',
            deviceEmulation: deviceEmulation || 'manual',
            width: currentViewport.width,
            height: currentViewport.height,
        });

        // 5. Respuesta Exitosa
        const response = {
            success: true,
            message: `Viewport ajustado correctamente en browserId: ${targetBrowserId}.`,
            browserId: targetBrowserId,
            currentViewport: currentViewport,
        };
        console.log('[RESPONSE DATA]', response);
        return res.status(200).json(response);
    } catch (error) {
        console.error('[ERROR] resizeViewportAction:', error?.message || error);

        const errorResponse = {
            success: false,
            message: error.message.includes('Configuración de dispositivo no encontrada')
                ? error.message
                : 'Error al redimensionar el viewport.',
            error: error?.message || String(error),
        };
        console.log('[RESPONSE DATA - ERROR]', errorResponse);
        res.status(500).json(errorResponse);
        return next(error);
    }
};

export const findElementAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'find_element',
        (opts) => ({
            selector: opts.selector,
            selectorType: opts.selectorType,
            timeout: opts.timeout,
            visible: opts.visible,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Elemento encontrado: ${opts.selector}`,
    );

export const getSetContentAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'get_set_content',
        (opts) => ({
            selector: opts.selector,
            action: opts.action,
            ...(opts.action === 'set' && { value: opts.value }),
            ...(opts.action === 'set' && { clearBeforeSet: opts.clearBeforeSet }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) =>
            `Contenido ${opts.action === 'set' ? 'establecido' : 'obtenido'} en ${opts.selector}`,
    );

export const waitForElementAction = async (req, res) => {
    try {
        const { selector, condition, timeout, browserId } = req.body ?? {};

        // === INICIO DE CORRECCIÓN: Obtener Browser y Page (Lógica Reutilizada) ===
        // 1. Obtener y Validar la Instancia del Navegador
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay páginas activas en el contexto para ejecutar la acción de espera.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        const finalBrowserId = targetBrowserId;
        // === FIN DE CORRECCIÓN ===

        const start = Date.now();

        // Mapear la condición a la opción de Playwright
        const stateMapping = {
            visible: 'visible',
            hidden: 'hidden',
            attached: 'attached',
            detached: 'detached',
        };
        const state = stateMapping[condition] || 'visible';

        console.log(
            `[INFO] Esperando elemento: ${selector}, condición: ${condition} (state: ${state})`,
        );

        // Ejecución de Playwright: page.waitForSelector
        await page.waitForSelector(selector, {
            state: state,
            timeout: timeout,
        });

        const duration = Date.now() - start;

        writeTrace({
            action: 'wait_for_element',
            selector,
            condition,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId, // Usar la variable correcta
        });

        return res.status(200).json({
            success: true,
            message: `Elemento ${selector} encontrado en estado "${condition}".`,
            selector,
            condition,
            durationMs: duration,
            browserId: finalBrowserId, // Usar la variable correcta
        });
    } catch (error) {
        console.error('[ERROR] waitForElementAction:', error.message);

        writeTrace({
            action: 'wait_for_element',
            error: error.message,
            status: 'error',
        });

        const status = error.message.includes('Timeout') ? 408 : 500;

        return res.status(status).json({
            success: false,
            message: 'Error al esperar el elemento. Timeout o error interno.',
            error: error.message,
            selector: req.body.selector,
        });
    }
};

export const executeJsAction = async (req, res) => {
    try {
        // Los valores ya están validados por Joi
        const { script, returnValue, variableName, args } = req.body ?? {};

        // === LÓGICA DE OBTENCIÓN DE NAVEGADOR Y PÁGINA (CORREGIDA) ===
        // 1. Obtener y Validar la Instancia del Navegador
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay páginas activas en el contexto para ejecutar JS.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada para ejecutar JS.');
        }

        const finalBrowserId = targetBrowserId; // Usar el ID validado
        // === FIN DE LÓGICA DE OBTENCIÓN ===

        const start = Date.now();

        // 3. Preparar los argumentos y la función de parseo
        const safeParseArgs = (argsString) => {
            if (!argsString || argsString.trim() === '') {
                return [];
            }
            try {
                // Asume que los argumentos vienen como un string JSON (ej: '["arg1", 123]')
                const parsedArgs = JSON.parse(argsString);
                if (!Array.isArray(parsedArgs)) {
                    console.warn(
                        '[WARN] Los argumentos de execute_js no son un array JSON. Se usarán como un solo argumento.',
                    );
                    return [parsedArgs];
                }
                return parsedArgs;
            } catch (e) {
                console.error('[ERROR] Error al parsear argumentos JSON:', e.message);
                // Si falla el parseo JSON, devuelve el string como un único argumento.
                return [argsString];
            }
        };

        // CORRECCIÓN: Definir parsedArgs en el ámbito correcto para usarlo en console.log y page.evaluate
        const parsedArgs = safeParseArgs(args);

        console.log(
            `[INFO] Ejecutando JS. Retorno esperado: ${returnValue}. Argumentos:`,
            parsedArgs,
        );

        let scriptResult = null;
        // let resultSaved = false;

        // Ejecutar Playwright: page.evaluate()
        scriptResult = await page.evaluate(script, ...parsedArgs);

        const duration = Date.now() - start;

        const traceData = {
            action: 'execute_js',
            script: script.substring(0, 50) + '...',
            durationMs: duration,
            status: 'success',
            browserId: finalBrowserId,
        };

        const responseData = {
            success: true,
            message: 'Script JavaScript ejecutado correctamente.',
            durationMs: duration,
            browserId: finalBrowserId,
        };

        // 4. Manejar el valor de retorno (si se solicita)
        if (returnValue) {
            // Asumiendo una utilidad global (como globalStateManager) para guardar la variable
            // globalStateManager.setVariable(variableName, scriptResult);

            responseData.message += ` Valor guardado en la variable: ${variableName}.`;
            responseData.variableName = variableName;
            responseData.resultValue = scriptResult;
            // resultSaved = true;
            traceData.resultValue = scriptResult;
            traceData.variableName = variableName;
        }

        writeTrace(traceData);

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('[ERROR] executeJsAction:', error.message);

        writeTrace({
            action: 'execute_js',
            error: error.message,
            status: 'error',
        });

        return res.status(500).json({
            success: false,
            message: 'Error al ejecutar el script JavaScript.',
            error: error.message,
        });
    }
};

export const selectOptionAction = async (req, res) => {
    try {
        // Los valores ya están validados por Joi
        const { selector, selectionCriteria, selectionValue, timeout } = req.body ?? {};

        // === Lógica de Obtención de Browser y Page (CORREGIDA) ===
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        // 1. Obtener y Validar la Instancia del Navegador
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'No hay páginas activas en el contexto para ejecutar la acción de selección.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        const finalBrowserId = targetBrowserId;
        const start = Date.now();
        // === FIN DE LÓGICA CORREGIDA ===

        // 2. Preparar el argumento para page.selectOption()
        let playwrightSelectArg;

        // Playwright permite seleccionar por value, label o index.
        switch (selectionCriteria) {
            case 'value':
                playwrightSelectArg = { value: selectionValue };
                break;
            case 'label':
                playwrightSelectArg = { label: selectionValue };
                break;
            case 'index': {
                // <-- Añadimos llave de apertura
                const index = parseInt(selectionValue, 10);
                if (isNaN(index)) {
                    throw new Error(
                        "El valor de selección para 'index' debe ser un número entero.",
                    );
                }
                playwrightSelectArg = { index: index };
                break;
            }

            default:
                throw new Error(`Criterio de selección no soportado: ${selectionCriteria}`);
        }

        console.log(
            `[INFO] Seleccionando opción en ${selector} por ${selectionCriteria}. Valor: ${selectionValue}`,
        );

        // 3. Ejecución de Playwright: page.selectOption()
        const selectedValues = await page.selectOption(selector, playwrightSelectArg, {
            timeout: timeout,
        });

        const duration = Date.now() - start;

        writeTrace({
            action: 'select_option',
            selector,
            selectionCriteria,
            selectionValue,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: `Opción seleccionada correctamente en ${selector}.`,
            selectedValues,
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] selectOptionAction:', error.message);

        writeTrace({
            action: 'select_option',
            error: error.message,
            status: 'error',
        });

        const status = error.message.includes('Timeout') ? 408 : 500;

        return res.status(status).json({
            success: false,
            message: 'Error al seleccionar la opción del dropdown.',
            error: error.message,
            selector: req.body.selector,
        });
    }
};

export const submitFormAction = async (req, res) => {
    try {
        // Los valores ya están validados por Joi
        const { selector, waitForNavigation, timeout } = req.body ?? {};

        // === INICIO DE CORRECCIÓN: Obtener Browser y Page (Reemplazando getActiveBrowserContext) ===
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        // 1. Obtener y Validar la Instancia del Navegador
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay páginas activas en el contexto para ejecutar la acción de envío.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        const finalBrowserId = targetBrowserId;
        const start = Date.now();
        // === FIN DE CORRECCIÓN ===

        console.log(
            `[INFO] Intentando enviar formulario/clic en: ${selector}. Esperar navegación: ${waitForNavigation}`,
        );

        if (waitForNavigation) {
            // Usamos Promise.all() para ejecutar el clic Y esperar la navegación de forma concurrente
            await Promise.all([
                // 1. Esperar la navegación (la condición por defecto es 'load')
                page.waitForNavigation({ timeout: timeout }),
                // 2. Ejecutar el clic o el envío del formulario
                page.click(selector, { timeout: timeout }),
            ]);
        } else {
            // Solo hacer el clic/envío (útil para envíos AJAX)
            await page.click(selector, { timeout: timeout });
        }

        const duration = Date.now() - start;

        writeTrace({
            action: 'submit_form',
            selector,
            waitForNavigation,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: `Formulario/botón de envío (${selector}) activado correctamente.`,
            navigationOccurred: waitForNavigation,
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] submitFormAction:', error.message);

        writeTrace({
            action: 'submit_form',
            error: error.message,
            status: 'error',
        });

        // Si es un timeout, puede ser por la navegación
        const status = error.message.includes('Timeout') ? 408 : 500;

        return res.status(status).json({
            success: false,
            message: 'Error al enviar el formulario o timeout esperando la navegación.',
            error: error.message,
            selector: req.body.selector,
        });
    }
};

export const uploadFileAction = async (req, res) => {
    // Declaramos estas variables fuera del try para que sean accesibles en el catch
    let selector;
    let files;
    let finalBrowserId;

    try {
        // Los valores ya están validados por Joi
        const { timeout } = req.body ?? {};
        ({ selector, files } = req.body ?? {});

        // === INICIO DE CORRECCIÓN: Obtener Browser y Page (Reemplazando getActiveBrowserContext) ===
        let { browserId } = req.body ?? {};
        if (browserId === '' || browserId === null) browserId = undefined;

        // 1. Obtener y Validar la Instancia del Navegador
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 2. Obtener la Página Activa (Usando Contexto)
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();
        let page;

        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'No hay páginas activas en el contexto para ejecutar la subida de archivos.',
                hint: 'Asegúrate de haber abierto una URL con open_url.',
            });
        }

        // Usamos la última página activa como objetivo
        page = pages[pages.length - 1];

        if (page.isClosed && page.isClosed()) {
            throw new Error('La página objetivo está cerrada.');
        }

        finalBrowserId = targetBrowserId;
        const start = Date.now();
        // === FIN DE CORRECCIÓN ===

        // Convertir la cadena de rutas a un array de rutas
        // Se asume que processFilePaths está definida y es accesible.
        const filePaths = processFilePaths(files);

        if (filePaths.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se encontraron rutas de archivo válidas para subir.',
            });
        }

        console.log(
            `[INFO] Subiendo archivos (${filePaths.length}) al selector ${selector}. Rutas: ${filePaths.join('; ')}`,
        );

        // 2. Ejecución de Playwright: page.setInputFiles()
        await page.setInputFiles(selector, filePaths, {
            timeout: timeout,
        });

        const duration = Date.now() - start;

        writeTrace({
            action: 'upload_file',
            selector,
            files: filePaths,
            status: 'success',
            durationMs: duration,
            browserId: finalBrowserId,
        });

        return res.status(200).json({
            success: true,
            message: `${filePaths.length} archivo(s) subido(s) correctamente al selector ${selector}.`,
            uploadedFiles: filePaths,
            durationMs: duration,
            browserId: finalBrowserId,
        });
    } catch (error) {
        console.error('[ERROR] uploadFileAction:', error.message);

        writeTrace({
            action: 'upload_file',
            error: error.message,
            status: 'error',
        });

        // Playwright lanza errores si el selector no es un input file o si la ruta es inaccesible.
        const status = error.message.includes('No node found') ? 404 : 500;

        return res.status(status).json({
            success: false,
            message:
                'Error al subir el archivo. Verifique el selector y las rutas de los archivos.',
            error: error.message,
            selector: selector, // Ahora es accesible
        });
    }
};

export const waitNavigationAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'wait_navigation',
        (opts) => ({
            ...(opts.url && { url: opts.url }),
            timeout: opts.timeout,
            waitUntil: opts.waitUntil,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        () => `Navegación completada`,
    );

export const waitNetworkAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'wait_network',
        (opts) => ({
            idleTime: opts.idleTime,
            timeout: opts.timeout,
            includeResources: opts.includeResources,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Red inactiva por ${opts.idleTime}ms`,
    );

export const waitConditionalAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'wait_conditional',
        (opts) => ({
            conditionScript: opts.conditionScript,
            polling: opts.polling,
            timeout: opts.timeout,
            ...(opts.args && { args: opts.args }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        () => `Condición JavaScript cumplida`,
    );

export const saveDomAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'save_dom',
        (opts) => ({
            ...(opts.selector && { selector: opts.selector }),
            ...(opts.path && { path: opts.path }),
            ...(opts.variableName && { variableName: opts.variableName }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        () => `DOM guardado`,
    );

export const logErrorsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'log_errors',
        (opts) => ({
            logToFile: opts.logToFile,
            ...(opts.filePath && { filePath: opts.filePath }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        () => `Escucha de errores iniciada`,
    );

export const listenEventsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'listen_events',
        (opts) => ({
            eventType: opts.eventType,
            ...(opts.selector && { selector: opts.selector }),
            logToFile: opts.logToFile,
            ...(opts.logToFile && opts.filePath && { filePath: opts.filePath }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Escucha de evento ${opts.eventType} iniciada`,
    );

export const interceptRequestAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'intercept_request',
        (opts) => ({
            urlPattern: opts.urlPattern,
            ...(opts.method && { method: opts.method }),
            action: opts.action,
            ...(opts.action === 'mock' && { responseMock: opts.responseMock }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Interceptación de ${opts.urlPattern} configurada`,
    );

export const mockResponseAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'mock_response',
        (opts) => ({
            urlPattern: opts.urlPattern,
            ...(opts.method && { method: opts.method }),
            responseBody: opts.responseBody,
            status: opts.status,
            ...(opts.headers && { headers: opts.headers }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Mock de respuesta configurado para ${opts.urlPattern}`,
    );

export const blockResourceAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'block_resource',
        (opts) => ({
            urlPattern: opts.urlPattern,
            ...(opts.resourceType && { resourceType: opts.resourceType }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Recurso ${opts.urlPattern} bloqueado`,
    );

export const modifyHeadersAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'modify_headers',
        (opts) => ({
            urlPattern: opts.urlPattern,
            headers: opts.headers,
            ...(opts.method && { method: opts.method }),
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Headers modificados para ${opts.urlPattern}`,
    );

export const manageCookiesAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'manage_cookies',
        (opts) => ({
            action: opts.action,
            ...(opts.cookiesData && { cookiesData: opts.cookiesData }),
            ...(opts.domainFilter && { domainFilter: opts.domainFilter }),
            ...(opts.pathFilter && { pathFilter: opts.pathFilter }),
            ...(opts.variableName && { variableName: opts.variableName }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Cookies ${opts.action} ejecutado`,
    );

export const manageStorageAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'manage_storage',
        (opts) => ({
            storageType: opts.storageType,
            action: opts.action,
            ...(opts.key && { key: opts.key }),
            ...(opts.value && { value: opts.value }),
            ...(opts.variableName && { variableName: opts.variableName }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Storage ${opts.action} ejecutado`,
    );

export const injectTokensAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'inject_tokens',
        (opts) => ({
            target: opts.target,
            key: opts.key,
            value: opts.value,
            ...(opts.urlPattern && { urlPattern: opts.urlPattern }),
            ...(opts.cookiePath && { cookiePath: opts.cookiePath }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Token inyectado en ${opts.target}`,
    );

export const persistSessionAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'persist_session',
        (opts) => ({
            action: opts.action,
            path: opts.path,
            ...(opts.action === 'save' && {
                includeLocalStorage: opts.includeLocalStorage,
                includeSessionStorage: opts.includeSessionStorage,
            }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Sesión ${opts.action === 'save' ? 'guardada' : 'cargada'}`,
    );

export const createContextAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'create_context',
        (opts) => ({
            ...(opts.storageState && { storageState: opts.storageState }),
            ...(opts.viewportWidth &&
                opts.viewportHeight && {
                    viewport: `${opts.viewportWidth},${opts.viewportHeight}`,
                }),
            ...(opts.userAgent && { userAgent: opts.userAgent }),
            ...(opts.geolocation && { geolocation: opts.geolocation }),
            ...(opts.permissions && { permissions: opts.permissions }),
            ...(opts.locale && { locale: opts.locale }),
            browserId: opts.browserId,
        }),
        () => `Contexto creado`,
    );

export const cleanupStateAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'cleanup_state',
        (opts) => ({
            target: opts.target,
            includeCookies: opts.includeCookies,
            includeLocalStorage: opts.includeLocalStorage,
            includeSessionStorage: opts.includeSessionStorage,
            includeIndexedDB: opts.includeIndexedDB,
            includePermissions: opts.includePermissions,
            browserId: opts.browserId,
        }),
        () => `Estado limpiado`,
    );

export const handleHooksAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'handle_hooks',
        (opts) => ({
            hookType: opts.hookType,
            ...(opts.actionName && { actionName: opts.actionName }),
            callbackCode: opts.callbackCode,
            once: opts.once,
            browserId: opts.browserId,
        }),
        (opts) => `Hook ${opts.hookType} registrado`,
    );

export const controlExceptionsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'control_exceptions',
        (opts) => ({
            exceptionType: opts.exceptionType,
            action: opts.action,
            ...(opts.action === 'retry' && { maxRetries: opts.maxRetries }),
            ...(opts.logFile && { logFile: opts.logFile }),
            browserId: opts.browserId,
        }),
        (opts) => `Control de excepción ${opts.exceptionType} configurado`,
    );

export const readDataAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'read_data',
        (opts) => ({
            sourceType: opts.sourceType,
            path: opts.path,
            variableName: opts.variableName,
            encoding: opts.encoding,
            ...(opts.sourceType === 'excel' && { sheetName: opts.sheetName }),
            ...((opts.sourceType === 'csv' || opts.sourceType === 'excel') && {
                hasHeader: opts.hasHeader,
            }),
            browserId: opts.browserId,
        }),
        (opts) => `Datos leídos desde ${opts.path}`,
    );

export const saveResultsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'save_results',
        (opts) => ({
            destinationType: opts.destinationType,
            path: opts.path,
            dataVariableName: opts.dataVariableName,
            encoding: opts.encoding,
            ...(opts.destinationType === 'excel' && {
                sheetName: opts.sheetName,
                includeHeader: opts.includeHeader,
            }),
            ...(opts.destinationType === 'csv' && { includeHeader: opts.includeHeader }),
            browserId: opts.browserId,
        }),
        (opts) => `Resultados guardados en ${opts.path}`,
    );

export const handleDownloadsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'handle_downloads',
        (opts) => ({
            action: opts.action,
            timeout: opts.timeout,
            browserId: opts.browserId,
            ...(opts.path && { path: opts.path }),
            ...(opts.expectedFileName && { expectedFileName: opts.expectedFileName }),
            ...(opts.minSizeKB && { minSizeKB: opts.minSizeKB }),
            ...(opts.maxSizeKB && { maxSizeKB: opts.maxSizeKB }),
        }),
        (opts) => `Descarga manejada: ${opts.action}`,
    );

export const callLlmAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'call_llm',
        (opts) => ({
            model: opts.model,
            prompt: opts.prompt,
            variableName: opts.variableName,
            temperature: opts.temperature,
            browserId: opts.browserId,
            ...(opts.maxTokens && { maxTokens: opts.maxTokens }),
        }),
        (opts) => `LLM ${opts.model} ejecutado`,
    );

export const generateDataAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'generate_data',
        (opts) => ({
            model: opts.model,
            prompt: opts.prompt,
            variableName: opts.variableName,
            temperature: opts.temperature,
            expectedFormat: opts.expectedFormat,
            browserId: opts.browserId,
        }),
        (opts) => `Datos generados en formato ${opts.expectedFormat}`,
    );

export const validateSemanticAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'validate_semantic',
        (opts) => ({
            model: opts.model,
            sourceTextVariable: opts.sourceTextVariable,
            validationPrompt: opts.validationPrompt,
            expectedAnswer: opts.expectedAnswer,
            validationTimeout: opts.validationTimeout,
            browserId: opts.browserId,
        }),
        () => `Validación semántica completada`,
    );

export const runTestsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'run_tests',
        (opts) => ({
            testSuite: opts.testSuite,
            parallel: opts.parallel,
            retries: opts.retries,
            reportFormat: opts.reportFormat,
            timeout: opts.timeout,
            browserId: opts.browserId,
        }),
        (opts) => `Tests ${opts.testSuite} ejecutados`,
    );

export const cliParamsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'cli_params',
        (opts) => ({
            paramName: opts.paramName,
            paramType: opts.paramType,
            required: opts.required,
            browserId: opts.browserId,
            ...(opts.defaultValue && { defaultValue: opts.defaultValue }),
            ...(opts.validationCode && { validationCode: opts.validationCode }),
        }),
        (opts) => `Parámetro CLI ${opts.paramName} registrado`,
    );

export const returnCodeAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'return_code',
        (opts) => ({
            successField: opts.successField,
            exitOnFail: opts.exitOnFail,
            customCodes: opts.customCodes,
            verbose: opts.verbose,
            browserId: opts.browserId,
        }),
        () => `Códigos de retorno configurados`,
    );

export const integrateCIAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'integrate_ci',
        (opts) => ({
            provider: opts.provider,
            saveArtifacts: opts.saveArtifacts,
            outputPath: opts.outputPath,
            uploadReports: opts.uploadReports,
            envVariables: opts.envVariables,
            retryOnFail: opts.retryOnFail,
            verbose: opts.verbose,
            browserId: opts.browserId,
        }),
        (opts) => `Integración CI ${opts.provider} configurada`,
    );

export const closeContextAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'close_context',
        (opts) => ({
            browserId: opts.browserId,
        }),
        () => `Contexto cerrado`,
    );

// Acciones de navegación básicas (back/forward)
export const backAction = async (req, res) => {
    try {
        // 1. Desestructurar y Normalizar Entrada
        const { browserId } = req.body ?? {};

        console.log('[ACTION] backAction iniciado.', { browserId });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 3. Obtener la Página Activa
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();

        if (pages.length > 0) {
            const pageInstance = pages[pages.length - 1]; // Usar la última página activa

            // 4. Ejecutar la Acción Playwright
            // page.goBack() retorna la respuesta de la navegación o null si no hay historial
            const response = await pageInstance.goBack();

            if (response === null) {
                const message = 'No hay historial de navegación hacia atrás en esta pestaña.';
                console.log(`[INFO] ${message}`);

                // Respuesta 400 ya que la acción no es posible por el estado del historial
                return res.status(400).json({
                    success: false,
                    message: message,
                    browserId: targetBrowserId,
                });
            }

            // 5. Registrar Trazabilidad
            writeTrace({
                action: 'go_back',
                browserId: targetBrowserId,
                status: 'success',
            });

            // 6. Respuesta Exitosa
            return res.status(200).json({
                success: true,
                message: `Navegación 'Atrás' exitosa en browserId: ${targetBrowserId}.`,
                browserId: targetBrowserId,
                newUrl: pageInstance.url(),
            });
        }

        return res.status(400).json({
            success: false,
            message: 'No hay páginas activas para navegar hacia atrás.',
        });
    } catch (error) {
        console.error('[ERROR] backAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error en navegación hacia atrás.',
            error: error.message,
        });
    }
};

export const forwardAction = async (req, res) => {
    try {
        // 1. Desestructurar y Normalizar Entrada
        const { browserId } = req.body ?? {};

        console.log('[ACTION] forwardAction iniciado.', { browserId });

        // 2. Obtener la Instancia del Navegador Objetivo (Validación)
        const validation = validateBrowser(browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }

        const targetBrowserId = validation.browserId;
        const browserInstance = validation.entry.browser || validation.entry;

        // 3. Obtener la Página Activa
        const context = await getOrCreateContext(browserInstance);
        const pages = context.pages();

        if (pages.length > 0) {
            const pageInstance = pages[pages.length - 1]; // Usar la última página activa

            // 4. Ejecutar la Acción Playwright
            // page.goForward() retorna la respuesta de la navegación o null si no hay historial
            const response = await pageInstance.goForward();

            if (response === null) {
                const message = 'No hay historial de navegación hacia adelante en esta pestaña.';
                console.log(`[INFO] ${message}`);

                // Respuesta 400 ya que la acción no es posible por el estado del historial
                return res.status(400).json({
                    success: false,
                    message: message,
                    browserId: targetBrowserId,
                });
            }

            // 5. Registrar Trazabilidad
            writeTrace({
                action: 'go_forward',
                browserId: targetBrowserId,
                status: 'success',
            });

            // 6. Respuesta Exitosa
            return res.status(200).json({
                success: true,
                message: `Navegación 'Adelante' exitosa en browserId: ${targetBrowserId}.`,
                browserId: targetBrowserId,
                newUrl: pageInstance.url(),
            });
        }

        return res.status(400).json({
            success: false,
            message: 'No hay páginas activas para navegar hacia adelante.',
        });
    } catch (error) {
        console.error('[ERROR] forwardAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error en navegación hacia adelante.',
            error: error.message,
        });
    }
};

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
    closeContextAction,
    manageTabsAction,
    backAction,
    forwardAction,
};
