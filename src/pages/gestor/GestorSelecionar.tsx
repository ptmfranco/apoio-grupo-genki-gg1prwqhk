import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BeneficiariosService } from '@/services/saude'
import { Beneficiario } from '@/types/saude'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RiscoBadge, StatusBeneficiarioBadge } from '@/components/common/Badges'
import { CheckSquare, Search, Filter, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import { CidCombobox } from '@/components/common/CidCombobox'

export default function GestorSelecionarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [condicaoFilter, setCondicaoFilter] = useState('')
  const [riscoFilter, setRiscoFilter] = useState('ALL')
  const [faixaFilter, setFaixaFilter] = useState('ALL')
  const [regiaoFilter, setRegiaoFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ELEGIVEL')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await BeneficiariosService.list({
        perPage: 1200,
        perfil: user?.perfil || 'GESTOR_PROGRAMA',
      })
      setBeneficiarios(res.items)
    } catch (err) {
      console.error('Erro ao carregar beneficiários:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = beneficiarios.filter((b) => {
    const nomeVal = b.nome || b.nome_beneficiario || ''
    const regiaoVal = b.unidade || b.unidade_regiao || ''
    const matchesSearch =
      nomeVal.toLowerCase().includes(search.toLowerCase()) ||
      b.matricula.toLowerCase().includes(search.toLowerCase()) ||
      (b.condicao_principal || '').toLowerCase().includes(search.toLowerCase())

    const matchesRisco = riscoFilter === 'ALL' || b.risco === riscoFilter
    const matchesCondicao =
      !condicaoFilter.trim() ||
      (b.condicao_principal || '').toLowerCase().includes(condicaoFilter.toLowerCase())
    const matchesFaixa =
      faixaFilter === 'ALL' || normalizeFaixaId(b.faixa || b.faixa_etaria) === faixaFilter
    const matchesRegiao = regiaoFilter === 'ALL' || regiaoVal.includes(regiaoFilter)
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter

    return (
      matchesSearch &&
      matchesCondicao &&
      matchesRisco &&
      matchesFaixa &&
      matchesRegiao &&
      matchesStatus
    )
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((b) => b.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectForProgram = async () => {
    if (selectedIds.length === 0 || !user) return
    setSubmitting(true)
    try {
      // Se for GESTOR_PROGRAMA, aprova direto para o ciclo clínico
      if (user.perfil === 'GESTOR_PROGRAMA') {
        await BeneficiariosService.approveForProgram(selectedIds, user.id)
        setSuccessMsg(
          `${selectedIds.length} beneficiário(s) aprovado(s) clinicamente com sucesso! Status: APROVADO. Pronto para distribuição pela governança de RH.`,
        )
      } else {
        await BeneficiariosService.selectForProgram(selectedIds, user.id)
        setSuccessMsg(
          `${selectedIds.length} beneficiário(s) selecionado(s) para o Programa com sucesso! Status: SELECIONADO (Aguardando Aprovação Clínica).`,
        )
      }
      setSelectedIds([])
      await loadData()
    } catch (err) {
      alert('Erro ao selecionar/aprovar beneficiários.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0 || !user) return
    setSubmitting(true)
    try {
      await BeneficiariosService.approveForProgram(selectedIds, user.id)
      setSuccessMsg(
        `${selectedIds.length} beneficiário(s) aprovado(s) clinicamente com sucesso! Status atualizado para APROVADO.`,
      )
      setSelectedIds([])
      await loadData()
    } catch (err) {
      alert('Erro ao aprovar beneficiários clinicamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Seleção de População para o Programa (Etapa 2)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Filtre elegíveis por risco clínico, custo e sinistralidade para incluí-los no ciclo de
            acompanhamento
          </p>
        </div>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-sm font-medium flex items-center justify-between w-full">
            <span>{successMsg}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/rh/distribuir')}
              className="bg-white text-emerald-800 border-emerald-400 text-xs ml-4"
            >
              Ver Distribuição RH <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Buscar por nome, matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="w-full">
              <CidCombobox
                value={condicaoFilter}
                onChange={(val) => setCondicaoFilter(val)}
                placeholder="Filtrar por CID-10..."
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="ELEGIVEL">Elegíveis</SelectItem>
                <SelectItem value="SELECIONADO">Selecionados</SelectItem>
                <SelectItem value="APROVADO">Aprovados</SelectItem>
                <SelectItem value="ATENDIDO">Atendidos (Alta)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riscoFilter} onValueChange={setRiscoFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Risco Clínico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Riscos</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
                <SelectItem value="ALTO">Alto</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="BAIXO">Baixo</SelectItem>
              </SelectContent>
            </Select>

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

            <Select value={regiaoFilter} onValueChange={setRegiaoFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Região / Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Regiões</SelectItem>
                <SelectItem value="São Paulo">São Paulo</SelectItem>
                <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                <SelectItem value="Curitiba">Curitiba</SelectItem>
                <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Checkbox
            id="select-all"
            checked={filtered.length > 0 && selectedIds.length === filtered.length}
            onCheckedChange={toggleSelectAll}
          />
          <label
            htmlFor="select-all"
            className="text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Selecionar todos os {filtered.length} visíveis
          </label>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            {selectedIds.length} selecionado(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user?.perfil === 'GESTOR_PROGRAMA' && (
            <Button
              onClick={handleApproveSelected}
              disabled={selectedIds.length === 0 || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {submitting ? 'Aprovando...' : 'Aprovar Clinicamente (GESTOR_PROGRAMA)'}
            </Button>
          )}
          <Button
            onClick={handleSelectForProgram}
            disabled={selectedIds.length === 0 || submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9"
          >
            <CheckSquare className="w-4 h-4 mr-1.5" />
            {submitting ? 'Gravando...' : 'Selecionar para o Ciclo'}
          </Button>
        </div>
      </div>

      {/* Tabela de Seleção */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5 w-10"></th>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5">Nome Beneficiário</th>
                  <th className="p-3.5">Vínculo</th>
                  <th className="p-3.5">Unidade / Região</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Condição Principal</th>
                  <th className="p-3.5">Risco</th>
                  <th className="p-3.5">Custo 12 Meses</th>
                  <th className="p-3.5">Status Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b) => {
                  const isChecked = selectedIds.includes(b.id)
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-teal-50/40' : ''}`}
                    >
                      <td className="p-3.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelectOne(b.id)}
                        />
                      </td>
                      <td className="p-3.5 font-mono text-xs font-medium text-slate-700">
                        {b.matricula}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {b.nome || b.nome_beneficiario}
                      </td>
                      <td className="p-3.5 text-xs text-slate-600">
                        {b.vinculo || b.tipo_vinculo}
                      </td>
                      <td className="p-3.5 text-xs text-slate-600">
                        {b.unidade || b.unidade_regiao}
                      </td>
                      <td className="p-3.5 text-xs font-medium text-teal-800">
                        {getFaixaLabel(b.faixa || b.faixa_etaria)}
                      </td>
                      <td className="p-3.5 text-xs font-medium text-slate-800 max-w-xs">
                        {b.condicao_principal || '—'}
                      </td>
                      <td className="p-3.5">
                        <RiscoBadge risco={b.risco} />
                      </td>
                      <td className="p-3.5 font-mono text-xs font-semibold text-emerald-700">
                        {(
                          (b.custo_12m !== undefined ? b.custo_12m : b.custo_12_meses) || 0
                        ).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-3.5">
                        <StatusBeneficiarioBadge status={b.status} />
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
