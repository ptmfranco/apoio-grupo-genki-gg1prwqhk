import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { GenkiLogo } from '@/components/common/GenkiLogo'

export default function Index() {
  const { user, perfil, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c1f2b] text-white p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl">
            <GenkiLogo variant="white" width={220} height={44} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="text-xs font-medium text-slate-300 tracking-wide">
              Carregando Apoio Grupo Genki...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirecionamento baseado nos 4 perfis do PRD v0.0.4
  if (perfil === 'GESTOR_VENART' || perfil === 'GESTOR_PROGRAMA') {
    return <Navigate to="/gestor" replace />
  }
  if (perfil === 'GESTOR_RH') {
    return <Navigate to="/rh" replace />
  }
  if (perfil === 'OPERACAO') {
    return <Navigate to="/atendente" replace />
  }

  return <Navigate to="/gestor" replace />
}
