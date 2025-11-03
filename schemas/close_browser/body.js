// schemas/close_browser/body.js

import Joi from 'joi';

const closeBrowserBodySchema = Joi.object({
    // 1. browserId (¡OBLIGATORIO!)
    // El ID que se obtuvo al llamar a launch_browser, vital para el MCP.
    browserId: Joi.string().trim().required().messages({
        'any.required': 'El ID del navegador (browserId) es obligatorio para cerrar la sesión.',
        'string.empty': 'El browserId no puede estar vacío.',
        'string.base': 'El browserId debe ser una cadena de texto.',
    }),

    // 2. forceClose (Opcional)
    forceClose: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo forceClose debe ser un valor booleano (true/false).',
    }),

    // 3. clearContext (Opcional)
    clearContext: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearContext debe ser un valor booleano (true/false).',
    }),
}).unknown(false);

export default closeBrowserBodySchema;
