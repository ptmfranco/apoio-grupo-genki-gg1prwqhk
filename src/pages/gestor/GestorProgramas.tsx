import React, { useEffect, useState } from 'react'
import { ControleProgramasService, BeneficiariosService } from '@/services/saude'
import { ControlePrograma, Beneficiario, NivelRisco } from '@/types/saude'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { RiscoBadge } from '@/components/common/Badges'
import { CidCombobox } from '@/components/common/CidCombobox'
import { Search, Plus, Edit, Activity, Calendar } from 'lucide-react'

export default function GestorProgramasCrud() {
  const [programas, setProgramas] = useState<ControlePrograma[]>([])
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ControlePrograma | null>(null)

  const [formData, setFormData] = useState<Partial<ControlePrograma>>({
    beneficiario_id: '',
    condicao_principal: '',
    risco: 'MEDIO',
    responsavel: 'Dr. Carlos Gestor',
    ativo: true,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, bRes] = await Promise.all([
        ControleProgramasService.list(),
        BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_PROGRAMA' }),
      ])
      setProgramas(pRes)
      setBeneficiarios(bRes.items)
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
      beneficiario_id: beneficiarios[0]?.id || '',
      condicao_principal: '',
      risco: 'MEDIO',
      responsavel: 'Dr. Carlos Gestor',
      ativo: true,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (p: ControlePrograma) => {
    setEditingItem(p)
    setFormData({ ...p })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await ControleProgramasService.update(editingItem.id, formData)
      } else {
        await ControleProgramasService.create(formData)
      }
      setDialogOpen(false)
      loadData()
    } catch (err: any) {
      alert('Erro ao salvar programa: ' + err.message)
    }
  }

  const handleToggleAtivo = async (p: ControlePrograma) => {
    try {
      await ControleProgramasService.toggleAtivo(p.id, !p.ativo)
      loadData()
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message)
    }
  }

  const filtered = programas.filter(
    (p) =>
      (p.expand?.beneficiario_id?.nome_beneficiario || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      p.condicao_principal.toLowerCase().includes(search.toLowerCase()) ||
      p.responsavel.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle de Programas de Saúde Crônica
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão de linhas de cuidado e programas especiais (Hipertensão, Diabetes, Pré-Natal,
            Oncológico)
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Vincular Novo Programa
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Pesquisar por beneficiário ou condição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5">Beneficiário</th>
                  <th className="p-3.5">Linha de Cuidado / Condição</th>
                  <th className="p-3.5">Classificação Risco</th>
                  <th className="p-3.5">Responsável Clínico</th>
                  <th className="p-3.5">Data Inclusão</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-medium text-slate-900">
                      {p.expand?.beneficiario_id?.nome_beneficiario ||
                        'Beneficiário não encontrado'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-800 font-semibold">
                      {p.condicao_principal}
                    </td>
                    <td className="p-3.5">
                      <RiscoBadge risco={p.risco} />
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">{p.responsavel}</td>
                    <td className="p-3.5 text-xs text-slate-500 font-mono">
                      {p.data_selecao ? new Date(p.data_selecao).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(p)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(p)}
                        className={`text-xs h-8 px-2 ${p.ativo ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        {p.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Vincular / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Programa de Saúde' : 'Vincular a Programa de Saúde'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o paciente e defina o protocolo de acompanhamento
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Beneficiário</Label>
              <Select
                value={formData.beneficiario_id || ''}
                onValueChange={(val) => setFormData({ ...formData, beneficiario_id: val })}
              >
                <SelectTrigger className="text-xs mt-1">
                  <SelectValue placeholder="Selecione um beneficiário..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {beneficiarios.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome_beneficiario} ({b.matricula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Linha de Cuidado / Condição Principal</Label>
              <div className="mt-1">
                <CidCombobox
                  value={formData.condicao_principal || ''}
                  onChange={(val) => setFormData({ ...formData, condicao_principal: val })}
                  placeholder="Selecione ou busque por CID-10 ou condição clínica..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Risco</Label>
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

              <div>
                <Label className="text-xs font-semibold">Responsável Clínico</Label>
                <Input
                  value={formData.responsavel || ''}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="prog-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="prog-ativo" className="text-xs font-medium cursor-pointer">
                Programa Ativo
              </Label>
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
                Salvar Programa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
