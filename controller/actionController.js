// controllers/actionController.js

/**
 * Función genérica para manejar las acciones y sus errores.
 * @param {Function} actionFn - La función asíncrona que contiene la lógica Playwright.
 */
const asyncHandler = (actionFn) => async (req, res, next) => {
    try {
        // Ejecuta la lógica de la acción con los datos validados (req.body)
        const result = await actionFn(req.body);

        // Retorna un éxito genérico o el resultado específico de la acción
        res.status(200).json({
            success: true,
            message: 'Acción ejecutada con éxito.',
            data: result,
        });
    } catch (error) {
        // Pasa el error al manejador de errores centralizado
        next(error);
    }
};

// ====================================================================
// Lógica de Acciones
// NOTA: Aquí iría la integración real con Playwright (contexto, página, etc.)
// ====================================================================

// Ejemplo de acción openUrl
const handleOpenUrl = async ({ url, waitUntil }) => {
    // ** Simulación de Lógica Playwright **
    // const page = getPlaywrightPage();
    // await page.goto(url, { waitUntil, timeout });

    // Aquí puedes lanzar un error si algo falla
    // if (url.includes('google.com')) throw { statusCode: 400, message: 'Google is blocked.' };

    return {
        urlReached: url,
        waitTime: waitUntil,
    };
};

const handleClick = async ({ selector, clickCount }) => {
    // ** Simulación de Lógica Playwright **
    // const page = getPlaywrightPage();
    // await page.click(selector, { clickCount });

    return {
        element: selector,
        clicks: clickCount,
    };
};

const handleTypeText = async ({ selector, text }) => {
    // ** Simulación de Lógica Playwright **
    // const page = getPlaywrightPage();
    // if (clearBeforeType) await page.fill(selector, '');
    // await page.type(selector, text);

    return {
        element: selector,
        textLength: text.length,
    };
};

// ====================================================================
// Exportación de Controladores
// ====================================================================

export const openUrl = asyncHandler(handleOpenUrl);
export const click = asyncHandler(handleClick);
export const typeText = asyncHandler(handleTypeText);
// ... Exportar el resto de acciones usando asyncHandler(handleActionName)
