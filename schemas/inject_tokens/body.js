// schemas/inject_tokens/body.js

import Joi from 'joi';

const allowedTargets = ['header', 'cookie', 'localStorage', 'sessionStorage'];

const injectTokensBodySchema = Joi.object({
    // 1. target (Destino de Inyección, Requerido)
    target: Joi.string()
        .valid(...allowedTargets)
        .required()
        .messages({
            'any.required': 'El destino de inyección (target) es obligatorio.',
        }),

    // 2. key (Nombre de la Clave/Cabecera/Cookie, Requerido)
    key: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la clave, cabecera o cookie es obligatorio.',
    }),

    // 3. value (Valor del Token, Requerido)
    value: Joi.string().required().messages({
        'any.required': 'El valor del token a inyectar es obligatorio.',
    }),

    // 4. urlPattern (Patrón de URL/Dominio, Opcional)
    urlPattern: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'El patrón de URL debe ser una cadena de texto.',
    }),

    // 5. cookiePath (Ruta de Cookie, Opcional)
    cookiePath: Joi.string().trim().default('/').optional().allow(null, '').messages({
        'string.base': 'La ruta de la cookie debe ser una cadena de texto.',
    }),

    // 6. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default injectTokensBodySchema;
