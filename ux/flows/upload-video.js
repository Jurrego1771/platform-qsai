export const uploadVideoFlow = {
  name: 'upload-video',
  description: 'Crear nuevo video VOD: desde lista hasta formulario completo, sin persistir datos',
  steps: [
    {
      name: 'media-list',
      path: '/media',
      screenshot: true,
      axe: true,
      description: 'Lista de videos — punto de entrada al módulo',
    },
    {
      name: 'click-create',
      description: 'Click en botón de crear/subir nuevo video',
      action: async (page) => {
        const btn = page.getByRole('button', { name: /crear|new|upload|subir|agregar|add/i }).first();
        await btn.waitFor({ timeout: 5_000 });
        await btn.click();
        await page.waitForTimeout(800);
      },
    },
    {
      name: 'upload-form-empty',
      screenshot: true,
      axe: true,
      description: 'Formulario de upload vacío — evaluar claridad y campos requeridos',
    },
    {
      name: 'fill-title',
      description: 'Llenar título del video',
      action: async (page) => {
        const titleInput = page.getByRole('textbox', { name: /título|title|nombre|name/i }).first();
        await titleInput.waitFor({ timeout: 5_000 }).catch(() => null);
        await titleInput.fill('[QA-E2E] Test Video UX Audit');
        await page.waitForTimeout(400);
      },
    },
    {
      name: 'upload-form-filled',
      screenshot: true,
      description: 'Formulario con título — evaluar validación y estado del CTA',
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
