import { Shield, Truck, Users } from "lucide-react"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Shield,
    titleKey: "halalCertified",
    descriptionKey: "halalDescription",
  },
  {
    icon: Truck,
    titleKey: "directFarm",
    descriptionKey: "directDescription",
  },
  {
    icon: Users,
    titleKey: "trustedPartners",
    descriptionKey: "trustedDescription",
  },
]

export function TrustSection() {
  const { language } = useAuth()

  return (
    <section className="w-full py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("whyChoose", language)}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("trustedDescription", language)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {t(feature.titleKey, language)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(feature.descriptionKey, language)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
