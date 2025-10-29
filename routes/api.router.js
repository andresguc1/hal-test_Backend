import { Router } from 'express';
import validate from '../middlewares/validator.js';

// Importar los esquemas de Body necesarios
import openUrlBodySchema from '../schemas/open_url/body.js';
import launchBrowserBodySchema from '../schemas/launch_browser/body.js';
import closeBrowserBodySchema from '../schemas/close_browser/body.js';
// NO NECESITAS importar controladores (como action.controller.js)

const router = Router();

// ==========================================================
// Mocks de Lógica de Acción (Controladores Integrados)
// ==========================================================

// Función simulada para abrir URL
const openUrlLogic = (req, res) => {
    const { url, waitUntil } = req.body;
    console.log(`[ACTION] URL abierta: ${url} (Wait: ${waitUntil})`);
    res.status(200).json({
        success: true,
        message: `URL '${url}' abierta con éxito.`,
        action: 'open_url',
        data: req.body,
    });
};

// Función simulada para lanzar navegador
const launchBrowserLogic = (req, res) => {
    // El Body ya está limpio y validado aquí (gracias a Joi)
    const options = req.body;

    console.log(
        `[ACTION] Navegador '${options.browserType}' lanzado. Headless: ${options.headless}`,
    );

    // RESPUESTA CORREGIDA: 'message' va fuera de 'data'
    res.status(200).json({
        success: true,
        message: `Navegador '${options.browserType}' lanzado con éxito.`,
        action: 'launch_browser',
        data: options, // Contiene el body limpio (browserType, headless, slowMo, etc.)
    });
};

// Función simulada para cerrar navegador
const closeBrowserLogic = (req, res) => {
    const { forceClose, clearContext } = req.body;
    console.log(`[ACTION] Navegador cerrado. Force: ${forceClose}, Clear Context: ${clearContext}`);
    res.status(200).json({
        success: true,
        message: `Navegador cerrado con éxito.`,
        action: 'close_browser',
        data: { forceClose, clearContext },
    });
};

// ==========================================================
// RUTAS DE ACCIONES (Operaciones Playwright)
// ==========================================================

// Ruta para abrir una URL (POST /api/actions/open_url)
router.post(
    '/actions/open_url',
    // 🛡️ Validación activa
    validate({ body: openUrlBodySchema }),
    openUrlLogic, // ⬅️ Lógica integrada
);

// Ruta para launch browser (POST /api/actions/launch_browser)
router.post(
    '/actions/launch_browser',
    // 🛡️ Validación activa
    validate({ body: launchBrowserBodySchema }),
    launchBrowserLogic, // ⬅️ Lógica integrada
);

// Ruta para cerrar el navegador (POST /api/actions/close_browser)
router.post(
    '/actions/close_browser',
    // 🛡️ Validación activa
    validate({ body: closeBrowserBodySchema }),
    closeBrowserLogic, // ⬅️ Lógica integrada
);

// Ruta de estatus/salud (Heath Check)
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        // CORREGIDO: Cambiado de 'Running' a 'ok' para pasar el test de api.test.js
        status: 'ok',
        service: 'HaltTest Backend API',
        uptime: process.uptime(),
    });
});

export default router;
