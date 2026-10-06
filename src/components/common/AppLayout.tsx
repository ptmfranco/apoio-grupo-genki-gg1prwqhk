import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LgpdBadge } from '@/components/common/Badges'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HeartPulse,
  LayoutDashboard,
  Upload,
  CheckSquare,
  Users,
  UserCheck,
  FileText,
  Target,
  Activity,
  BarChart3,
  FileSpreadsheet,
  Share2,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  ClipboardList,
} from 'lucide-react'
import { UserPerfil } from '@/types/saude'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, perfil, tema, toggleTema, logout, switchMockProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Menus customizados para os perfis
  const gestorVenartNav: NavItem[] = [
    { label: 'Visão Geral (Venart)', href: '/gestor', icon: LayoutDashboard },
    { label: 'Importar Lotes', href: '/gestor/importar', icon: Upload },
    { label: 'Selecionar Elegíveis', href: '/gestor/selecionar', icon: CheckSquare },
    { label: 'Beneficiários', href: '/gestor/beneficiarios', icon: Users },
    { label: 'Gestão de Usuários', href: '/gestor/usuarios', icon: UserCheck },
    { label: 'Gestão de Questionários', href: '/gestor/questionarios', icon: ClipboardList },
    { label: 'Fichas de Cuidado', href: '/gestor/fichas', icon: FileText },
    { label: 'Planos de Ação', href: '/gestor/planos-acao', icon: Target },
    { label: 'Controle de Programas', href: '/gestor/programas', icon: Activity },
    { label: 'Dashboard Comparativo', href: '/gestor/comparativo', icon: BarChart3 },
    { label: 'Relatórios & Auditoria', href: '/gestor/relatorios', icon: FileSpreadsheet },
  ]

  const gestorProgramaNav: NavItem[] = [
    { label: 'Painel do Programa', href: '/gestor', icon: LayoutDashboard },
    { label: 'Aprovação de Vidas', href: '/gestor/selecionar', icon: CheckSquare },
    { label: 'Beneficiários Clínicos', href: '/gestor/beneficiarios', icon: Users },
    { label: 'Fichas de Atendimento', href: '/gestor/fichas', icon: FileText },
    { label: 'Catálogo de Planos', href: '/gestor/planos-acao', icon: Target },
    { label: 'Controle de Programas', href: '/gestor/programas', icon: Activity },
    { label: 'Indicadores Comparativos', href: '/gestor/comparativo', icon: BarChart3 },
    { label: 'Relatórios Médicos', href: '/gestor/relatorios', icon: FileSpreadsheet },
  ]

  const gestorRhNav: NavItem[] = [
    { label: 'Dashboard RH', href: '/rh', icon: LayoutDashboard },
    { label: 'Distribuir Aprovados', href: '/rh/distribuir', icon: Share2 },
    { label: 'Lista de Beneficiários', href: '/gestor/beneficiarios', icon: Users },
    { label: 'Relatórios Populacionais', href: '/gestor/relatorios', icon: FileSpreadsheet },
  ]

  const operacaoNav: NavItem[] = [
    { label: 'Painel da Operação', href: '/atendente', icon: LayoutDashboard },
    { label: 'Minhas Fichas de Cuidado', href: '/atendente/fichas', icon: FileText },
    { label: 'Consultas & Evoluções Gerais', href: '/gestor/fichas', icon: ClipboardList },
  ]

  let navItems: NavItem[] = []
  if (perfil === 'GESTOR_VENART') navItems = gestorVenartNav
  else if (perfil === 'GESTOR_PROGRAMA') navItems = gestorProgramaNav
  else if (perfil === 'GESTOR_RH') navItems = gestorRhNav
  else if (perfil === 'OPERACAO') navItems = operacaoNav
  else navItems = gestorVenartNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPerfilBadgeClass = (p?: UserPerfil | null) => {
    switch (p) {
      case 'GESTOR_VENART':
        return 'bg-purple-950 text-purple-300 border-purple-800'
      case 'GESTOR_PROGRAMA':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800'
      case 'GESTOR_RH':
        return 'bg-amber-950 text-amber-300 border-amber-800'
      case 'OPERACAO':
        return 'bg-teal-950 text-teal-300 border-teal-800'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
            Apoio Grupo Genki
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTema} className="h-8 w-8">
            {tema === 'DARK' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-slate-950 text-slate-100 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide leading-none">
                Apoio Grupo Genki
              </h1>
              <span className="text-[11px] text-teal-400 font-medium">Plataforma Apoio Saúde</span>
            </div>
          </div>
          <button
            onClick={toggleTema}
            title={`Alternar tema (atual: ${tema})`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            {tema === 'DARK' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Current user badge */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Perfil Ativo
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPerfilBadgeClass(
                perfil,
              )}`}
            >
              {perfil}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>{user?.categoria_profissional || user?.tipo_profissional}</span>
            {user?.registro_profissional && <span>• {user.registro_profissional}</span>}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Operacional
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">LGPD Dinâmica</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 h-7 px-2 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-3">{perfil && <LgpdBadge perfil={perfil} />}</div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTema}
              className="gap-1.5 text-xs h-8"
              title="Alternar Tema Claro / Escuro"
            >
              {tema === 'DARK' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </Button>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {user?.unidade_regiao || 'São Paulo'} • {user?.perfil}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-medium">{user?.perfil}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-normal">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      perfil === 'GESTOR_RH'
                        ? '/rh'
                        : perfil === 'OPERACAO'
                          ? '/atendente'
                          : '/gestor',
                    )
                  }
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Painel Principal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTema}>
                  {tema === 'DARK' ? (
                    <Sun className="w-4 h-4 mr-2 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 mr-2 text-slate-600" />
                  )}
                  Alternar Tema ({tema})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Encerrar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
