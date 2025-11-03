// schemas/intercept_request/body.js

import Joi from 'joi';

const allowedMethods = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const allowedActions = ['mock', 'abort', 'continue'];

const interceptRequestBodySchema = Joi.object({
    // 1. urlPattern (Requerido)
    urlPattern: Joi.string().trim().required().messages({
        'any.required': 'El patrón de URL a interceptar es obligatorio.',
    }),

    // 2. method (Método HTTP, Opcional)
    method: Joi.string()
        .valid(...allowedMethods)
        .default('')
        .optional(),

    // 3. action (Acción a Realizar, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .default('continue')
        .required()
        .messages({
            'any.required': 'La acción a realizar (mock, abort, continue) es obligatoria.',
            'any.only': 'La acción debe ser mock, abort o continue.',
        }),

    // 4. responseMock (Cuerpo de Respuesta Mock, Condicional)
    responseMock: Joi.string()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'mock',
            then: Joi.string().required().messages({
                'any.required':
                    'El cuerpo de la respuesta Mock es obligatorio si la acción es "mock".',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. timeout (Duración de Interceptación)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'El timeout debe ser positivo o cero (indefinido).',
    }),

    // 6. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default interceptRequestBodySchema;
