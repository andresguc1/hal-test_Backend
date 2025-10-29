// schemas/save_dom/body.js

import Joi from 'joi';

const saveDomBodySchema = Joi.object({
    // 1. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, ''),

    // 2. path (Ruta de Guardado, Opcional)
    path: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'La ruta de guardado debe ser una cadena de texto.',
    }),

    // 3. variableName (Nombre de Variable, Condicional)
    // Requerido solo si 'path' está vacío, ya que el contenido debe guardarse en algún lugar.
    variableName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('path', {
            is: Joi.valid('', null),
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de la variable es obligatorio si no se proporciona una ruta de archivo (path).',
                'string.empty': 'El nombre de la variable no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 4. timeout (Tiempo de espera)
    timeout: Joi.number().integer().min(1).default(30000),
}).unknown(false);

export default saveDomBodySchema;
