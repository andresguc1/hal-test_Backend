// schemas/select_option/body.js

import Joi from 'joi';

// Valores permitidos para selectionCriteria
const allowedCriteria = [
    'value', // Por valor (value="" en <option>)
    'label', // Por etiqueta (Texto visible)
    'index', // Por índice (Posición numérica)
];

const selectOptionBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del dropdown (<select>) es obligatorio.',
    }),

    // 2. selectionCriteria (Requerido, Select)
    selectionCriteria: Joi.string()
        .valid(...allowedCriteria)
        .default('value')
        .required()
        .messages({
            'any.required': 'El criterio de selección (value, label, index) es obligatorio.',
            'any.only': 'El criterio de selección debe ser value, label o index.',
        }),

    // 3. selectionValue (Requerido, String)
    // Nota: Aunque el índice es numérico, Joi lo acepta como string y el backend lo parseará.
    selectionValue: Joi.string().trim().required().messages({
        'any.required': 'El valor, etiqueta o índice a seleccionar es obligatorio.',
    }),

    // 4. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000),
}).unknown(false);

export default selectOptionBodySchema;
