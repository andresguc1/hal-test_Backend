// app.js
// ==========================
// 🚀 HaltTest Backend Server
// ==========================

import 'dotenv/config'; // Forma moderna de cargar dotenv en ESM
import express from 'express';
import cors from 'cors';
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import validate from './middlewares/validator.js';
import openUrlBodySchema from './schemas/open_url/body.js';
import apiRouter from './routes/api.router.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 2001;

// --- 1. MIDDLEWARES DE SEGURIDAD (Aplicar primero) ---
app.use(helmetMiddleware);
app.use(apiLimiter); // Rate limiting en todas las rutas

// --- 2. MIDDLEWARES DE FORMATO ---
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);
app.use(express.json()); // Parser JSON nativo de Express
app.use(express.urlencoded({ extended: true }));

// --- 3. LOGGERS ---
import { developmentLogger, productionLogger } from './middlewares/logger.js';

// Aplica el logger según el ambiente
if (process.env.NODE_ENV === 'production') {
    app.use(productionLogger()); // Logs detallados en archivo
} else {
    app.use(developmentLogger()); // Logs concisos en consola
}

// --- MOCKS DE DATOS DEL FRAMEWORK PLAYWRIGHT MCP ---

// 1. Mock de Categorías
const mockCategories = {
    browser_management: {
        label: 'Navegador',
        icon: '🌐',
        nodes: ['launch_browser', 'open_url', 'close_browser', 'manage_tabs', 'resize_viewport'],
    },
    dom_manipulation: {
        label: 'DOM',
        icon: '💻',
        nodes: ['find_element', 'get_set_content', 'wait_for_element', 'execute_js'],
    },
    user_simulation: {
        label: 'Interacción',
        icon: '👆',
        nodes: [
            'click',
            'type_text',
            'select_option',
            'submit_form',
            'scroll',
            'drag_drop',
            'upload_file',
        ],
    },
    synchronization: {
        label: 'Sincronización',
        icon: '⏱️',
        nodes: ['wait_visible', 'wait_navigation', 'wait_network', 'wait_conditional'],
    },
    diagnostics: {
        label: 'Diagnóstico',
        icon: '📷',
        nodes: ['take_screenshot', 'save_dom', 'log_errors', 'listen_events'],
    },
    network_control: {
        label: 'Red',
        icon: '🔌',
        nodes: ['intercept_request', 'mock_response', 'block_resource', 'modify_headers'],
    },
    session_management: {
        label: 'Sesión',
        icon: '🍪',
        nodes: ['manage_cookies', 'manage_storage', 'inject_tokens', 'persist_session'],
    },
    test_execution: {
        label: 'Contexto/Control',
        icon: '✅',
        nodes: ['create_context', 'cleanup_state', 'handle_hooks', 'control_exceptions'],
    },
    file_data: {
        label: 'Archivos/Datos',
        icon: '📁',
        nodes: ['read_data', 'save_results', 'handle_downloads'],
    },
    llm_ai: {
        label: 'Modelos de IA (LLM)',
        icon: '🧠',
        nodes: ['call_llm', 'generate_data', 'validate_semantic'],
    },
    execution_interface: {
        label: 'Ejecución',
        icon: '🖥️',
        nodes: ['run_tests', 'cli_params', 'return_code', 'integrate_ci'],
    },
};

// 2. Mock de Operaciones (Esquema JSON COMPLETO de campos de entrada para cada nodo)
const allNodeFieldConfigs = {
    // --- BROWSER MANAGEMENT ---
    launch_browser: [
        {
            name: 'browserType',
            label: 'Tipo de navegador',
            type: 'select',
            options: [
                { value: 'chromium', label: 'Chromium' },
                { value: 'firefox', label: 'Firefox' },
                { value: 'webkit', label: 'WebKit (Safari)' },
            ],
            defaultValue: 'chromium',
            required: true,
        },
        {
            name: 'headless',
            label: 'Modo headless (sin interfaz)',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'slowMo',
            label: 'Ralentizar acciones (ms)',
            type: 'number',
            placeholder: 'Ej: 50. Retrasa cada acción para debug.',
            defaultValue: 0,
            min: 0,
        },
        {
            name: 'args',
            label: 'Argumentos del navegador',
            type: 'text',
            placeholder: 'Ej: --start-maximized, --disable-notifications. Separar por comas.',
        },
        {
            name: 'executablePath',
            label: 'Ruta del ejecutable (personalizado)',
            type: 'text',
            placeholder: 'Ej: /ruta/a/chrome.exe. Usar ejecutable de navegador personalizado.',
        },
    ],
    close_browser: [],
    manage_tabs: [], // Pendiente de implementación de campos

    open_url: [
        {
            name: 'url',
            label: 'URL',
            type: 'text',
            placeholder: 'https://ejemplo.com',
            required: true,
        },
        {
            name: 'waitUntil',
            label: 'Condición de espera de carga',
            type: 'select',
            options: [
                { value: 'load', label: 'Carga completa (Load: Recursos e imágenes)' },
                { value: 'domcontentloaded', label: 'DOM listo (DOMContentLoaded)' },
                { value: 'networkidle', label: 'Red inactiva (NetworkIdle)' },
                { value: 'commit', label: 'Navegación confirmada (Commit)' },
            ],
            defaultValue: 'load',
        },
        {
            name: 'timeout',
            label: 'Tiempo de espera (ms)',
            type: 'number',
            placeholder: 'Ej: 30000. Tiempo máximo para navegar.',
            defaultValue: 30000,
            min: 0,
        },
    ],

    resize_viewport: [
        {
            name: 'deviceEmulation',
            label: 'Emulación de Dispositivo Predefinida',
            type: 'select',
            options: [
                { value: '', label: 'Tamaño manual (No usar emulación)' },
                { value: 'iPhone 13', label: 'iPhone 13' },
                { value: 'Pixel 5', label: 'Google Pixel 5' },
                { value: 'iPad Pro', label: 'iPad Pro' },
                { value: 'Desktop Chrome', label: 'Desktop (Chrome 1920x1080)' },
            ],
            defaultValue: '',
            required: false,
            description:
                'Simula un dispositivo con tamaño, escala y agente de usuario predefinidos.',
        },
        {
            name: 'width',
            label: 'Ancho (px)',
            type: 'number',
            placeholder: 'Ej: 1280',
            required: true,
            min: 1,
            description:
                'Ancho del viewport en píxeles. Se usa si "Emulación de Dispositivo" es vacío.',
        },
        {
            name: 'height',
            label: 'Alto (px)',
            type: 'number',
            placeholder: 'Ej: 720',
            required: true,
            min: 1,
            description:
                'Alto del viewport en píxeles. Se usa si "Emulación de Dispositivo" es vacío.',
        },
    ],

    // --- USER SIMULATION ---
    click: [
        {
            name: 'selector',
            label: 'Selector del Elemento',
            type: 'text',
            placeholder: 'Ej: #id-del-boton o [data-test="link-registro"]',
            required: true,
            description:
                'Selector CSS, XPath o Playwright Locator que identifica el elemento a hacer clic.',
        },
        {
            name: 'button',
            label: 'Botón del Mouse',
            type: 'select',
            options: [
                { value: 'left', label: 'Izquierdo (Predeterminado)' },
                { value: 'right', label: 'Derecho' },
                { value: 'middle', label: 'Medio (Rueda)' },
            ],
            defaultValue: 'left',
            required: true,
            description: 'Define qué botón del mouse simulará la acción.',
        },
        {
            name: 'clickCount',
            label: 'Número de Clics',
            type: 'number',
            placeholder: 'Ej: 2 para doble clic',
            defaultValue: 1,
            min: 1,
            description: 'Define si es un clic simple (1), doble (2), o múltiple.',
        },
        {
            name: 'modifiers',
            label: 'Teclas Modificadoras',
            type: 'multiselect',
            options: [
                { value: 'Alt', label: 'Alt' },
                { value: 'Control', label: 'Control' },
                { value: 'Meta', label: 'Meta (Windows/Command)' },
                { value: 'Shift', label: 'Shift' },
            ],
            required: false,
            description: 'Teclas que se mantendrán presionadas durante el clic (Ej: Clic + Shift).',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description: 'Tiempo máximo para esperar que el clic se complete.',
        },
        {
            name: 'force',
            label: 'Forzar Clic',
            type: 'checkbox',
            defaultValue: false,
            description:
                'Si está activo, fuerza el clic aunque el elemento esté oculto o cubierto por otro elemento.',
        },
    ],

    type_text: [
        {
            name: 'selector',
            label: 'Selector del Campo de Texto',
            type: 'text',
            placeholder: 'Ej: #input-username o input[name="email"]',
            required: true,
            description:
                'Selector CSS, XPath o Playwright Locator que identifica el campo de texto objetivo.',
        },
        {
            name: 'text',
            label: 'Texto a Ingresar',
            type: 'text',
            placeholder: 'Ej: mi_texto_de_prueba',
            required: true,
            description: 'La cadena de texto que se simulará ingresar en el campo.',
        },
        {
            name: 'clearBeforeType',
            label: 'Limpiar Contenido Previo',
            type: 'checkbox',
            defaultValue: true,
            description: 'Si está activo, el campo se vaciará antes de ingresar el nuevo texto.',
        },
        {
            name: 'delay',
            label: 'Retardo de Tipeo (ms)',
            type: 'number',
            placeholder: 'Ej: 100',
            defaultValue: 0,
            min: 0,
            description: 'Tiempo de espera entre la simulación de cada carácter.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description: 'Tiempo máximo para esperar que el campo de texto sea interactuable.',
        },
    ],

    select_option: [
        {
            name: 'selector',
            label: 'Selector del Dropdown (<select>)',
            type: 'text',
            placeholder: 'Ej: #dropdown-pais o select[name="opcion"]',
            required: true,
            description:
                'Selector CSS, XPath o Playwright Locator que identifica el elemento <select>.',
        },
        {
            name: 'selectionCriteria',
            label: 'Criterio de Selección',
            type: 'select',
            options: [
                { value: 'value', label: 'Por Valor (value="" en <option>)' },
                { value: 'label', label: 'Por Etiqueta (Texto visible de la opción)' },
                { value: 'index', label: 'Por Índice (Posición numérica, empezando en 0)' },
            ],
            defaultValue: 'value',
            required: true,
            description: 'Define qué método usar para identificar la opción a seleccionar.',
        },
        {
            name: 'selectionValue',
            label: 'Valor/Etiqueta/Índice a Seleccionar',
            type: 'text',
            placeholder: 'Ej: US, Canada o 2',
            required: true,
            description:
                'El valor (string o número de índice) correspondiente al criterio seleccionado arriba.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 10000',
            defaultValue: 30000,
            min: 1,
            description: 'Tiempo máximo para esperar que el dropdown esté interactuable.',
        },
    ],

    submit_form: [
        {
            name: 'selector',
            label: 'Selector de Formulario o Botón de Envío',
            type: 'text',
            placeholder: 'Ej: #formulario-registro o button[type="submit"]',
            required: true,
            description:
                'Selector CSS, XPath o Playwright Locator que identifica el elemento <form> o el botón que dispara el submit.',
        },
        {
            name: 'waitForNavigation',
            label: 'Esperar Navegación',
            type: 'checkbox',
            defaultValue: true,
            description:
                'Si está activo, el test esperará a que se complete la navegación a la nueva página después del envío del formulario.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 60000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo para que el elemento de submit sea interactuable y/o se complete la navegación.',
        },
    ],

    scroll: [
        {
            name: 'selector',
            label: 'Selector de Elemento Objetivo',
            type: 'text',
            placeholder: 'Ej: #final-de-pagina o [data-testid="caja-desplazable"]',
            required: false,
            description:
                'Selector del elemento al que se desea hacer scroll. Si se especifica, se ignora "direction" y "amount".',
        },
        {
            name: 'direction',
            label: 'Dirección de Desplazamiento',
            type: 'select',
            options: [
                { value: 'down', label: 'Abajo' },
                { value: 'up', label: 'Arriba' },
                { value: 'right', label: 'Derecha' },
                { value: 'left', label: 'Izquierda' },
            ],
            defaultValue: 'down',
            required: false,
            description:
                'Dirección en la que se desplaza la vista. Solo se usa si no hay selector.',
        },
        {
            name: 'amount',
            label: 'Cantidad de Píxeles a Desplazar',
            type: 'number',
            placeholder: 'Ej: 500',
            defaultValue: 100,
            min: 1,
            required: false,
            description: 'Cantidad de píxeles a mover la vista. Solo se usa si no hay selector.',
        },
        {
            name: 'behavior',
            label: 'Comportamiento de Scroll',
            type: 'select',
            options: [
                { value: 'auto', label: 'Auto (Instantáneo)' },
                { value: 'smooth', label: 'Smooth (Animado)' },
            ],
            defaultValue: 'auto',
            required: true,
            description: 'Define si el scroll es instantáneo ("auto") o animado ("smooth").',
        },
    ],

    drag_drop: [
        {
            name: 'sourceSelector',
            label: 'Selector de Origen (Arrastrar)',
            type: 'text',
            placeholder: 'Ej: #elemento-a-arrastrar',
            required: true,
            description: 'Selector que identifica el elemento que se debe arrastrar.',
        },
        {
            name: 'targetSelector',
            label: 'Selector de Destino (Soltar)',
            type: 'text',
            placeholder: 'Ej: #zona-de-soltar',
            required: true,
            description: 'Selector que identifica el elemento donde se debe soltar el origen.',
        },
        {
            name: 'steps',
            label: 'Pasos Intermedios',
            type: 'number',
            placeholder: 'Ej: 20',
            defaultValue: 10,
            min: 1,
            description: 'Número de pasos intermedios para simular el movimiento del arrastre.',
        },
        {
            name: 'force',
            label: 'Forzar Arrastre',
            type: 'checkbox',
            defaultValue: false,
            description: 'Si está activo, fuerza el inicio y fin del arrastre.',
        },
    ],

    upload_file: [
        {
            name: 'selector',
            label: 'Selector del Input File',
            type: 'text',
            placeholder: 'Ej: #input-archivo o input[type="file"]',
            required: true,
            description: 'Selector que identifica el elemento <input type="file">.',
        },
        {
            name: 'files',
            label: 'Rutas de Archivos a Subir',
            type: 'text',
            placeholder: 'Ej: /ruta/a/archivo1.pdf, /ruta/a/archivo2.jpg',
            required: true,
            description: 'Una o más rutas de archivos a subir. Separar múltiples rutas con comas.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description: 'Tiempo máximo para esperar que el input file sea interactuable.',
        },
    ],

    // --- SYNCHRONIZATION ---
    wait_conditional: [
        {
            name: 'conditionScript',
            label: 'Script de Condición (JavaScript)',
            type: 'textarea',
            placeholder:
                'Ej: return document.querySelector("#status").textContent === "Completado";',
            required: true,
            description:
                'Código JavaScript que se ejecuta repetidamente. Debe devolver true cuando la condición se cumpla.',
        },
        {
            name: 'polling',
            label: 'Intervalo de Evaluación (ms)',
            type: 'number',
            placeholder: 'Ej: 250',
            defaultValue: 100,
            min: 1,
            description:
                'Intervalo de tiempo en milisegundos con el que se evaluará el script de condición.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description: 'Tiempo máximo total que el test esperará a que el script devuelva true.',
        },
        {
            name: 'args',
            label: 'Argumentos para el Script',
            type: 'text',
            placeholder: 'Ej: "#miSelector", "valorBuscado" (Separar por comas)',
            required: false,
            description: 'Argumentos que se pasarán al script para mayor reusabilidad.',
        },
    ],

    wait_visible: [
        {
            name: 'selector',
            label: 'Selector del Elemento',
            type: 'text',
            placeholder: 'Ej: #boton-continuar o [data-status="cargado"]',
            required: true,
            description:
                'Selector que identifica el elemento que se debe esperar a que sea visible.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo en milisegundos que se esperará a que el elemento se vuelva visible.',
        },
        {
            name: 'scrollIntoView',
            label: 'Desplazar a la Vista',
            type: 'checkbox',
            defaultValue: true,
            description:
                'Si está activo, el framework intentará desplazar la página hasta el elemento antes de verificar su visibilidad.',
        },
    ],

    wait_navigation: [
        {
            name: 'url',
            label: 'URL de Destino Específica',
            type: 'text',
            placeholder: 'Ej: https://example.com/login',
            required: false,
            description:
                'La URL completa o un patrón de la URL a la que se espera que navegue la página.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 60000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo en milisegundos que se esperará a que se complete la navegación.',
        },
        {
            name: 'waitUntil',
            label: 'Condición de Fin de Navegación',
            type: 'select',
            options: [
                { value: 'load', label: 'Load (Página completamente cargada)' },
                { value: 'domcontentloaded', label: 'DOMContentLoaded (DOM listo)' },
                { value: 'networkidle', label: 'NetworkIdle (Sin solicitudes de red pendientes)' },
            ],
            defaultValue: 'load',
            required: true,
            description:
                'El evento que Playwright usará para determinar que la navegación ha finalizado.',
        },
    ],

    wait_network: [
        {
            name: 'idleTime',
            label: 'Tiempo Mínimo de Inactividad (ms)',
            type: 'number',
            placeholder: 'Ej: 1000',
            defaultValue: 500,
            min: 0,
            description:
                'El periodo de tiempo mínimo que la red debe estar completamente inactiva para considerarla estabilizada.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 45000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo total que el test esperará a que se cumpla la condición de inactividad de la red.',
        },
        {
            name: 'includeResources',
            label: 'Incluir Solicitudes de Recursos',
            type: 'checkbox',
            defaultValue: true,
            description:
                'Si está activo, considera todas las solicitudes (imágenes, CSS, JS) al determinar la inactividad.',
        },
    ],

    // --- DIAGNOSTICS ---
    take_screenshot: [
        {
            name: 'selector',
            label: 'Selector de Elemento Específico',
            type: 'text',
            placeholder: 'Ej: #id-de-la-caja o .panel-principal',
            required: false,
            description:
                'Selector del elemento a capturar. Si está vacío, se captura toda la página.',
        },
        {
            name: 'path',
            label: 'Ruta de Guardado del Archivo',
            type: 'text',
            placeholder: 'Ej: screenshots/error_01.png',
            required: false,
            description: 'Ruta completa del archivo donde se guardará la imagen.',
        },
        {
            name: 'fullPage',
            label: 'Página Completa',
            type: 'checkbox',
            defaultValue: false,
            description:
                'Si está activo, captura todo el contenido de la página. Solo aplicable si NO se especifica un selector.',
        },
        {
            name: 'format',
            label: 'Formato de Imagen',
            type: 'select',
            options: [
                { value: 'png', label: 'PNG (Sin pérdida, Predeterminado)' },
                { value: 'jpeg', label: 'JPEG (Comprimido)' },
            ],
            defaultValue: 'png',
            required: true,
            description: 'Define el formato de archivo de la imagen de salida.',
        },
        {
            name: 'quality',
            label: 'Calidad JPEG (1-100)',
            type: 'number',
            placeholder: 'Ej: 80',
            defaultValue: 100,
            min: 1,
            max: 100,
            description: 'Calidad de compresión, solo aplicable cuando el formato es JPEG.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo para esperar que la página o el elemento estén listos para ser capturados.',
        },
    ],

    save_dom: [
        {
            name: 'selector',
            label: 'Selector de Elemento Específico',
            type: 'text',
            placeholder: 'Ej: #formulario-completo o [data-testid="cuerpo-mensaje"]',
            required: false,
            description:
                'Selector de un elemento. Si está vacío, se guarda todo el HTML de la página (page.content()).',
        },
        {
            name: 'path',
            label: 'Ruta de Guardado del Archivo',
            type: 'text',
            placeholder: 'Ej: dom_captura_error.html',
            required: false,
            description: 'Ruta completa del archivo donde se guardará el contenido HTML.',
        },
        {
            name: 'variableName',
            label: 'Guardar en Variable (Si no hay Ruta)',
            type: 'text',
            placeholder: 'Ej: html_resultado',
            required: false,
            description:
                'El nombre de la variable del framework donde se guardará el contenido HTML si no se proporciona una ruta de archivo.',
        },
        {
            name: 'timeout',
            label: 'Tiempo de Espera Máximo (ms)',
            type: 'number',
            placeholder: 'Ej: 15000',
            defaultValue: 30000,
            min: 1,
            description:
                'Tiempo máximo para esperar que el contenido HTML del elemento (o página) se obtenga.',
        },
    ],

    log_errors: [
        {
            name: 'logToFile',
            label: 'Registrar Errores a Archivo',
            type: 'checkbox',
            defaultValue: false,
            description:
                'Si está activo, los errores de la página y fallos de red capturados se guardarán en un archivo.',
        },
        {
            name: 'filePath',
            label: 'Ruta del Archivo de Logs',
            type: 'text',
            placeholder: 'Ej: logs/errores_pagina.txt',
            required: false,
            description: 'Ruta completa del archivo donde se registrarán los mensajes de error.',
        },
        {
            name: 'timeout',
            label: 'Duración de Escucha (ms)',
            type: 'number',
            placeholder: 'Ej: 60000',
            defaultValue: 0,
            min: 0,
            description:
                'Tiempo en milisegundos que el listener de errores permanecerá activo. 0 es indefinidamente.',
        },
    ],

    listen_events: [
        {
            name: 'eventType',
            label: 'Tipo de Evento a Escuchar',
            type: 'select',
            options: [
                { value: 'click', label: 'DOM: Click (en selector)' },
                { value: 'input', label: 'DOM: Input (cambio de valor de campo)' },
                { value: 'change', label: 'DOM: Change (cambio de valor finalizado)' },
                { value: 'submit', label: 'DOM: Submit (envío de formulario)' },
                { value: 'request', label: 'Red: Solicitud (Request global)' },
                { value: 'response', label: 'Red: Respuesta (Response global)' },
                { value: 'custom', label: 'Otros (Eventos de página como console, dialog, etc.)' },
            ],
            required: true,
            description: 'Define el evento que el framework debe registrar.',
        },
        {
            name: 'selector',
            label: 'Selector de Elemento (Solo DOM)',
            type: 'text',
            placeholder: 'Ej: #mi-boton o input[name="data"]',
            required: false,
            description:
                'Selector del elemento específico para escuchar. Si se usa un evento de Red, se ignora.',
        },
        {
            name: 'logToFile',
            label: 'Registrar Eventos a Archivo',
            type: 'checkbox',
            defaultValue: false,
            description:
                'Si está activo, los detalles de cada evento capturado se escribirán en un archivo.',
        },
        {
            name: 'filePath',
            label: 'Ruta del Archivo de Logs',
            type: 'text',
            placeholder: 'Ej: logs/eventos_capturados.txt',
            required: false,
            description: 'Ruta completa del archivo donde se registrarán los eventos.',
        },
        {
            name: 'timeout',
            label: 'Duración de Escucha (ms)',
            type: 'number',
            placeholder: 'Ej: 60000',
            defaultValue: 0,
            min: 0,
            description:
                'Tiempo máximo que el listener permanecerá activo. 0 significa indefinidamente.',
        },
    ],

    // --- NETWORK CONTROL ---
    intercept_request: [
        {
            name: 'urlPattern',
            label: 'Patrón de URL a Interceptar',
            type: 'text',
            placeholder: 'Ej: **/api/data/* o https://miapi.com/v1/user',
            required: true,
            description:
                'El patrón de URL (puede usar wildcard * o RegEx) para filtrar qué solicitudes se deben interceptar.',
        },
        {
            name: 'method',
            label: 'Método HTTP',
            type: 'select',
            options: [
                { value: '', label: 'Cualquiera (Por defecto)' },
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'OPTIONS', label: 'OPTIONS' },
            ],
            defaultValue: '',
            required: false,
            description: 'Filtra las solicitudes por un método HTTP específico.',
        },
        {
            name: 'action',
            label: 'Acción a Realizar',
            type: 'select',
            options: [
                { value: 'mock', label: 'Simular Respuesta (Mock)' },
                { value: 'abort', label: 'Bloquear Solicitud (Abort)' },
                { value: 'continue', label: 'Continuar Solicitud (Sin modificar)' },
            ],
            defaultValue: 'continue',
            required: true,
            description: 'Define la acción a realizar sobre la solicitud interceptada.',
        },
        {
            name: 'responseMock',
            label: 'Cuerpo de Respuesta Mock (JSON/Texto)',
            type: 'textarea',
            placeholder: 'Ej: { "status": "ok", "data": [] }',
            required: false,
            description:
                'El cuerpo de la respuesta simulada que se devolverá al navegador. Solo se usa si la acción es "Mock".',
        },
        {
            name: 'timeout',
            label: 'Duración de Interceptación (ms)',
            type: 'number',
            placeholder: 'Ej: 60000',
            defaultValue: 0,
            min: 0,
            description:
                'Tiempo máximo que la regla de interceptación permanecerá activa. 0 significa indefinidamente.',
        },
    ],

    mock_response: [
        {
            name: 'urlPattern',
            label: 'Patrón de URL a Interceptar',
            type: 'text',
            placeholder: 'Ej: **/api/productos o https://miapi.com/user/*',
            required: true,
            description:
                'El patrón de URL para filtrar qué solicitudes se deben interceptar para mocking.',
        },
        {
            name: 'method',
            label: 'Método HTTP',
            type: 'select',
            options: [
                { value: '', label: 'Cualquiera (Por defecto)' },
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'OPTIONS', label: 'OPTIONS' },
            ],
            defaultValue: '',
            required: false,
            description: 'Filtra las solicitudes por un método HTTP específico.',
        },
        {
            name: 'responseBody',
            label: 'Cuerpo de Respuesta (JSON/Texto)',
            type: 'textarea',
            placeholder: 'Ej: { "id": 1, "name": "Mock Product" }',
            required: true,
            description: 'El cuerpo de la respuesta simulada que se devolverá al navegador.',
        },
        {
            name: 'status',
            label: 'Código de Estado HTTP',
            type: 'number',
            placeholder: 'Ej: 404 (Not Found)',
            defaultValue: 200,
            min: 100,
            max: 599,
            description: 'El código de estado HTTP que se devolverá en la respuesta mock.',
        },
        {
            name: 'headers',
            label: 'Cabeceras HTTP Adicionales (JSON)',
            type: 'textarea',
            placeholder: 'Ej: { "Cache-Control": "no-cache" }',
            defaultValue: '{}',
            required: false,
            description:
                'Cabeceras HTTP adicionales que se añadirán a la respuesta simulada (debe ser JSON válido).',
        },
    ],

    block_resource: [], // Pendiente de implementación de campos
    modify_headers: [], // Pendiente de implementación de campos

    // --- DOM MANIPULATION ---
    find_element: [], // Pendiente de implementación de campos
    get_set_content: [], // Pendiente de implementación de campos
    wait_for_element: [], // Pendiente de implementación de campos
    execute_js: [], // Pendiente de implementación de campos

    // --- SESSION MANAGEMENT ---
    manage_cookies: [], // Pendiente de implementación de campos
    manage_storage: [], // Pendiente de implementación de campos
    inject_tokens: [], // Pendiente de implementación de campos
    persist_session: [], // Pendiente de implementación de campos

    // --- TEST EXECUTION ---
    create_context: [], // Pendiente de implementación de campos
    cleanup_state: [], // Pendiente de implementación de campos
    handle_hooks: [], // Pendiente de implementación de campos
    control_exceptions: [], // Pendiente de implementación de campos

    // --- FILE/DATA ---
    read_data: [], // Pendiente de implementación de campos
    save_results: [], // Pendiente de implementación de campos
    handle_downloads: [], // Pendiente de implementación de campos

    // --- LLM/AI ---
    call_llm: [], // Pendiente de implementación de campos
    generate_data: [], // Pendiente de implementación de campos
    validate_semantic: [], // Pendiente de implementación de campos

    // --- EXECUTION INTERFACE ---
    run_tests: [], // Pendiente de implementación de campos
    cli_params: [], // Pendiente de implementación de campos
    return_code: [], // Pendiente de implementación de campos
    integrate_ci: [], // Pendiente de implementación de campos
};

// 3. Mock de Datos de Proyecto Guardado
const mockProjectData = {
    projectId: 'PRJ-42',
    projectName: 'Flujo de Login y Compra',
    description:
        'Simulación de usuario navegando, iniciando sesión y agregando un producto al carrito.',
    nodes: [
        {
            id: 'n1',
            type: 'launch_browser',
            data: { browser: 'chromium', headless: true },
            position: { x: 50, y: 50 },
        },
        {
            id: 'n2',
            type: 'open_url',
            data: { url: 'https://ejemplo.com/login', timeout: 45000 },
            position: { x: 50, y: 150 },
        },
        {
            id: 'n3',
            type: 'type_text',
            data: { selector: '#username', text: 'testuser' },
            position: { x: 250, y: 150 },
        },
        {
            id: 'n4',
            type: 'click',
            data: { selector: 'button[type="submit"]' },
            position: { x: 250, y: 250 },
        },
    ],
    edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
    ],
};

// --- 4. LÓGICA DE NEGOCIO (RUTAS API) ---

// Montar el router de API bajo el prefijo '/api'
app.use('/api', apiRouter);

// Ruta de prueba para el middleware de validación (POST /api/actions/open_url)
app.post(
    '/api/actions/open_url',
    // 1. Middleware de Validación (usando Joi)
    validate({
        body: openUrlBodySchema,
    }),

    // 2. Controlador de la Ruta
    (req, res) => {
        const { url, timeout } = req.body;

        console.log(`✅ Ejecutando Open URL en: ${url} con timeout: ${timeout}ms`);

        res.status(200).json({
            success: true,
            message: 'Validación exitosa y esquemas separados correctamente.',
            data: req.body,
        });
    },
);

// 1. API: Obtener la estructura de categorías y nodos
app.get('/api/nodes/categories', (req, res) => {
    console.log('📂 API: Devolviendo categorías de nodos MCP.');
    res.json(mockCategories);
});

// 2. API: Obtener el esquema (parámetros) para una o todas las operaciones
app.get('/api/nodes/operations', (req, res) => {
    const operationName = req.query.op;

    if (operationName) {
        console.log(`📋 API: Devolviendo esquema para la operación: ${operationName}`);
        const schema = allNodeFieldConfigs[operationName];

        if (schema) {
            return res.json({ [operationName]: schema });
        } else {
            return res.status(404).json({
                error: `Operación '${operationName}' no encontrada.`,
            });
        }
    }

    console.log('📋 API: Devolviendo todos los esquemas de operaciones.');
    res.json(allNodeFieldConfigs);
});

// 3. API: Cargar datos de un proyecto (Mock)
app.get('/api/project/load', (req, res) => {
    const projectId = req.query.id;

    if (projectId === mockProjectData.projectId) {
        console.log(`📦 API: Devolviendo datos de proyecto: ${projectId}`);
        return res.json(mockProjectData);
    }

    console.log(`❌ API: Proyecto ID ${projectId} no encontrado.`);
    res.status(404).json({ error: 'Proyecto no encontrado' });
});

// 4. API: Simulación de recepción de flujo para Guardar/Ejecutar
app.post('/api/data', (req, res) => {
    const receivedData = req.body;
    console.log(
        `📥 API: Recibida solicitud POST en /api/data. Tamaño: ${JSON.stringify(receivedData).length} bytes`,
    );

    if (!receivedData || Object.keys(receivedData).length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'No se recibieron datos en el cuerpo de la solicitud.',
            data: receivedData,
        });
    }

    res.json({
        status: 'success',
        message: 'Flujo de trabajo o datos recibidos y procesados correctamente (Mock).',
        received_timestamp: new Date().toISOString(),
        data_keys_received: Object.keys(receivedData),
    });
});

// 5. API: Verificar estado del servidor
app.get('/api/status', (req, res) => {
    console.log('🔍 API: Solicitud de estado recibida.');
    res.json({
        status: 'ok',
        message: 'HaltTest API is up and running 🚀',
        version: '1.0.0-MCP',
        timestamp: new Date().toISOString(),
    });
});

// ====================================================================
// --- MIDDLEWARE DE MANEJO DE ERRORES GLOBAL ---
// Captura errores pasados por next(err) y los formatea correctamente.
// ====================================================================
app.use((err, req, res) => {
    // Para errores de validación (Joi), el status code ya estará adjunto (400)
    const statusCode = err.status || 500;

    // Ocultar detalles sensibles en producción
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        console.error('❌ Error no manejado (producción):', err);
        return res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor. Intente de nuevo más tarde.',
        });
    }

    // Respuesta detallada para desarrollo (o para errores de cliente 4xx)
    console.error('❌ Error no manejado:', err);
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Error interno del servidor',
        // Si el error tiene detalles (ej. de Joi), los incluimos.
        ...(err.details && { details: err.details }),
        // Mostrar el stack trace solo en desarrollo para 500
        ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack }),
    });
});

// --- MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Ruta no encontrada: ${req.method} ${req.path}`,
    });
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`\n🚀 ================================`);
    console.log(`   HaltTest Backend Server`);
    console.log(`   Corriendo en: http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`================================\n`);
});

// 5.2. Manejador de Errores Centralizado
app.use(errorHandler);

// Exportar la instancia de la aplicación para testing
export default app;
