// schemas/get_set_content/body.js

import Joi from 'joi';

const allowedActions = ['get', 'set'];

const getSetContentBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector para localizar el elemento es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. action (Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .default('get')
        .required()
        .messages({
            'any.required': 'La acción (get/set) es obligatoria.',
            'any.only': 'La acción debe ser "get" (obtener) o "set" (asignar).',
        }),

    // 3. value (Requerido CONDICIONAL)
    value: Joi.string()
        .when('action', {
            // Si action es 'set', el campo 'value' es obligatorio.
            is: 'set',
            then: Joi.string().trim().min(1).required(),
            // Si action es 'get', el campo 'value' es opcional y se ignora.
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El "value" es obligatorio cuando la acción es "set".',
            'string.min': 'El valor a asignar no puede estar vacío.',
        }),

    // 4. clearBeforeSet (Opcional)
    clearBeforeSet: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearBeforeSet debe ser booleano.',
    }),

    // 5. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
}).unknown(false);

export default getSetContentBodySchema;
