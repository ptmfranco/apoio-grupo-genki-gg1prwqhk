import React, { useState, useEffect } from 'react'
import {
  getAllBeneficiariosAdmin,
  createBeneficiario,
  updateBeneficiario,
  softDeleteBeneficiario,
} from '@/services/healthService'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Power,
  PowerOff,
  UserCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/common/RiskBadge'
import { CidCombobox } from '@/components/common/CidCombobox'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Beneficiario } from '@/types'

export default function GestaoBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Beneficiario | null>(null)
  const [saving, setSaving] = useState(false)

  // Form State
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [formData, setFormData] = useState({
    nome_beneficiario: '',
    matricula: '',
    unidade_regiao: 'São Paulo - Matriz',
    tipo_vinculo: 'TITULAR',
    faixa: '05',
    faixa_etaria: '05',
    telefone: '',
    celular: '',
    email: '',
    custo_12_meses: 5000,
    status: 'ELEGIVEL',
    condicao_principal: '',
    risco: 'MEDIO',
    permite_contato_whatsapp_sms: true,
    ativo: true,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getAllBeneficiariosAdmin()
      setBeneficiarios(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar beneficiários.')
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
      nome_beneficiario: '',
      matricula: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      unidade_regiao: 'São Paulo - Matriz',
      tipo_vinculo: 'TITULAR',
      faixa: '05',
      faixa_etaria: '05',
      telefone: '',
      celular: '',
      email: '',
      custo_12_meses: 6000,
      status: 'ELEGIVEL',
      condicao_principal: '',
      risco: 'MEDIO',
      permite_contato_whatsapp_sms: true,
      ativo: true,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (b: Beneficiario) => {
    setEditingItem(b)
    const normalized = normalizeFaixaId(b.faixa || b.faixa_etaria)
    setFormData({
      nome_beneficiario: b.nome_beneficiario || b.nome || '',
      matricula: b.matricula,
      unidade_regiao: b.unidade_regiao || b.unidade || '',
      tipo_vinculo: b.tipo_vinculo || b.vinculo || 'TITULAR',
      faixa: normalized,
      faixa_etaria: normalized,
      telefone: b.telefone || '',
      celular: b.celular || '',
      email: b.email || '',
      custo_12_meses: b.custo_12_meses || 0,
      status: b.status,
      condicao_principal: b.condicao_principal || '',
      risco: b.risco || 'MEDIO',
      permite_contato_whatsapp_sms: b.permite_contato_whatsapp_sms ?? true,
      ativo: b.ativo ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingItem) {
        await updateBeneficiario(editingItem.id, {
          ...formData,
          tipo_vinculo: formData.tipo_vinculo as 'TITULAR' | 'DEPENDENTE',
          status: formData.status as
            | 'ELEGIVEL'
            | 'SELECIONADO'
            | 'EM_ATENDIMENTO'
            | 'ATENDIDO'
            | 'INATIVO',
          risco: formData.risco as 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO',
        })
        toast.success('Beneficiário atualizado com sucesso!')
      } else {
        await createBeneficiario({
          ...formData,
          data_selecao: new Date().toISOString(),
          tipo_vinculo: formData.tipo_vinculo as 'TITULAR' | 'DEPENDENTE',
          status: formData.status as
            | 'ELEGIVEL'
            | 'SELECIONADO'
            | 'EM_ATENDIMENTO'
            | 'ATENDIDO'
            | 'INATIVO',
          risco: formData.risco as 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO',
        })
        toast.success('Novo beneficiário cadastrado com sucesso!')
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar beneficiário.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async (b: Beneficiario) => {
    try {
      const novoStatus = !b.ativo
      await updateBeneficiario(b.id, { ativo: novoStatus })
      toast.success(
        novoStatus ? 'Beneficiário reativado!' : 'Beneficiário desativado (Soft Delete)!',
      )
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status do beneficiário.')
    }
  }

  const filtered = beneficiarios.filter((b) => {
    const nome = b.nome_beneficiario || b.nome || ''
    const unidade = b.unidade_regiao || b.unidade || ''
    const matches =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matches) return false
    if (filtroFaixa !== 'TODAS') {
      const bFaixa = normalizeFaixaId(b.faixa || b.faixa_etaria)
      if (bFaixa !== filtroFaixa) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Cadastro e Gestão de Beneficiários
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manutenção cadastral de titulares, dependentes, custos sinistrais e estratificação de
            risco
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Beneficiário
        </Button>
      </div>

      <LgpdNotice perfil="GESTOR" />

      {/* Busca & Filtro Faixa */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, matrícula, unidade..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Faixa:
              </Label>
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
              </select>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Total: <span className="font-bold text-foreground">{filtered.length}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Beneficiários */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Matrícula</th>
                  <th className="p-3 font-semibold">Nome Beneficiário</th>
                  <th className="p-3 font-semibold">Vínculo</th>
                  <th className="p-3 font-semibold">Faixa Etária</th>
                  <th className="p-3 font-semibold">Unidade</th>
                  <th className="p-3 font-semibold">Contato</th>
                  <th className="p-3 font-semibold">Condição</th>
                  <th className="p-3 font-semibold">Risco</th>
                  <th className="p-3 font-semibold text-right">Custo 12m</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-muted/30 transition-colors ${!b.ativo ? 'opacity-60 bg-muted/20' : ''}`}
                  >
                    <td className="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                      {b.matricula}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{b.nome_beneficiario}</p>
                      <p className="text-[10px] text-muted-foreground">{b.email}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {b.tipo_vinculo || b.vinculo}
                      </Badge>
                    </td>
                    <td className="p-3 text-teal-800 dark:text-teal-300 font-medium text-[11px]">
                      {getFaixaLabel(b.faixa || b.faixa_etaria)}
                    </td>
                    <td className="p-3 text-muted-foreground">{b.unidade_regiao || b.unidade}</td>
                    <td className="p-3 text-muted-foreground">
                      <div>{b.celular || b.telefone}</div>
                    </td>
                    <td className="p-3 font-medium text-foreground max-w-[160px] truncate">
                      {b.condicao_principal || '—'}
                    </td>
                    <td className="p-3">
                      <RiskBadge level={b.risco} size="sm" />
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(b.custo_12_meses || 0)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={`text-[10px] ${b.ativo ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        {b.ativo ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(b)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAtivo(b)}
                          className={`h-7 w-7 ${b.ativo ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                          title={b.ativo ? 'Desativar beneficiário' : 'Ativar beneficiário'}
                        >
                          {b.ativo ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal CRUD Beneficiário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-primary">
                {editingItem ? 'Editar Beneficiário' : 'Novo Cadastro de Beneficiário'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha as informações cadastrais e clínicas do segurado.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Nome Completo</Label>
                <Input
                  required
                  value={formData.nome_beneficiario}
                  onChange={(e) => setFormData({ ...formData, nome_beneficiario: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Matrícula</Label>
                <Input
                  required
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unidade / Região</Label>
                <Input
                  value={formData.unidade_regiao}
                  onChange={(e) => setFormData({ ...formData, unidade_regiao: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Vínculo</Label>
                <select
                  value={formData.tipo_vinculo}
                  onChange={(e) => setFormData({ ...formData, tipo_vinculo: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="TITULAR">Titular</option>
                  <option value="DEPENDENTE">Dependente</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Faixa Etária</Label>
                <select
                  value={normalizeFaixaId(formData.faixa || formData.faixa_etaria)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      faixa: e.target.value,
                      faixa_etaria: e.target.value,
                    })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {FAIXAS_ETARIAS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Celular (WhatsApp)</Label>
                <Input
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Custo 12 Meses (R$)</Label>
                <Input
                  type="number"
                  value={formData.custo_12_meses}
                  onChange={(e) =>
                    setFormData({ ...formData, custo_12_meses: Number(e.target.value) })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estratificação de Risco</Label>
                <select
                  value={formData.risco}
                  onChange={(e) => setFormData({ ...formData, risco: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="BAIXO">Baixo</option>
                  <option value="MEDIO">Médio</option>
                  <option value="ALTO">Alto</option>
                  <option value="CRITICO">Crítico</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">
                  Condição Principal / Diagnóstico (CID-10)
                </Label>
                <CidCombobox
                  value={formData.condicao_principal}
                  onChange={(val) => setFormData({ ...formData, condicao_principal: val })}
                  placeholder="Selecione o CID-10 ou busque por código/descrição..."
                />
              </div>

              <div className="space-y-1 sm:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="permite-contato"
                  checked={formData.permite_contato_whatsapp_sms}
                  onChange={(e) =>
                    setFormData({ ...formData, permite_contato_whatsapp_sms: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-primary"
                />
                <Label htmlFor="permite-contato" className="text-xs font-medium cursor-pointer">
                  Segurado autorizou contato ativo via WhatsApp / SMS / Telefone
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                Salvar Beneficiário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
