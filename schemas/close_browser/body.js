// schemas/close_browser/body.js

import Joi from 'joi';

const closeBrowserBodySchema = Joi.object({
    // 1. forceClose (type: checkbox -> boolean)
    forceClose: Joi.boolean()
        .default(false) // Coincide con el defaultValue del frontend
        .optional()
        .messages({
            'boolean.base': 'El campo forceClose debe ser un valor booleano (true/false).',
        }),

    // 2. clearContext (type: checkbox -> boolean)
    clearContext: Joi.boolean()
        .default(true) // Coincide con el defaultValue del frontend
        .optional()
        .messages({
            'boolean.base': 'El campo clearContext debe ser un valor booleano (true/false).',
        }),

    // Bloquea cualquier campo extra que no esté definido.
}).unknown(false);

export default closeBrowserBodySchema;
