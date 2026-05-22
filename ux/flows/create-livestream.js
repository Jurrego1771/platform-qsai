export const createLivestreamFlow = {
  name: 'create-livestream',
  description: 'Crear nuevo live stream: desde lista hasta formulario con datos, sin persistir',
  steps: [
    {
      name: 'livestream-list',
      path: '/live',
      screenshot: true,
      axe: true,
      description: 'Lista de live streams — revisar estado de streams activos y CTAs',
    },
    {
      name: 'click-create',
      description: 'Click en botón de crear nuevo stream',
      action: async (page) => {
        const btn = page.getByRole('button', { name: /crear|new|create|agregar|add/i }).first();
        await btn.waitFor({ timeout: 5_000 });
        await btn.click();
        await page.waitForTimeout(800);
      },
    },
    {
      name: 'create-form-empty',
      screenshot: true,
      axe: true,
      description: 'Formulario de creación vacío — evaluar campos técnicos y tooltips (bitrate, codec, CDN)',
    },
    {
      name: 'fill-name',
      description: 'Llenar nombre del stream',
      action: async (page) => {
        const nameInput = page.getByRole('textbox', { name: /nombre|name|título|title/i }).first();
        await nameInput.waitFor({ timeout: 5_000 }).catch(() => null);
        await nameInput.fill('[QA-E2E] Test Live Stream UX Audit');
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'create-form-filled',
      screenshot: true,
      description: 'Formulario con nombre — evaluar densidad de campos técnicos y terminología',
    },
    {
      name: 'cancel',
      description: 'Cancelar sin crear — no persistir datos de prueba',
      action: async (page) => {
        const cancel = page.getByRole('button', { name: /cancelar|cancel|cerrar|close|volver|back/i }).first();
        const exists = await cancel.isVisible().catch(() => false);
        if (exists) {
          await cancel.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      },
    },
  ],
};
