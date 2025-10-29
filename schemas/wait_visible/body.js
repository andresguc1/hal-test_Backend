// schemas/wait_visible/body.js

import Joi from 'joi';

const waitVisibleBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del elemento es obligatorio para la espera de visibilidad.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. timeout (Tiempo de espera)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 3. scrollIntoView (Booleano/Checkbox)
    scrollIntoView: Joi.boolean()
        .default(true) // Por defecto, intenta hacer scroll
        .optional(),
}).unknown(false);

export default waitVisibleBodySchema;
