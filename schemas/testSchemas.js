// schemas/testSchemas.js

// ----------------------------------------------------------------------
// 1. IMPORTACIÓN DE ESQUEMAS DE CUERPO
// ----------------------------------------------------------------------

import launchBrowserBodySchemaImport from './launch_browser/body.js';
import closeBrowserBodySchemaImport from './close_browser/body.js';
import openUrlBodySchemaImport from './open_url/body.js';
import resizeViewportBodySchema from './resize_viewport/body.js';
import waitFixedBodySchema from './wait_fixed/body.js';
import clickBodySchema from './click/body.js';
import typeTextBodySchema from './type_text/body.js';
import selectOptionBodySchema from './select_option/body.js';
import submitFormBodySchema from './submit_form/body.js';
import scrollBodySchema from './scroll/body.js';
import dragDropBodySchema from './drag_drop/body.js';
import uploadFileBodySchema from './upload_file/body.js';
import waitVisibleBodySchema from './wait_visible/body.js';
import waitNavigationBodySchema from './wait_navigation/body.js';
import waitNetworkBodySchema from './wait_network/body.js';
import waitConditionalBodySchema from './wait_conditional/body.js';
import takeScreenshotBodySchema from './take_screenshot/body.js';
import saveDomBodySchema from './save_dom/body.js';
import logErrorsBodySchema from './log_errors/body.js';
import listenEventsBodySchema from './listen_events/body.js';
import interceptRequestBodySchema from './intercept_request/body.js';
import mockResponseBodySchema from './mock_response/body.js';
import manageTabsBodySchemaImport from './manage_tabs/body.js';

// ----------------------------------------------------------------------
// 2. RE-EXPORTACIONES DE ESQUEMAS BASE (Opcional, para acceso directo al Joi)
// ----------------------------------------------------------------------

export const launchBrowserBodySchema = launchBrowserBodySchemaImport;
export const closeBrowserBodySchema = closeBrowserBodySchemaImport;
export const openUrlBodySchema = openUrlBodySchemaImport;
export const manageTabsBodySchema = manageTabsBodySchemaImport;
// ... El resto de re-exportaciones de BodySchema ...

// ----------------------------------------------------------------------
// 3. EXPORTACIONES PARA EL MIDDLEWARE DE VALIDACIÓN ({ body: Schema })
// ----------------------------------------------------------------------

// Gestión del Navegador
export const launchBrowserSchema = { body: launchBrowserBodySchema };
export const closeBrowserSchema = { body: closeBrowserBodySchema };
export const manageTabsSchema = { body: manageTabsBodySchema };

// Acciones de Navegación y Configuración
export const openUrlSchema = { body: openUrlBodySchema };
export const resizeViewportSchema = { body: resizeViewportBodySchema };

// Acciones de Espera
export const waitFixedSchema = { body: waitFixedBodySchema };
export const waitVisibleSchema = { body: waitVisibleBodySchema };
export const waitNavigationSchema = { body: waitNavigationBodySchema };
export const waitNetworkSchema = { body: waitNetworkBodySchema };
export const waitConditionalSchema = { body: waitConditionalBodySchema };

// Acciones de Interacción
export const clickSchema = { body: clickBodySchema };
export const typeTextSchema = { body: typeTextBodySchema };
export const selectOptionSchema = { body: selectOptionBodySchema };
export const submitFormSchema = { body: submitFormBodySchema };
export const scrollSchema = { body: scrollBodySchema };
export const dragDropSchema = { body: dragDropBodySchema };
export const uploadFileSchema = { body: uploadFileBodySchema };

// Acciones de Captura y Logs
export const takeScreenshotSchema = { body: takeScreenshotBodySchema };
export const saveDomSchema = { body: saveDomBodySchema };
export const logErrorsSchema = { body: logErrorsBodySchema };
export const listenEventsSchema = { body: listenEventsBodySchema };

// Acciones de Red
export const interceptRequestSchema = { body: interceptRequestBodySchema };
export const mockResponseSchema = { body: mockResponseBodySchema };
