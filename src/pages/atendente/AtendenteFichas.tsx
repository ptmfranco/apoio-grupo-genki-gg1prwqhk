import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FichasService } from '@/services/saude'
import { FichaAtendimento } from '@/types/saude'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RiscoBadge, StatusGeralBadge } from '@/components/common/Badges'
import { Search, Plus, Star, Phone, MessageCircle, Mail, MessageSquare, Filter } from 'lucide-react'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'

export default function AtendenteFichasPage() {
  const { user } = useAuth()
  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [faixaFilter, setFaixaFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await FichasService.list('', '-created')
      // Permite ao operador ver todas as fichas atribuídas ou gerais da operação
      setFichas(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const filtered = fichas.filter((f) => {
    const benefNome =
      f.expand?.beneficiario_id?.nome || f.expand?.beneficiario_id?.nome_beneficiario || ''
    const matchesSearch =
      (f.ficha_id || '').toLowerCase().includes(search.toLowerCase()) ||
      benefNome.toLowerCase().includes(search.toLowerCase()) ||
      (f.condicao_principal || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || f.status_geral === statusFilter
    const bFaixa = f.expand?.beneficiario_id?.faixa || f.expand?.beneficiario_id?.faixa_etaria
    const matchesFaixa = faixaFilter === 'ALL' || normalizeFaixaId(bFaixa) === faixaFilter

    return matchesSearch && matchesStatus && matchesFaixa
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Minhas Fichas de Cuidado & Atendimento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Histórico completo de intervenções, planos de ação clínica e acompanhamentos realizados
          </p>
        </div>
        <Link to="/atendente/fichas/nova">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5">
            <Plus className="w-4 h-4" /> Nova Ficha de Atendimento
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Buscar por ID, paciente ou diagnóstico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={faixaFilter} onValueChange={setFaixaFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Faixa Etária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Faixas</SelectItem>
                {FAIXAS_ETARIAS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.id} - {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status Geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="EM_ACOMPANHAMENTO">Em Acompanhamento</SelectItem>
                <SelectItem value="ALTA">Alta Médica / Concluído</SelectItem>
                <SelectItem value="AGUARDANDO_RETORNO">Aguardando Retorno</SelectItem>
                <SelectItem value="PROXIMO_CONTATO">Próximo Contato</SelectItem>
                <SelectItem value="DESISTENCIA">Desistência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5">Ficha ID</th>
                  <th className="p-3.5">Beneficiário</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Contato / Meio</th>
                  <th className="p-3.5">Condição Clínica</th>
                  <th className="p-3.5">Risco</th>
                  <th className="p-3.5">Status Geral</th>
                  <th className="p-3.5">Versão</th>
                  <th className="p-3.5">Feedback</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                      Nenhuma ficha encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 text-xs">
                      <td className="p-3.5 font-mono font-medium">{f.ficha_id}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">
                          {f.expand?.beneficiario_id?.nome ||
                            f.expand?.beneficiario_id?.nome_beneficiario ||
                            'Paciente'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {f.expand?.beneficiario_id?.matricula} •{' '}
                          {f.expand?.beneficiario_id?.unidade ||
                            f.expand?.beneficiario_id?.unidade_regiao}
                        </div>
                      </td>
                      <td className="p-3.5 text-teal-800 font-medium">
                        {getFaixaLabel(
                          f.expand?.beneficiario_id?.faixa ||
                            f.expand?.beneficiario_id?.faixa_etaria,
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-800 font-medium">{f.status_contato}</div>
                        <div className="text-[11px] text-slate-500">{f.meio_contato}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">
                        {f.condicao_principal}
                      </td>
                      <td className="p-3.5">
                        <RiscoBadge risco={f.risco} />
                      </td>
                      <td className="p-3.5">
                        <StatusGeralBadge status={f.status_geral} />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-600">v{f.versao || 1}</td>
                      <td className="p-3.5">
                        {f.feedback && f.feedback > 0 ? (
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{f.feedback} / 5</span>
                          </div>
                        ) : f.data_envio_pesquisa ? (
                          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Enviada
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link to={`/atendente/fichas/${f.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Abrir / Editar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
