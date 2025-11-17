import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Order } from "../types"
import { getCustomerOrders, reorderOrder } from "../api"
import { useAuth } from "./AuthContext"

interface OrdersContextValue {
  orders: Order[]
  isLoading: boolean
  refreshOrders: () => Promise<void>
  reorder: (orderId: number) => Promise<void>
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined)

function normalizeOrders(data: unknown): Order[] {
  if (!data) {
    return []
  }
  if (Array.isArray(data)) {
    return data as Order[]
  }
  if (typeof data === "object" && "results" in data && Array.isArray((data as { results: Order[] }).results)) {
    return (data as { results: Order[] }).results
  }
  return []
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!user || user.role !== "CUSTOMER") {
      setOrders([])
      return
    }
    setIsLoading(true)
    try {
      const data = await getCustomerOrders()
      setOrders(normalizeOrders(data))
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const reorder = useCallback(
    async (orderId: number) => {
      await reorderOrder(orderId)
      await fetchOrders()
    },
    [fetchOrders]
  )

  return (
    <OrdersContext.Provider
      value={{
        orders,
        isLoading,
        refreshOrders: fetchOrders,
        reorder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider")
  }
  return context
}

