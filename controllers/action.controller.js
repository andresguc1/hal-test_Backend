// controllers/action.controller.js - OPTIMIZADO Y CORREGIDO
// ==========================================================
// 🧠 Conectores de acciones individuales al Playwright
// ==========================================================

import { callTool } from '../services/mcp.service.js';
import { chromium } from 'playwright';
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
// ACCIONES MCP SIMPLIFICADAS
// ==========================================================

export const clickAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'click',
        (opts) => ({
            selector: opts.selector,
            button: opts.button,
            clickCount: opts.clickCount,
            modifiers: opts.modifiers,
            timeout: opts.timeout,
            force: opts.force,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Click ejecutado en ${opts.selector}`,
    );

export const typeTextAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'type_text',
        (opts) => ({
            selector: opts.selector,
            text: opts.text,
            clearBeforeType: opts.clearBeforeType,
            delay: opts.delay,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Texto ingresado en ${opts.selector}`,
    );

export const scrollAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'scroll',
        (opts) => ({
            ...(opts.selector && { selector: opts.selector }),
            direction: opts.direction,
            amount: opts.amount,
            behavior: opts.behavior,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Scroll ${opts.direction} ejecutado`,
    );

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

export const manageTabsAction = async (req, res) => {
    try {
        const { action, url, tabIndex, waitUntil = 'load', timeout = 30000 } = req.body ?? {};
        let { browserId } = req.body ?? {};

        if (!action) {
            return res.status(400).json({
                success: false,
                message: 'El campo "action" es requerido.',
            });
        }

        // Validar y obtener browser
        if (!browserId || browserId === '' || browserId === null) {
            const ids = Array.from(browserManager.keys());
            if (ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay navegadores activos. Llama a launch_browser primero.',
                });
            }
            browserId = ids[ids.length - 1];
            console.log(`[INFO] No se especificó browserId. Usando último activo: ${browserId}`);
        }

        const entry = browserManager.get(browserId);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: `No se encontró navegador con ID: ${browserId}`,
            });
        }

        // Normalizar la instancia del browser
        const browser = entry.browser || entry;

        console.log(`[DEBUG] Browser tipo:`, typeof browser);
        console.log(`[DEBUG] Browser tiene newContext:`, typeof browser.newContext);
        console.log(`[DEBUG] Browser tiene contexts:`, typeof browser.contexts);

        // Obtener o crear contexto de forma segura (usa la CORRECCIÓN 1)
        let context;
        try {
            context = await getOrCreateContext(browser);
        } catch (contextError) {
            console.error('[ERROR] Error al obtener/crear contexto:', contextError.message);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener contexto de navegación',
                error: contextError.message,
                hint: 'El navegador puede no estar correctamente inicializado. Intenta cerrar y volver a lanzar el navegador.',
            });
        }

        // Validar que el contexto es válido
        if (!context || typeof context.pages !== 'function') {
            return res.status(500).json({
                success: false,
                message: 'Contexto de navegación inválido',
                hint: 'El contexto no tiene el método pages(). Intenta relanzar el navegador.',
            });
        }

        const getPages = () => context.pages();
        let result = null;

        switch (action) {
            case 'new': {
                const page = await context.newPage();
                let duration = null;
                if (url) {
                    const start = Date.now();
                    await page.goto(url, { waitUntil, timeout });
                    duration = Date.now() - start;
                }
                const pages = getPages();
                result = {
                    success: true,
                    message: 'Nueva pestaña creada.',
                    tabIndex: pages.length - 1,
                    url: url ?? null,
                    durationMs: duration,
                };
                break;
            }

            case 'close': {
                if (typeof tabIndex !== 'number' || tabIndex < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'tabIndex inválido. Debe ser un número >= 0',
                    });
                }
                const pages = getPages();
                if (tabIndex >= pages.length) {
                    return res.status(400).json({
                        success: false,
                        message: `tabIndex fuera de rango. Hay ${pages.length} pestañas.`,
                    });
                }
                await pages[tabIndex].close().catch((err) => {
                    console.log(`[WARN] Error al cerrar pestaña ${tabIndex}:`, err.message);
                });
                result = { success: true, message: 'Pestaña cerrada.', tabIndex };
                break;
            }

            case 'switch': {
                if (typeof tabIndex !== 'number' || tabIndex < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'tabIndex inválido. Debe ser un número >= 0',
                    });
                }
                const pages = getPages();
                if (tabIndex >= pages.length) {
                    return res.status(400).json({
                        success: false,
                        message: `tabIndex fuera de rango. Hay ${pages.length} pestañas.`,
                    });
                }
                await pages[tabIndex].bringToFront().catch((err) => {
                    console.log(`[WARN] Error al traer pestaña al frente:`, err.message);
                });
                result = { success: true, message: 'Pestaña activada.', tabIndex };
                break;
            }

            case 'navigate': {
                if (!url || typeof tabIndex !== 'number' || tabIndex < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'url y tabIndex válido son requeridos para navigate',
                    });
                }
                const pages = getPages();
                if (tabIndex >= pages.length) {
                    return res.status(400).json({
                        success: false,
                        message: `tabIndex fuera de rango. Hay ${pages.length} pestañas.`,
                    });
                }
                const start = Date.now();
                await pages[tabIndex].goto(url, { waitUntil, timeout });
                const duration = Date.now() - start;
                result = {
                    success: true,
                    message: 'Navegación completada.',
                    tabIndex,
                    url,
                    durationMs: duration,
                };
                break;
            }

            case 'list': {
                const pages = getPages();
                const tabs = await Promise.all(
                    pages.map(async (p, i) => {
                        let pageUrl = null;
                        let pageTitle = null;

                        try {
                            pageUrl = typeof p.url === 'function' ? p.url() : p.url;
                        } catch {
                            pageUrl = 'N/A';
                        }

                        try {
                            pageTitle = typeof p.title === 'function' ? await p.title() : p.title;
                        } catch {
                            pageTitle = 'N/A';
                        }

                        return {
                            tabIndex: i,
                            url: pageUrl,
                            title: pageTitle,
                        };
                    }),
                );
                result = { success: true, tabs };
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: `Acción desconocida: ${action}. Acciones válidas: new, close, switch, navigate, list`,
                });
        }

        // Trazabilidad no bloqueante
        writeTrace({
            action: 'manage_tabs',
            subtype: action,
            browserId,
            result,
        });

        console.log(`[SUCCESS] manage_tabs ${action} completado`);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[ERROR] manageTabsAction:', error.message);
        console.error('[STACK]', error.stack);

        writeTrace({
            action: 'manage_tabs',
            error: error.message,
            stack: error.stack,
            status: 'error',
        });

        return res.status(500).json({
            success: false,
            message: 'Error en manageTabsAction.',
            error: error.message,
            hint: 'Verifica que el navegador esté correctamente inicializado.',
        });
    }
};

// ==========================================================
// RESTO DE ACCIONES MCP USANDO EL PATRÓN OPTIMIZADO
// ==========================================================

export const dragDropAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'drag_drop',
        (opts) => ({
            sourceSelector: opts.sourceSelector,
            targetSelector: opts.targetSelector,
            steps: opts.steps,
            force: opts.force,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Drag & Drop de ${opts.sourceSelector} a ${opts.targetSelector}`,
    );

export const resizeViewportAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'resize_viewport',
        (opts) => ({
            deviceEmulation: opts.deviceEmulation || undefined,
            width: opts.width,
            height: opts.height,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) =>
            opts.deviceEmulation
                ? `Viewport redimensionado a ${opts.deviceEmulation}`
                : `Viewport redimensionado a ${opts.width}x${opts.height}`,
    );

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

export const waitForElementAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'wait_for_element',
        (opts) => ({
            selector: opts.selector,
            condition: opts.condition,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Elemento ${opts.selector} cumple condición ${opts.condition}`,
    );

export const executeJsAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'execute_js',
        (opts) => ({
            script: opts.script,
            returnValue: opts.returnValue,
            ...(opts.returnValue && { variableName: opts.variableName }),
            ...(opts.args && { args: opts.args }),
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        () => `JavaScript ejecutado`,
    );

export const selectOptionAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'select_option',
        (opts) => ({
            selector: opts.selector,
            selectionCriteria: opts.selectionCriteria,
            selectionValue: opts.selectionValue,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Opción seleccionada en ${opts.selector}`,
    );

export const submitFormAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'submit_form',
        (opts) => ({
            selector: opts.selector,
            waitForNavigation: opts.waitForNavigation,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Formulario enviado desde ${opts.selector}`,
    );

export const uploadFileAction = (req, res) =>
    executeMcpAction(
        req,
        res,
        'upload_file',
        (opts) => ({
            selector: opts.selector,
            files: opts.files,
            timeout: opts.timeout,
            ...(opts.browserId && { browserId: opts.browserId }),
        }),
        (opts) => `Archivos subidos a ${opts.selector}`,
    );

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
        const { browserId } = req.body ?? {};
        const validation = validateBrowser(browserId);

        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const browser = validation.entry.browser || validation.entry;
        const context = await getOrCreateContext(browser);
        const pages = context.pages();

        if (pages.length > 0) {
            await pages[0].goBack();
            writeTrace({ action: 'back', browserId: validation.browserId });
            return res.status(200).json({
                success: true,
                message: 'Navegación hacia atrás completada',
            });
        }

        return res.status(400).json({
            success: false,
            message: 'No hay páginas activas',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en navegación back',
            error: error.message,
        });
    }
};

export const forwardAction = async (req, res) => {
    try {
        const { browserId } = req.body ?? {};
        const validation = validateBrowser(browserId);

        if (validation.error) {
            return res.status(validation.status).json({
                success: false,
                message: validation.message,
            });
        }

        const browser = validation.entry.browser || validation.entry;
        const context = await getOrCreateContext(browser);
        const pages = context.pages();

        if (pages.length > 0) {
            await pages[0].goForward();
            writeTrace({ action: 'forward', browserId: validation.browserId });
            return res.status(200).json({
                success: true,
                message: 'Navegación hacia adelante completada',
            });
        }

        return res.status(400).json({
            success: false,
            message: 'No hay páginas activas',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en navegación forward',
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
