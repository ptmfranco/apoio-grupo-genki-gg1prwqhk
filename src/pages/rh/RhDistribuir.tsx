import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BeneficiariosService, UsuariosService } from '@/services/saude'
import { Beneficiario, User } from '@/types/saude'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { StatusBeneficiarioBadge } from '@/components/common/Badges'
import {
  Share2,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Stethoscope,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getFaixaLabel } from '@/constants/faixasEtarias'

export default function RhDistribuirPage() {
  const navigate = useNavigate()
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [atendentes, setAtendentes] = useState<User[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [targetAtendenteId, setTargetAtendenteId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [regiaoFilter, setRegiaoFilter] = useState('ALL')

  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, aRes] = await Promise.all([
        BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_RH' }),
        UsuariosService.listOperacao(),
      ])
      // Beneficiários aptos para alocação: APROVADO ou SELECIONADO
      setBeneficiarios(
        bRes.items.filter((b) => b.status === 'APROVADO' || b.status === 'SELECIONADO'),
      )
      setAtendentes(aRes)
      if (aRes.length > 0) {
        setTargetAtendenteId(aRes[0].id)
      }
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
      b.matricula.toLowerCase().includes(search.toLowerCase())
    const matchesRegiao = regiaoFilter === 'ALL' || regiaoVal.includes(regiaoFilter)
    return matchesSearch && matchesRegiao
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

  const handleDistribute = async () => {
    if (selectedIds.length === 0 || !targetAtendenteId) return
    setSubmitting(true)
    try {
      const atendenteObj = atendentes.find((a) => a.id === targetAtendenteId)
      await BeneficiariosService.distributeToAtendente(selectedIds, targetAtendenteId)
      setSuccessMsg(
        `${selectedIds.length} beneficiário(s) distribuído(s) com sucesso para o atendente/operador ${atendenteObj?.name}!`,
      )
      setSelectedIds([])
      await loadData()
    } catch (err: any) {
      alert('Erro ao distribuir beneficiários: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Distribuição de Beneficiários para Atendentes (Etapa 3-4)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Alocação populacional para a equipe de enfermagem e médicos conforme região e carga de
            trabalho
          </p>
        </div>
      </div>

      {/* LGPD Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
        <div className="text-xs text-amber-900">
          <strong>Proteção de Dados Médicos (LGPD):</strong> O RH não tem visibilidade sobre
          diagnósticos ou riscos. Distribua com base na unidade/região geográfica e carga de cada
          atendente.
        </div>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-sm font-medium">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Carga dos Atendentes Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {atendentes.map((a) => {
          const isTarget = targetAtendenteId === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setTargetAtendenteId(a.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isTarget
                  ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-1 ring-teal-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">{a.name}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium text-slate-700">
                    {a.tipo_profissional}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{a.unidade_regiao}</p>
                <p className="text-[11px] text-slate-400 font-mono">{a.registro_profissional}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Selecionar p/ envio</span>
                {isTarget ? (
                  <span className="text-teal-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                  </span>
                ) : (
                  <span className="text-slate-400">Clique</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Action and Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={regiaoFilter} onValueChange={setRegiaoFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Região / Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Unidades</SelectItem>
                <SelectItem value="São Paulo">São Paulo</SelectItem>
                <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                <SelectItem value="Curitiba">Curitiba</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={targetAtendenteId} onValueChange={setTargetAtendenteId}>
                <SelectTrigger className="text-xs border-amber-300 bg-amber-50/40">
                  <SelectValue placeholder="Escolha o Atendente" />
                </SelectTrigger>
                <SelectContent>
                  {atendentes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.tipo_profissional}) - {a.unidade_regiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleDistribute}
                disabled={selectedIds.length === 0 || !targetAtendenteId || submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                Distribuir ({selectedIds.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Selecionados */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all-dist"
              checked={filtered.length > 0 && selectedIds.length === filtered.length}
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all-dist"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Selecionar todos ({filtered.length} beneficiários aptos)
            </label>
          </div>
          <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            {selectedIds.length} selecionado(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5 w-10"></th>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5">Nome do Beneficiário</th>
                  <th className="p-3.5">Vínculo</th>
                  <th className="p-3.5">Unidade / Região</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Celular / Telefone</th>
                  <th className="p-3.5">Opt-in WhatsApp</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                      Nenhum beneficiário no status SELECIONADO aguardando distribuição.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const isChecked = selectedIds.includes(b.id)
                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-amber-50/50' : ''}`}
                      >
                        <td className="p-3.5">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSelectOne(b.id)}
                          />
                        </td>
                        <td className="p-3.5 font-mono text-xs font-medium">{b.matricula}</td>
                        <td className="p-3.5 font-medium text-slate-900">
                          {b.nome || b.nome_beneficiario}
                        </td>
                        <td className="p-3.5 text-xs text-slate-600">
                          {b.vinculo || b.tipo_vinculo}
                        </td>
                        <td className="p-3.5 text-xs text-slate-600">
                          {b.unidade || b.unidade_regiao}
                        </td>
                        <td className="p-3.5 text-xs text-slate-600">
                          {getFaixaLabel(b.faixa || b.faixa_etaria)}
                        </td>
                        <td className="p-3.5 font-mono text-xs text-slate-600">
                          {b.celular || b.telefone || '—'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              b.permite_contato_whatsapp_sms
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.permite_contato_whatsapp_sms ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <StatusBeneficiarioBadge status={b.status} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
