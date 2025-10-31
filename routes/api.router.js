// routes/api.router.js (ACTUALIZADO)

import { Router } from 'express';
import validate from '../middlewares/validator.js';

// Importar los esquemas de Body necesarios
import openUrlBodySchema from '../schemas/open_url/body.js';
import launchBrowserBodySchema from '../schemas/launch_browser/body.js';
import closeBrowserBodySchema from '../schemas/close_browser/body.js';

// 🆕 Importar las funciones controladoras REALES conectadas al MCP
import {
    openUrlAction,
    launchBrowserAction,
    closeBrowserAction,
} from '../controllers/action.controller.js';

const router = Router();

// ==========================================================
// ❌ LÓGICA DE ACCIÓN SIMULADA ELIMINADA (openUrlLogic, launchBrowserLogic, closeBrowserLogic)
// ==========================================================

// ==========================================================
// RUTAS DE ACCIONES (Operaciones Playwright - Conectadas al MCP)
// ==========================================================

// 1. Ruta para launch browser (POST /api/actions/launch_browser)
router.post(
    '/actions/launch_browser',
    // 🛡️ Validación
    validate({ body: launchBrowserBodySchema }),
    launchBrowserAction, // ⬅️ CONECTADO AL MCP
);

// 2. Ruta para abrir una URL (POST /api/actions/open_url)
router.post(
    '/actions/open_url',
    // 🛡️ Validación
    validate({ body: openUrlBodySchema }),
    openUrlAction, // ⬅️ CONECTADO AL MCP
);

// 3. Ruta para cerrar el navegador (POST /api/actions/close_browser)
router.post(
    '/actions/close_browser',
    // 🛡️ Validación
    validate({ body: closeBrowserBodySchema }),
    closeBrowserAction, // ⬅️ CONECTADO AL MCP
);

// Ruta de estatus/salud (Heath Check)
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        service: 'HaltTest Backend API',
        uptime: process.uptime(),
    });
});

export default router;
