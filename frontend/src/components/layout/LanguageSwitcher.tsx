import { Globe } from "lucide-react"
import { useAuth } from "@/lib/context"
import { Language } from "@/lib/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const { language, setLanguage } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("uz" as Language)}
          className={language === "uz" ? "bg-accent" : ""}
        >
          O'zbekcha
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("ru" as Language)}
          className={language === "ru" ? "bg-accent" : ""}
        >
          Русский
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
