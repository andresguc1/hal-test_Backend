// schemas/submit_form/body.js

import Joi from 'joi';

const submitFormBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del formulario o botón de envío es obligatorio.',
    }),

    // 2. waitForNavigation (Booleano/Checkbox)
    waitForNavigation: Joi.boolean()
        .default(true) // Esperar navegación por defecto
        .optional(),

    // 3. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000),
}).unknown(false);

export default submitFormBodySchema;
