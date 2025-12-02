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
import { ShoppingCart, Package, Users as UsersIcon, MoreVertical, Download, Upload, FileSpreadsheet, Send, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type { Order, OrderStatus, User, Product, Category, Supplier } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import {
  adminSummary,
  listOrders,
  setOrderStatus,
  exportOrders,
  importProducts,
  getJob,
  adminTelegramContact,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getUsers,
  updateUserRole,
  downloadTemplate,
} from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

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
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'suppliers' | 'users' | 'excel'>('orders')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [exportJob, setExportJob] = useState<AsyncJob | null>(null)
  const [importJob, setImportJob] = useState<AsyncJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleChangeLoading, setRoleChangeLoading] = useState<Record<string, boolean>>({})
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)
  const [roleChangeSuccess, setRoleChangeSuccess] = useState<string | null>(null)

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Form states
  const [productForm, setProductForm] = useState<Partial<Product>>({})
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({})
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({})

  // Search/filter states
  const [productSearch, setProductSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [productsPage, setProductsPage] = useState(1)
  const [productsTotal, setProductsTotal] = useState(0)
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [categoriesTotal, setCategoriesTotal] = useState(0)
  const [suppliersPage, setSuppliersPage] = useState(1)
  const [suppliersTotal, setSuppliersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/')
      return
    }

    fetchAdminData()
  }, [user, navigate])

  const fetchOrders = async (page = 1) => {
    try {
      const params: any = { page }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      const data = await listOrders(params)
      setOrders(data.results || [])
      setOrdersTotal(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const fetchProducts = async (page = 1) => {
    try {
      const params: any = { page }
      if (productSearch) params.search = productSearch

      const data = await getProducts(params)
      setProducts(data.results || [])
      setProductsTotal(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchCategories = async (page = 1) => {
    try {
      const params: any = { page }
      if (categorySearch) params.search = categorySearch

      const data = await getCategories(params)
      setCategories(data.results || [])
      setCategoriesTotal(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchSuppliers = async (page = 1) => {
    try {
      const params: any = { page }
      if (supplierSearch) params.search = supplierSearch

      const data = await getSuppliers(params)
      setSuppliers(data.results || [])
      setSuppliersTotal(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchUsers = async (page = 1) => {
    try {
      const data = await getUsers({ page })
      setUsers(data.results || [])
      setUsersTotal(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchAdminData = async () => {
    try {
      // Fetch statistics
      const statsData = await adminSummary()
      setStats(statsData)

      await Promise.all([
        fetchOrders(ordersPage),
        fetchProducts(productsPage),
        fetchCategories(categoriesPage),
        fetchSuppliers(suppliersPage),
      ])

      if (user?.role === 'SUPERADMIN') {
        await fetchUsers(usersPage)
      }

    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await setOrderStatus(orderId, newStatus)
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    // @ts-ignore
    setRoleChangeLoading(prev => ({ ...prev, [userId]: true }))
    setRoleChangeError(null)
    setRoleChangeSuccess(null)

    try {
      const data = await updateUserRole(userId, newRole)
      // @ts-ignore
      setRoleChangeSuccess(data.message || t('roleChangedSuccess', language))
      await fetchAdminData()
      setTimeout(() => setRoleChangeSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to change role:', error)
      setRoleChangeError(error.response?.data?.detail || t('roleChangeFailed', language))
      setTimeout(() => setRoleChangeError(null), 5000)
    } finally {
      // @ts-ignore
      setRoleChangeLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleExportOrders = async () => {
    try {
      const job = await exportOrders({})
      const jobId = job.job_id || (job as any).id
      const normalizedJob = { ...job, id: jobId }
      setExportJob(normalizedJob)
      if (jobId) {
        pollJobStatus(jobId, setExportJob)
      }
    } catch (error) {
      console.error('Failed to export orders:', error)
    }
  }

  const handleImportProducts = async (file: File) => {
    try {
      const job = await importProducts(file)
      const jobId = job.job_id || (job as any).id
      const normalizedJob = { ...job, id: jobId }
      setImportJob(normalizedJob)
      if (jobId) {
        pollJobStatus(jobId, setImportJob)
      }
    } catch (error) {
      console.error('Failed to import products:', error)
    }
  }

  const pollJobStatus = async (jobId: string, setJob: (job: AsyncJob) => void) => {
    const interval = setInterval(async () => {
      try {
        const job = await getJob(jobId)
        setJob(job as AsyncJob)
        if (job.status === 'SUCCESS' || job.status === 'FAILED') {
          clearInterval(interval)
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

  const filteredOrders = orders
  const availableRoles = ['CUSTOMER', 'ADMIN', 'SUPERADMIN']
  const importColumns = ['name_uz', 'name_ru', 'category', 'supplier', 'image_url', 'description', 'status']

  // Refetch when filters change
  useEffect(() => {
    setOrdersPage(1)
    fetchOrders(1)
  }, [statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setProductsPage(1)
      fetchProducts(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [productSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoriesPage(1)
      fetchCategories(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [categorySearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuppliersPage(1)
      fetchSuppliers(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate()
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

  // CRUD handlers for Products
  const handleCreateProduct = async () => {
    try {
      const formData = new FormData()

      formData.append('category_id', String(productForm.category))
      formData.append('supplier_id', String(productForm.supplier))
      formData.append('description', productForm.description || '')
      formData.append('status', String(productForm.status ?? true))

      if (productImageFile) {
        formData.append('image_file', productImageFile)
      }

      await createProduct(formData)
      setProductDialogOpen(false)
      fetchProducts(productsPage)
      setProductForm({})
      setProductImageFile(null)
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      const formData = new FormData()

      formData.append('category_id', String(productForm.category))
      formData.append('supplier_id', String(productForm.supplier))
      formData.append('description', productForm.description || '')
      formData.append('status', String(productForm.status ?? true))

      if (productImageFile) {
        formData.append('image_file', productImageFile)
      }

      await updateProduct(editingProduct.id, formData)
      setProductDialogOpen(false)
      setEditingProduct(null)
      fetchProducts(productsPage)
      setProductForm({})
      setProductImageFile(null)
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        category: product.category,
        supplier: product.supplier,
        description: product.description,
        status: product.status,
      })
      setProductImageFile(null)
    } else {
      setEditingProduct(null)
      setProductForm({
        category: categories[0]?.id || 0,
        supplier: suppliers[0]?.id || 0,
        description: '',
        status: true,
      })
      setProductImageFile(null)
    }
    setProductDialogOpen(true)
  }

  const handleSubmitProduct = async () => {
    if (!productForm.category || !productForm.supplier) {
      alert(t('pleaseFillRequired', language) || 'Please fill all required fields')
      return
    }
    try {
      if (editingProduct) {
        await handleUpdateProduct()
      } else {
        await handleCreateProduct()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id)
      await fetchProducts(productsPage)
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  // CRUD handlers for Categories
  const handleCreateCategory = async (data: Partial<Category>) => {
    try {
      await createCategory(data)
      await fetchCategories(categoriesPage)
      setCategoryDialogOpen(false)
      setCategoryForm({})
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  const handleUpdateCategory = async (id: number, data: Partial<Category>) => {
    try {
      await updateCategory(id, data)
      await fetchCategories(categoriesPage)
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({})
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name_uz: category.name_uz,
        name_ru: category.name_ru,
        order: category.order,
        status: category.status,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name_uz: '',
        name_ru: '',
        order: 0,
        status: true,
      })
    }
    setCategoryDialogOpen(true)
  }

  const handleSubmitCategory = async () => {
    if (!categoryForm.name_uz || !categoryForm.name_ru) {
      alert(t('pleaseFillRequired', language) || 'Please fill all required fields')
      return
    }
    try {
      if (editingCategory) {
        await handleUpdateCategory(editingCategory.id, categoryForm)
      } else {
        await handleCreateCategory(categoryForm)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id)
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  // CRUD handlers for Suppliers
  const handleCreateSupplier = async (data: Partial<Supplier>) => {
    try {
      await createSupplier(data)
      await fetchAdminData()
      setSupplierDialogOpen(false)
      setSupplierForm({})
    } catch (error) {
      console.error('Failed to create supplier:', error)
      throw error
    }
  }

  const handleUpdateSupplier = async (id: number, data: Partial<Supplier>) => {
    try {
      await updateSupplier(id, data)
      await fetchAdminData()
      setSupplierDialogOpen(false)
      setEditingSupplier(null)
      setSupplierForm({})
    } catch (error) {
      console.error('Failed to update supplier:', error)
      throw error
    }
  }

  const handleOpenSupplierDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setSupplierForm({
        name: supplier.name,
        phone: supplier.phone || '',
        address: supplier.address || '',
        status: supplier.status,
      })
    } else {
      setEditingSupplier(null)
      setSupplierForm({
        name: '',
        phone: '',
        address: '',
        status: true,
      })
    }
    setSupplierDialogOpen(true)
  }

  const handleSubmitSupplier = async () => {
    if (!supplierForm.name) {
      alert(t('pleaseFillRequired', language) || 'Please fill all required fields')
      return
    }
    try {
      if (editingSupplier) {
        await handleUpdateSupplier(editingSupplier.id, supplierForm)
      } else {
        await handleCreateSupplier(supplierForm)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  // Filtered lists
  // Filtered lists - now just direct data since we filter on server
  const filteredProducts = products

  const filteredCategories = categories

  const filteredSuppliers = suppliers

  const handleDeleteSupplier = async (id: number) => {
    try {
      await deleteSupplier(id)
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      alert('Failed to delete supplier')
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
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('allOrders', language)}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'products'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('products', language)}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('categories', language)}
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'suppliers'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('suppliers', language)}
        </button>
        {user.role === 'SUPERADMIN' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {t('userManagement', language)}
          </button>
        )}
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'excel'
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
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${reached ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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
            <PaginationControls
              currentPage={ordersPage}
              totalPages={Math.ceil(ordersTotal / PAGE_SIZE)}
              onPageChange={(page) => {
                setOrdersPage(page)
                fetchOrders(page)
              }}
              hasNext={ordersPage < Math.ceil(ordersTotal / PAGE_SIZE)}
              hasPrevious={ordersPage > 1}
            />
          </CardContent>
        </Card>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('products', language)}</CardTitle>
                <Button onClick={() => handleOpenProductDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add', language)} {t('products', language)}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder={t('searchProducts', language)}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('loading', language)}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {productSearch ? t('noProducts', language) : (language === 'uz' ? 'Siz hali mahsulot yaratmadingiz' : 'You have not created a product yet')}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const categoryName = categories.find(c => c.id === product.category)
                    const supplierName = suppliers.find(s => s.id === product.supplier)
                    return (
                      <div key={product.id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{categoryName ? (language === 'uz' ? categoryName.name_uz : categoryName.name_ru) : 'Unknown Category'}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('supplier', language)}: {supplierName ? supplierName.name : product.supplier}
                          </div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground mt-1">{product.description}</div>
                          )}
                          <Badge variant={product.status ? 'default' : 'secondary'} className="mt-2">
                            {product.status ? t('inStock', language) : t('outOfStock', language)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenProductDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            const message = t('confirmDelete', language) || 'Are you sure you want to delete this item?'
                            if (confirm(message)) {
                              handleDeleteProduct(product.id)
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <PaginationControls
                currentPage={productsPage}
                totalPages={Math.ceil(productsTotal / PAGE_SIZE)}
                onPageChange={(page) => {
                  setProductsPage(page)
                  fetchProducts(page)
                }}
                hasNext={productsPage < Math.ceil(productsTotal / PAGE_SIZE)}
                hasPrevious={productsPage > 1}
              />
            </CardContent>
          </Card>

          {/* Product Dialog */}
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? t('edit', language) : t('add', language)} {t('products', language)}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? t('editProductDesc', language) || 'Edit product information' : t('addProductDesc', language) || 'Add a new product to the catalog'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category', language)} *</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={productForm.category || ''}
                      onChange={(e) => setProductForm({ ...productForm, category: Number(e.target.value) })}
                      required
                    >
                      <option value="">{t('selectCategory', language) || 'Select category'}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {language === 'uz' ? cat.name_uz : cat.name_ru}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">{t('supplier', language)} *</Label>
                    <select
                      id="supplier"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={productForm.supplier || ''}
                      onChange={(e) => setProductForm({ ...productForm, supplier: Number(e.target.value) })}
                      required
                    >
                      <option value="">{t('selectSupplier', language) || 'Select supplier'}</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_file">{t('imageFile', language) || 'Product Image'}</Label>
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setProductImageFile(file)
                    }}
                  />
                  {editingProduct && editingProduct.image_url && !productImageFile && (
                    <div className="text-xs text-muted-foreground">
                      {t('currentImage', language)}: <a href={editingProduct.image_url} target="_blank" rel="noreferrer" className="underline">{t('view', language)}</a>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description', language)}</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="status"
                    checked={productForm.status ?? true}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="status" className="cursor-pointer">{t('status', language)}: {productForm.status ? t('active', language) : t('inactive', language)}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                  {t('cancel', language)}
                </Button>
                <Button onClick={handleSubmitProduct}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('save', language)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('categories', language)}</CardTitle>
                <Button onClick={() => handleOpenCategoryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add', language)} {t('categories', language)}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder={t('search', language) + '...'}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {categorySearch ? t('noResults', language) || 'No results found' : t('loading', language)}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{language === 'uz' ? category.name_uz : category.name_ru}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {t('order', language) || 'Order'}: {category.order}
                        </div>
                        <Badge variant={category.status ? 'default' : 'secondary'} className="mt-2">
                          {category.status ? t('active', language) : t('inactive', language)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenCategoryDialog(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const message = t('confirmDelete', language) || 'Are you sure you want to delete this item?'
                          if (confirm(message)) {
                            handleDeleteCategory(category.id)
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationControls
                currentPage={categoriesPage}
                totalPages={Math.ceil(categoriesTotal / PAGE_SIZE)}
                onPageChange={(page) => {
                  setCategoriesPage(page)
                  fetchCategories(page)
                }}
                hasNext={categoriesPage < Math.ceil(categoriesTotal / PAGE_SIZE)}
                hasPrevious={categoriesPage > 1}
              />
            </CardContent>
          </Card>

          {/* Category Dialog */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? t('edit', language) : t('add', language)} {t('categories', language)}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? t('editCategoryDesc', language) || 'Edit category information' : t('addCategoryDesc', language) || 'Add a new category'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat_name_uz">{t('nameUz', language) || 'Name (Uzbek)'} *</Label>
                    <Input
                      id="cat_name_uz"
                      value={categoryForm.name_uz || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name_uz: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat_name_ru">{t('nameRu', language) || 'Name (Russian)'} *</Label>
                    <Input
                      id="cat_name_ru"
                      value={categoryForm.name_ru || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name_ru: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat_order">{t('order', language) || 'Order'}</Label>
                  <Input
                    id="cat_order"
                    type="number"
                    value={categoryForm.order || 0}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cat_status"
                    checked={categoryForm.status ?? true}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="cat_status" className="cursor-pointer">{t('status', language)}: {categoryForm.status ? t('active', language) : t('inactive', language)}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                  {t('cancel', language)}
                </Button>
                <Button onClick={handleSubmitCategory}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('save', language)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('suppliers', language)}</CardTitle>
                <Button onClick={() => handleOpenSupplierDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add', language)} {t('suppliers', language)}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder={t('search', language) + '...'}
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {filteredSuppliers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {supplierSearch ? t('noResults', language) || 'No results found' : t('loading', language)}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.phone && (
                          <div className="text-sm text-muted-foreground">{t('phone', language)}: {supplier.phone}</div>
                        )}
                        {supplier.address && (
                          <div className="text-sm text-muted-foreground">{t('address_field', language)}: {supplier.address}</div>
                        )}
                        <Badge variant={supplier.status ? 'default' : 'secondary'} className="mt-2">
                          {supplier.status ? t('active', language) : t('inactive', language)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenSupplierDialog(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const message = t('confirmDelete', language) || 'Are you sure you want to delete this item?'
                          if (confirm(message)) {
                            handleDeleteSupplier(supplier.id)
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationControls
                currentPage={suppliersPage}
                totalPages={Math.ceil(suppliersTotal / PAGE_SIZE)}
                onPageChange={(page) => {
                  setSuppliersPage(page)
                  fetchSuppliers(page)
                }}
                hasNext={suppliersPage < Math.ceil(suppliersTotal / PAGE_SIZE)}
                hasPrevious={suppliersPage > 1}
              />
            </CardContent>
          </Card>

          {/* Supplier Dialog */}
          <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? t('edit', language) : t('add', language)} {t('suppliers', language)}</DialogTitle>
                <DialogDescription>
                  {editingSupplier ? t('editSupplierDesc', language) || 'Edit supplier information' : t('addSupplierDesc', language) || 'Add a new supplier'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sup_name">{t('name', language)} *</Label>
                  <Input
                    id="sup_name"
                    value={supplierForm.name || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup_phone">{t('phone', language)}</Label>
                  <Input
                    id="sup_phone"
                    type="tel"
                    value={supplierForm.phone || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup_address">{t('address_field', language)}</Label>
                  <Input
                    id="sup_address"
                    value={supplierForm.address || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sup_status"
                    checked={supplierForm.status ?? true}
                    onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="sup_status" className="cursor-pointer">{t('status', language)}: {supplierForm.status ? t('active', language) : t('inactive', language)}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSupplierDialogOpen(false)}>
                  {t('cancel', language)}
                </Button>
                <Button onClick={handleSubmitSupplier}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('save', language)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
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
            <PaginationControls
              currentPage={usersPage}
              totalPages={Math.ceil(usersTotal / PAGE_SIZE)}
              onPageChange={(page) => {
                setUsersPage(page)
                fetchUsers(page)
              }}
              hasNext={usersPage < Math.ceil(usersTotal / PAGE_SIZE)}
              hasPrevious={usersPage > 1}
            />
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
