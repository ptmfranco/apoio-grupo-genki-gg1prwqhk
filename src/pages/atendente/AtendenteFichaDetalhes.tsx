import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  FichasService,
  BeneficiariosService,
  PlanosAcaoService,
  ControleProgramasService,
  QuestionariosService,
} from '@/services/saude'
import {
  FichaAtendimento,
  Beneficiario,
  PlanoAcao,
  ControlePrograma,
  MeioContato,
  StatusContato,
  StatusGeralFicha,
  NivelRisco,
  HistoricoFicha,
  QuestionarioTemplate,
  RespostaQuestionario,
} from '@/types/saude'
import { QuestionarioClinico } from '@/components/common/QuestionarioClinico'
import { getFaixaLabel } from '@/constants/faixasEtarias'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RiscoBadge, StatusGeralBadge } from '@/components/common/Badges'
import {
  Save,
  CheckCircle2,
  Send,
  History,
  Phone,
  MessageCircle,
  FileText,
  Target,
  Clock,
  Star,
  ExternalLink,
  Copy,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

export default function AtendenteFichaDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'nova'
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Dados auxiliares
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [programas, setProgramas] = useState<ControlePrograma[]>([])
  const [historico, setHistorico] = useState<HistoricoFicha[]>([])

  // Questionários Clínicos por Condição
  const [allTemplates, setAllTemplates] = useState<QuestionarioTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<QuestionarioTemplate | null>(null)
  const [respostasSalvas, setRespostasSalvas] = useState<RespostaQuestionario[]>([])

  // Modal de Alta e Envio de Pesquisa
  const [altaModalOpen, setAltaModalOpen] = useState(false)
  const [altaCanal, setAltaCanal] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP')
  const [altaObs, setAltaObs] = useState('')
  const [surveyLinkGenerated, setSurveyLinkGenerated] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<Partial<FichaAtendimento>>({
    ficha_id: `FICHA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    beneficiario_id: '',
    atendente_id: user?.id || '',
    plano_acao_id: '',
    controle_programa_id: '',
    meio_contato: 'WHATSAPP',
    condicao_principal: '',
    risco: 'MEDIO',
    status_contato: 'ATENDIDO',
    descricao_atendimento: '',
    data_contato: new Date().toISOString().slice(0, 16),
    data_proximo_contato: '',
    responsavel: user?.name || 'Profissional de Saúde',
    meta: '',
    observacoes: '',
    pendencias: '',
    status_geral: 'EM_ACOMPANHAMENTO',
    versao: 1,
    ativo: true,
  })

  // Beneficiário selecionado no momento
  const selectedBeneficiario = beneficiarios.find((b) => b.id === formData.beneficiario_id)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [bRes, pRes, progRes, tplList] = await Promise.all([
          BeneficiariosService.list({ perPage: 1200, perfil: 'OPERACAO' }),
          PlanosAcaoService.list('ativo = true'),
          ControleProgramasService.list(),
          QuestionariosService.listTemplates(),
        ])

        setBeneficiarios(bRes.items)
        setPlanosAcao(pRes)
        setProgramas(progRes)
        setAllTemplates(tplList)

        if (!isNew && id) {
          const [ficha, h, resp] = await Promise.all([
            FichasService.getById(id),
            FichasService.getHistorico(id),
            QuestionariosService.getRespostasPorFicha(id),
          ])

          setFormData({
            ...ficha,
            data_contato: ficha.data_contato ? ficha.data_contato.slice(0, 16) : '',
            data_proximo_contato: ficha.data_proximo_contato
              ? ficha.data_proximo_contato.slice(0, 10)
              : '',
          })
          setHistorico(h)
          setRespostasSalvas(resp)

          // Obter template para a condição da ficha
          const condicao =
            ficha.condicao_principal || ficha.expand?.beneficiario_id?.condicao_principal
          const tpl = await QuestionariosService.getTemplatePorCondicao(condicao)
          setCurrentTemplate(tpl)
        } else if (bRes.items.length > 0) {
          // Defaults for new
          const firstB = bRes.items[0]
          setFormData((prev) => ({
            ...prev,
            beneficiario_id: firstB.id,
            condicao_principal: firstB.condicao_principal || '',
            risco: firstB.risco || 'MEDIO',
          }))

          const tpl = await QuestionariosService.getTemplatePorCondicao(firstB.condicao_principal)
          setCurrentTemplate(tpl)
        }
      } catch (err) {
        console.error('Erro ao carregar dados da ficha:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, isNew])

  // Ao selecionar um beneficiário no cadastro de nova ficha
  const handleBeneficiarioChange = async (bId: string) => {
    const b = beneficiarios.find((item) => item.id === bId)
    const novaCondicao = b?.condicao_principal || ''
    setFormData((prev) => ({
      ...prev,
      beneficiario_id: bId,
      condicao_principal: novaCondicao || prev.condicao_principal,
      risco: b?.risco || prev.risco,
    }))

    if (novaCondicao) {
      const tpl = await QuestionariosService.getTemplatePorCondicao(novaCondicao)
      setCurrentTemplate(tpl)
    }
  }

  // Recarregar respostas após submissão do questionário
  const reloadRespostasQuestionarios = async () => {
    if (id && !isNew) {
      const resp = await QuestionariosService.getRespostasPorFicha(id)
      setRespostasSalvas(resp)
    }
  }

  // Ao selecionar um plano de ação do catálogo
  const handleSelectPlanoCatalogo = (planoId: string) => {
    const plano = planosAcao.find((p) => p.id === planoId)
    if (!plano) return

    setFormData((prev) => ({
      ...prev,
      plano_acao_id: planoId,
      meta: plano.objetivo,
      observacoes: (prev.observacoes ? prev.observacoes + '\n' : '') + `Ação: ${plano.acao_tomada}`,
      pendencias:
        (prev.pendencias ? prev.pendencias + '\n' : '') +
        `Prazo: ${plano.prazo_acao_dias} dias (${plano.prioridade})`,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)

    try {
      if (isNew) {
        const created = await FichasService.create({
          ...formData,
          atendente_id: user?.id,
          responsavel: user?.name || formData.responsavel,
        })
        setSuccessMsg('Ficha de Atendimento criada com sucesso!')
        setTimeout(() => navigate(`/atendente/fichas/${created.id}`), 1000)
      } else if (id && user) {
        const updated = await FichasService.updateWithVersion(
          id,
          formData,
          user.id,
          'Evolução de Atendimento e Atualização Clínica',
        )
        setFormData({
          ...updated,
          data_contato: updated.data_contato ? updated.data_contato.slice(0, 16) : '',
          data_proximo_contato: updated.data_proximo_contato
            ? updated.data_proximo_contato.slice(0, 10)
            : '',
        })
        const h = await FichasService.getHistorico(id)
        setHistorico(h)
        setSuccessMsg(`Ficha atualizada com sucesso! Nova versão: v${updated.versao}`)
      }
    } catch (err: any) {
      alert('Erro ao salvar ficha: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmAlta = async () => {
    if (!id || !formData.beneficiario_id || !user) return
    setSaving(true)

    try {
      const result = await FichasService.finalizarComAlta(id, formData.beneficiario_id, user.id, {
        observacoes: altaObs,
        canal: altaCanal,
      })

      setSurveyLinkGenerated(result.publicSurveyUrl)
      setFormData({
        ...result.ficha,
        data_contato: result.ficha.data_contato ? result.ficha.data_contato.slice(0, 16) : '',
      })
      const h = await FichasService.getHistorico(id)
      setHistorico(h)
    } catch (err: any) {
      alert('Erro ao finalizar atendimento: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const copySurveyLink = () => {
    if (surveyLinkGenerated) {
      navigator.clipboard.writeText(surveyLinkGenerated)
      alert('Link público da pesquisa de satisfação copiado para a área de transferência!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
              {formData.ficha_id}
            </span>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
              Versão {formData.versao || 1}
            </span>
            {formData.status_geral && <StatusGeralBadge status={formData.status_geral} />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {isNew
              ? 'Nova Ficha de Atendimento Clínico'
              : `Evolução Clínica: ${selectedBeneficiario?.nome || selectedBeneficiario?.nome_beneficiario || 'Beneficiário'}`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && formData.status_geral !== 'ALTA' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSurveyLinkGenerated(null)
                setAltaModalOpen(true)
              }}
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Finalizar / Conceder Alta (Disparar Pesquisa)
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Gravando...' : 'Salvar Alterações (Versão)'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-sm font-medium">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Card Dados do Beneficiário Selecionado */}
      {selectedBeneficiario && (
        <Card className="border-teal-200 bg-teal-50/40 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                Paciente Vinculado
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {selectedBeneficiario.nome || selectedBeneficiario.nome_beneficiario}
              </h3>
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong>Matrícula:</strong> {selectedBeneficiario.matricula}
                </span>
                <span>
                  <strong>Unidade:</strong> {selectedBeneficiario.unidade_regiao}
                </span>
                <span>
                  <strong>Faixa Etária:</strong>{' '}
                  {getFaixaLabel(selectedBeneficiario.faixa || selectedBeneficiario.faixa_etaria)}
                </span>
                <span>
                  <strong>WhatsApp:</strong>{' '}
                  {selectedBeneficiario.celular || selectedBeneficiario.telefone}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RiscoBadge risco={selectedBeneficiario.risco} />
            </div>
          </div>
        </Card>
      )}

      {/* Formulário Principal com Abas */}
      <form onSubmit={handleSave}>
        <Tabs defaultValue="dados_clinicos" className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="dados_clinicos" className="text-xs">
              1. Dados do Contato & Avaliação
            </TabsTrigger>
            <TabsTrigger value="questionario" className="text-xs flex items-center gap-1.5">
              <span>2. Questionário Clínico</span>
              {currentTemplate && (
                <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-1.5 py-0.2 rounded">
                  {currentTemplate.condicao_principal}
                </span>
              )}
              {respostasSalvas.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger value="plano_acao" className="text-xs">
              3. Plano de Ação & Intervenção
            </TabsTrigger>
            <TabsTrigger value="indicadores" className="text-xs">
              4. Indicadores & Fechamento
            </TabsTrigger>
            {!isNew && (
              <TabsTrigger value="historico" className="text-xs">
                5. Histórico de Auditoria ({historico.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Dados Clínicos */}
          <TabsContent value="dados_clinicos" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">
                  Etapa 5-7: Registro de Contato e Condição
                </CardTitle>
                <CardDescription className="text-xs">
                  Preencha o meio de comunicação, desfecho e anamnese clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isNew && (
                  <div>
                    <Label className="text-xs font-semibold">Selecione o Beneficiário</Label>
                    <Select
                      value={formData.beneficiario_id || ''}
                      onValueChange={handleBeneficiarioChange}
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue placeholder="Selecione um paciente..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {beneficiarios.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nome || b.nome_beneficiario} ({b.matricula}) -{' '}
                            {b.unidade || b.unidade_regiao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Meio de Contato</Label>
                    <Select
                      value={formData.meio_contato || 'WHATSAPP'}
                      onValueChange={(val) =>
                        setFormData({ ...formData, meio_contato: val as MeioContato })
                      }
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="LIGACAO_TELEFONICA">Ligação Telefônica</SelectItem>
                        <SelectItem value="EMAIL">E-mail</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Status do Contato</Label>
                    <Select
                      value={formData.status_contato || 'ATENDIDO'}
                      onValueChange={(val) =>
                        setFormData({ ...formData, status_contato: val as StatusContato })
                      }
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATENDIDO">Atendido com Sucesso</SelectItem>
                        <SelectItem value="OCUPADO">Ocupado</SelectItem>
                        <SelectItem value="SEM_RESPOSTA">Sem Resposta</SelectItem>
                        <SelectItem value="CONTATO_INCORRETO">Contato Incorreto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Data/Hora do Contato</Label>
                    <Input
                      type="datetime-local"
                      value={formData.data_contato || ''}
                      onChange={(e) => setFormData({ ...formData, data_contato: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Condição Principal Identificada</Label>
                    <Input
                      value={formData.condicao_principal || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, condicao_principal: e.target.value })
                      }
                      placeholder="Ex: Hipertensão Severa em descompensação"
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Classificação de Risco Clínico</Label>
                    <Select
                      value={formData.risco || 'MEDIO'}
                      onValueChange={(val) =>
                        setFormData({ ...formData, risco: val as NivelRisco })
                      }
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXO">Baixo Risco</SelectItem>
                        <SelectItem value="MEDIO">Médio Risco</SelectItem>
                        <SelectItem value="ALTO">Alto Risco</SelectItem>
                        <SelectItem value="CRITICO">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Descrição do Atendimento / Evolução
                  </Label>
                  <Textarea
                    rows={4}
                    value={formData.descricao_atendimento || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao_atendimento: e.target.value })
                    }
                    placeholder="Descreva a interação com o beneficiário, relato de sintomas, adesão medicamentosa e orientações..."
                    className="text-xs mt-1"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Questionário Clínico por Condição Principal */}
          <TabsContent value="questionario" className="space-y-4">
            <QuestionarioClinico
              fichaId={id && !isNew ? id : undefined}
              condicaoPrincipal={
                formData.condicao_principal || selectedBeneficiario?.condicao_principal
              }
              template={currentTemplate}
              allTemplates={allTemplates}
              onSelectTemplate={(tpl) => setCurrentTemplate(tpl)}
              respostasSalvas={respostasSalvas}
              onRespostasSalvasUpdated={reloadRespostasQuestionarios}
              usuarioAtualId={user?.id}
              perfilUsuario={user?.perfil || 'OPERACAO'}
              readOnly={false}
            />
          </TabsContent>

          {/* Tab 2: Plano de Ação */}
          <TabsContent value="plano_acao" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Atribuição de Plano de Ação</CardTitle>
                <CardDescription className="text-xs">
                  Vincule protocolos pré-definidos do catálogo institucional ou customize as
                  diretrizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">
                    Importar do Catálogo de Planos de Ação
                  </Label>
                  <Select onValueChange={handleSelectPlanoCatalogo}>
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue placeholder="Selecione um plano do catálogo para auto-preencher..." />
                    </SelectTrigger>
                    <SelectContent>
                      {planosAcao.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.necessidade_identificada} — {p.objetivo} ({p.prioridade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Profissional Responsável</Label>
                    <Input
                      value={formData.responsavel || ''}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">
                      Data Prevista para Próximo Contato
                    </Label>
                    <Input
                      type="date"
                      value={formData.data_proximo_contato || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, data_proximo_contato: e.target.value })
                      }
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Meta Clínica Estabelecida</Label>
                  <Input
                    value={formData.meta || ''}
                    onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                    placeholder="Ex: Reduzir HbA1c para < 7% e realizar MAPA 24h em 30 dias"
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Observações & Condutas</Label>
                  <Textarea
                    rows={3}
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações complementares sobre o paciente e rede de apoio..."
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Pendências / Exames a Realizar</Label>
                  <Input
                    value={formData.pendencias || ''}
                    onChange={(e) => setFormData({ ...formData, pendencias: e.target.value })}
                    placeholder="Ex: Enviar laudo ecocardiograma, aguardando retorno laboratorial..."
                    className="text-xs mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Indicadores e Status Geral */}
          <TabsContent value="indicadores" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Status Geral e Ciclo de Acompanhamento</CardTitle>
                <CardDescription className="text-xs">
                  Atualize o status no funil de cuidado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Status Geral da Ficha</Label>
                    <Select
                      value={formData.status_geral || 'EM_ACOMPANHAMENTO'}
                      onValueChange={(val) =>
                        setFormData({ ...formData, status_geral: val as StatusGeralFicha })
                      }
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EM_ACOMPANHAMENTO">Em Acompanhamento Ativo</SelectItem>
                        <SelectItem value="AGUARDANDO_RETORNO">
                          Aguardando Retorno do Paciente
                        </SelectItem>
                        <SelectItem value="PROXIMO_CONTATO">Agendado Próximo Contato</SelectItem>
                        <SelectItem value="ALTA">Alta Concluída</SelectItem>
                        <SelectItem value="DESISTENCIA">Desistência / Recusa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Data da Alta (Se aplicável)</Label>
                    <Input
                      type="date"
                      value={formData.data_alta ? formData.data_alta.slice(0, 10) : ''}
                      onChange={(e) => setFormData({ ...formData, data_alta: e.target.value })}
                      className="text-xs mt-1"
                      disabled={formData.status_geral !== 'ALTA'}
                    />
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Etapa 8: Pesquisa de Satisfação & Feedback
                  </span>

                  {formData.feedback && formData.feedback > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${s <= (formData.feedback || 0) ? 'fill-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-sm text-slate-800">
                        {formData.feedback} de 5 estrelas
                      </span>
                      <span className="text-xs text-slate-500">
                        (Respondida em:{' '}
                        {new Date(formData.data_resposta_pesquisa || '').toLocaleDateString(
                          'pt-BR',
                        )}
                        )
                      </span>
                    </div>
                  ) : formData.data_envio_pesquisa ? (
                    <div className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded border border-blue-200">
                      Pesquisa simulada disparada em{' '}
                      {new Date(formData.data_envio_pesquisa).toLocaleString('pt-BR')}. Aguardando
                      resposta do beneficiário.
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Ao conceder alta ao paciente, o sistema gerará automaticamente o link público
                      para a pesquisa de satisfação.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Histórico */}
          {!isNew && (
            <TabsContent value="historico" className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Trilha de Auditoria & Versões</CardTitle>
                  <CardDescription className="text-xs">
                    Todas as modificações incrementam a versão e gravam o histórico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {historico.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">
                      Nenhuma versão anterior registrada (versão inicial v1).
                    </p>
                  ) : (
                    historico.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-slate-50/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{new Date(h.created).toLocaleString('pt-BR')}</span>
                          <span className="font-semibold text-slate-700">
                            {h.expand?.alterado_por?.name || 'Profissional'}
                          </span>
                        </div>
                        <p className="font-semibold text-teal-800">{h.campo_alterado}</p>
                        <div className="text-slate-600">
                          <span className="text-slate-400">De:</span> {h.valor_anterior} &rarr;{' '}
                          <span className="text-teal-700 font-medium">Para:</span> {h.valor_novo}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>

      {/* Modal de Conclusão / Alta & Envio de Pesquisa (Etapa 8) */}
      <Dialog open={altaModalOpen} onOpenChange={setAltaModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento & Conceder Alta</DialogTitle>
            <DialogDescription className="text-xs">
              O status mudará para ALTA e o sistema gerará o link da Pesquisa de Satisfação
            </DialogDescription>
          </DialogHeader>

          {surveyLinkGenerated ? (
            <div className="space-y-4 py-2">
              <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs font-semibold">
                  Atendimento finalizado e Pesquisa de Satisfação gerada com sucesso!
                </AlertDescription>
              </Alert>

              <div className="p-3 bg-slate-100 rounded-lg space-y-1">
                <Label className="text-[11px] font-bold text-slate-700 uppercase">
                  Link Público da Pesquisa (Simulação de Envio):
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={surveyLinkGenerated}
                    className="text-xs font-mono bg-white h-8"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copySurveyLink}
                    className="h-8 px-2 shrink-0 text-xs gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <a href={surveyLinkGenerated} target="_blank" rel="noreferrer">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Pesquisa no Navegador
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAltaModalOpen(false)}
                  className="text-xs"
                >
                  Concluir
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold">Canal de Envio Simulado</Label>
                <Select
                  value={altaCanal}
                  onValueChange={(v) => setAltaCanal(v as 'WHATSAPP' | 'EMAIL')}
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp (Simulado)</SelectItem>
                    <SelectItem value="EMAIL">E-mail (Simulado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Observações de Alta</Label>
                <Textarea
                  rows={3}
                  value={altaObs}
                  onChange={(e) => setAltaObs(e.target.value)}
                  placeholder="Ex: Paciente com metas atingidas, orientado quanto a hábitos saudáveis e retorno anual."
                  className="text-xs mt-1"
                />
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAltaModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmAlta}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {saving ? 'Processando...' : 'Confirmar Alta e Gerar Pesquisa'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
