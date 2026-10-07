import React, { useState, useEffect } from 'react'
import {
  getAllProgramas,
  createPrograma,
  updatePrograma,
  getBeneficiarios,
  getFichas,
} from '@/services/healthService'
import {
  Activity,
  Plus,
  Search,
  CheckCircle2,
  User,
  HeartPulse,
  FileText,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/common/RiskBadge'
import { CidCombobox } from '@/components/common/CidCombobox'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { ControlePrograma, Beneficiario, FichaAtendimento, NivelRisco } from '@/types'

export default function ProgramasSaude() {
  const [programas, setProgramas] = useState<ControlePrograma[]>([])
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    beneficiario_id: '',
    condicao_principal: '',
    risco: 'ALTO' as NivelRisco,
    responsavel: 'Dr. Carlos Gestor',
    ativo: true,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [pList, bList, fList] = await Promise.all([
        getAllProgramas(),
        getBeneficiarios(),
        getFichas(),
      ])
      setProgramas(pList)
      setBeneficiarios(bList)
      setFichas(fList)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar programas de saúde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setFormData({
      beneficiario_id: beneficiarios[0]?.id || '',
      condicao_principal: '',
      risco: 'ALTO',
      responsavel: 'Dr. Carlos Gestor',
      ativo: true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.beneficiario_id) {
      toast.error('Selecione um beneficiário.')
      return
    }

    try {
      setSaving(true)
      await createPrograma({
        ...formData,
        data_selecao: new Date().toISOString(),
      })
      toast.success('Beneficiário incluído no Programa de Saúde com sucesso!')
      setModalOpen(false)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao incluir no programa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Programas de Saúde e Cuidado Contínuo
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão consolidada de linhas de cuidado para crônicos, gestantes e casos de alta
            complexidade
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Inscrever no Programa
        </Button>
      </div>

      <LgpdNotice perfil="GESTOR" />

      {/* Lista de Programas em Execução */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programas.map((prog) => {
          const fichasDoPrograma = fichas.filter(
            (f) => f.controle_programa_id === prog.id || f.beneficiario_id === prog.beneficiario_id,
          )
          const fichasConcluidas = fichasDoPrograma.filter((f) => f.status_geral === 'ALTA').length

          return (
            <Card key={prog.id} className="border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <RiskBadge level={prog.risco} size="sm" />
                  <Badge variant="outline" className="text-[10px]">
                    {new Date(prog.data_selecao).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold text-foreground">
                  {prog.condicao_principal}
                </CardTitle>
                <CardDescription className="text-xs">
                  Paciente:{' '}
                  <span className="font-semibold text-foreground">
                    {prog.expand?.beneficiario_id?.nome_beneficiario}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs flex-1">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Atendimentos vinculados:</span>
                    <span className="font-bold text-foreground">{fichasDoPrograma.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground mt-1">
                    <span>Altas obtidas:</span>
                    <span className="font-bold text-emerald-600">{fichasConcluidas}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Coordenação:</span>{' '}
                  {prog.responsavel}
                </p>
              </CardContent>
              <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
                <Badge className="bg-emerald-600 text-[10px]">PROGRAMA ATIVO</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Mat: {prog.expand?.beneficiario_id?.matricula}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal Inscrição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-primary">
                Inscrever Beneficiário em Programa
              </DialogTitle>
              <DialogDescription className="text-xs">
                Selecione o paciente e defina o programa de acompanhamento específico.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Beneficiário</Label>
                <select
                  required
                  value={formData.beneficiario_id}
                  onChange={(e) => setFormData({ ...formData, beneficiario_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {beneficiarios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome_beneficiario} ({b.matricula}) -{' '}
                      {b.condicao_principal || 'Sem diagnóstico'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Condição Clínica / CID-10 Vinculado</Label>
                <CidCombobox
                  value={formData.condicao_principal}
                  onChange={(val) => setFormData({ ...formData, condicao_principal: val })}
                  placeholder="Selecione o CID-10 ou busque por código/descrição..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Classificação de Risco</Label>
                <select
                  value={formData.risco}
                  onChange={(e) =>
                    setFormData({ ...formData, risco: e.target.value as NivelRisco })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="CRITICO">Crítico</option>
                  <option value="ALTO">Alto</option>
                  <option value="MEDIO">Médio</option>
                  <option value="BAIXO">Baixo</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Profissional Coordenador</Label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="text-xs"
                />
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
                <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar no Programa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
