// schemas/open_url/body.js

import Joi from 'joi';

// Array de valores permitidos para el campo 'waitUntil'
const allowedWaitUntilValues = ['load', 'domcontentloaded', 'networkidle', 'commit'];

const openUrlBodySchema = Joi.object({
    // 1. URL (Requerido, URI válida)
    url: Joi.string()
        .uri({ scheme: ['http', 'https'] }) // Asegura el formato http:// o https://
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
        .default('load') // Coincide con el defaultValue del frontend
        .messages({
            'any.only':
                'La condición de espera no es válida. Use load, domcontentloaded, networkidle o commit.',
        }),

    // 3. timeout (Tiempo de espera)
    timeout: Joi.number()
        .integer()
        .min(0) // Coincide con el min: 0 del frontend
        .default(30000) // Coincide con el defaultValue del frontend
        .messages({
            'number.base': 'El tiempo de espera debe ser un número entero.',
            'number.min': 'El tiempo de espera no puede ser negativo.',
        }),
})
    // IMPORTANTE: Bloquea cualquier campo extra no definido.
    .unknown(false);

export default openUrlBodySchema;
