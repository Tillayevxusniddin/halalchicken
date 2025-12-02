import { useMemo, useState, type ChangeEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function Signup() {
  const { language, signup } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fio: "",
    phone: "",
    address: "",
    company_name: "",
    responsible_person: "",
    legal_address: "",
    inn: "",
    bank_details: "",
    user_type: "INDIVIDUAL" as "INDIVIDUAL" | "LEGAL",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const isLegal = formData.user_type === "LEGAL"

  // Validation patterns
  const INN_PATTERN = /^[0-9A-Za-z-]{6,64}$/
  const PHONE_PATTERN = /^\+?[0-9]{9,15}$/

  const legalFields = useMemo<Array<{ id: keyof typeof formData; label: string }>>(
    () => [
      { id: "company_name", label: t("companyName", language) || "Company Name" },
      { id: "responsible_person", label: t("responsiblePerson", language) || "Responsible Person" },
      { id: "legal_address", label: t("legalAddress", language) || "Legal Address" },
      { id: "inn", label: t("inn", language) || "INN" },
      { id: "bank_details", label: t("bankDetails", language) || "Bank Details" },
    ],
    [language]
  )

  const handleFieldChange =
    (field: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear field error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }))
      }
    }

  const validateField = (field: keyof typeof formData, value: string): string => {
    if (field === "inn" && isLegal && value) {
      if (!INN_PATTERN.test(value)) {
        return t("invalidInnFormat", language) || "Invalid INN format. Must be 6-64 alphanumeric characters or hyphens."
      }
    }
    if (field === "phone" && value) {
      if (!PHONE_PATTERN.test(value)) {
        return t("invalidPhoneFormat", language) || "Invalid phone format. Must be 9-15 digits, optionally starting with +."
      }
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setFieldErrors({})

    try {
      // Validate fields
      const errors: Record<string, string> = {}

      const phoneError = validateField("phone", formData.phone)
      if (phoneError) errors.phone = phoneError

      if (isLegal) {
        const innError = validateField("inn", formData.inn)
        if (innError) errors.inn = innError
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      type SignupPayload = Parameters<typeof signup>[0]
      const emailValue = formData.email.trim()
      const payload: SignupPayload = {
        username: formData.username.trim(),
        password: formData.password,
        user_type: formData.user_type,
        fio: formData.fio.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      }

      if (emailValue) {
        payload.email = emailValue
      }

      if (isLegal) {
        if (!emailValue) {
          setError(t("email", language) + " " + (t("isRequired", language) || "is required"))
          setLoading(false)
          return
        }
        payload.email = emailValue
        payload.company_name = formData.company_name.trim()
        payload.responsible_person = formData.responsible_person.trim()
        payload.legal_address = formData.legal_address.trim()
        payload.inn = formData.inn.trim()
        payload.bank_details = formData.bank_details.trim()
      }

      await signup(payload)
      navigate("/")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("signup", language)}</CardTitle>
          <CardDescription>
            {t("alreadyHaveAccount", language)} <Link to="/login" className="text-primary hover:underline">{t("login", language)}</Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("userType", language) || "User Type"}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.user_type === "INDIVIDUAL" ? "default" : "outline"}
                  onClick={() => setFormData((prev) => ({ ...prev, user_type: "INDIVIDUAL" }))}
                >
                  {t("individual", language) || "Individual"}
                </Button>
                <Button
                  type="button"
                  variant={formData.user_type === "LEGAL" ? "default" : "outline"}
                  onClick={() => setFormData((prev) => ({ ...prev, user_type: "LEGAL" }))}
                >
                  {t("legalEntity", language) || "Legal Entity"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleFieldChange("username")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email", language)}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleFieldChange("email")}
                required={isLegal}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password", language)}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleFieldChange("password")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fio">{t("name", language)}</Label>
              <Input
                id="fio"
                value={formData.fio}
                onChange={handleFieldChange("fio")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone", language)}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleFieldChange("phone")}
                required
                className={fieldErrors.phone ? "border-destructive" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("address", language)}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleFieldChange("address")}
                required
              />
            </div>
            {isLegal && (
              <div className="space-y-4">
                {legalFields.map((field) => (
                  <div className="space-y-2" key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      value={formData[field.id] as string}
                      onChange={handleFieldChange(field.id)}
                      required
                      className={fieldErrors[field.id] ? "border-destructive" : ""}
                    />
                    {fieldErrors[field.id] && (
                      <p className="text-xs text-destructive">{fieldErrors[field.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("loading", language) : t("signup", language)}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
