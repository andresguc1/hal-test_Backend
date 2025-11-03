// schemas/scroll/body.js

import Joi from 'joi';

const allowedDirections = ['down', 'up', 'right', 'left'];
const allowedBehaviors = ['auto', 'smooth'];

const scrollBodySchema = Joi.object({
    // 1. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, ''),

    // 2. direction (String, Condicional)
    direction: Joi.string()
        .valid(...allowedDirections)
        .default('down')
        .messages({
            'any.only': 'La dirección debe ser down, up, right o left.',
        }),

    // 3. amount (Número, Condicional)
    amount: Joi.number().integer().min(1).default(100).messages({
        'number.min': 'La cantidad de píxeles debe ser al menos 1.',
    }),

    // 4. behavior (Requerido, Select)
    behavior: Joi.string()
        .valid(...allowedBehaviors)
        .default('auto')
        .required()
        .messages({
            'any.only': 'El comportamiento debe ser auto o smooth.',
        }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default scrollBodySchema;
