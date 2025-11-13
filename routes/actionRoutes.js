// routes/actionRoutes.js

import { Router } from 'express';
import validate from '../middlewares/validateSchema.js';
import * as actionController from '../controllers/actionController.js';
import {
    // GESTIÓN DEL NAVEGADOR ⬅️ Nuevas Importaciones
    launchBrowserSchema,
    closeBrowserSchema,
    manageTabsSchema,

    // NAVEGACIÓN Y CONFIGURACIÓN
    openUrlSchema,
    resizeViewportSchema,

    // INTERACCIÓN
    clickSchema,
    typeTextSchema,
    selectOptionSchema,
    submitFormSchema,
    scrollSchema,
    dragDropSchema,
    uploadFileSchema,

    // ESPERA
    waitFixedSchema,
    waitVisibleSchema,
    waitNavigationSchema,
    waitNetworkSchema,
    waitConditionalSchema,

    // CAPTURA Y LOGS
    takeScreenshotSchema,
    saveDomSchema,
    logErrorsSchema,
    listenEventsSchema,

    // RED (MOCKING)
    interceptRequestSchema,
    mockResponseSchema,
} from '../schemas/testSchemas.js';

const router = Router();

// ====================================================================
// --- GESTIÓN DEL NAVEGADOR ---
// ====================================================================
router.post('/launch-browser', validate(launchBrowserSchema), actionController.launchBrowser);
router.post('/close-browser', validate(closeBrowserSchema), actionController.closeBrowser);
router.post('/manage-tabs', validate(manageTabsSchema), actionController.manageTabs);

// ====================================================================
// --- NAVEGACIÓN Y CONFIGURACIÓN ---
// ====================================================================
router.post('/open-url', validate(openUrlSchema), actionController.openUrl);
router.post('/resize-viewport', validate(resizeViewportSchema), actionController.resizeViewport);

// ====================================================================
// --- INTERACCIÓN ---
// ====================================================================
router.post('/click', validate(clickSchema), actionController.click);
router.post('/type-text', validate(typeTextSchema), actionController.typeText);
router.post('/select-option', validate(selectOptionSchema), actionController.selectOption);
router.post('/submit-form', validate(submitFormSchema), actionController.submitForm);
router.post('/scroll', validate(scrollSchema), actionController.scroll);
router.post('/drag-drop', validate(dragDropSchema), actionController.dragDrop);
router.post('/upload-file', validate(uploadFileSchema), actionController.uploadFile);

// ====================================================================
// --- ESPERA ---
// ====================================================================
router.post('/wait-fixed', validate(waitFixedSchema), actionController.waitFixed);
router.post('/wait-visible', validate(waitVisibleSchema), actionController.waitVisible);
router.post('/wait-navigation', validate(waitNavigationSchema), actionController.waitNavigation);
router.post('/wait-network', validate(waitNetworkSchema), actionController.waitNetwork);
router.post('/wait-conditional', validate(waitConditionalSchema), actionController.waitConditional);

// ====================================================================
// --- CAPTURA Y LOGS ---
// ====================================================================
router.post('/take-screenshot', validate(takeScreenshotSchema), actionController.takeScreenshot);
router.post('/save-dom', validate(saveDomSchema), actionController.saveDom);
router.post('/log-errors', validate(logErrorsSchema), actionController.logErrors);
router.post('/listen-events', validate(listenEventsSchema), actionController.listenEvents);

// ====================================================================
// --- RED (MOCKING) ---
// ====================================================================
router.post(
    '/intercept-request',
    validate(interceptRequestSchema),
    actionController.interceptRequest,
);
router.post('/mock-response', validate(mockResponseSchema), actionController.mockResponse);

export default router;
