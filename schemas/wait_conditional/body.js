// schemas/wait_conditional/body.js

import Joi from 'joi';

const waitConditionalBodySchema = Joi.object({
    // 1. conditionScript (Requerido, String)
    conditionScript: Joi.string().trim().required().messages({
        'any.required': 'El script de condición JavaScript es obligatorio.',
        'string.empty': 'El script de condición no puede estar vacío.',
    }),

    // 2. polling (Intervalo de Evaluación)
    polling: Joi.number().integer().min(1).default(100).messages({
        'number.min': 'El intervalo de evaluación (polling) debe ser al menos 1ms.',
    }),

    // 3. timeout (Tiempo de espera Máximo)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 4. args (Argumentos para el Script, Opcional)
    args: Joi.string().trim().optional().allow(null, ''),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default waitConditionalBodySchema;
