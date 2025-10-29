// controllers/action.controller.js

/**
 * Lógica de controladores para las operaciones de Hal-Test (acciones de Playwright).
 */

// Este mock simula la ejecución exitosa de un comando.
// En un sistema real, aquí llamarías a un servicio para ejecutar la lógica de Playwright.

// ==========================================================
// 1. OPEN URL
// ==========================================================

export const openUrlAction = async (req, res, next) => {
    try {
        const { url, waitUntil } = req.body;

        console.log(`[ACTION] URL abierta: ${url} (Wait: ${waitUntil})`);

        res.status(200).json({
            success: true,
            message: `URL '${url}' abierta con éxito.`,
            action: 'open_url',
            data: req.body,
        });
    } catch (error) {
        next(error); // ahora sí existe
    }
};

// ==========================================================
// 2. LAUNCH BROWSER
// ==========================================================

export const launchBrowserAction = async (req, res, next) => {
    try {
        // req.body está limpio y validado por Joi
        const options = req.body;

        // Simular la conversión de args (si es un string separado por comas)
        const argsArray = options.args
            ? options.args
                  .split(',')
                  .map((arg) => arg.trim())
                  .filter((arg) => arg.length > 0)
            : [];

        // Simular la acción de Playwright
        // const browser = await playwrightService.launch(options);

        console.log(
            `[ACTION] Navegador '${options.browserType}' lanzado. Headless: ${options.headless}`,
        );

        res.status(200).json({
            success: true,
            message: `Navegador '${options.browserType}' lanzado con éxito.`,
            action: 'launch_browser',
            // Opcionalmente, puedes devolver los datos procesados, como args como un array:
            data: { ...options, args: argsArray, status: 'launched' },
        });
    } catch (error) {
        // Pasa cualquier error al manejador de errores centralizado
        next(error);
    }
};

// ==========================================================
// 3. CLICK (Eliminado en la última refactorización)
// ==========================================================

// export const clickAction = async (req, res, next) => {
//     // ... código del click ...
// };

// Nota: Dado que en el archivo routes/api.router.js importaste explícitamente
// 'openUrlAction' y 'launchBrowserAction' desde action.controller.js,
// este archivo ahora es la fuente de ambos controladores.
