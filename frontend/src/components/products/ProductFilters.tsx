import { Search } from "lucide-react"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { Category, Supplier } from "@/lib/types"

interface ProductFiltersProps {
  categories: Category[]
  suppliers: Supplier[]
  selectedCategory?: number
  selectedSupplier?: number
  searchQuery: string
  onCategoryChange: (categoryId?: number) => void
  onSupplierChange: (supplierId?: number) => void
  onSearchChange: (query: string) => void
}

export function ProductFilters({
  categories,
  suppliers,
  selectedCategory,
  selectedSupplier,
  searchQuery,
  onCategoryChange,
  onSupplierChange,
  onSearchChange,
}: ProductFiltersProps) {
  const { language } = useAuth()

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchProducts", language)}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedCategory || ""}
          onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">{t("allCategories", language)}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {language === "uz" ? category.name_uz : category.name_ru}
            </option>
          ))}
        </select>

        {/* Supplier Filter */}
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={selectedSupplier || ""}
          onChange={(e) => onSupplierChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">{t("allSuppliers", language)}</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
