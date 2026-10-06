import React, { useState, useEffect } from 'react'
import { getFichas, getHistoricoFicha } from '@/services/healthService'
import {
  FileText,
  Search,
  Filter,
  Eye,
  History,
  Clock,
  User,
  Activity,
  Calendar,
  CheckCircle2,
  Stethoscope,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from '@/components/common/RiskBadge'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import { getFaixaLabel } from '@/constants/faixasEtarias'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { FichaAtendimento, HistoricoFicha } from '@/types'

export default function FichasGestao() {
  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroRisco, setFiltroRisco] = useState('TODOS')

  // Modal Detalhe
  const [selectedFicha, setSelectedFicha] = useState<FichaAtendimento | null>(null)
  const [historicoList, setHistoricoList] = useState<HistoricoFicha[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getFichas()
      setFichas(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar fichas de atendimento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVerDetalhes = async (ficha: FichaAtendimento) => {
    setSelectedFicha(ficha)
    setModalOpen(true)
    try {
      const hist = await getHistoricoFicha(ficha.id)
      setHistoricoList(hist)
    } catch (err) {
      console.warn('Erro ao carregar histórico da ficha:', err)
      setHistoricoList([])
    }
  }

  const filtered = fichas.filter((f) => {
    const nomeBen = f.expand?.beneficiario_id?.nome_beneficiario || ''
    const matBen = f.expand?.beneficiario_id?.matricula || ''
    const matchSearch =
      f.ficha_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomeBen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matBen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.condicao_principal.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = filtroStatus === 'TODOS' || f.status_geral === filtroStatus
    const matchRisco = filtroRisco === 'TODOS' || f.risco === filtroRisco

    return matchSearch && matchStatus && matchRisco
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Fichas de Atendimento e Prontuários
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Histórico completo de evoluções clínicas, metas, pendências e versionamento de
            alterações
          </p>
        </div>
      </div>

      <LgpdNotice perfil="GESTOR" />

      {/* Filtros */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por ficha ID, paciente, condição..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="TODOS">Todos os Status Gerais</option>
              <option value="EM_ACOMPANHAMENTO">Em Acompanhamento</option>
              <option value="ALTA">Alta Concluída</option>
              <option value="AGUARDANDO_RETORNO">Aguardando Retorno</option>
              <option value="DESISTENCIA">Desistência</option>
            </select>

            <select
              value={filtroRisco}
              onChange={(e) => setFiltroRisco(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
            >
              <option value="TODOS">Todos os Riscos</option>
              <option value="CRITICO">Crítico</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Médio</option>
              <option value="BAIXO">Baixo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Fichas */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Ficha ID</th>
                  <th className="p-3 font-semibold">Beneficiário</th>
                  <th className="p-3 font-semibold">Condição</th>
                  <th className="p-3 font-semibold">Risco</th>
                  <th className="p-3 font-semibold">Canal</th>
                  <th className="p-3 font-semibold">Status Geral</th>
                  <th className="p-3 font-semibold">Atendente</th>
                  <th className="p-3 font-semibold text-center">Versão</th>
                  <th className="p-3 font-semibold text-right">Data Contato</th>
                  <th className="p-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                      {f.ficha_id}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">
                        {f.expand?.beneficiario_id?.nome_beneficiario || 'Segurado'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.expand?.beneficiario_id?.matricula}
                      </p>
                    </td>
                    <td className="p-3 font-medium text-foreground max-w-[180px] truncate">
                      {f.condicao_principal}
                    </td>
                    <td className="p-3">
                      <RiskBadge level={f.risco} size="sm" />
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {f.meio_contato}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] ${
                          f.status_geral === 'ALTA'
                            ? 'bg-emerald-600'
                            : f.status_geral === 'EM_ACOMPANHAMENTO'
                              ? 'bg-blue-600'
                              : 'bg-amber-600'
                        }`}
                      >
                        {f.status_geral}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {f.expand?.atendente_id?.name || f.responsavel}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        v{f.versao || 1}
                      </Badge>
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {new Date(f.data_contato).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVerDetalhes(f)}
                        className="h-7 px-2 text-primary font-semibold text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detalhes da Ficha e Histórico de Alterações */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedFicha && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-base font-bold text-primary flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Ficha de Atendimento:{' '}
                      {selectedFicha.ficha_id}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Versão atual: v{selectedFicha.versao || 1} • Última atualização em{' '}
                      {new Date(selectedFicha.updated).toLocaleString('pt-BR')}
                    </DialogDescription>
                  </div>
                  <RiskBadge level={selectedFicha.risco} size="md" />
                </div>
              </DialogHeader>

              {/* Informações do Beneficiário */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Beneficiário
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedFicha.expand?.beneficiario_id?.nome_beneficiario}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Matrícula
                  </span>
                  <span className="font-mono text-foreground font-semibold">
                    {selectedFicha.expand?.beneficiario_id?.matricula}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Faixa Etária
                  </span>
                  <span className="font-semibold text-teal-800 dark:text-teal-300">
                    {getFaixaLabel(
                      selectedFicha.expand?.beneficiario_id?.faixa ||
                        selectedFicha.expand?.beneficiario_id?.faixa_etaria,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Atendente Responsável
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedFicha.expand?.atendente_id?.name || selectedFicha.responsavel}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Status Geral
                  </span>
                  <Badge className="text-[10px] mt-0.5">{selectedFicha.status_geral}</Badge>
                </div>
              </div>

              {/* Detalhes Clínicos */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-primary mb-1">
                    Descrição do Atendimento e Conduta:
                  </h4>
                  <p className="p-3 bg-card border border-border rounded-lg text-muted-foreground leading-relaxed">
                    {selectedFicha.descricao_atendimento || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-border rounded-lg bg-card">
                    <h5 className="font-bold text-foreground mb-1">Meta Assistencial:</h5>
                    <p className="text-muted-foreground">
                      {selectedFicha.meta || 'Sem meta estabelecida'}
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-card">
                    <h5 className="font-bold text-foreground mb-1">Pendências / Próximo Passo:</h5>
                    <p className="text-muted-foreground">
                      {selectedFicha.pendencias || 'Nenhuma pendência ativa'}
                    </p>
                  </div>
                </div>

                {selectedFicha.plano_acao_id && selectedFicha.expand?.plano_acao_id && (
                  <div className="p-3 border border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg">
                    <h5 className="font-bold text-teal-900 dark:text-teal-200 mb-1">
                      Plano de Ação Vinculado:
                    </h5>
                    <p className="text-teal-800 dark:text-teal-300 font-medium">
                      {selectedFicha.expand.plano_acao_id.necessidade_identificada}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Objetivo: {selectedFicha.expand.plano_acao_id.objetivo}
                    </p>
                  </div>
                )}
              </div>

              {/* Histórico de Versionamento */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                  <History className="w-3.5 h-3.5 text-primary" /> Trilha de Auditoria & Alterações
                  Anteriores
                </h4>
                {historicoList.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {historicoList.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span className="font-semibold text-foreground">
                            Alterado por: {h.expand?.alterado_por?.name || 'Profissional'}
                          </span>
                          <span>{new Date(h.created).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-[11px]">
                          <span className="font-bold text-primary mr-1">
                            Campo "{h.campo_alterado}":
                          </span>
                          <span className="line-through text-red-500 mr-1.5">
                            {h.valor_anterior || '(vazio)'}
                          </span>
                          &rarr;
                          <span className="font-semibold text-emerald-600 ml-1.5">
                            {h.valor_novo}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhuma alteração registrada após a criação inicial (versão original 1.0).
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
