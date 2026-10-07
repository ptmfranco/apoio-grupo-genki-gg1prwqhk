import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FichasService, QuestionariosService } from '@/services/saude'
import { FichaAtendimento, QuestionarioTemplate, RespostaQuestionario } from '@/types/saude'
import { useAuth } from '@/contexts/AuthContext'
import { getFaixaLabel } from '@/constants/faixasEtarias'
import { QuestionarioClinico } from '@/components/common/QuestionarioClinico'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RiscoBadge, StatusGeralBadge } from '@/components/common/Badges'
import { CidCombobox } from '@/components/common/CidCombobox'
import {
  Search,
  Star,
  MessageSquare,
  History,
  Phone,
  Mail,
  MessageCircle,
  FileCheck,
  Filter,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FAIXAS_ETARIAS, normalizeFaixaId } from '@/constants/faixasEtarias'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function GestorFichasCrud() {
  const { user } = useAuth()
  const perfilLogado = user?.perfil || 'GESTOR_VENART'
  const temAcessoNominal =
    perfilLogado === 'GESTOR_VENART' ||
    perfilLogado === 'GESTOR_PROGRAMA' ||
    perfilLogado === 'SUPERUSUARIO'

  const getNomeExibicao = (beneficiario?: any) => {
    if (!beneficiario) return 'Beneficiário'
    if (temAcessoNominal) {
      return (
        beneficiario.nome_beneficiario ||
        beneficiario.nome ||
        (beneficiario.matricula ? `Beneficiário (${beneficiario.matricula})` : 'Beneficiário')
      )
    }
    return beneficiario.matricula
      ? `Beneficiário Protegido (${beneficiario.matricula})`
      : 'Beneficiário Protegido'
  }

  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [search, setSearch] = useState('')
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS')
  const [filtroCondicao, setFiltroCondicao] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedFicha, setSelectedFicha] = useState<FichaAtendimento | null>(null)
  const [historicoList, setHistoricoList] = useState<any[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionarioTemplate | null>(null)
  const [respostasList, setRespostasList] = useState<RespostaQuestionario[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await FichasService.list('', '-created')
      setFichas(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenHistorico = async (ficha: FichaAtendimento) => {
    setSelectedFicha(ficha)
    try {
      const [h, resp, tpl] = await Promise.all([
        FichasService.getHistorico(ficha.id),
        QuestionariosService.getRespostasPorFicha(ficha.id),
        QuestionariosService.getTemplatePorCondicao(ficha.condicao_principal),
      ])
      setHistoricoList(h)
      setRespostasList(resp)
      setSelectedTemplate(tpl)
    } catch (e) {
      setHistoricoList([])
      setRespostasList([])
    }
    setHistoryOpen(true)
  }

  const getContactIcon = (meio: string) => {
    if (meio === 'WHATSAPP') return <MessageCircle className="w-4 h-4 text-emerald-600" />
    if (meio === 'LIGACAO_TELEFONICA') return <Phone className="w-4 h-4 text-blue-600" />
    if (meio === 'EMAIL') return <Mail className="w-4 h-4 text-indigo-600" />
    return <MessageSquare className="w-4 h-4 text-slate-500" />
  }

  const filtered = fichas.filter((f) => {
    const matchSearch =
      (f.ficha_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.expand?.beneficiario_id?.nome_beneficiario || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (f.expand?.beneficiario_id?.matricula || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.expand?.atendente_id?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.condicao_principal || '').toLowerCase().includes(search.toLowerCase())

    const bFaixa = f.expand?.beneficiario_id?.faixa || f.expand?.beneficiario_id?.faixa_etaria
    const matchFaixa = filtroFaixa === 'ALL' || normalizeFaixaId(bFaixa) === filtroFaixa

    let matchCondicao = true
    if (filtroCondicao && filtroCondicao.trim()) {
      const fCond = (f.condicao_principal || '').toLowerCase()
      const filterTerm = filtroCondicao.trim().toLowerCase()
      const parts = filterTerm.split('—').map((s) => s.trim().toLowerCase())
      matchCondicao = parts.some((p) => p && fCond.includes(p)) || fCond.includes(filterTerm)
    }

    return matchSearch && matchFaixa && matchCondicao
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fichas de Atendimento & Evolução Clínica
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão clínica e auditoria de todos os atendimentos, histórico de versões e pesquisas de
            satisfação
          </p>
        </div>
        <Link to="/atendente/fichas/nova">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 text-xs">
            + Nova Ficha / Consulta
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Pesquisar por Ficha ID, beneficiário ou atendente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
                <SelectTrigger className="w-[150px] text-xs h-8">
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
            </div>
            <div className="w-[230px]">
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
                  <th className="p-3.5">Ficha ID</th>
                  <th className="p-3.5">Beneficiário</th>
                  <th className="p-3.5">Faixa Etária</th>
                  <th className="p-3.5">Atendente / Responsável</th>
                  <th className="p-3.5">Meio</th>
                  <th className="p-3.5">Condição / Risco</th>
                  <th className="p-3.5">Status Geral</th>
                  <th className="p-3.5">Versão</th>
                  <th className="p-3.5">Pesquisa / Feedback</th>
                  <th className="p-3.5 text-right">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-xs font-semibold text-slate-700">
                      {f.ficha_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900">
                        {getNomeExibicao(f.expand?.beneficiario_id)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {f.expand?.beneficiario_id?.matricula || ''}
                      </div>
                    </td>
                    <td className="p-3.5 text-xs font-medium text-teal-800">
                      {getFaixaLabel(
                        f.expand?.beneficiario_id?.faixa || f.expand?.beneficiario_id?.faixa_etaria,
                      )}
                    </td>
                    <td className="p-3.5 text-xs text-slate-700">
                      {f.expand?.atendente_id?.name || f.responsavel}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        {getContactIcon(f.meio_contato)}
                        <span>{f.meio_contato.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-xs font-medium text-slate-800 max-w-xs truncate">
                        {f.condicao_principal}
                      </div>
                      <div className="mt-1">
                        <RiscoBadge risco={f.risco} />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <StatusGeralBadge status={f.status_geral} />
                    </td>
                    <td className="p-3.5 font-mono text-xs font-bold text-slate-600">
                      v{f.versao || 1}
                    </td>
                    <td className="p-3.5">
                      {f.feedback && f.feedback > 0 ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-md border border-amber-200 w-fit">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{f.feedback} / 5</span>
                        </div>
                      ) : f.data_envio_pesquisa ? (
                        <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Pesquisa Enviada
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/atendente/fichas/${f.id}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            Atender / Evoluir
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenHistorico(f)}
                          className="text-xs h-7 gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          Auditoria
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

      {/* Modal Histórico e Auditoria com Questionários */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auditoria Clínica da Ficha de Atendimento</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedFicha?.ficha_id} • Paciente:{' '}
              {getNomeExibicao(selectedFicha?.expand?.beneficiario_id)} • Faixa:{' '}
              {getFaixaLabel(
                selectedFicha?.expand?.beneficiario_id?.faixa ||
                  selectedFicha?.expand?.beneficiario_id?.faixa_etaria,
              )}{' '}
              ({selectedFicha?.condicao_principal})
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="geral" className="space-y-3 pt-2">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="geral" className="text-xs">
                Visão Geral & Evolução
              </TabsTrigger>
              <TabsTrigger value="questionario" className="text-xs flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Questionário Clínico ({respostasList.length})</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs">
                Trilha de Modificações ({historicoList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Detalhes Atuais (v{selectedFicha?.versao})</span>
                  {selectedFicha?.risco && <RiscoBadge risco={selectedFicha.risco} />}
                </div>
                <p className="text-slate-600">
                  <strong>Descrição:</strong> {selectedFicha?.descricao_atendimento}
                </p>
                <p className="text-slate-600">
                  <strong>Meta / Plano:</strong> {selectedFicha?.meta || 'Não informada'}
                </p>
                <p className="text-slate-600">
                  <strong>Pendências:</strong> {selectedFicha?.pendencias || 'Nenhuma'}
                </p>
                <p className="text-slate-600">
                  <strong>Responsável:</strong> {selectedFicha?.responsavel}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="questionario" className="space-y-4">
              {selectedFicha && (
                <QuestionarioClinico
                  fichaId={selectedFicha.id}
                  condicaoPrincipal={selectedFicha.condicao_principal}
                  template={selectedTemplate}
                  respostasSalvas={respostasList}
                  usuarioAtualId={user?.id}
                  perfilUsuario={user?.perfil || 'GESTOR_VENART'}
                  readOnly={true}
                />
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-3">
              <div className="border-t pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Trilha de Modificações (historico_fichas)
                </h4>

                {historicoList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Nenhuma alteração anterior registrada para esta ficha (versão inicial).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historicoList.map((h, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>{new Date(h.created).toLocaleString('pt-BR')}</span>
                          <span className="font-semibold text-slate-700">
                            {h.expand?.alterado_por?.name || 'Profissional'}
                          </span>
                        </div>
                        <p className="font-medium text-teal-800">{h.campo_alterado}</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-2 rounded">
                          <div>
                            <strong>Antes:</strong> {h.valor_anterior}
                          </div>
                          <div>
                            <strong>Depois:</strong> {h.valor_novo}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
