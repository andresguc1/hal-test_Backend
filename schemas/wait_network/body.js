// schemas/wait_network/body.js

import Joi from 'joi';

const waitNetworkBodySchema = Joi.object({
    // 1. idleTime (Tiempo Mínimo de Inactividad, Mínimo 0)
    idleTime: Joi.number().integer().min(0).default(500).messages({
        'number.min': 'El tiempo de inactividad debe ser positivo o cero.',
    }),

    // 2. timeout (Tiempo de espera Máximo)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 3. includeResources (Booleano/Checkbox)
    includeResources: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo includeResources debe ser booleano.',
    }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default waitNetworkBodySchema;
