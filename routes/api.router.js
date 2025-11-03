// routes/api.router.js (ACTUALIZADO)

import { Router } from 'express';
import validate from '../middlewares/validator.js';

// Importar los esquemas de Body necesarios
import openUrlBodySchema from '../schemas/open_url/body.js';
import launchBrowserBodySchema from '../schemas/launch_browser/body.js';
import closeBrowserBodySchema from '../schemas/close_browser/body.js';
import dragDropBodySchema from '../schemas/drag_drop/body.js';
import resizeViewportBodySchema from '../schemas/resize_viewport/body.js';
import findElementBodySchema from '../schemas/find_element/body.js';
import getSetContentBodySchema from '../schemas/get_set_content/body.js';
import waitForElementBodySchema from '../schemas/wait_for_element/body.js';
import executeJsBodySchema from '../schemas/execute_js/body.js';
import clickBodySchema from '../schemas/click/body.js';
import typeTextBodySchema from '../schemas/type_text/body.js';
import selectOptionBodySchema from '../schemas/select_option/body.js';
import submitFormBodySchema from '../schemas/submit_form/body.js';
import scrollBodySchema from '../schemas/scroll/body.js';
import uploadFileBodySchema from '../schemas/upload_file/body.js';
import waitVisibleBodySchema from '../schemas/wait_visible/body.js';
import waitNavigationBodySchema from '../schemas/wait_navigation/body.js';
import waitNetworkBodySchema from '../schemas/wait_network/body.js';
import waitConditionalBodySchema from '../schemas/wait_conditional/body.js';
import takeScreenshotBodySchema from '../schemas/take_screenshot/body.js';
import saveDomBodySchema from '../schemas/save_dom/body.js';
import logErrorsBodySchema from '../schemas/log_errors/body.js';
import listenEventsBodySchema from '../schemas/listen_events/body.js';
import interceptRequestBodySchema from '../schemas/intercept_request/body.js';
import mockResponseBodySchema from '../schemas/mock_response/body.js';
import blockResourceBodySchema from '../schemas/block_resource/body.js';
import modifyHeadersBodySchema from '../schemas/modify_headers/body.js';
import manageCookiesBodySchema from '../schemas/manage_cookies/body.js';
import manageStorageBodySchema from '../schemas/manage_storage/body.js';
import injectTokensBodySchema from '../schemas/inject_tokens/body.js';
import persistSessionBodySchema from '../schemas/persist_session/body.js';
import createContextBodySchema from '../schemas/create_context/body.js';
import cleanupStateBodySchema from '../schemas/cleanup_state/body.js';
import handleHooksBodySchema from '../schemas/handle_hooks/body.js';
import controlExceptionsBodySchema from '../schemas/control_exceptions/body.js';
import readDataBodySchema from '../schemas/read_data/body.js';
import saveResultsBodySchema from '../schemas/save_results/body.js';
import handleDownloadsBodySchema from '../schemas/handle_downloads/body.js';
import callLlmBodySchema from '../schemas/call_llm/body.js';
import generateDataBodySchema from '../schemas/generate_data/body.js';
import validateSemanticBodySchema from '../schemas/validate_semantic/body.js';
import runTestsBodySchema from '../schemas/run_tests/body.js';
import cliParamsBodySchema from '../schemas/cli_params/body.js';
import returnCodeBodySchema from '../schemas/return_code/body.js';
import integrateCIBodySchema from '../schemas/integrate_ci/body.js';
import closeContextBodySchema from '../schemas/close_context/body.js';

// 🆕 Importar las funciones controladoras REALES conectadas al MCP
import {
    openUrlAction,
    launchBrowserAction,
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

// 4. Ruta para drag & drop (POST /api/actions/drag_drop) 🆕
router.post('/actions/drag_drop', validate({ body: dragDropBodySchema }), dragDropAction);

// 5. Ruta para resize viewport (POST /api/actions/resize_viewport) 🆕
router.post(
    '/actions/resize_viewport',
    validate({ body: resizeViewportBodySchema }),
    resizeViewportAction,
);

// 6. Ruta para find element (POST /api/actions/find_element) 🆕
router.post('/actions/find_element', validate({ body: findElementBodySchema }), findElementAction);

// 7. Ruta para get/set content (POST /api/actions/get_set_content) 🆕
router.post(
    '/actions/get_set_content',
    validate({ body: getSetContentBodySchema }),
    getSetContentAction,
);

// 8. Ruta para wait for element (POST /api/actions/wait_for_element) 🆕
router.post(
    '/actions/wait_for_element',
    validate({ body: waitForElementBodySchema }),
    waitForElementAction,
);

// 9. Ruta para execute js (POST /api/actions/execute_js) 🆕
router.post('/actions/execute_js', validate({ body: executeJsBodySchema }), executeJsAction);

// 10. Ruta para click (POST /api/actions/click) 🆕
router.post('/actions/click', validate({ body: clickBodySchema }), clickAction);

// 11. Ruta para type text (POST /api/actions/type_text) 🆕
router.post('/actions/type_text', validate({ body: typeTextBodySchema }), typeTextAction);

// 12. Ruta para select option (POST /api/actions/select_option) 🆕
router.post(
    '/actions/select_option',
    validate({ body: selectOptionBodySchema }),
    selectOptionAction,
);

// 13. Ruta para submit form (POST /api/actions/submit_form) 🆕
router.post('/actions/submit_form', validate({ body: submitFormBodySchema }), submitFormAction);

// 14. Ruta para scroll (POST /api/actions/scroll) 🆕
router.post('/actions/scroll', validate({ body: scrollBodySchema }), scrollAction);

// 15. Ruta para upload file (POST /api/actions/upload_file) 🆕
router.post('/actions/upload_file', validate({ body: uploadFileBodySchema }), uploadFileAction);

// 16. Ruta para wait visible (POST /api/actions/wait_visible) 🆕
router.post('/actions/wait_visible', validate({ body: waitVisibleBodySchema }), waitVisibleAction);

// 17. Ruta para wait navigation (POST /api/actions/wait_navigation) 🆕
router.post(
    '/actions/wait_navigation',
    validate({ body: waitNavigationBodySchema }),
    waitNavigationAction,
);

// 18. Ruta para wait network (POST /api/actions/wait_network) 🆕
router.post('/actions/wait_network', validate({ body: waitNetworkBodySchema }), waitNetworkAction);

// Ruta de estatus/salud (Heath Check)
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        service: 'HaltTest Backend API',
        uptime: process.uptime(),
    });
});

// 19. Ruta para wait conditional (POST /api/actions/wait_conditional) 🆕
router.post(
    '/actions/wait_conditional',
    validate({ body: waitConditionalBodySchema }),
    waitConditionalAction,
);

// 20. Ruta para take screenshot (POST /api/actions/take_screenshot) 🆕
router.post(
    '/actions/take_screenshot',
    validate({ body: takeScreenshotBodySchema }),
    takeScreenshotAction,
);

// 21. Ruta para save dom (POST /api/actions/save_dom) 🆕
router.post('/actions/save_dom', validate({ body: saveDomBodySchema }), saveDomAction);

// 22. Ruta para log errors (POST /api/actions/log_errors) 🆕
router.post('/actions/log_errors', validate({ body: logErrorsBodySchema }), logErrorsAction);

// 23. Ruta para listen events (POST /api/actions/listen_events) 🆕
router.post(
    '/actions/listen_events',
    validate({ body: listenEventsBodySchema }),
    listenEventsAction,
);

// 24. Ruta para intercept request (POST /api/actions/intercept_request) 🆕
router.post(
    '/actions/intercept_request',
    validate({ body: interceptRequestBodySchema }),
    interceptRequestAction,
);

// 25. Ruta para mock response (POST /api/actions/mock_response) 🆕
router.post(
    '/actions/mock_response',
    validate({ body: mockResponseBodySchema }),
    mockResponseAction,
);

// 26. Ruta para block resource (POST /api/actions/block_resource) 🆕
router.post(
    '/actions/block_resource',
    validate({ body: blockResourceBodySchema }),
    blockResourceAction,
);

// 27. Ruta para modify headers (POST /api/actions/modify_headers) 🆕
router.post(
    '/actions/modify_headers',
    validate({ body: modifyHeadersBodySchema }),
    modifyHeadersAction,
);

// 28. Ruta para manage cookies (POST /api/actions/manage_cookies) 🆕
router.post(
    '/actions/manage_cookies',
    validate({ body: manageCookiesBodySchema }),
    manageCookiesAction,
);

// 29. Ruta para manage storage (POST /api/actions/manage_storage) 🆕
router.post(
    '/actions/manage_storage',
    validate({ body: manageStorageBodySchema }),
    manageStorageAction,
);

// 30. Ruta para inject tokens (POST /api/actions/inject_tokens) 🆕
router.post(
    '/actions/inject_tokens',
    validate({ body: injectTokensBodySchema }),
    injectTokensAction,
);

// 31. Ruta para persist session (POST /api/actions/persist_session) 🆕
router.post(
    '/actions/persist_session',
    validate({ body: persistSessionBodySchema }),
    persistSessionAction,
);

// 32. Ruta para create context (POST /api/actions/create_context) 🆕
router.post(
    '/actions/create_context',
    validate({ body: createContextBodySchema }),
    createContextAction,
);

// 33. Ruta para cleanup state (POST /api/actions/cleanup_state) 🆕
router.post(
    '/actions/cleanup_state',
    validate({ body: cleanupStateBodySchema }),
    cleanupStateAction,
);

// 34. Ruta para handle hooks (POST /api/actions/handle_hooks) 🆕
router.post('/actions/handle_hooks', validate({ body: handleHooksBodySchema }), handleHooksAction);

// 35. Ruta para control exceptions (POST /api/actions/control_exceptions) 🆕
router.post(
    '/actions/control_exceptions',
    validate({ body: controlExceptionsBodySchema }),
    controlExceptionsAction,
);

// 36. Ruta para read data (POST /api/actions/read_data) 🆕
router.post('/actions/read_data', validate({ body: readDataBodySchema }), readDataAction);

// 37. Ruta para save results (POST /api/actions/save_results) 🆕
router.post('/actions/save_results', validate({ body: saveResultsBodySchema }), saveResultsAction);

// 38. Ruta para handle downloads (POST /api/actions/handle_downloads) 🆕
router.post(
    '/actions/handle_downloads',
    validate({ body: handleDownloadsBodySchema }),
    handleDownloadsAction,
);

// 39. Ruta para call llm (POST /api/actions/call_llm) 🆕
router.post('/actions/call_llm', validate({ body: callLlmBodySchema }), callLlmAction);

// 40. Ruta para generate data (POST /api/actions/generate_data) 🆕
router.post(
    '/actions/generate_data',
    validate({ body: generateDataBodySchema }),
    generateDataAction,
);

// 41. Ruta para validate semantic (POST /api/actions/validate_semantic) 🆕
router.post(
    '/actions/validate_semantic',
    validate({ body: validateSemanticBodySchema }),
    validateSemanticAction,
);

// 42. Ruta para run tests (POST /api/actions/run_tests) 🆕
router.post('/actions/run_tests', validate({ body: runTestsBodySchema }), runTestsAction);

// 43. Ruta para cli params (POST /api/actions/cli_params) 🆕
router.post('/actions/cli_params', validate({ body: cliParamsBodySchema }), cliParamsAction);

// 44. Ruta para return code (POST /api/actions/return_code) 🆕
router.post('/actions/return_code', validate({ body: returnCodeBodySchema }), returnCodeAction);

// 45. Ruta para integrate ci (POST /api/actions/integrate_ci) 🆕
router.post('/actions/integrate_ci', validate({ body: integrateCIBodySchema }), integrateCIAction);

// 46. Ruta para close context (POST /api/actions/close_context) 🆕
router.post(
    '/actions/close_context',
    validate({ body: closeContextBodySchema }),
    closeContextAction,
);

export default router;
