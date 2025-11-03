// schemas/cli_params/body.js

import Joi from 'joi';

const allowedParamTypes = ['string', 'number', 'boolean'];

const cliParamsBodySchema = Joi.object({
    // 1. paramName (Nombre del Parámetro CLI, Requerido)
    paramName: Joi.string().trim().required().messages({
        'any.required': 'El nombre del parámetro CLI es obligatorio.',
        'string.empty': 'El nombre del parámetro no puede estar vacío.',
    }),

    // 2. paramType (Tipo de Dato Esperado, Requerido)
    paramType: Joi.string()
        .valid(...allowedParamTypes)
        .required()
        .messages({
            'any.required': 'El tipo de dato esperado para el parámetro es obligatorio.',
            'any.only': 'El tipo de dato debe ser string, number o boolean.',
        }),

    // 3. defaultValue (Valor por Defecto, Opcional)
    // Usamos string para permitir cualquier tipo (será convertido internamente)
    defaultValue: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'El valor por defecto debe ser una cadena de texto.',
    }),

    // 4. required (Parámetro Obligatorio, Opcional)
    required: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo "required" debe ser booleano.',
    }),

    // 5. validationCode (Código de Validación JS, Opcional)
    validationCode: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'El código de validación debe ser una cadena de texto (JS).',
    }),

    // 6. browserId (ID del contexto/navegador objetivo) 🆕
    // Aunque esto no es directamente una acción de navegador, se requiere un contexto de ejecución.
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
})
    // Bloquea cualquier campo extra que no esté definido.
    .unknown(false);

export default cliParamsBodySchema;
