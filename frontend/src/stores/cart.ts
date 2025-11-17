import { create } from 'zustand'

type CartItem = { productId: string; name: string; quantity: number }

type CartState = {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCart = create<CartState>((set) => ({
  items: [],
  add: (item) => set((s) => {
    const existing = s.items.find((i) => i.productId === item.productId)
    if (existing) {
      return {
        items: s.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      }
    }
    return { items: [...s.items, item] }
  }),
  remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  clear: () => set({ items: [] }),
}))
