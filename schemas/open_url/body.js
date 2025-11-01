// schemas/open_url/body.js

import Joi from 'joi';

// Array de valores permitidos para el campo 'waitUntil'
const allowedWaitUntilValues = ['load', 'domcontentloaded', 'networkidle', 'commit'];

const openUrlBodySchema = Joi.object({
    // 1. URL (Requerido)
    url: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .trim()
        .required()
        .messages({
            'any.required': 'La propiedad "url" es obligatoria para iniciar la prueba.',
            'string.empty': 'La propiedad "url" no puede estar vacía.',
            'string.uri': 'URL inválida. Debe incluir http:// o https://.',
        }),

    // 2. waitUntil (Condición de espera)
    waitUntil: Joi.string()
        .valid(...allowedWaitUntilValues)
        .default('load')
        .optional() // Joi es estricto, es mejor marcar opcional si tiene default
        .messages({
            'any.only':
                'La condición de espera no es válida. Use load, domcontentloaded, networkidle o commit.',
        }),

    // 3. timeout (Tiempo de espera en ms)
    timeout: Joi.number()
        .integer()
        .min(0)
        .default(30000)
        .optional() // Joi es estricto, es mejor marcar opcional si tiene default
        .messages({
            'number.base': 'El tiempo de espera debe ser un número entero.',
            'number.min': 'El tiempo de espera no puede ser negativo.',
        }),

    // 4. browserId (ID del navegador objetivo) 🆕 CAMPO AÑADIDO
    browserId: Joi.string()
        .allow(null, '') // Permite null o cadena vacía si el frontend no lo envía
        .optional()
        .messages({
            'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
        }),
})
    // IMPORTANTE: Bloquea cualquier campo extra no definido.
    .unknown(false);

export default openUrlBodySchema;
