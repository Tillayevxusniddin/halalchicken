import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/context'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User as UserIcon } from 'lucide-react'
import { updateMe } from '@/lib/api'

export function Profile() {
  const { language, user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fio: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    setFormData({
      fio: user.fio,
      phone: user.phone,
      address: user.address,
    })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      const updatedUser = await updateMe(formData)
      updateUser(updatedUser)
      setMessage({ type: 'success', text: t('success', language) })
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage({ type: 'error', text: t('error', language) })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t('profile', language)}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('personalInfo', language)}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-md text-sm ${message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fio">{t('name', language)}</Label>
                <Input
                  id="fio"
                  value={formData.fio}
                  onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone', language)}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('address', language)}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading', language) : t('save', language)}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('accountInfo', language)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('userType', language)}:</span>
              <span className="font-medium">{t(user.user_type, language)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('role', language)}:</span>
              <span className="font-medium">{user.role}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
