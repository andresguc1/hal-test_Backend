// schemas/manage_storage/body.js

import Joi from 'joi';

const allowedStorageTypes = ['local', 'session'];
const allowedActions = ['get', 'set', 'delete', 'clear'];

const manageStorageBodySchema = Joi.object({
    // 1. storageType (Requerido)
    storageType: Joi.string()
        .valid(...allowedStorageTypes)
        .required()
        .messages({
            'any.required': 'El tipo de almacenamiento (local o session) es obligatorio.',
        }),

    // 2. action (Acción a Realizar, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La acción a realizar (get, set, delete, clear) es obligatoria.',
        }),

    // 3. key (Clave, Condicional)
    key: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid('get', 'set', 'delete'),
            then: Joi.string().required().messages({
                'any.required':
                    'La clave (key) es obligatoria para las acciones "get", "set" o "delete".',
                'string.empty': 'La clave no puede estar vacía.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 4. value (Valor a Establecer, Condicional)
    value: Joi.string()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'set',
            then: Joi.string().required().messages({
                'any.required':
                    'El valor a establecer (value) es obligatorio para la acción "set".',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. variableName (Guardar Valor en Variable, Condicional)
    variableName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'get',
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de la variable es obligatorio para la acción "get" para guardar el resultado.',
                'string.empty': 'El nombre de la variable no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 6. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default manageStorageBodySchema;
