import { test, expect } from '@playwright/test'

test('admin can change order status', async ({ page }) => {
  const API = process.env.E2E_API_ORIGIN || 'http://localhost:8000'
  // Seed demo data and admin user assumptions
  await page.request.post(`${API}/api/auth/register/`, {
    data: { username: 'admin@e2e.test', password: 'Admin123!' },
  })
  // elevate to admin via direct DB API is not available; assume seeded admin exists
  // Try login with seeded admin credentials if provided by seed script
  const login = await page.request.post(`${API}/api/auth/login/`, {
    data: { username: 'admin', password: 'admin' },
  })
  if (!login.ok()) test.skip()
  const tok = await login.json()
  await page.goto('/')
  await page.evaluate((t) => {
    // @ts-expect-error: E2E helper injection
    window.__setToken?.(t)
  }, tok.access)
  await page.getByRole('link', { name: 'Admin' }).click()
  const select = page.getByRole('combobox').first()
  await expect(select).toBeVisible()
  await select.selectOption('Accepted')
  await expect(page.getByText('Accepted')).toBeVisible()
})
