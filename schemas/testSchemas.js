// schemas/testSchemas.js (Archivo Índice)

// ... Importación de launch_browser

import openUrlBodySchemaImport from './open_url/body.js';
// ⬇️ Importación del nuevo esquema
import closeBrowserBodySchemaImport from './close_browser/body.js';

// ----------------------------------------------------------------------
// RE-EXPORTACIONES DE ESQUEMAS BASE
// ----------------------------------------------------------------------

export const openUrlBodySchema = openUrlBodySchemaImport;
// ⬇️ Nueva re-exportación
export const closeBrowserBodySchema = closeBrowserBodySchemaImport;

// ----------------------------------------------------------------------
// EXPORTACIONES PARA EL MIDDLEWARE DE VALIDACIÓN ({ body: Schema })
// ----------------------------------------------------------------------

export const openUrlSchema = { body: openUrlBodySchema };
// ⬇️ Nueva exportación para el router
export const closeBrowserSchema = { body: closeBrowserBodySchema };
