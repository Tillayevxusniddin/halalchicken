import { ShoppingCart } from "lucide-react"
import { useAuth, useCart } from "@/lib/context"
import { Product } from "@/lib/types"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { language } = useAuth()
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState("1.00")

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      const parsed = parseFloat(quantity)
      const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
      await addToCart(product, normalized)
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const productName = language === "uz" ? product.name_uz : product.name_ru

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop"}
          alt={productName}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {!product.status && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            {t("outOfStock", language)}
          </Badge>
        )}
        {product.status && (
          <Badge className="absolute top-2 right-2">
            {t("inStock", language)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {productName}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="space-y-1 w-full">
          <label className="text-xs text-muted-foreground">
            {t("quantity", language)} ({t("kg", language)})
          </label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!product.status}
          />
        </div>
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={!product.status || isAdding}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isAdding ? t("loading", language) : t("addToCart", language)}
        </Button>
      </CardFooter>
    </Card>
  )
}
