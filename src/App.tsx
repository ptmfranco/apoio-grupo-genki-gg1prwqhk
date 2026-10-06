import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AppLayout } from '@/components/common/AppLayout'

// Páginas de Autenticação e Públicas
import Index from './pages/Index'
import LoginPage from './pages/Login'
import PesquisaPublicaPage from './pages/PesquisaPublica'
import NotFound from './pages/NotFound'

// Módulo do Gestor (GESTOR_VENART, GESTOR_PROGRAMA)
import GestorDashboard from './pages/gestor/GestorDashboard'
import GestorImportarPage from './pages/gestor/GestorImportar'
import GestorCid10Page from './pages/gestor/GestorCid10'
import GestorSelecionarPage from './pages/gestor/GestorSelecionar'
import GestorBeneficiariosCrud from './pages/gestor/GestorBeneficiarios'
import GestorUsuariosCrud from './pages/gestor/GestorUsuarios'
import GestorFichasCrud from './pages/gestor/GestorFichas'
import GestorPlanosAcaoCrud from './pages/gestor/GestorPlanosAcao'
import GestorProgramasCrud from './pages/gestor/GestorProgramas'
import GestorComparativoPage from './pages/gestor/GestorComparativo'
import GestorRelatoriosPage from './pages/gestor/GestorRelatorios'
import GestorQuestionariosCrud from './pages/gestor/GestorQuestionarios'

// Módulo do RH (GESTOR_RH)
import RhDashboard from './pages/rh/RhDashboard'
import RhDistribuirPage from './pages/rh/RhDistribuir'

// Módulo da Operação (OPERACAO)
import AtendenteDashboard from './pages/atendente/AtendenteDashboard'
import AtendenteFichasPage from './pages/atendente/AtendenteFichas'
import AtendenteFichaDetalhesPage from './pages/atendente/AtendenteFichaDetalhes'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota Raiz - Redirecionador Inteligente */}
          <Route path="/" element={<Index />} />

          {/* Autenticação & Pesquisa Pública Sem Login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pesquisa/:token" element={<PesquisaPublicaPage />} />

          {/* Rotas Protegidas do GESTOR (GESTOR_VENART, GESTOR_PROGRAMA, GESTOR_RH) */}
          <Route
            path="/gestor"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/importar"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART']}>
                <AppLayout>
                  <GestorImportarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/cid10"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorCid10Page />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/selecionar"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorSelecionarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/beneficiarios"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA', 'GESTOR_RH']}>
                <AppLayout>
                  <GestorBeneficiariosCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/usuarios"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART']}>
                <AppLayout>
                  <GestorUsuariosCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/questionarios"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART']}>
                <AppLayout>
                  <GestorQuestionariosCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/fichas"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA', 'OPERACAO']}>
                <AppLayout>
                  <GestorFichasCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/planos-acao"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorPlanosAcaoCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/programas"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorProgramasCrud />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/comparativo"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <GestorComparativoPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestor/relatorios"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_VENART', 'GESTOR_PROGRAMA', 'GESTOR_RH']}>
                <AppLayout>
                  <GestorRelatoriosPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Rotas Protegidas do GESTOR_RH */}
          <Route
            path="/rh"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_RH', 'GESTOR_VENART']}>
                <AppLayout>
                  <RhDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rh/distribuir"
            element={
              <ProtectedRoute allowedRoles={['GESTOR_RH', 'GESTOR_VENART']}>
                <AppLayout>
                  <RhDistribuirPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Rotas Protegidas da OPERACAO */}
          <Route
            path="/atendente"
            element={
              <ProtectedRoute allowedRoles={['OPERACAO', 'GESTOR_PROGRAMA']}>
                <AppLayout>
                  <AtendenteDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/atendente/fichas"
            element={
              <ProtectedRoute allowedRoles={['OPERACAO', 'GESTOR_PROGRAMA', 'GESTOR_VENART']}>
                <AppLayout>
                  <AtendenteFichasPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/atendente/fichas/:id"
            element={
              <ProtectedRoute allowedRoles={['OPERACAO', 'GESTOR_PROGRAMA', 'GESTOR_VENART']}>
                <AppLayout>
                  <AtendenteFichaDetalhesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
