import React from 'react'
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'
import { UserPerfil } from '@/types/saude'

export function LgpdNotice({ perfil }: { perfil: UserPerfil | string }) {
  const isSuperUsuario = perfil === 'SUPERUSUARIO'
  const isGestorPrograma = perfil === 'GESTOR_PROGRAMA'
  const isGestorVenart = perfil === 'GESTOR_VENART' || perfil === 'GESTOR'
  const isGestorRh = perfil === 'GESTOR_RH' || perfil === 'RH'
  const isOperacao = perfil === 'OPERACAO' || perfil === 'ATENDENTE'

  return (
    <div
      className={`rounded-lg border p-3 flex items-start gap-3 text-xs mb-4 ${
        isSuperUsuario
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          : isGestorPrograma
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : isGestorVenart
              ? 'bg-[#163A4D]/10 dark:bg-[#163A4D]/30 border-[#163A4D]/30 dark:border-[#163A4D]/60 text-[#163A4D] dark:text-[#a5d2eb]'
              : isGestorRh
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
      }`}
    >
      {isSuperUsuario ? (
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      ) : isGestorPrograma ? (
        <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : isGestorVenart ? (
        <ShieldCheck className="w-4 h-4 text-[#163A4D] dark:text-[#a5d2eb] shrink-0 mt-0.5" />
      ) : isOperacao ? (
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      ) : (
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div>
        <p className="font-semibold mb-0.5">
          {isSuperUsuario &&
            'Conformidade LGPD — Perfil SUPERUSUÁRIO (Acesso Total / Nome Liberado)'}
          {isGestorPrograma &&
            'Conformidade LGPD — Perfil GESTOR_PROGRAMA (Acesso Total / Nome Liberado)'}
          {isGestorVenart &&
            'Conformidade LGPD — Perfil GESTOR_VENART (Acesso Total / Nome Liberado)'}
          {isGestorRh && 'Conformidade LGPD — Perfil GESTOR_RH (Nome Oculto)'}
          {isOperacao && 'Conformidade LGPD — Perfil OPERAÇÃO (Nome e Dados Sensíveis Protegidos)'}
        </p>
        <p className="opacity-90">
          {isSuperUsuario &&
            'Visualização nominal integral e irrestrita autorizada para administração global, auditoria e suporte do sistema.'}
          {isGestorPrograma &&
            'Visualização nominal integral e irrestrita autorizada para acompanhamento médico e coordenação assistencial.'}
          {isGestorVenart &&
            'Visualização nominal autorizada para a gestão integral do programa, acompanhamento clínico e governança operacional.'}
          {isGestorRh &&
            'Nomes de beneficiários mantidos anonimizados por padrão (MAT-XXXXXX) para preservar sigilo, com dados clínicos e de custos visíveis para gestão assistencial.'}
          {isOperacao &&
            'Nomes protegidos por padrão conforme matriz de governança da coleção config_lgpd_campos.'}
        </p>
      </div>
    </div>
  )
}
export default LgpdNotice
