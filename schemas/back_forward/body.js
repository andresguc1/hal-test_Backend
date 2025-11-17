// schemas/manage_tabs/body.js

import Joi from 'joi';

// Valores permitidos para el campo 'action'
const allowedActions = ['new', 'switch', 'close'];

const manageTabsBodySchema = Joi.object({
    // 1. action (Requerido, Select)
    action: Joi.string()
        .valid(...allowedActions)
        .default('new')
        .required()
        .messages({
            'any.required': 'La acción (action) para gestionar pestañas es obligatoria.',
            'any.only': 'La acción debe ser "new", "switch" o "close".',
        }),

    // 2. url (Condicional: Requerido para action='new')
    url: Joi.string()
        .uri() // Asegura que el valor, si está presente, sea un URI válido.
        .when('action', {
            is: 'new',
            // Si action es 'new', la URL es obligatoria y no puede estar vacía.
            then: Joi.string().uri().required().messages({
                'any.required': 'La URL es obligatoria cuando la acción es "new".',
                'string.empty': 'La URL no puede estar vacía cuando la acción es "new".',
                'string.uri': 'La URL debe ser un formato de URI válido.',
            }),
            // Si action no es 'new' (switch o close), es opcional y puede ser nulo o vacío.
            otherwise: Joi.string().uri().allow(null, '').optional(),
        })
        .messages({
            'string.base': 'URL debe ser una cadena de texto.',
        }),

    // 3. endpoint (Opcional, Text) - No requiere validación de formato específico, solo que sea string.
    endpoint: Joi.string().uri().allow(null, '').optional().messages({
        'string.base': 'El endpoint debe ser una cadena de texto con formato URI.',
    }),

    // 4. browserId (ID del navegador objetivo) 🚨 ¡CRUCIAL!
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default manageTabsBodySchema;
