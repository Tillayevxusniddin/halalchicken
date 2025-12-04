import { useLocation } from 'react-router-dom'

export default function Success() {
  const loc = useLocation() as any
  const telegramLink = loc?.state?.telegramLink as string | undefined
  const order = loc?.state?.order
  return (
    <div>
      <h1 className="text-2xl font-semibold">Order placed</h1>
  {order && <p className="mt-2" data-testid="order-number">Order: {order.order_number}</p>}
      <p className="mt-2">Contact us via Telegram to finalize details.</p>
      {telegramLink && (
        <a className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded" href={telegramLink} target="_blank">Contact via Telegram</a>
      )}
    </div>
  )
}
