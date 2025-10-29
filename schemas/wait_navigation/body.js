// schemas/wait_navigation/body.js

import Joi from 'joi';

// Los mismos valores de waitUntil que en open_url, pero 'commit' no es común en espera de navegación
const allowedWaitUntilValues = [
    'load',
    'domcontentloaded',
    'networkidle',
    // Se excluye 'commit' ya que 'load' es el default para la navegación
];

const waitNavigationBodySchema = Joi.object({
    // 1. url (URL de Destino Específica, Opcional)
    // Permite que sea un string vacío si se quiere esperar *cualquier* navegación.
    url: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'La URL de destino debe ser una cadena de texto o un patrón.',
    }),

    // 2. timeout (Tiempo de espera)
    timeout: Joi.number().integer().min(1).default(30000),

    // 3. waitUntil (Condición de Fin de Navegación, Requerido)
    waitUntil: Joi.string()
        .valid(...allowedWaitUntilValues)
        .default('load')
        .required()
        .messages({
            'any.required': 'La condición de fin de navegación es obligatoria.',
            'any.only': 'La condición debe ser load, domcontentloaded o networkidle.',
        }),
}).unknown(false);

export default waitNavigationBodySchema;
