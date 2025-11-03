// schemas/handle_hooks/body.js

import Joi from 'joi';

const allowedHookTypes = [
    'beforeAction',
    'afterAction',
    'beforePageLoad',
    'afterPageLoad',
    'custom',
];

const handleHooksBodySchema = Joi.object({
    // 1. hookType (Tipo de Hook, Requerido)
    hookType: Joi.string()
        .valid(...allowedHookTypes)
        .required()
        .messages({
            'any.required': 'El tipo de hook (hookType) es obligatorio.',
            'any.only': 'El tipo de hook seleccionado no es válido.',
        }),

    // 2. actionName (Acción Específica a Filtrar, Opcional)
    actionName: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'El nombre de la acción debe ser una cadena de texto.',
    }),

    // 3. callbackCode (Código de la Función Callback, Requerido)
    callbackCode: Joi.string().trim().required().messages({
        'any.required': 'El código de la función callback (callbackCode JS) es obligatorio.',
        'string.empty': 'El código del callback no puede estar vacío.',
    }),

    // 4. once (Ejecutar Solo una Vez, Opcional)
    once: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'once debe ser booleano.',
    }),

    // 5. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para registrar un hook.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default handleHooksBodySchema;
