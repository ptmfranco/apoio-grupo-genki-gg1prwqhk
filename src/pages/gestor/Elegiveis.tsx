import React, { useState, useEffect } from 'react'
import { getBeneficiarios, selecionarElegiveis } from '@/services/healthService'
import {
  UserCheck,
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  DollarSign,
  HeartPulse,
  Send,
  Sparkles,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/common/RiskBadge'
import { StepTracker } from '@/components/common/StepTracker'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import { toast } from 'sonner'
import type { Beneficiario } from '@/types'

export default function ElegiveisSelecao() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroRisco, setFiltroRisco] = useState<string>('TODOS')
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [filtroStatus, setFiltroStatus] = useState<string>('ELEGIVEL')
  const [processing, setProcessing] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getBeneficiarios()
      setBeneficiarios(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar lista de beneficiários elegíveis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = beneficiarios.filter((b) => {
    const matchSearch =
      b.nome_beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.condicao_principal &&
        b.condicao_principal.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchRisco = filtroRisco === 'TODOS' || b.risco === filtroRisco
    const matchFaixa =
      filtroFaixa === 'TODAS' || normalizeFaixaId(b.faixa || b.faixa_etaria) === filtroFaixa
    const matchStatus = filtroStatus === 'TODOS' || b.status === filtroStatus

    return matchSearch && matchRisco && matchFaixa && matchStatus
  })

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((b) => b.id))
    }
  }

  const handleConfirmarSelecao = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione ao menos um beneficiário para encaminhar ao RH.')
      return
    }

    try {
      setProcessing(true)
      await selecionarElegiveis(selectedIds)
      toast.success(
        `${selectedIds.length} beneficiário(s) selecionado(s) e encaminhados para a fila de distribuição do RH!`,
      )
      setSelectedIds([])
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao selecionar beneficiários.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" /> Etapa 2: Seleção de Elegíveis para
            Cuidado
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acesso TOTAL: O Gestor analisa a base completa com custos, riscos e condições clínicas
            para priorizar quem entrará no fluxo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleConfirmarSelecao}
            disabled={processing || selectedIds.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-teal-600/20"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Selecionar para Atendimento ({selectedIds.length})</span>
          </Button>
        </div>
      </div>

      <StepTracker currentStep={2} />
      <LgpdNotice perfil="GESTOR" />

      {/* Filtros e Busca */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, matrícula ou condição..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ELEGIVEL">Apenas Elegíveis</option>
              <option value="SELECIONADO">Selecionados (Aguardando RH)</option>
              <option value="EM_ATENDIMENTO">Em Atendimento</option>
              <option value="ATENDIDO">Atendidos / Alta</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <span>Risco:</span>
            </div>
            <select
              value={filtroRisco}
              onChange={(e) => setFiltroRisco(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="TODOS">Todos os Riscos</option>
              <option value="CRITICO">Crítico</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Médio</option>
              <option value="BAIXO">Baixo</option>
            </select>
            <select
              value={filtroFaixa}
              onChange={(e) => setFiltroFaixa(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="TODAS">Todas as Faixas</option>
              {FAIXAS_ETARIAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} - {f.label}
                </option>
              ))}
            </select>{' '}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Elegíveis com Seleção Múltipla */}
      <Card className="border-border shadow-sm">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs font-semibold gap-1.5 px-2"
            >
              {selectedIds.length === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground" />
              )}
              <span>Selecionar Todos ({filtered.length})</span>
            </Button>
            {selectedIds.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {selectedIds.length} selecionado(s)
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Exibindo <span className="font-bold text-foreground">{filtered.length}</span>{' '}
            beneficiários
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 w-10 text-center">Sel.</th>
                  <th className="p-3 font-semibold">Matrícula</th>
                  <th className="p-3 font-semibold">Nome Beneficiário</th>
                  <th className="p-3 font-semibold">Vínculo</th>
                  <th className="p-3 font-semibold">Faixa Etária</th>
                  <th className="p-3 font-semibold">Unidade / Região</th>
                  <th className="p-3 font-semibold">Condição Clínica</th>
                  <th className="p-3 font-semibold">Risco</th>
                  <th className="p-3 font-semibold text-right">Custo 12 Meses</th>
                  <th className="p-3 font-semibold">Status Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => {
                  const isSelected = selectedIds.includes(b.id)
                  return (
                    <tr
                      key={b.id}
                      onClick={() => handleToggleSelect(b.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/80 dark:bg-teal-950/40' : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(b.id)}
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                        {b.matricula}
                      </td>
                      <td className="p-3 font-semibold text-foreground">{b.nome_beneficiario}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {b.tipo_vinculo}
                        </Badge>
                      </td>
                      <td className="p-3 text-teal-800 dark:text-teal-300 font-medium">
                        {getFaixaLabel(b.faixa || b.faixa_etaria)}
                      </td>
                      <td className="p-3 text-muted-foreground">{b.unidade_regiao}</td>
                      <td className="p-3 font-medium text-foreground">{b.condicao_principal}</td>
                      <td className="p-3">
                        <RiskBadge level={b.risco} size="sm" />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(b.custo_12_meses || 0)}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] ${
                            b.status === 'ELEGIVEL'
                              ? 'bg-slate-600'
                              : b.status === 'SELECIONADO'
                                ? 'bg-blue-600'
                                : b.status === 'EM_ATENDIMENTO'
                                  ? 'bg-amber-600'
                                  : 'bg-emerald-600'
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
