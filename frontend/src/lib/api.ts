import axios, { AxiosRequestHeaders } from 'axios'
import { getAccessToken } from './token-storage'

const defaultOrigin =
  typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
const configuredOrigin = (import.meta.env.VITE_API_ORIGIN || '').trim().replace(/\/+$/, '')
const apiOrigin = configuredOrigin || defaultOrigin

export const api = axios.create({
  baseURL: apiOrigin ? `${apiOrigin}/api` : '/api',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    const headers = (config.headers ??= {} as AxiosRequestHeaders)
    headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type Health = { status: 'ok' }

export async function getHealth(): Promise<Health> {
  const { data } = await api.get<Health>('/healthz/')
  return data
}

export async function register(payload: Record<string, unknown>) {
  const { data } = await api.post('/auth/register/', payload)
  return data
}

export async function login(username: string, password: string) {
  const { data } = await api.post('/auth/login/', { username, password })
  return data as { access: string; refresh: string }
}

export async function me() {
  const { data } = await api.get('/auth/me/')
  return data
}

export async function updateMe(payload: Record<string, unknown>) {
  const { data } = await api.put('/auth/me/', payload)
  return data
}

export async function getCart() {
  const { data } = await api.get('/cart/')
  return data as {
    id: number
    items: Array<{ id: number; product: any; quantity: number }>
  }
}

export async function addCartItem(product_id: number, quantity: number) {
  const { data } = await api.post('/cart/items/', { product_id, quantity })
  return data
}

export async function removeCartItem(product_id: number) {
  const { data } = await api.delete(`/cart/items/${product_id}`)
  return data
}

export async function createOrder() {
  const { data } = await api.post('/orders/')
  return data as { id: number; order_number: string }
}

export async function getCustomerOrders(params?: { page?: number }) {
  const { data } = await api.get('/orders/', { params })
  return data
}

export async function reorderOrder(id: number) {
  const { data } = await api.post(`/orders/${id}/reorder/`)
  return data as {
    id: number
    items: Array<{ product: any; quantity: number }>
  }
}

export async function telegramTemplate(orderId: number) {
  const { data } = await api.get('/telegram/message-template/', {
    params: { orderId },
  })
  return data as { text: string; order_number: string }
}

// Admin APIs
export async function adminSummary() {
  const { data } = await api.get('/admin/summary/')
  return data as {
    today_orders: number
    new_orders: number
    total_products: number
    total_customers: number
  }
}

export async function listOrders(params?: {
  status?: string
  user?: number
  date_from?: string
  date_to?: string
}) {
  const { data } = await api.get('/admin/orders/', { params })
  return data
}

export async function setOrderStatus(id: number, status: string) {
  const { data } = await api.post(`/orders/${id}/status/`, { status })
  return data
}

export async function exportOrders(filters: {
  status?: string
  user_id?: number
  date_from?: string
  date_to?: string
}) {
  const { data } = await api.post('/admin/export/orders/', filters)
  return data as { job_id: string; status: string }
}

export async function importProducts(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/admin/import/products/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as { job_id: string; status: string }
}

export async function getJob(jobId: string) {
  const { data } = await api.get(`/admin/jobs/${jobId}/`)
  return data as {
    id: string
    status: string
    result_url?: string
    error?: string
  }
}

export async function adminTelegramContact(orderId: number) {
  const { data } = await api.get(`/admin/orders/${orderId}/telegram-contact/`)
  return data as {
    customer_name: string
    customer_phone: string | null
    order_number: string
    message_text: string
    telegram_link: string
  }
}
