import React, { useEffect, useState, useMemo } from 'react'
import { QuestionariosService } from '@/services/saude'
import { QuestionarioTemplate, QuestaoClinica, TipoQuestaoClinica } from '@/types/saude'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Lock,
  Layers,
  Sparkles,
  ListOrdered,
  X,
  FileQuestion,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { CidCombobox } from '@/components/common/CidCombobox'

// 10 Condições Clínicas Conhecidas no Sistema
const CONDICOES_CONHECIDAS = [
  'Diabetes Mellitus',
  'Hipertensão Arterial',
  'Lombalgia Crônica',
  'Insuficiência Cardíaca',
  'Asma Brônquica',
  'Obesidade Grau II',
  'Gestação de Alto Risco',
  'Transtorno de Ansiedade',
  'Dislipidemia',
  'DPOC',
]

const TIPOS_QUESTAO: { value: TipoQuestaoClinica; label: string; desc: string }[] = [
  {
    value: 'texto_livre',
    label: 'Texto Livre',
    desc: 'Campo aberto para relatos, valores ou datas',
  },
  {
    value: 'escala',
    label: 'Escala Numérica (0-5)',
    desc: 'Avaliação graduada de 0 a 5 com legendas',
  },
  { value: 'sim_nao', label: 'Sim ou Não', desc: 'Seleção dicotômica direta' },
  {
    value: 'multipla_escolha',
    label: 'Múltipla Escolha',
    desc: 'Lista de opções com seleção única',
  },
]

export default function GestorQuestionariosCrud() {
  const { perfil } = useAuth()
  const [templates, setTemplates] = useState<QuestionarioTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS')

  // Modais de Criação/Edição
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuestionarioTemplate | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Estado do Formulário
  const [condicaoPrincipal, setCondicaoPrincipal] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [questoes, setQuestoes] = useState<QuestaoClinica[]>([])

  // Modal de Exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<QuestionarioTemplate | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Modal de Visualização/Preview Rápido
  const [previewTemplate, setPreviewTemplate] = useState<QuestionarioTemplate | null>(null)

  // Carregar dados
  const carregarTemplates = async () => {
    setLoading(true)
    try {
      const data = await QuestionariosService.getTemplates(false) // trazer ativos e inativos
      setTemplates(data)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar questionários',
        description: err?.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTemplates()
  }, [])

  // Filtragem da lista (executada incondicionalmente antes de qualquer retorno)
  const templatesFiltrados = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.condicao_principal.toLowerCase().includes(search.toLowerCase()) ||
        t.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (t.descricao && t.descricao.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        filtroStatus === 'TODOS'
          ? true
          : filtroStatus === 'ATIVOS'
            ? t.ativo === true
            : t.ativo === false

      return matchesSearch && matchesStatus
    })
  }, [templates, search, filtroStatus])

  // Proteção de acesso: se não for GESTOR_VENART
  if (perfil !== 'GESTOR_VENART') {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">
                Acesso Restrito ao Perfil Venart
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                A gestão e parametrização dos templates de questionários clínicos é exclusiva para
                usuários com perfil <strong>GESTOR_VENART</strong>. Demais gestores e operadores não
                possuem permissão para alterar diretrizes clínicas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Abertura para novo template
  const handleNovoTemplate = () => {
    setEditingTemplate(null)
    setCondicaoPrincipal('')
    setTitulo('')
    setDescricao('')
    setAtivo(true)
    setQuestoes([
      {
        id: `q_${Date.now()}_1`,
        enunciado: '',
        tipo: 'texto_livre',
        obrigatoria: true,
        placeholder: '',
      },
    ])
    setModalOpen(true)
  }

  // Abertura para edição
  const handleEditarTemplate = (tpl: QuestionarioTemplate) => {
    setEditingTemplate(tpl)
    setCondicaoPrincipal(tpl.condicao_principal || '')
    setTitulo(tpl.titulo || '')
    setDescricao(tpl.descricao || '')
    setAtivo(tpl.ativo ?? true)
    setQuestoes(
      tpl.questoes && tpl.questoes.length > 0
        ? JSON.parse(JSON.stringify(tpl.questoes))
        : [
            {
              id: `q_${Date.now()}_1`,
              enunciado: '',
              tipo: 'texto_livre',
              obrigatoria: true,
            },
          ],
    )
    setModalOpen(true)
  }

  // Ações de Questões no Editor
  const handleAddQuestao = () => {
    const novaQuestao: QuestaoClinica = {
      id: `q_${Date.now()}_${questoes.length + 1}`,
      enunciado: '',
      tipo: 'texto_livre',
      obrigatoria: true,
      placeholder: '',
    }
    setQuestoes([...questoes, novaQuestao])
  }

  const handleRemoveQuestao = (index: number) => {
    if (questoes.length <= 1) {
      toast({
        title: 'Operação não permitida',
        description: 'O questionário deve possuir pelo menos 1 questão clínica.',
        variant: 'destructive',
      })
      return
    }
    const updated = [...questoes]
    updated.splice(index, 1)
    setQuestoes(updated)
  }

  const handleMoverQuestao = (index: number, direcao: 'cima' | 'baixo') => {
    if (
      (direcao === 'cima' && index === 0) ||
      (direcao === 'baixo' && index === questoes.length - 1)
    ) {
      return
    }
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1
    const updated = [...questoes]
    const item = updated.splice(index, 1)[0]
    updated.splice(novoIndex, 0, item)
    setQuestoes(updated)
  }

  const handleUpdateQuestao = (index: number, patch: Partial<QuestaoClinica>) => {
    const updated = [...questoes]
    updated[index] = { ...updated[index], ...patch }
    setQuestoes(updated)
  }

  const handleOpcaoMultiplaChange = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questoes]
    const opts = [...(updated[qIndex].opcoes || [])]
    opts[optIndex] = val
    updated[qIndex].opcoes = opts
    setQuestoes(updated)
  }

  const handleAddOpcaoMultipla = (qIndex: number) => {
    const updated = [...questoes]
    const opts = [...(updated[qIndex].opcoes || [])]
    opts.push(`Opção ${opts.length + 1}`)
    updated[qIndex].opcoes = opts
    setQuestoes(updated)
  }

  const handleRemoveOpcaoMultipla = (qIndex: number, optIndex: number) => {
    const updated = [...questoes]
    const opts = [...(updated[qIndex].opcoes || [])]
    if (opts.length <= 2) {
      toast({
        title: 'Mínimo de opções',
        description: 'Uma questão de múltipla escolha deve ter pelo menos 2 opções.',
        variant: 'destructive',
      })
      return
    }
    opts.splice(optIndex, 1)
    updated[qIndex].opcoes = opts
    setQuestoes(updated)
  }

  // Validação e Gravação
  const handleSalvarTemplate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!condicaoPrincipal.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe a condição clínica principal associada a este template.',
        variant: 'destructive',
      })
      return
    }

    if (!titulo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe o título do protocolo do questionário.',
        variant: 'destructive',
      })
      return
    }

    if (questoes.length === 0) {
      toast({
        title: 'Validação de questões',
        description: 'O questionário deve conter no mínimo 1 questão.',
        variant: 'destructive',
      })
      return
    }

    // Validar enunciados em branco ou duplicados
    const enunciadosNorm = new Set<string>()
    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i]
      const text = q.enunciado.trim()
      if (!text) {
        toast({
          title: 'Questão incompleta',
          description: `A questão #${i + 1} está com o enunciado vazio.`,
          variant: 'destructive',
        })
        return
      }

      const lower = text.toLowerCase()
      if (enunciadosNorm.has(lower)) {
        toast({
          title: 'Questão duplicada',
          description: `A questão #${i + 1} possui enunciado idêntico a outra questão.`,
          variant: 'destructive',
        })
        return
      }
      enunciadosNorm.add(lower)

      // Validação de tipo de questão
      if (q.tipo === 'multipla_escolha') {
        if (!q.opcoes || q.opcoes.length < 2) {
          toast({
            title: 'Opções insuficientes',
            description: `A questão #${i + 1} (Múltipla Escolha) requer ao menos 2 opções configuradas.`,
            variant: 'destructive',
          })
          return
        }
        if (q.opcoes.some((opt) => !opt.trim())) {
          toast({
            title: 'Opção em branco',
            description: `A questão #${i + 1} possui opções de múltipla escolha vazias.`,
            variant: 'destructive',
          })
          return
        }
      }
    }

    setSalvando(true)
    try {
      const payload: Partial<QuestionarioTemplate> = {
        condicao_principal: condicaoPrincipal.trim(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        ativo,
        questoes: questoes.map((q, idx) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${idx + 1}`,
          enunciado: q.enunciado.trim(),
          escalaMin: q.tipo === 'escala' ? (q.escalaMin ?? 0) : undefined,
          escalaMax: q.tipo === 'escala' ? (q.escalaMax ?? 5) : undefined,
          legendaMin: q.tipo === 'escala' ? q.legendaMin : undefined,
          legendaMax: q.tipo === 'escala' ? q.legendaMax : undefined,
          opcoes: q.tipo === 'multipla_escolha' ? q.opcoes : undefined,
          placeholder: q.tipo === 'texto_livre' ? q.placeholder : undefined,
        })),
      }

      if (editingTemplate) {
        await QuestionariosService.updateTemplate(editingTemplate.id, payload)
        toast({
          title: 'Template atualizado com sucesso!',
          description: `O protocolo "${titulo}" foi gravado.`,
        })
      } else {
        await QuestionariosService.createTemplate(payload)
        toast({
          title: 'Template criado com sucesso!',
          description: `Novo protocolo "${titulo}" adicionado ao catálogo clínico.`,
        })
      }

      setModalOpen(false)
      carregarTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar questionário',
        description: err?.message || 'Falha ao processar requisição.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Alternar Ativo/Inativo na tabela
  const handleToggleAtivo = async (tpl: QuestionarioTemplate) => {
    try {
      const novoStatus = !tpl.ativo
      await QuestionariosService.toggleAtivoTemplate(tpl.id, novoStatus)
      toast({
        title: novoStatus ? 'Template ativado' : 'Template desativado',
        description: `O protocolo para "${tpl.condicao_principal}" agora está ${novoStatus ? 'ativo' : 'inativo'}.`,
      })
      carregarTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status',
        description: err?.message || 'Não foi possível alterar o status do template.',
        variant: 'destructive',
      })
    }
  }

  // Duplicar template
  const handleDuplicar = async (tpl: QuestionarioTemplate) => {
    try {
      await QuestionariosService.duplicarTemplate(tpl)
      toast({
        title: 'Template duplicado com sucesso!',
        description: `Uma cópia de "${tpl.titulo}" foi criada e já está disponível para edição.`,
      })
      carregarTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao duplicar template',
        description: err?.message || 'Falha ao clonar o template.',
        variant: 'destructive',
      })
    }
  }

  // Confirmar Exclusão
  const handleConfirmExcluir = async () => {
    if (!itemParaExcluir) return
    setExcluindo(true)
    try {
      const res = await QuestionariosService.deleteTemplate(itemParaExcluir.id, true)
      if (res.soft) {
        toast({
          title: 'Template desativado (Soft Delete)',
          description:
            'Como já existem respostas clínicas gravadas vinculadas a este protocolo, o template foi inativado para proteger o histórico dos atendimentos.',
        })
      } else {
        toast({
          title: 'Template excluído definitivamente',
          description: `O protocolo "${itemParaExcluir.titulo}" foi removido do banco.`,
        })
      }
      setItemParaExcluir(null)
      carregarTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir template',
        description: err?.message || 'Não foi possível excluir o questionário.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Gestão de Questionários Clínicos
            </h1>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-[11px] font-bold">
              Exclusivo Venart
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Parametrize os protocolos de acompanhamento clínico, perguntas-chave e formatos de
            resposta aplicados pelos atendentes nas fichas de cuidado.
          </p>
        </div>

        <Button
          onClick={handleNovoTemplate}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Protocolo Clínico
        </Button>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total de Protocolos
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {templates.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Protocolos Ativos
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {templates.filter((t) => t.ativo).length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total de Questões Cadastradas
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {templates.reduce((acc, t) => acc + (t.questoes?.length || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ListOrdered className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Listagem com Filtros */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Buscar por condição, título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Filtrar Status:
              </span>
              <Select value={filtroStatus} onValueChange={(val: any) => setFiltroStatus(val)}>
                <SelectTrigger className="h-9 text-xs w-36 bg-white dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos ({templates.length})</SelectItem>
                  <SelectItem value="ATIVOS">
                    Ativos ({templates.filter((t) => t.ativo).length})
                  </SelectItem>
                  <SelectItem value="INATIVOS">
                    Inativos ({templates.filter((t) => !t.ativo).length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto" />
              <p>Carregando protocolos clínicos...</p>
            </div>
          ) : templatesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Nenhum questionário encontrado.
              </p>
              <p className="text-[11px] text-slate-400">
                Tente ajustar os filtros de busca ou cadastre um novo protocolo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Condição Principal</th>
                    <th className="p-3.5">Título do Protocolo</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5 text-center">Nº Questões</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {templatesFiltrados.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="font-bold border-teal-500/40 text-teal-800 bg-teal-50/60 dark:bg-teal-950/40 dark:text-teal-300 text-[11px]"
                        >
                          {tpl.condicao_principal}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tpl)}
                          className="text-left hover:text-teal-600 dark:hover:text-teal-400 hover:underline cursor-pointer"
                          title="Clique para visualizar o questionário"
                        >
                          {tpl.titulo}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                        {tpl.descricao || '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                          {tpl.questoes?.length || 0}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            tpl.ativo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {tpl.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarTemplate(tpl)}
                          className="h-8 px-2 text-slate-700 dark:text-slate-300 hover:text-teal-600"
                          title="Editar questionário"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicar(tpl)}
                          className="h-8 px-2 text-slate-700 dark:text-slate-300 hover:text-teal-600"
                          title="Duplicar questionário"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Duplicar
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAtivo(tpl)}
                          className={`h-8 px-2 ${
                            tpl.ativo
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                          title={tpl.ativo ? 'Desativar template' : 'Ativar template'}
                        >
                          {tpl.ativo ? 'Desativar' : 'Ativar'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemParaExcluir(tpl)}
                          className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Excluir questionário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Template */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              {editingTemplate
                ? 'Editar Protocolo de Questionário'
                : 'Novo Protocolo de Questionário'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure as informações gerais do protocolo e gerencie as questões clínicas
              específicas da condição de saúde.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarTemplate} className="space-y-5 py-2">
            {/* Bloco 1: Dados Gerais */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">
                    Condição Principal de Saúde (CID-10) *
                  </Label>
                  <div className="mt-1">
                    <CidCombobox
                      value={condicaoPrincipal}
                      onChange={(val) => setCondicaoPrincipal(val)}
                      placeholder="Selecione o CID-10 ou busque por código/descrição..."
                      required
                    />
                  </div>

                  {/* Sugestões das condições pré-configuradas */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 self-center mr-1">Sugestões:</span>
                    {CONDICOES_CONHECIDAS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCondicaoPrincipal(c)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          condicaoPrincipal === c
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Status do Protocolo</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="template-ativo" checked={ativo} onCheckedChange={setAtivo} />
                    <Label
                      htmlFor="template-ativo"
                      className="text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {ativo ? 'Ativo (Disponível na Ficha)' : 'Inativo (Suspenso)'}
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Título do Questionário Clínico *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Protocolo de Acompanhamento Clínico — Diabetes Mellitus"
                  required
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Descrição / Diretriz de Acompanhamento
                </Label>
                <Textarea
                  rows={2}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Orientações e objetivos clínicos deste questionário..."
                  className="text-xs mt-1"
                />
              </div>
            </div>

            {/* Bloco 2: Editor de Questões */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-teal-600" />
                    Questões do Questionário ({questoes.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina o enunciado, tipo de resposta e reordene as perguntas conforme o fluxo
                    clínico.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleAddQuestao}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-teal-500 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950 font-semibold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Questão
                </Button>
              </div>

              <div className="space-y-3">
                {questoes.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    {/* Linha superior: cabeçalho da questão e reordenação */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Questão #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMoverQuestao(idx, 'cima')}
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === questoes.length - 1}
                          onClick={() => handleMoverQuestao(idx, 'baixo')}
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveQuestao(idx)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1"
                          title="Remover questão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Enunciado e Tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Enunciado da Pergunta *
                        </Label>
                        <Input
                          value={q.enunciado}
                          onChange={(e) => handleUpdateQuestao(idx, { enunciado: e.target.value })}
                          placeholder="Digite o enunciado claro da pergunta..."
                          required
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Tipo de Resposta
                        </Label>
                        <Select
                          value={q.tipo}
                          onValueChange={(val: TipoQuestaoClinica) => {
                            const patch: Partial<QuestaoClinica> = { tipo: val }
                            if (
                              val === 'multipla_escolha' &&
                              (!q.opcoes || q.opcoes.length === 0)
                            ) {
                              patch.opcoes = ['Opção 1', 'Opção 2', 'Opção 3']
                            }
                            if (val === 'escala') {
                              patch.escalaMin = 0
                              patch.escalaMax = 5
                              patch.legendaMin = '0 = Mínimo / Ruim'
                              patch.legendaMax = '5 = Máximo / Excelente'
                            }
                            handleUpdateQuestao(idx, patch)
                          }}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_QUESTAO.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                <div>
                                  <span className="font-semibold">{t.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Configurações específicas por tipo */}
                    {q.tipo === 'texto_livre' && (
                      <div className="space-y-1 pt-1">
                        <Label className="text-[10px] text-slate-500">
                          Placeholder (Dica para o atendente)
                        </Label>
                        <Input
                          value={q.placeholder || ''}
                          onChange={(e) =>
                            handleUpdateQuestao(idx, { placeholder: e.target.value })
                          }
                          placeholder="Ex: 7.2% (realizado em 15/01/2026)"
                          className="text-xs h-8"
                        />
                      </div>
                    )}

                    {q.tipo === 'escala' && (
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Configuração da Escala (0 a 5)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-slate-500">Legenda Mínima (0)</Label>
                            <Input
                              value={q.legendaMin || ''}
                              onChange={(e) =>
                                handleUpdateQuestao(idx, { legendaMin: e.target.value })
                              }
                              placeholder="Ex: 0 = Não adere / Interrompeu"
                              className="text-xs h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">Legenda Máxima (5)</Label>
                            <Input
                              value={q.legendaMax || ''}
                              onChange={(e) =>
                                handleUpdateQuestao(idx, { legendaMax: e.target.value })
                              }
                              placeholder="Ex: 5 = Adesão integral 100%"
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {q.tipo === 'multipla_escolha' && (
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Opções de Escolha
                          </span>
                          <Button
                            type="button"
                            onClick={() => handleAddOpcaoMultipla(idx)}
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-teal-700 hover:bg-teal-50 font-semibold"
                          >
                            + Adicionar Opção
                          </Button>
                        </div>

                        <div className="space-y-1.5">
                          {(q.opcoes || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 w-4">{optIdx + 1}.</span>
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  handleOpcaoMultiplaChange(idx, optIdx, e.target.value)
                                }
                                placeholder={`Opção ${optIdx + 1}`}
                                className="text-xs h-7 flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOpcaoMultipla(idx, optIdx)}
                                className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                title="Remover opção"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campo de Obrigatoriedade */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`obrigatoria-${idx}`}
                          checked={q.obrigatoria ?? true}
                          onCheckedChange={(checked) =>
                            handleUpdateQuestao(idx, { obrigatoria: checked })
                          }
                        />
                        <Label
                          htmlFor={`obrigatoria-${idx}`}
                          className="text-[11px] font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          Resposta Obrigatória para o atendente
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Gravando Template...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {editingTemplate ? 'Atualizar Questionário' : 'Criar Questionário'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog
        open={!!itemParaExcluir}
        onOpenChange={(open) => !open && setItemParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Excluir Protocolo Clínico?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Você está prestes a excluir o protocolo <strong>
                "{itemParaExcluir?.titulo}"
              </strong> (
              {itemParaExcluir?.condicao_principal}).
              <br />
              <br />
              <strong>Proteção de Integridade:</strong> Se este questionário já possuir avaliações
              preenchidas vinculadas no histórico de fichas de atendimento, o sistema executará
              automaticamente um <em>soft delete</em> (desativação), garantindo que as respostas
              anteriores continuem perfeitamente legíveis no histórico clínico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluir}
              disabled={excluindo}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {excluindo ? 'Processando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Preview do Template */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-teal-700 border-teal-500 bg-teal-50">
                {previewTemplate?.condicao_principal}
              </Badge>
              <Badge
                className={
                  previewTemplate?.ativo
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }
              >
                {previewTemplate?.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 mt-2">
              {previewTemplate?.titulo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              {previewTemplate?.descricao || 'Sem descrição cadastrada.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 border-t border-slate-100 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Questões Cadastradas ({previewTemplate?.questoes?.length || 0})
            </h4>

            {previewTemplate?.questoes?.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {idx + 1}. {q.enunciado}{' '}
                    {q.obrigatoria && <span className="text-rose-500">*</span>}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {q.tipo === 'sim_nao'
                      ? 'Sim/Não'
                      : q.tipo === 'escala'
                        ? 'Escala 0-5'
                        : q.tipo === 'multipla_escolha'
                          ? 'Múltipla Escolha'
                          : 'Texto Livre'}
                  </Badge>
                </div>

                {q.tipo === 'escala' && (
                  <div className="text-[11px] text-slate-500">
                    Legendas: {q.legendaMin || '0 = Mínimo'} → {q.legendaMax || '5 = Máximo'}
                  </div>
                )}

                {q.tipo === 'multipla_escolha' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(q.opcoes || []).map((opt, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}

                {q.tipo === 'texto_livre' && q.placeholder && (
                  <div className="text-[11px] italic text-slate-400">Dica: {q.placeholder}</div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
              className="text-xs"
            >
              Fechar Visualização
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (previewTemplate) {
                  const t = previewTemplate
                  setPreviewTemplate(null)
                  handleEditarTemplate(t)
                }
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" /> Editar Protocolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
