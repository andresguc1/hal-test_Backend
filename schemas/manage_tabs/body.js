// schemas/manage_tabs/body.js

import Joi from 'joi';

const allowedActions = ['new', 'switch', 'close', 'list'];

const manageTabsBodySchema = Joi.object({
    // 1. action (Requerido, Select)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La operación de pestaña (action) es obligatoria.',
            'any.only': 'La acción debe ser "new", "switch", "close" o "list".',
        }),

    // 2. browserId (Opcional) - 🆕 Añadido
    // Identificador del navegador objetivo. Si no se envía, el controlador usará el último activo.
    browserId: Joi.string()
        .allow(null, '') // Permite que sea nulo o una cadena vacía
        .optional()
        .messages({
            'string.base': 'browserId debe ser una cadena de texto.',
        }),

    // 3. tabIndex (Número, Condicional)
    tabIndex: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.min': 'El índice de la pestaña debe ser 0 o mayor.',
            'number.base': 'El índice de la pestaña debe ser un número entero.',
        })
        // Condicional: Requerido si action es 'switch' o 'close'
        .when('action', {
            is: Joi.valid('switch', 'close'),
            then: Joi.required().messages({
                'any.required':
                    'El índice de la pestaña es obligatorio para las acciones "switch" y "close".',
            }),
            otherwise: Joi.optional(),
        }),

    // 4. url (String, Condicional)
    url: Joi.string()
        // Valida que sea una URL válida con protocolo http o https
        .uri({ scheme: ['http', 'https'] })
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.uri': 'URL inválida. Debe incluir http:// o https://.',
        })
        // Condicional: Requerido si action es 'new'
        .when('action', {
            is: 'new',
            then: Joi.required().messages({
                'any.required': 'La URL es obligatoria al crear una nueva pestaña (acción "new").',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),
}).unknown(false);

export default manageTabsBodySchema;
