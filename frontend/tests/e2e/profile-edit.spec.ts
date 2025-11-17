import { test, expect } from '@playwright/test'

test('profile edit saves', async ({ page }) => {
  const API = process.env.E2E_API_ORIGIN || 'http://localhost:8000'
  const username = `user${Date.now()}@e2e.test`
  const password = 'Passw0rd!'
  await page.request.post(`${API}/api/auth/register/`, {
    data: { username, password },
  })
  const tok = await (
    await page.request.post(`${API}/api/auth/login/`, {
      data: { username, password },
    })
  ).json()
  await page.goto('/')
  await page.evaluate((t) => {
    // @ts-expect-error
    window.__setToken?.(t)
  }, tok.access)
  await page.getByRole('link', { name: 'Profile' }).click()
  const address = page.getByPlaceholder('Address')
  await address.fill('Somewhere 123')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(address).toHaveValue('Somewhere 123')
})
