// schemas/wait_network/body.js

import Joi from 'joi';

const waitNetworkBodySchema = Joi.object({
    // 1. idleTime (Tiempo Mínimo de Inactividad, Mínimo 0)
    idleTime: Joi.number().integer().min(0).default(500).messages({
        'number.min': 'El tiempo de inactividad debe ser positivo o cero.',
    }),

    // 2. timeout (Tiempo de espera Máximo)
    timeout: Joi.number().integer().min(1).default(30000),

    // 3. includeResources (Booleano/Checkbox)
    includeResources: Joi.boolean()
        .default(true) // Por defecto, incluye todos los recursos (CSS, JS, imágenes)
        .optional(),
}).unknown(false);

export default waitNetworkBodySchema;
