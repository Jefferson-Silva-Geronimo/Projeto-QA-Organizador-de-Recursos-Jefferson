import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (Fase 6, 6.D): o navegador fala com o front e a API reais, subidos por `compose.e2e.yaml`, sem mocks.
 * As credenciais e as URLs vêm de variáveis de ambiente (nada de segredo no repositório). Ver docs/testes/e2e/README.md.
 * Um trabalhador só: os testes compartilham o banco descartável e cada um usa dias próprios para não se atrapalhar.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: './e2e/semente.ts',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.E2E_FRONT_URL ?? 'http://localhost:4173',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Trace em todos os testes: o relatório e os traces vão como artifact da CI, passando ou falhando.
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
