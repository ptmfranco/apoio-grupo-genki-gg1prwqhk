import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { GenkiLogo } from '@/components/common/GenkiLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const stateFeedback = (location.state as any)?.feedback as string | undefined
  const [error, setError] = useState<string | null>(stateFeedback || null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      const fromPath = (location.state as any)?.from?.pathname
      if (fromPath && fromPath !== '/login') {
        navigate(fromPath)
      } else if (user.perfil === 'SUPERUSUARIO') navigate('/gestor/usuarios')
      else if (user.perfil === 'GESTOR_VENART') navigate('/gestor')
      else if (user.perfil === 'GESTOR_PROGRAMA') navigate('/gestor')
      else if (user.perfil === 'GESTOR_RH') navigate('/rh')
      else if (user.perfil === 'OPERACAO') navigate('/atendente')
      else navigate('/gestor')
    } catch (err: any) {
      setError(err?.message || 'E-mail ou senha incorretos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1f2b] via-[#122c3b] to-[#163a4d] flex flex-col justify-center items-center p-4">
      {/* Container Central */}
      <div className="w-full max-w-md space-y-5">
        {/* Brand header com logotipo oficial do Grupo Genki */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl inline-flex flex-col items-center">
            <GenkiLogo variant="white" width={240} height={48} />
          </div>
          <div className="space-y-0.5 pt-1">
            <h1 className="text-xl font-bold tracking-tight text-white">Apoio Grupo Genki</h1>
            <p className="text-xs font-medium text-amber-300/90 tracking-wide uppercase">
              Plataforma Apoio Saúde
            </p>
          </div>
        </div>

        {/* Card Formulário */}
        <Card className="border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Entre com suas credenciais para acessar seu perfil de governança ou operação
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <form onSubmit={handleLogin} className="space-y-3.5">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  E-mail Corporativo
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@venart.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Senha de Acesso
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-9 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-hidden"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#163A4D] hover:bg-[#1f4c64] dark:bg-[#D4A359] dark:hover:bg-[#e0b06b] dark:text-[#0f2430] text-white h-9 font-semibold text-xs transition-colors shadow-sm"
                disabled={loading}
              >
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security and LGPD Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>LGPD Dinâmica ativa conforme coleção config_lgpd_campos</span>
        </div>
      </div>
    </div>
  )
}
