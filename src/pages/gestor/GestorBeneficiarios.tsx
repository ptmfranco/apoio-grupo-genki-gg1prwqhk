import React, { useEffect, useState } from 'react'
import { BeneficiariosService, UsuariosService } from '@/services/saude'
import { Beneficiario, NivelRisco, StatusBeneficiario, TipoVinculo, User } from '@/types/saude'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RiscoBadge, StatusBeneficiarioBadge } from '@/components/common/Badges'
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, Filter } from 'lucide-react'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import { CidCombobox } from '@/components/common/CidCombobox'
import { formatPhone, validatePhoneField } from '@/lib/phoneMask'

export default function GestorBeneficiariosCrud() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [atendentes, setAtendentes] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [filtroCondicao, setFiltroCondicao] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Beneficiario | null>(null)
  const [phoneErrors, setPhoneErrors] = useState<{ celular?: string; telefone?: string }>({})

  // Form State
  const [formData, setFormData] = useState<Partial<Beneficiario>>({
    matricula: '',
    nome_beneficiario: '',
    id_externo: '',
    unidade_regiao: 'São Paulo - Matriz',
    tipo_vinculo: 'TITULAR',
    faixa: '05',
    faixa_etaria: '05',
    telefone: '',
    celular: '',
    email: '',
    custo_12_meses: 0,
    condicao_principal: '',
    risco: 'MEDIO',
    permite_contato_whatsapp_sms: true,
    status: 'ELEGIVEL',
    atendente_id: '',
    ativo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, aRes] = await Promise.all([
        BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_PROGRAMA' }),
        UsuariosService.listOperacao(),
      ])
      setBeneficiarios(bRes.items)
      setAtendentes(aRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setPhoneErrors({})
    setFormData({
      matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: '',
      id_externo: `BENEF-${Math.floor(1000 + Math.random() * 9000)}`,
      unidade_regiao: 'São Paulo - Matriz',
      tipo_vinculo: 'TITULAR',
      faixa: '05',
      faixa_etaria: '05',
      telefone: '',
      celular: '',
      email: '',
      custo_12_meses: 5000,
      condicao_principal: '',
      risco: 'MEDIO',
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
      atendente_id: '',
      ativo: true,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (b: Beneficiario) => {
    setEditingItem(b)
    setPhoneErrors({})
    const normalized = normalizeFaixaId(b.faixa || b.faixa_etaria)
    setFormData({
      ...b,
      faixa: normalized,
      faixa_etaria: normalized,
      celular: formatPhone(b.celular),
      telefone: formatPhone(b.telefone),
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação estrita de obrigatoriedade e 11 dígitos para Celular/WhatsApp e Telefone
    const celVal = validatePhoneField(formData.celular, 'Celular (WhatsApp)')
    const telVal = validatePhoneField(formData.telefone, 'Telefone')

    const newErrors: { celular?: string; telefone?: string } = {}
    if (!celVal.valid) newErrors.celular = celVal.error
    if (!telVal.valid) newErrors.telefone = telVal.error

    if (!celVal.valid || !telVal.valid) {
      setPhoneErrors(newErrors)
      return
    }

    setPhoneErrors({})
    try {
      if (editingItem) {
        await BeneficiariosService.update(editingItem.id, formData)
      } else {
        await BeneficiariosService.create(formData)
      }
      setDialogOpen(false)
      loadData()
    } catch (err: any) {
      alert('Erro ao salvar beneficiário: ' + err.message)
    }
  }

  const handleToggleSoftDelete = async (b: Beneficiario) => {
    try {
      await BeneficiariosService.update(b.id, {
        ativo: !b.ativo,
        status: !b.ativo ? 'ELEGIVEL' : 'INATIVO',
      })
      loadData()
    } catch (err: any) {
      alert('Erro ao alterar status ativo: ' + err.message)
    }
  }

  const filtered = beneficiarios.filter((b) => {
    const matchesSearch =
      (b.nome || b.nome_beneficiario || '').toLowerCase().includes(search.toLowerCase()) ||
      b.matricula.toLowerCase().includes(search.toLowerCase()) ||
      (b.condicao_principal || '').toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filtroFaixa !== 'TODAS') {
      const bFaixaId = normalizeFaixaId(b.faixa || b.faixa_etaria)
      if (bFaixaId !== filtroFaixa) return false
    }

    if (filtroCondicao && filtroCondicao.trim()) {
      const cond = (b.condicao_principal || '').toLowerCase()
      const filterTerm = filtroCondicao.trim().toLowerCase()
      // Casar por código ou descrição
      const parts = filterTerm.split('—').map((s) => s.trim().toLowerCase())
      const match = parts.some((p) => p && cond.includes(p))
      if (!match && !cond.includes(filterTerm)) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Beneficiários (Cadastro Geral)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            CRUD completo com visualização Irrestrita de Dados Clínicos, Financeiros e LGPD
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Novo Beneficiário
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Pesquisar por nome, matrícula ou condição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Faixa:
              </Label>
              <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
                <SelectTrigger className="w-[150px] text-xs h-9">
                  <SelectValue placeholder="Todas as Faixas" />
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

            <div className="w-[240px]">
              <CidCombobox
                value={filtroCondicao}
                onChange={(val) => setFiltroCondicao(val)}
                placeholder="Filtrar por CID-10..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5">Nome</th>
                  <th className="p-3.5">Vínculo</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Unidade</th>
                  <th className="p-3.5">Condição Principal</th>
                  <th className="p-3.5">Risco</th>
                  <th className="p-3.5">Custo 12m</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Ativo</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50 ${!b.ativo ? 'opacity-50 bg-slate-100' : ''}`}
                  >
                    <td className="p-3.5 font-mono text-xs font-medium">{b.matricula}</td>
                    <td className="p-3.5 font-medium text-slate-900">
                      {b.nome || b.nome_beneficiario}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">{b.vinculo || b.tipo_vinculo}</td>
                    <td className="p-3.5 text-xs font-medium text-teal-800">
                      {getFaixaLabel(b.faixa || b.faixa_etaria)}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">
                      {b.unidade || b.unidade_regiao}
                    </td>
                    <td className="p-3.5 text-xs font-medium text-slate-800 max-w-xs truncate">
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
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(b)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSoftDelete(b)}
                        className={`h-8 w-8 p-0 ${b.ativo ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação / Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? `Editar Beneficiário: ${editingItem.nome_beneficiario}`
                : 'Cadastrar Novo Beneficiário'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados cadastrais, clínicos e financeiros completos
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                  <span>Matrícula</span> <span className="text-rose-500 ml-0.5">*</span>
                </Label>
                <Input
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                  className="text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                  <span>Nome Completo</span> <span className="text-rose-500 ml-0.5">*</span>
                </Label>
                <Input
                  value={formData.nome_beneficiario || ''}
                  onChange={(e) => setFormData({ ...formData, nome_beneficiario: e.target.value })}
                  required
                  className="text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                  Tipo Vínculo
                </Label>
                <Select
                  value={formData.tipo_vinculo || 'TITULAR'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, tipo_vinculo: val as TipoVinculo })
                  }
                >
                  <SelectTrigger className="text-xs h-9 mt-1.5 focus:ring-[#163A4D]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TITULAR">Titular</SelectItem>
                    <SelectItem value="DEPENDENTE">Dependente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                  Faixa Etária
                </Label>
                <Select
                  value={normalizeFaixaId(formData.faixa || formData.faixa_etaria)}
                  onValueChange={(val) =>
                    setFormData({ ...formData, faixa: val, faixa_etaria: val })
                  }
                >
                  <SelectTrigger className="text-xs h-9 mt-1.5 focus:ring-[#163A4D]">
                    <SelectValue placeholder="Selecione a faixa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FAIXAS_ETARIAS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                  Unidade / Região
                </Label>
                <Input
                  value={formData.unidade_regiao || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_regiao: e.target.value })}
                  className="text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center justify-between">
                  <span className="flex items-center">
                    Celular (WhatsApp) <span className="text-rose-500 ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">11 dígitos</span>
                </Label>
                <Input
                  value={formData.celular || ''}
                  onChange={(e) => {
                    const masked = formatPhone(e.target.value)
                    setFormData({ ...formData, celular: masked })
                    if (phoneErrors.celular) setPhoneErrors({ ...phoneErrors, celular: undefined })
                  }}
                  placeholder="(99) 9999-99999"
                  maxLength={15}
                  required
                  className={`text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D] ${phoneErrors.celular ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                {phoneErrors.celular && (
                  <p className="text-[11px] text-rose-600 mt-1 leading-tight font-medium">
                    {phoneErrors.celular}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center justify-between">
                  <span className="flex items-center">
                    Telefone de Contato <span className="text-rose-500 ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">11 dígitos</span>
                </Label>
                <Input
                  value={formData.telefone || ''}
                  onChange={(e) => {
                    const masked = formatPhone(e.target.value)
                    setFormData({ ...formData, telefone: masked })
                    if (phoneErrors.telefone)
                      setPhoneErrors({ ...phoneErrors, telefone: undefined })
                  }}
                  placeholder="(99) 9999-99999"
                  maxLength={15}
                  required
                  className={`text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D] ${phoneErrors.telefone ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                {phoneErrors.telefone && (
                  <p className="text-[11px] text-rose-600 mt-1 leading-tight font-medium">
                    {phoneErrors.telefone}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center justify-between">
                  <span>E-mail</span>
                  <span className="text-[10px] text-slate-400 font-normal opacity-0 select-none">
                    opcional
                  </span>
                </Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                  className="text-xs h-9 mt-1.5 focus-visible:ring-[#163A4D]"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-[#163A4D] dark:text-[#a5d2eb] uppercase tracking-wider block">
                Dados Clínicos & Financeiros (Sensíveis LGPD)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div>
                  <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center gap-1">
                    Condição Principal (CID-10)
                  </Label>
                  <CidCombobox
                    value={formData.condicao_principal || ''}
                    onChange={(val) => setFormData({ ...formData, condicao_principal: val })}
                    placeholder="Selecione o CID-10..."
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                    Classificação de Risco
                  </Label>
                  <Select
                    value={formData.risco || 'MEDIO'}
                    onValueChange={(val) => setFormData({ ...formData, risco: val as NivelRisco })}
                  >
                    <SelectTrigger className="text-xs h-9 mt-1.5 focus:ring-[#163A4D]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXO">Baixo</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="ALTO">Alto</SelectItem>
                      <SelectItem value="CRITICO">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div>
                  <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                    Custo 12 Meses (R$)
                  </Label>
                  <Input
                    type="number"
                    value={formData.custo_12_meses || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, custo_12_meses: parseFloat(e.target.value) || 0 })
                    }
                    className="text-xs h-9 mt-1.5 font-mono focus-visible:ring-[#163A4D]"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                    Status do Funil
                  </Label>
                  <Select
                    value={formData.status || 'ELEGIVEL'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val as StatusBeneficiario })
                    }
                  >
                    <SelectTrigger className="text-xs h-9 mt-1.5 focus:ring-[#163A4D]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELEGIVEL">Elegível</SelectItem>
                      <SelectItem value="SELECIONADO">Selecionado</SelectItem>
                      <SelectItem value="APROVADO">Aprovado</SelectItem>
                      <SelectItem value="ATENDIDO">Atendido (Alta)</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold min-h-[1.25rem] flex items-center">
                    Atendente Responsável
                  </Label>
                  <Select
                    value={formData.atendente_id || 'NONE'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, atendente_id: val === 'NONE' ? '' : val })
                    }
                  >
                    <SelectTrigger className="text-xs h-9 mt-1.5 focus:ring-[#163A4D]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Nenhum</SelectItem>
                      {atendentes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.tipo_profissional || 'Profissional'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="permite-contato"
                  checked={formData.permite_contato_whatsapp_sms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, permite_contato_whatsapp_sms: checked })
                  }
                />
                <Label htmlFor="permite-contato" className="text-xs font-medium cursor-pointer">
                  Permite Contato via WhatsApp / SMS (Opt-in)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo-switch"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo-switch" className="text-xs font-medium cursor-pointer">
                  Cadastro Ativo
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#163A4D] hover:bg-[#122e3e] text-white text-xs font-semibold"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
