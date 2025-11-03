// schemas/mock_response/body.js

import Joi from 'joi';

const allowedMethods = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const mockResponseBodySchema = Joi.object({
    // 1. urlPattern (Requerido)
    urlPattern: Joi.string().trim().required().messages({
        'any.required': 'El patrón de URL a interceptar es obligatorio.',
    }),

    // 2. method (Método HTTP, Opcional)
    method: Joi.string()
        .valid(...allowedMethods)
        .default('') // Por defecto, cualquiera
        .optional(),

    // 3. responseBody (Cuerpo de Respuesta, Requerido)
    responseBody: Joi.string().required().messages({
        'any.required': 'El cuerpo de la respuesta simulada es obligatorio.',
    }),

    // 4. status (Código de Estado HTTP)
    status: Joi.number().integer().min(100).max(599).default(200).messages({
        'number.min': 'El código de estado debe ser al menos 100.',
        'number.max': 'El código de estado debe ser como máximo 599.',
    }),

    // 5. headers (Cabeceras HTTP Adicionales, Opcional JSON)
    headers: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'Las cabeceras deben ser una cadena de texto (JSON).',
    }),

    // 6. timeout (Duración de Mocking)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'La duración de mocking (timeout) debe ser positiva o cero (indefinido).',
    }),

    // 7. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default mockResponseBodySchema;
