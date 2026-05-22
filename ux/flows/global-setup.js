import 'dotenv/config';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const baseURL = process.env.BASE_URL || 'https://dev.platform.mediastre.am';
  const email = process.env.CMS_USER;
  const password = process.env.CMS_PASSWORD;

  if (!email || !password) {
    throw new Error('CMS_USER and CMS_PASSWORD must be set in .env');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password|contraseña/i }).fill(password);
  await page.getByRole('button', { name: /login|iniciar|entrar/i }).click();

  await page.waitForURL(/\/(media|dashboard|cms|\?|#)/, { timeout: 30_000 }).catch(async () => {
    // Fallback: wait for navigation away from /login
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20_000 });
  });

  // Navigate to /media to trigger JWT injection into localStorage
  await page.goto(`${baseURL}/media`, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null);
  await page.waitForTimeout(1000);

  const authDir = '.auth';
  fs.mkdirSync(authDir, { recursive: true });
  await page.context().storageState({ path: path.join(authDir, 'user.json') });

  await browser.close();
  console.log('✅ Auth setup complete — session saved to .auth/user.json');
}
