// schemas/type_text/body.js

import Joi from 'joi';

const typeTextBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del campo de texto es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. text (Requerido)
    text: Joi.string().required().messages({
        'any.required': 'El texto a ingresar es obligatorio.',
        'string.empty': 'El texto no puede estar vacío.',
    }),

    // 3. clearBeforeType (Booleano/Checkbox)
    clearBeforeType: Joi.boolean()
        .default(true) // Coincide con el defaultValue del frontend
        .optional()
        .messages({
            'boolean.base': 'El campo clearBeforeType debe ser un valor booleano (true/false).',
        }),

    // 4. delay (Número, Mínimo 0)
    delay: Joi.number()
        .integer()
        .min(0) // Coincide con min: 0 del frontend
        .default(0) // Coincide con defaultValue del frontend
        .messages({
            'number.base': 'El retardo (delay) debe ser un número entero.',
            'number.min': 'El retardo no puede ser negativo.',
        }),

    // 5. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default typeTextBodySchema;
