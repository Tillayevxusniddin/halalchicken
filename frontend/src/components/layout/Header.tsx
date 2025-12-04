import { Link } from "react-router-dom"
import { ShoppingCart, User, Menu, LogOut, Sun, Moon } from "lucide-react"
import { useAuth } from "@/lib/context"
import { useCart } from "@/lib/context"
import { useTheme } from "@/lib/context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "./LanguageSwitcher"

export function Header() {
  const { user, language, logout } = useAuth()
  const { itemCount } = useCart()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">HalalChicken</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="items-center hidden space-x-6 md:flex">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav_home", language)}
          </Link>
          {/* Products only visible for customers and unauthenticated users, not admins */}
          {(!user || user.role === "CUSTOMER") && (
            <Link to="/products" className="text-sm font-medium transition-colors hover:text-primary">
              {t("nav_products", language)}
            </Link>
          )}
          {/* Cart only visible for customers, not admins */}
          {(!user || user.role === "CUSTOMER") && (
            <Link to="/cart" className="text-sm font-medium transition-colors hover:text-primary">
              {t("nav_cart", language)}
            </Link>
          )}
          {/* Orders only visible for customers */}
          {user && user.role === "CUSTOMER" && (
            <Link to="/orders" className="text-sm font-medium transition-colors hover:text-primary">
              {t("nav_orders", language)}
            </Link>
          )}
          {/* Admin link only for admins */}
          {user?.role === "ADMIN" || user?.role === "SUPERADMIN" ? (
            <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
              {t("nav_admin", language)}
            </Link>
          ) : null}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          
          {/* Theme Toggle - Always visible */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Cart Button - Only show for customers, not admins */}
          {(!user || user.role === "CUSTOMER") && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute flex items-center justify-center w-5 h-5 text-xs rounded-full -top-1 -right-1 bg-primary text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.fio}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    {t("profile", language)}
                  </Link>
                </DropdownMenuItem>
                {/* Orders only for customers */}
                {user.role === "CUSTOMER" && (
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      {t("nav_orders", language)}
                    </Link>
                  </DropdownMenuItem>
                )}
                {/* Admin panel only for admins */}
                {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      {t("nav_admin", language)}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("logout", language)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost">{t("login", language)}</Button>
              </Link>
              <Link to="/signup">
                <Button>{t("signup", language)}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  {t("nav_home", language)}
                </Link>
              </DropdownMenuItem>
              {/* Products only for customers and unauthenticated users */}
              {(!user || user.role === "CUSTOMER") && (
                <DropdownMenuItem asChild>
                  <Link to="/products" className="cursor-pointer">
                    {t("nav_products", language)}
                  </Link>
                </DropdownMenuItem>
              )}
              {/* Cart only for customers */}
              {(!user || user.role === "CUSTOMER") && (
                <DropdownMenuItem asChild>
                  <Link to="/cart" className="cursor-pointer">
                    {t("nav_cart", language)}
                  </Link>
                </DropdownMenuItem>
              )}
              {/* Orders only for customers */}
              {user && user.role === "CUSTOMER" && (
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="cursor-pointer">
                    {t("nav_orders", language)}
                  </Link>
                </DropdownMenuItem>
              )}
              {/* Admin panel only for admins */}
              {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    {t("nav_admin", language)}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
