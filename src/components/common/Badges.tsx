import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import { UserPerfil } from '@/types/saude'

export function LgpdBadge({ perfil }: { perfil: UserPerfil | string }) {
  if (perfil === 'SUPERUSUARIO') {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1 font-semibold"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Super Usuário (Acesso Total aos Dados / Nome Liberado)
      </Badge>
    )
  }

  if (perfil === 'GESTOR_PROGRAMA') {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Gestor Programa (Acesso Total aos Dados / Nome Liberado)
      </Badge>
    )
  }

  if (perfil === 'GESTOR_VENART') {
    return (
      <Badge
        variant="outline"
        className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 flex items-center gap-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Gestor Venart (Acesso Total aos Dados / Nome Liberado)
      </Badge>
    )
  }

  if (perfil === 'GESTOR_RH') {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Gestor RH (Nome Protegido / Dados Clínicos e Custo Ativos)
      </Badge>
    )
  }

  if (perfil === 'OPERACAO') {
    return (
      <Badge
        variant="outline"
        className="bg-[#163A4D]/10 dark:bg-[#163A4D]/30 text-[#163A4D] dark:text-[#88b6cc] border-[#163A4D]/30 dark:border-[#163A4D]/60 flex items-center gap-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Operação (Nome Protegido / Acesso Clínico Liberado)
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 flex items-center gap-1"
    >
      <Shield className="w-3.5 h-3.5" />
      LGPD Ativo
    </Badge>
  )
}

export function RiscoBadge({ risco }: { risco?: string }) {
  if (!risco) {
    return (
      <span className="text-muted-foreground text-xs italic">Não informado / Protegido LGPD</span>
    )
  }

  const map: Record<string, { label: string; className: string }> = {
    BAIXO: {
      label: 'Baixo',
      className:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    },
    MEDIO: {
      label: 'Médio',
      className:
        'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300',
    },
    ALTO: {
      label: 'Alto',
      className:
        'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
    },
    CRITICO: {
      label: 'Crítico',
      className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
    },
  }

  const item = map[risco.toUpperCase()] || {
    label: risco,
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  }

  return (
    <Badge variant="outline" className={`font-semibold ${item.className}`}>
      {item.label}
    </Badge>
  )
}

export function StatusBeneficiarioBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ELEGIVEL: {
      label: 'Elegível',
      className:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    },
    SELECIONADO: {
      label: 'Selecionado',
      className:
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    },
    APROVADO: {
      label: 'Aprovado',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    },
    EM_ATENDIMENTO: {
      label: 'Aprovado',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    },
    ATENDIDO: {
      label: 'Atendido (Alta)',
      className:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    },
    INATIVO: {
      label: 'Inativo',
      className: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
    },
  }

  const item = map[status] || { label: status, className: 'bg-slate-100 text-slate-700' }

  return (
    <Badge variant="outline" className={item.className}>
      {item.label}
    </Badge>
  )
}

export function StatusGeralBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    EM_ACOMPANHAMENTO: {
      label: 'Em Acompanhamento',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    },
    ALTA: {
      label: 'Alta Médica',
      className:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    },
    DESISTENCIA: {
      label: 'Desistência',
      className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
    },
    AGUARDANDO_RETORNO: {
      label: 'Aguardando Retorno',
      className:
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    },
    PROXIMO_CONTATO: {
      label: 'Próximo Contato',
      className:
        'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    },
    CONTATO_WHATSAPP: {
      label: 'WhatsApp',
      className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300',
    },
  }

  const item = map[status] || { label: status, className: 'bg-slate-100 text-slate-700' }

  return (
    <Badge variant="outline" className={item.className}>
      {item.label}
    </Badge>
  )
}
