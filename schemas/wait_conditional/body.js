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
    timeout: Joi.number().integer().min(1).default(30000),

    // 4. args (Argumentos para el Script, Opcional)
    // NOTA: Se espera un string que el backend debe parsear a un array de argumentos.
    args: Joi.string().trim().optional().allow(null, ''),
}).unknown(false);

export default waitConditionalBodySchema;
