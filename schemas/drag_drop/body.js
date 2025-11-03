// schemas/drag_drop/body.js

import Joi from 'joi';

const dragDropBodySchema = Joi.object({
    // 1. sourceSelector (Requerido)
    sourceSelector: Joi.string().trim().required().messages({
        'any.required': 'El selector de origen (arrastrar) es obligatorio.',
    }),

    // 2. targetSelector (Requerido)
    targetSelector: Joi.string().trim().required().messages({
        'any.required': 'El selector de destino (soltar) es obligatorio.',
    }),

    // 3. steps (Número, Mínimo 1)
    steps: Joi.number().integer().min(1).default(10).optional().messages({
        'number.min': 'El número de pasos debe ser al menos 1.',
        'number.base': 'steps debe ser un número entero.',
    }),

    // 4. force (Booleano/Checkbox)
    force: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo force debe ser booleano (true/false).',
    }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
}).unknown(false);

export default dragDropBodySchema;
