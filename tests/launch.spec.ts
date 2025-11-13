// tests/launch.spec.ts
import { test } from '@playwright/test';
import { readFileSync } from 'fs';
import { chromium, firefox, webkit } from 'playwright';

const cfgPath = new URL('./config.json', import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8')) as {
    browserType?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    slowMo?: number;
    args?: string[];
};

const browsers = { chromium, firefox, webkit };

test('launch browser only', async () => {
    const browserType = cfg.browserType ?? 'chromium';
    const launcher = browsers[browserType] ?? chromium;

    const browser = await launcher.launch({
        headless: cfg.headless ?? false,
        slowMo: cfg.slowMo ?? 0,
        args: cfg.args ?? []
    });

    // Crea un contexto y una página vacía (sin navegar)
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`✅ ${browserType} lanzado correctamente (sin navegar)`);

    // Espera unos segundos para ver el navegador (opcional)
    await page.waitForTimeout(3000);

    await browser.close();
    console.log('✅ Navegador cerrado.');
});
