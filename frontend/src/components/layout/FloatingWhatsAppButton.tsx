import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingWhatsAppButton() {
  const whatsappNumber = "998901234567" // Replace with actual WhatsApp number
  const message = "Assalomu alaykum! Mahsulotlaringiz haqida ma'lumot olmoqchiman."

  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-green-500 hover:bg-green-600"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </Button>
  )
}
