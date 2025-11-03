// schemas/modify_headers/body.js

import Joi from 'joi';

const allowedMethods = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const modifyHeadersBodySchema = Joi.object({
    // 1. urlPattern (Requerido)
    urlPattern: Joi.string().trim().required().messages({
        'any.required': 'El patrón de URL a interceptar es obligatorio.',
    }),

    // 2. headers (Cabeceras a Modificar, Requerido JSON String)
    headers: Joi.string().trim().required().messages({
        'any.required': 'El objeto JSON de cabeceras (headers) es obligatorio.',
        'string.empty': 'El objeto JSON de cabeceras no puede estar vacío.',
    }),

    // 3. method (Método HTTP, Opcional)
    method: Joi.string()
        .valid(...allowedMethods)
        .default('') // Por defecto, cualquiera
        .optional(),

    // 4. timeout (Duración de la Modificación)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min':
            'La duración de la modificación (timeout) debe ser positiva o cero (indefinido).',
    }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default modifyHeadersBodySchema;
