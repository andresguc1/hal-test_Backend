// schemas/upload_file/body.js

import Joi from 'joi';

const uploadFileBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del input file es obligatorio.',
    }),

    // 2. files (Rutas de Archivos a Subir, Requerido)
    // NOTA: Se espera un string de rutas separadas por algún delimitador (ej: coma), que el backend debe procesar.
    files: Joi.string().trim().required().messages({
        'any.required': 'Las rutas de los archivos a subir son obligatorias.',
        'string.empty': 'Las rutas de los archivos no pueden estar vacías.',
    }),

    // 3. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000),
}).unknown(false);

export default uploadFileBodySchema;
