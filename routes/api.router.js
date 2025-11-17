// routes/api.router.js (OPTIMIZADO)
// ==========================================================
// 🚀 Router optimizado con configuración declarativa
// ==========================================================

import { Router } from 'express';
import validate from '../middlewares/validator.js';

// Importación unificada de esquemas
import * as schemas from '../schemas/index.js';

// Importación unificada de controladores
import * as actions from '../controllers/action.controller.js';

const router = Router();

// ==========================================================
// CONFIGURACIÓN DECLARATIVA DE RUTAS
// ==========================================================

const actionRoutes = [
    // ========== Navegación y Entorno ==========
    {
        path: 'launch_browser',
        schema: 'launchBrowserBodySchema',
        action: 'launchBrowserAction',
        category: 'browser',
    },
    {
        path: 'open_url',
        schema: 'openUrlBodySchema',
        action: 'openUrlAction',
        category: 'navigation',
    },
    {
        path: 'close_browser',
        schema: 'closeBrowserBodySchema',
        action: 'closeBrowserAction',
        category: 'browser',
    },
    {
        path: 'back',
        schema: 'backForwardBodySchema',
        action: 'backAction',
        category: 'navigation',
    },
    {
        path: 'forward',
        schema: 'backForwardBodySchema',
        action: 'forwardAction',
        category: 'navigation',
    },
    {
        path: 'manage_tabs',
        schema: 'manageTabsBodySchema',
        action: 'manageTabsAction',
        category: 'tabs',
    },
    {
        path: 'drag_drop',
        schema: 'dragDropBodySchema',
        action: 'dragDropAction',
        category: 'interaction',
    },
    {
        path: 'resize_viewport',
        schema: 'resizeViewportBodySchema',
        action: 'resizeViewportAction',
        category: 'viewport',
    },

    // ========== Interacción con Elementos ==========
    {
        path: 'find_element',
        schema: 'findElementBodySchema',
        action: 'findElementAction',
        category: 'element',
    },
    {
        path: 'get_set_content',
        schema: 'getSetContentBodySchema',
        action: 'getSetContentAction',
        category: 'element',
    },
    {
        path: 'click',
        schema: 'clickBodySchema',
        action: 'clickAction',
        category: 'interaction',
    },
    {
        path: 'type_text',
        schema: 'typeTextBodySchema',
        action: 'typeTextAction',
        category: 'interaction',
    },
    {
        path: 'select_option',
        schema: 'selectOptionBodySchema',
        action: 'selectOptionAction',
        category: 'interaction',
    },
    {
        path: 'submit_form',
        schema: 'submitFormBodySchema',
        action: 'submitFormAction',
        category: 'interaction',
    },
    {
        path: 'scroll',
        schema: 'scrollBodySchema',
        action: 'scrollAction',
        category: 'interaction',
    },
    {
        path: 'upload_file',
        schema: 'uploadFileBodySchema',
        action: 'uploadFileAction',
        category: 'interaction',
    },
    {
        path: 'execute_js',
        schema: 'executeJsBodySchema',
        action: 'executeJsAction',
        category: 'scripting',
    },

    // ========== Operaciones de Espera ==========
    {
        path: 'wait_for_element',
        schema: 'waitForElementBodySchema',
        action: 'waitForElementAction',
        category: 'wait',
    },
    {
        path: 'wait_visible',
        schema: 'waitVisibleBodySchema',
        action: 'waitVisibleAction',
        category: 'wait',
    },
    {
        path: 'wait_navigation',
        schema: 'waitNavigationBodySchema',
        action: 'waitNavigationAction',
        category: 'wait',
    },
    {
        path: 'wait_network',
        schema: 'waitNetworkBodySchema',
        action: 'waitNetworkAction',
        category: 'wait',
    },
    {
        path: 'wait_conditional',
        schema: 'waitConditionalBodySchema',
        action: 'waitConditionalAction',
        category: 'wait',
    },

    // ========== Monitoreo y Captura ==========
    {
        path: 'take_screenshot',
        schema: 'takeScreenshotBodySchema',
        action: 'takeScreenshotAction',
        category: 'capture',
    },
    {
        path: 'save_dom',
        schema: 'saveDomBodySchema',
        action: 'saveDomAction',
        category: 'capture',
    },
    {
        path: 'log_errors',
        schema: 'logErrorsBodySchema',
        action: 'logErrorsAction',
        category: 'monitoring',
    },
    {
        path: 'listen_events',
        schema: 'listenEventsBodySchema',
        action: 'listenEventsAction',
        category: 'monitoring',
    },

    // ========== Network y Sesión ==========
    {
        path: 'intercept_request',
        schema: 'interceptRequestBodySchema',
        action: 'interceptRequestAction',
        category: 'network',
    },
    {
        path: 'mock_response',
        schema: 'mockResponseBodySchema',
        action: 'mockResponseAction',
        category: 'network',
    },
    {
        path: 'block_resource',
        schema: 'blockResourceBodySchema',
        action: 'blockResourceAction',
        category: 'network',
    },
    {
        path: 'modify_headers',
        schema: 'modifyHeadersBodySchema',
        action: 'modifyHeadersAction',
        category: 'network',
    },
    {
        path: 'manage_cookies',
        schema: 'manageCookiesBodySchema',
        action: 'manageCookiesAction',
        category: 'session',
    },
    {
        path: 'manage_storage',
        schema: 'manageStorageBodySchema',
        action: 'manageStorageAction',
        category: 'session',
    },
    {
        path: 'inject_tokens',
        schema: 'injectTokensBodySchema',
        action: 'injectTokensAction',
        category: 'session',
    },
    {
        path: 'persist_session',
        schema: 'persistSessionBodySchema',
        action: 'persistSessionAction',
        category: 'session',
    },

    // ========== Contexto y Estado ==========
    {
        path: 'create_context',
        schema: 'createContextBodySchema',
        action: 'createContextAction',
        category: 'context',
    },
    {
        path: 'cleanup_state',
        schema: 'cleanupStateBodySchema',
        action: 'cleanupStateAction',
        category: 'context',
    },
    {
        path: 'close_context',
        schema: 'closeContextBodySchema',
        action: 'closeContextAction',
        category: 'context',
    },

    // ========== Utilidades de Flujo y Datos ==========
    {
        path: 'handle_hooks',
        schema: 'handleHooksBodySchema',
        action: 'handleHooksAction',
        category: 'flow',
    },
    {
        path: 'control_exceptions',
        schema: 'controlExceptionsBodySchema',
        action: 'controlExceptionsAction',
        category: 'flow',
    },
    {
        path: 'read_data',
        schema: 'readDataBodySchema',
        action: 'readDataAction',
        category: 'data',
    },
    {
        path: 'save_results',
        schema: 'saveResultsBodySchema',
        action: 'saveResultsAction',
        category: 'data',
    },
    {
        path: 'handle_downloads',
        schema: 'handleDownloadsBodySchema',
        action: 'handleDownloadsAction',
        category: 'data',
    },

    // ========== Inteligencia Artificial (LLM) ==========
    {
        path: 'call_llm',
        schema: 'callLlmBodySchema',
        action: 'callLlmAction',
        category: 'ai',
    },
    {
        path: 'generate_data',
        schema: 'generateDataBodySchema',
        action: 'generateDataAction',
        category: 'ai',
    },
    {
        path: 'validate_semantic',
        schema: 'validateSemanticBodySchema',
        action: 'validateSemanticAction',
        category: 'ai',
    },

    // ========== Testing y CI/CD ==========
    {
        path: 'run_tests',
        schema: 'runTestsBodySchema',
        action: 'runTestsAction',
        category: 'testing',
    },
    {
        path: 'cli_params',
        schema: 'cliParamsBodySchema',
        action: 'cliParamsAction',
        category: 'cli',
    },
    {
        path: 'return_code',
        schema: 'returnCodeBodySchema',
        action: 'returnCodeAction',
        category: 'cli',
    },
    {
        path: 'integrate_ci',
        schema: 'integrateCIBodySchema',
        action: 'integrateCIAction',
        category: 'ci',
    },
];

// ==========================================================
// GENERACIÓN DINÁMICA DE RUTAS
// ==========================================================

// Validar que todos los schemas y actions existan
const validationErrors = [];

actionRoutes.forEach(({ path, schema, action }) => {
    if (!schemas[schema]) {
        validationErrors.push(`⚠️ Schema no encontrado: ${schema} para ruta ${path}`);
    }
    if (!actions[action]) {
        validationErrors.push(`⚠️ Action no encontrada: ${action} para ruta ${path}`);
    }
});

if (validationErrors.length > 0) {
    console.error('='.repeat(60));
    console.error('❌ ERRORES DE CONFIGURACIÓN DEL ROUTER:');
    validationErrors.forEach((err) => console.error(err));
    console.error('='.repeat(60));
    throw new Error('Router configuration error. Check console for details.');
}

// Crear rutas dinámicamente
actionRoutes.forEach(({ path, schema, action }) => {
    const schemaObject = schemas[schema];
    const actionHandler = actions[action];

    router.post(`/actions/${path}`, validate({ body: schemaObject }), actionHandler);
});

console.log(`✅ ${actionRoutes.length} rutas de acciones registradas correctamente`);

// ==========================================================
// RUTAS ADICIONALES
// ==========================================================

// Health Check
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        service: 'HaltTest Backend API',
        uptime: process.uptime(),
        routes: actionRoutes.length,
        timestamp: new Date().toISOString(),
    });
});

// Documentación de rutas (útil para debugging)
router.get('/routes', (req, res) => {
    const routesByCategory = actionRoutes.reduce((acc, route) => {
        if (!acc[route.category]) {
            acc[route.category] = [];
        }
        acc[route.category].push({
            path: route.path,
            endpoint: `/actions/${route.path}`,
            method: 'POST',
        });
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        totalRoutes: actionRoutes.length,
        categories: Object.keys(routesByCategory).sort(),
        routes: routesByCategory,
    });
});

// Manejo de rutas no encontradas
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
        availableEndpoints: ['/status', '/routes', '/actions/*'],
    });
});

export default router;
