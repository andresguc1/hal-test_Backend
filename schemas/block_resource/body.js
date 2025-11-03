// schemas/block_resource/body.js

import Joi from 'joi';

const allowedResourceTypes = [
    '', // Cualquiera (por defecto)
    'image',
    'stylesheet',
    'script',
    'font',
    'media',
    'document',
    'xhr',
    'other',
];

const blockResourceBodySchema = Joi.object({
    // 1. urlPattern (Requerido)
    urlPattern: Joi.string().trim().required().messages({
        'any.required': 'El patrón de URL de recursos a bloquear es obligatorio.',
    }),

    // 2. resourceType (Filtrar por Tipo de Recurso, Opcional)
    resourceType: Joi.string()
        .valid(...allowedResourceTypes)
        .default('') // Por defecto, cualquiera
        .optional(),

    // 3. timeout (Duración del Bloqueo)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'La duración del bloqueo (timeout) debe ser positiva o cero (indefinido).',
    }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default blockResourceBodySchema;
