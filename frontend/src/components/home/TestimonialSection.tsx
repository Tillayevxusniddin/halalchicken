import { Star, Quote } from "lucide-react"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    name_uz: "Aziz Rahimov",
    name_ru: "Азиз Рахимов",
    role_uz: "Restoran egasi",
    role_ru: "Владелец ресторана",
    text_uz: "Halal Chicken bilan ishlash juda qulay. Sifatli mahsulotlar va tez yetkazib berish. 5 yildan beri doim ishonchli hamkor!",
    text_ru: "Работать с Halal Chicken очень удобно. Качественные продукты и быстрая доставка. Уже 5 лет надежный партнер!",
    rating: 5,
  },
  {
    name_uz: "Malika Karimova",
    name_ru: "Малика Каримова",
    role_uz: "Kafe boshqaruvchisi",
    role_ru: "Управляющая кафе",
    text_uz: "Eng yaxshi narxlar va professional xizmat. Mijozlarimiz mahsulot sifatini juda yuqori baholaydi. Rahmat!",
    text_ru: "Лучшие цены и профессиональный сервис. Наши клиенты высоко оценивают качество продукции. Спасибо!",
    rating: 5,
  },
  {
    name_uz: "Sardor Yusupov",
    name_ru: "Сардор Юсупов",
    role_uz: "Oshxona ta'minotchisi",
    role_ru: "Поставщик для столовых",
    text_uz: "Katta hajmli buyurtmalarni tez va sifatli bajaradilar. Halol sertifikatlari va hujjatlar doim tartiblashgan. Tavsiya qilaman!",
    text_ru: "Большие объемы выполняют быстро и качественно. Халяльные сертификаты и документы всегда в порядке. Рекомендую!",
    rating: 5,
  },
]

export function TestimonialSection() {
  const { language } = useAuth()

  return (
    <section className="w-full py-20">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("whatCustomersSay", language)}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("fromAll", language)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="absolute -top-2 -right-2 opacity-10">
                  <Quote className="h-24 w-24 text-primary" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-muted-foreground mb-6 relative z-10">
                  "{language === "uz" ? testimonial.text_uz : testimonial.text_ru}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {(language === "uz" ? testimonial.name_uz : testimonial.name_ru)[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {language === "uz" ? testimonial.name_uz : testimonial.name_ru}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "uz" ? testimonial.role_uz : testimonial.role_ru}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
