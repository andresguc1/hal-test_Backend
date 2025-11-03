// schemas/click/body.js

import Joi from 'joi';

// Valores permitidos para el campo 'button'
const allowedButtonValues = ['left', 'right', 'middle'];

// Valores permitidos para las teclas 'modifiers' (multiselect -> array)
const allowedModifierKeys = [
    'Alt',
    'Control',
    'Meta', // Windows/Command key
    'Shift',
];

const clickBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del elemento es obligatorio para la acción click.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. button (Requerido, Select)
    button: Joi.string()
        .valid(...allowedButtonValues)
        .default('left')
        .required()
        .messages({
            'any.required': 'El botón del mouse es obligatorio (left, right o middle).',
            'any.only': 'El botón debe ser "left", "right" o "middle".',
        }),

    // 3. clickCount (Número, Mínimo 1)
    clickCount: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'El número de clics debe ser un número entero.',
        'number.min': 'El número de clics debe ser al menos 1.',
    }),

    // 4. modifiers (Array de Strings, Opcional)
    modifiers: Joi.array()
        .items(Joi.string().valid(...allowedModifierKeys))
        .unique() // Asegura que no haya modificadores duplicados
        .optional()
        .messages({
            'array.base': 'Los modificadores deben ser un array de teclas.',
            'array.includes':
                'Uno de los modificadores no es una tecla válida (Alt, Control, Meta, Shift).',
        }),

    // 5. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 6. force (Booleano, Checkbox)
    force: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo force debe ser un valor booleano (true/false).',
    }),

    // 7. browserId (ID del navegador objetivo) 🚨 ¡CRUCIAL!
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default clickBodySchema;
