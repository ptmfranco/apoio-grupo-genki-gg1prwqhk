import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BeneficiariosService, UsuariosService } from '@/services/saude'
import { Beneficiario, User } from '@/types/saude'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBeneficiarioBadge } from '@/components/common/Badges'
import {
  Users,
  Share2,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Building2,
  Filter,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'

export default function RhDashboard() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [atendentes, setAtendentes] = useState<User[]>([])
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, aRes] = await Promise.all([
          BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_RH' }),
          UsuariosService.listOperacao(),
        ])
        setBeneficiarios(bRes.items)
        setAtendentes(aRes)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selecionados = beneficiarios.filter(
    (b) => b.status === 'SELECIONADO' || b.status === 'APROVADO',
  )
  const distribuidos = beneficiarios.filter((b) => !!b.atendente_id || b.status === 'ATENDIDO')
  const pendentes = selecionados.filter((b) => !b.atendente_id)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Painel de Operações de RH & Distribuição
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão do fluxo administrativo e distribuição populacional de beneficiários selecionados
          </p>
        </div>
        <Link to="/rh/distribuir">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2">
            <Share2 className="w-4 h-4" /> Distribuir para Atendentes
          </Button>
        </Link>
      </div>

      {/* LGPD Banner for RH */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <strong>Filtro LGPD Administrativo Ativo:</strong> Conforme as políticas de privacidade da
          empresa e a LGPD, o perfil de Recursos Humanos tem acesso exclusivo aos dados cadastrais e
          de contato. Informações sobre{' '}
          <em>
            doenças, diagnósticos, riscos clínicos, custos assistenciais e avaliações de prontuário
          </em>{' '}
          estão estritamente omitidas.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Selecionados pela Gestão
            </CardTitle>
            <Users className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{selecionados.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              Beneficiários elegíveis prontos para alocação
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Já Distribuídos (Em Cuidado)
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{distribuidos.length}</div>
            <p className="text-xs text-slate-500 mt-1">Atribuídos a enfermeiros ou médicos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendentes de Distribuição
            </CardTitle>
            <Clock className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{pendentes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Aguardando atribuição de atendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Carga Atual dos Atendentes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Capacidade e Carga Atual da Equipe de Saúde
          </CardTitle>
          <CardDescription className="text-xs">
            Volume de beneficiários atualmente atribuídos por atendente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {atendentes.map((atendente) => {
              const count = beneficiarios.filter((b) => b.atendente_id === atendente.id).length
              return (
                <div
                  key={atendente.id}
                  className="p-4 border rounded-xl bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-slate-900">{atendente.name}</p>
                    <p className="text-xs text-slate-500">
                      {atendente.tipo_profissional || 'Profissional'} •{' '}
                      {atendente.unidade_regiao || 'SP'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {atendente.registro_profissional || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-teal-700">{count}</span>
                    <span className="text-[11px] block text-slate-500">casos ativos</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Selecionados com Filtro LGPD Ativo */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              Beneficiários Selecionados (Visão RH - Dados Protegidos)
            </CardTitle>
            <CardDescription className="text-xs">
              Exibição cadastral sem dados clínicos sensíveis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
                <SelectTrigger className="w-[170px] text-xs h-8">
                  <SelectValue placeholder="Faixa Etária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Faixas</SelectItem>
                  {FAIXAS_ETARIAS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.id} - {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link to="/rh/distribuir">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 text-amber-700 border-amber-300 h-8"
              >
                Ir para Distribuição <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5">Nome do Beneficiário</th>
                  <th className="p-3.5">Unidade / Região</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Telefone / Celular</th>
                  <th className="p-3.5">WhatsApp Autorizado</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Atendente Atribuído</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selecionados
                  .filter((b) => {
                    if (filtroFaixa === 'TODAS') return true
                    return normalizeFaixaId(b.faixa || b.faixa_etaria) === filtroFaixa
                  })
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 text-xs">
                      <td className="p-3.5 font-mono font-medium">{b.matricula}</td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {b.nome || b.nome_beneficiario}
                      </td>
                      <td className="p-3.5 text-slate-600">{b.unidade || b.unidade_regiao}</td>
                      <td className="p-3.5 text-teal-800 dark:text-teal-300 font-medium">
                        {getFaixaLabel(b.faixa || b.faixa_etaria)}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {b.celular || b.telefone || 'Não cadastrado'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            b.permite_contato_whatsapp_sms
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {b.permite_contato_whatsapp_sms ? 'Sim (Opt-in)' : 'Não'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBeneficiarioBadge status={b.status} />
                      </td>
                      <td className="p-3.5 font-medium text-teal-800">
                        {b.expand?.atendente_id?.name || 'Aguardando Atendente'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
