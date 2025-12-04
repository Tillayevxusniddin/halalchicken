import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '@/lib/context'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { createOrder, telegramTemplate } from '@/lib/api'

export function Cart() {
  const { language, user } = useAuth()
  const { cart, updateQuantity, removeFromCart, fetchCart, itemCount, isLoading } = useCart()
  const { push: toast } = useToast()
  const navigate = useNavigate()
  const [contactInfo, setContactInfo] = useState<{ text: string; orderNumber: string } | null>(null)

  useEffect(() => {
    // Redirect admins away from cart page
    if (user && user.role !== "CUSTOMER") {
      navigate("/admin")
      return
    }
    fetchCart()
  }, [fetchCart, user, navigate])

  const shareOnTelegram = (text: string) => {
    const encoded = encodeURIComponent(text)
    window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank')
  }

  const handleContactClick = () => {
    if (contactInfo) {
      shareOnTelegram(contactInfo.text)
    }
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return

    try {
      // Create order
      const order = await createOrder()
      await fetchCart()

      // Get telegram message template
      const { text, order_number } = await telegramTemplate(order.id)
      setContactInfo({ text, orderNumber: order_number })
      shareOnTelegram(text)
      console.info('Order placed:', order_number)
      
      toast({ message: t('orderPlacedSuccess', language) || 'Order placed successfully!', type: 'success' })
      navigate('/orders')
    } catch (error) {
      console.error('Checkout failed:', error)
      toast({ message: t('checkoutFailed', language) || 'Failed to place order', type: 'error' })
    }
  }

  const formatWeight = (value: number) => Number(value || 0).toFixed(2)

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('cartEmpty', language)}</h1>
            <p className="text-muted-foreground">
              {t('continueShopping', language)}
            </p>
          </div>
          <Button onClick={() => navigate('/products')} size="lg">
            {t('browseProducts', language)}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('shoppingCart', language)}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=150&h=150&fit=crop'}
                      alt={language === 'uz' ? item.product.name_uz : item.product.name_ru}
                      className="h-24 w-24 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=150&h=150&fit=crop'
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {language === 'uz' ? item.product.name_uz : item.product.name_ru}
                    </h3>
                    {item.product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.product.description}
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            Number(Math.max(0.1, item.quantity - 0.1).toFixed(2))
                          )
                        }
                        disabled={item.quantity <= 0.1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {formatWeight(item.quantity)} {t('kg', language)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            Number((item.quantity + 0.1).toFixed(2))
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('orderSummary', language)}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('totalWeight', language)}</span>
                    <span className="font-medium">
                      {itemCount.toFixed(2)} {t('kg', language)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('noPricesShown', language)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={!user}
              >
                {t('placeOrder', language)}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  {t('pleaseLogin', language)}
                </p>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium">{t('contactMessageIntro', language)}</p>
                {contactInfo ? (
                  <>
                    <p className="text-xs">
                      {t('orderNumber', language)}: {contactInfo.orderNumber}
                    </p>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleContactClick}
                      disabled={!user}
                    >
                      {t('contactViaTelegram', language)}
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('placeOrderToContact', language)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
