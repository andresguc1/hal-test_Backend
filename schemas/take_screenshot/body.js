// schemas/take_screenshot/body.js

import Joi from 'joi';

const allowedFormats = [
    'png', // Predeterminado y sin pérdida
    'jpeg', // Comprimido, permite calidad
];

const takeScreenshotBodySchema = Joi.object({
    // 1. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, ''),

    // 2. path (Ruta de Guardado, Opcional)
    path: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'La ruta de guardado debe ser una cadena de texto.',
    }),

    // 3. fullPage (Booleano/Checkbox)
    fullPage: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo fullPage debe ser booleano.',
    }),

    // 4. format (Requerido, Select)
    format: Joi.string()
        .valid(...allowedFormats)
        .default('png')
        .required()
        .messages({
            'any.required': 'El formato de imagen es obligatorio.',
            'any.only': 'El formato debe ser png o jpeg.',
        }),

    // 5. quality (Número, Condicional)
    quality: Joi.number().integer().min(1).max(100).default(100).messages({
        'number.min': 'La calidad debe ser al menos 1.',
        'number.max': 'La calidad debe ser como máximo 100.',
    }),

    // 6. timeout (Tiempo de espera)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 7. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default takeScreenshotBodySchema;
