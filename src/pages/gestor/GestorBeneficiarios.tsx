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

export default function GestorBeneficiariosCrud() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [atendentes, setAtendentes] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Beneficiario | null>(null)

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
    setFormData({
      matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: '',
      id_externo: `BENEF-${Math.floor(1000 + Math.random() * 9000)}`,
      unidade_regiao: 'São Paulo - Matriz',
      tipo_vinculo: 'TITULAR',
      faixa: '05',
      faixa_etaria: '05',
      telefone: '(11) 3322-1100',
      celular: '(11) 98877-6655',
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
    const normalized = normalizeFaixaId(b.faixa || b.faixa_etaria)
    setFormData({ ...b, faixa: normalized, faixa_etaria: normalized })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Faixa Etária:
            </Label>
            <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
              <SelectTrigger className="w-[180px] text-xs h-9">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Matrícula</Label>
                <Input
                  value={formData.matricula || ''}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                  className="text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Nome Completo</Label>
                <Input
                  value={formData.nome_beneficiario || ''}
                  onChange={(e) => setFormData({ ...formData, nome_beneficiario: e.target.value })}
                  required
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tipo Vínculo</Label>
                <Select
                  value={formData.tipo_vinculo || 'TITULAR'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, tipo_vinculo: val as TipoVinculo })
                  }
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TITULAR">Titular</SelectItem>
                    <SelectItem value="DEPENDENTE">Dependente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Faixa Etária</Label>
                <Select
                  value={normalizeFaixaId(formData.faixa || formData.faixa_etaria)}
                  onValueChange={(val) =>
                    setFormData({ ...formData, faixa: val, faixa_etaria: val })
                  }
                >
                  <SelectTrigger className="text-xs mt-1">
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
                <Label className="text-xs font-semibold">Unidade / Região</Label>
                <Input
                  value={formData.unidade_regiao || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_regiao: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Celular (WhatsApp)</Label>
                <Input
                  value={formData.celular || ''}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Telefone Fixo</Label>
                <Input
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Dados Clínicos & Financeiros (Sensíveis LGPD)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Condição Principal / Diagnóstico</Label>
                  <Input
                    value={formData.condicao_principal || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, condicao_principal: e.target.value })
                    }
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Classificação de Risco</Label>
                  <Select
                    value={formData.risco || 'MEDIO'}
                    onValueChange={(val) => setFormData({ ...formData, risco: val as NivelRisco })}
                  >
                    <SelectTrigger className="text-xs mt-1">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Custo 12 Meses (R$)</Label>
                  <Input
                    type="number"
                    value={formData.custo_12_meses || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, custo_12_meses: parseFloat(e.target.value) || 0 })
                    }
                    className="text-xs mt-1 font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Status do Funil</Label>
                  <Select
                    value={formData.status || 'ELEGIVEL'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val as StatusBeneficiario })
                    }
                  >
                    <SelectTrigger className="text-xs mt-1">
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
                  <Label className="text-xs font-semibold">Atendente Responsável</Label>
                  <Select
                    value={formData.atendente_id || 'NONE'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, atendente_id: val === 'NONE' ? '' : val })
                    }
                  >
                    <SelectTrigger className="text-xs mt-1">
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
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
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
