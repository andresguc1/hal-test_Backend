// schemas/log_errors/body.js

import Joi from 'joi';

const logErrorsBodySchema = Joi.object({
    // 1. logToFile (Booleano/Checkbox)
    logToFile: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'logToFile debe ser booleano.',
    }),

    // 2. filePath (Ruta de Archivo, Condicional)
    filePath: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('logToFile', {
            is: true,
            then: Joi.string().required().messages({
                'any.required':
                    'La ruta del archivo de logs (filePath) es obligatoria si "Registrar Errores a Archivo" está activo.',
                'string.empty': 'La ruta del archivo de logs no puede estar vacía.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 3. timeout (Duración de Escucha)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'El timeout debe ser positivo o cero (indefinido).',
    }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default logErrorsBodySchema;
