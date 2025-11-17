import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/context'
import { t } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShoppingCart, Package, Users as UsersIcon, MoreVertical, Download, Upload, FileSpreadsheet, Send } from 'lucide-react'
import type { Order, OrderStatus, User } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { adminTelegramContact } from '@/lib/api'

interface AdminStats {
  today_orders: number
  new_orders: number
  total_products: number
  total_customers: number
}

interface AsyncJob {
  id: string
  type: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  result_url?: string
  error?: string
}

interface AdminOrder extends Omit<Order, 'user'> {
  user: {
    id: number
    username: string
    fio: string | null
    phone: string | null
    email: string | null
    user_type: 'INDIVIDUAL' | 'LEGAL'
    company_name: string | null
  }
}

export function Admin() {
  const { language, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'excel'>('orders')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [exportJob, setExportJob] = useState<AsyncJob | null>(null)
  const [importJob, setImportJob] = useState<AsyncJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleChangeLoading, setRoleChangeLoading] = useState<Record<string, boolean>>({})
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)
  const [roleChangeSuccess, setRoleChangeSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/')
      return
    }

    fetchAdminData()
  }, [user, navigate])

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch statistics
      const statsResponse = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/summary/`, { headers })
      if (statsResponse.ok) {
        setStats(await statsResponse.json())
      }

      // Fetch orders - handle paginated response
      const ordersResponse = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/orders/`, { headers })
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        // Check if response is paginated (has 'results' key) or direct array
        setOrders((Array.isArray(ordersData) ? ordersData : (ordersData.results || [])) as AdminOrder[])
      }

      // Fetch users (if SUPERADMIN) - handle paginated response
      if (user?.role === 'SUPERADMIN') {
        const usersResponse = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/users/`, { headers })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          // Check if response is paginated (has 'results' key) or direct array
          setUsers(Array.isArray(usersData) ? usersData : (usersData.results || []))
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/orders/${orderId}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchAdminData()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleChangeLoading(prev => ({ ...prev, [userId]: true }))
    setRoleChangeError(null)
    setRoleChangeSuccess(null)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/users/${userId}/role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        const data = await response.json()
        setRoleChangeSuccess(data.message || t('roleChangedSuccess', language))
        await fetchAdminData()
        // Clear success message after 3 seconds
        setTimeout(() => setRoleChangeSuccess(null), 3000)
      } else {
        const error = await response.json()
        setRoleChangeError(error.detail || t('roleChangeFailed', language))
        // Clear error message after 5 seconds
        setTimeout(() => setRoleChangeError(null), 5000)
      }
    } catch (error) {
      console.error('Failed to change role:', error)
      setRoleChangeError(t('roleChangeFailed', language))
      setTimeout(() => setRoleChangeError(null), 5000)
    } finally {
      setRoleChangeLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleExportOrders = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/export/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const job = await response.json()
        const jobId = job.job_id || job.id
        const normalizedJob = { ...job, id: jobId }
        setExportJob(normalizedJob)
        if (jobId) {
          pollJobStatus(jobId, setExportJob)
        }
      }
    } catch (error) {
      console.error('Failed to export orders:', error)
    }
  }

  const handleImportProducts = async (file: File) => {
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/import/products/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const job = await response.json()
        const jobId = job.job_id || job.id
        const normalizedJob = { ...job, id: jobId }
        setImportJob(normalizedJob)
        if (jobId) {
          pollJobStatus(jobId, setImportJob)
        }
      }
    } catch (error) {
      console.error('Failed to import products:', error)
    }
  }

  const pollJobStatus = async (jobId: string, setJob: (job: AsyncJob) => void) => {
    const token = localStorage.getItem('access_token')
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/jobs/${jobId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const job = await response.json()
          setJob(job)
          if (job.status === 'SUCCESS' || job.status === 'FAILED') {
            clearInterval(interval)
          }
        }
      } catch (error) {
        clearInterval(interval)
      }
    }, 2000)
  }

const statusColors: Record<OrderStatus, string> = {
  Received: 'bg-blue-100 text-blue-800 border-blue-200',
  Confirmed: 'bg-purple-100 text-purple-800 border-purple-200',
  Shipped: 'bg-green-100 text-green-800 border-green-200',
}

  const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  Received: ['Confirmed'],
  Confirmed: ['Shipped'],
  Shipped: [],
}
  const statusTimeline: OrderStatus[] = ['Received', 'Confirmed', 'Shipped']

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders
    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])
  const availableRoles = ['CUSTOMER', 'ADMIN', 'SUPERADMIN']
  const importColumns = ['name_uz', 'name_ru', 'category', 'supplier', 'image_url', 'description', 'status']

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${import.meta.env.VITE_API_ORIGIN}/api/admin/import/products/template/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) {
        throw new Error('Failed to download template')
      }
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'product_import_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download template:', error)
    }
  }

  const handleContactCustomer = async (orderId: number) => {
    try {
      const contactInfo = await adminTelegramContact(orderId)
      // Open Telegram link in new tab
      window.open(contactInfo.telegram_link, '_blank')
    } catch (error) {
      console.error('Failed to get Telegram contact info:', error)
    }
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return null
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">{t('loading', language)}</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">{t('adminDashboard', language)}</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('todayOrders', language)}</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('newOrders', language)}</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('totalProducts', language)}</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t('totalCustomers', language)}</CardTitle>
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_customers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('allOrders', language)}
        </button>
        {user.role === 'SUPERADMIN' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('userManagement', language)}
          </button>
        )}
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'excel'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Excel
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('allOrders', language)}</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                {t('allStatuses', language)}
              </Button>
              {statusTimeline.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {t(status, language)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t('noOrders', language)}</div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div>
                      <div className="font-medium">
                        {t('orderNumber', language)}: {order.order_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('customer', language)}: {order.user?.fio || order.user?.username || `User #${order.user?.id}`}
                        {order.user?.phone && ` • ${order.user.phone}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactCustomer(order.id)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {t('contactCustomer', language)}
                      </Button>
                      <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                        {t(order.status, language)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusTransitions[order.status]?.length ? (
                            statusTransitions[order.status].map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(order.id, status)}
                              >
                                {t(status, language)}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>{t(order.status, language)}</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                    <div className="text-sm space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusTimeline.map((step) => {
                          const currentIndex = statusTimeline.indexOf(order.status)
                          const stepIndex = statusTimeline.indexOf(step)
                          const reached = stepIndex <= currentIndex
                          return (
                            <div
                              key={step}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                reached ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {t(step, language)}
                            </div>
                          )
                        })}
                      </div>
                    <div className="mb-2 font-medium">{t('items', language)}:</div>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          {language === 'uz' ? item.product.name_uz : item.product.name_ru} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && user.role === 'SUPERADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('allUsers', language)}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Success/Error Messages */}
            {roleChangeSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                {roleChangeSuccess}
              </div>
            )}
            {roleChangeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {roleChangeError}
              </div>
            )}

            {users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">{t('loading', language)}</div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="p-4 border rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {u.fio} • {u.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t(u.role, language)}</Badge>
                        {u.id !== user.id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={roleChangeLoading[u.id]}
                              >
                                {roleChangeLoading[u.id] ? (
                                  <span className="text-xs">{t('loading', language)}...</span>
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {availableRoles.map((role) => (
                                <DropdownMenuItem 
                                  key={role} 
                                  onClick={() => handleRoleChange(u.id, role)}
                                  disabled={u.role === role || roleChangeLoading[u.id]}
                                  className={u.role === role ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {u.role === role ? '✓ ' : ''}{t(role, language)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('currentUser', language)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Excel Tab */}
      {activeTab === 'excel' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {t('exportOrders', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleExportOrders} disabled={exportJob?.status === 'RUNNING'} className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {exportJob?.status === 'RUNNING' ? t('exporting', language) : t('exportOrders', language)}
                </Button>

                {exportJob && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('status', language)}:</span>
                      <Badge
                        variant={
                          exportJob.status === 'SUCCESS'
                            ? 'default'
                            : exportJob.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {t(`job${exportJob.status.charAt(0) + exportJob.status.slice(1).toLowerCase()}`, language)}
                      </Badge>
                    </div>
                    {exportJob.status === 'SUCCESS' && exportJob.result_url && (
                      <a
                        href={exportJob.result_url}
                        download
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        {t('download', language)}
                      </a>
                    )}
                    {exportJob.status === 'FAILED' && (
                      <div className="text-sm text-destructive">{exportJob.error}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('importProducts', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadTemplate', language)}
                </Button>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportProducts(file)
                  }}
                  disabled={importJob?.status === 'RUNNING'}
                />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('importInstructions', language)}</p>
                  <ul className="text-xs list-disc list-inside">
                    {importColumns.map((col) => (
                      <li key={col}>
                        <code>{col}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs">{t('importMaxSize', language)}</p>
                </div>

                {importJob && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('status', language)}:</span>
                      <Badge
                        variant={
                          importJob.status === 'SUCCESS'
                            ? 'default'
                            : importJob.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {t(`job${importJob.status.charAt(0) + importJob.status.slice(1).toLowerCase()}`, language)}
                      </Badge>
                    </div>
                    {importJob.status === 'FAILED' && (
                      <div className="text-sm text-destructive">{importJob.error}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
