// schemas/scroll/body.js

import Joi from 'joi';

const allowedDirections = ['down', 'up', 'right', 'left'];
const allowedBehaviors = ['auto', 'smooth'];

const scrollBodySchema = Joi.object({
    // 1. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, ''), // Permitir que sea nulo o vacío

    // 2. direction (String, Condicional)
    direction: Joi.string()
        .valid(...allowedDirections)
        .default('down')
        .messages({
            'any.only': 'La dirección debe ser down, up, right o left.',
        }),

    // 3. amount (Número, Condicional)
    amount: Joi.number().integer().min(1).default(100).messages({
        'number.min': 'La cantidad de píxeles debe ser al menos 1.',
    }),

    // 4. behavior (Requerido, Select)
    behavior: Joi.string()
        .valid(...allowedBehaviors)
        .default('auto')
        .required()
        .messages({
            'any.only': 'El comportamiento debe ser auto o smooth.',
        }),

    // NOTA: La lógica de si direction/amount son necesarios (cuando selector está vacío)
    // se maneja mejor en el controlador, ya que Joi hace la validación de forma independiente.
    // Aquí solo se validan los tipos y valores permitidos.
}).unknown(false);

export default scrollBodySchema;
