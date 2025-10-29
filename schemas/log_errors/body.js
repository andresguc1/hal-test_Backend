// schemas/log_errors/body.js

import Joi from 'joi';

const logErrorsBodySchema = Joi.object({
    // 1. logToFile (Booleano/Checkbox)
    logToFile: Joi.boolean().default(false).optional(),

    // 2. filePath (Ruta de Archivo, Condicional)
    // Requerido solo si 'logToFile' es true.
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
    // 0 significa indefinido.
    timeout: Joi.number().integer().min(0).default(0),
}).unknown(false);

export default logErrorsBodySchema;
