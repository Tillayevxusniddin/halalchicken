import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Product, Category, Supplier } from "@/lib/types"
import { ProductGrid, ProductFilters } from "@/components/products"
import { getProducts, getCategories, getSuppliers } from "@/lib/api"

export function Products() {
  const { language, user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<number>()
  const [selectedSupplier, setSelectedSupplier] = useState<number>()
  const [searchQuery, setSearchQuery] = useState("")

  // Redirect admins to admin panel
  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
      navigate("/admin")
    }
  }, [user, navigate])

  // Fetch categories and suppliers on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesData, suppliersData] = await Promise.all([
          getCategories({}),
          getSuppliers({}),
        ])

        setCategories(categoriesData.results || categoriesData)
        setSuppliers(suppliersData.results || suppliersData)
      } catch (error) {
        console.error("Failed to fetch filters:", error)
      }
    }

    fetchFilters()
  }, [])

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params: any = {}
        if (selectedCategory) params.category = selectedCategory
        if (selectedSupplier) params.supplier = selectedSupplier
        if (searchQuery) params.search = searchQuery

        const data = await getProducts(params)
        setProducts(data.results || data)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, selectedSupplier, searchQuery])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("products", language)}</h1>
        <p className="text-muted-foreground">
          {t("halalChickenDesc", language)}
        </p>
      </div>

      <ProductFilters
        categories={categories}
        suppliers={suppliers}
        selectedCategory={selectedCategory}
        selectedSupplier={selectedSupplier}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategory}
        onSupplierChange={setSelectedSupplier}
        onSearchChange={setSearchQuery}
      />

      <div className="mt-8">
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  )
}
