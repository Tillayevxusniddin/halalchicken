import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Product, Category, Supplier } from "@/lib/types"
import { ProductGrid, ProductFilters } from "@/components/products"

export function Products() {
  const { language } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<number>()
  const [selectedSupplier, setSelectedSupplier] = useState<number>()
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch categories and suppliers on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_ORIGIN}/api/categories/`),
          fetch(`${import.meta.env.VITE_API_ORIGIN}/api/suppliers/`),
        ])
        
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.results || data)
        }
        
        if (suppliersRes.ok) {
          const data = await suppliersRes.json()
          setSuppliers(data.results || data)
        }
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
        const params = new URLSearchParams()
        if (selectedCategory) params.append("category", selectedCategory.toString())
        if (selectedSupplier) params.append("supplier", selectedSupplier.toString())
        if (searchQuery) params.append("search", searchQuery)

        const response = await fetch(
          `${import.meta.env.VITE_API_ORIGIN}/api/products/?${params.toString()}`
        )

        if (response.ok) {
          const data = await response.json()
          setProducts(data.results || data)
        }
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
