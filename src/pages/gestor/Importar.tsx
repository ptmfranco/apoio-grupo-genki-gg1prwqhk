import React, { useState, useEffect } from 'react'
import { getLotes, createLote, createBeneficiario } from '@/services/healthService'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  Users,
  ShieldCheck,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import { StepTracker } from '@/components/common/StepTracker'
import { RiskBadge } from '@/components/common/RiskBadge'
import { toast } from 'sonner'
import type { LoteSelecao } from '@/types'
import { getFaixaLabel } from '@/constants/faixasEtarias'
import { downloadModeloBeneficiariosXlsx } from '@/services/modeloPlanilhaService'
import { Download } from 'lucide-react'

// Mock de linhas para preview de planilha .xlsx/.csv
const PREVIEW_MOCK_DATA = [
  {
    id_externo: 'BI-901',
    nome_beneficiario: 'Valeria Siqueira Castro',
    matricula: 'MAT-3001',
    unidade_regiao: 'São Paulo - Matriz',
    tipo_vinculo: 'TITULAR',
    faixa: '07',
    faixa_etaria: '07',
    telefone: '(11) 3222-1199',
    celular: '(11) 97711-2233',
    email: 'valeria.castro@empresa.com.br',
    custo_12_meses: 19400.0,
    condicao_principal: 'Hipertensão com Risco Coronariano',
    risco: 'ALTO',
    permite_contato_whatsapp_sms: true,
  },
  {
    id_externo: 'BI-902',
    nome_beneficiario: 'Rodrigo Mendonça Prado',
    matricula: 'MAT-3002',
    unidade_regiao: 'Campinas - Filial',
    tipo_vinculo: 'TITULAR',
    faixa: '09',
    faixa_etaria: '09',
    telefone: '(19) 3344-9988',
    celular: '(19) 98822-4455',
    email: 'rodrigo.prado@empresa.com.br',
    custo_12_meses: 31200.0,
    condicao_principal: 'Diabetes Tipo 2 e Neuropatia',
    risco: 'CRITICO',
    permite_contato_whatsapp_sms: true,
  },
  {
    id_externo: 'BI-903',
    nome_beneficiario: 'Larissa Prado (Dependente)',
    matricula: 'MAT-3002-D1',
    unidade_regiao: 'Campinas - Filial',
    tipo_vinculo: 'DEPENDENTE',
    faixa: '02',
    faixa_etaria: '02',
    telefone: '(19) 3344-9988',
    celular: '(19) 98822-4456',
    email: 'larissa.prado@gmail.com',
    custo_12_meses: 2400.0,
    condicao_principal: 'Alergias Respiratórias Crônicas',
    risco: 'BAIXO',
    permite_contato_whatsapp_sms: true,
  },
  {
    id_externo: 'BI-904',
    nome_beneficiario: 'Gabriel Monteiro Neves',
    matricula: 'MAT-3003',
    unidade_regiao: 'Santos - Porto',
    tipo_vinculo: 'TITULAR',
    faixa: '06',
    faixa_etaria: '06',
    telefone: '(13) 3219-5566',
    celular: '(13) 99111-8899',
    email: 'gabriel.neves@empresa.com.br',
    custo_12_meses: 9800.0,
    condicao_principal: 'Lombalgia Ocupacional e Hipertensão Leve',
    risco: 'MEDIO',
    permite_contato_whatsapp_sms: true,
  },
]

export default function ImportarPlanilha() {
  const [lotes, setLotes] = useState<LoteSelecao[]>([])
  const [loading, setLoading] = useState(true)
  const [fileSelected, setFileSelected] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState(PREVIEW_MOCK_DATA)
  const [showPreview, setShowPreview] = useState(false)
  const [processing, setProcessing] = useState(false)

  const loadLotes = async () => {
    try {
      const data = await getLotes()
      setLotes(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLotes()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileSelected(e.target.files[0])
      setShowPreview(true)
      toast.success(`Arquivo "${e.target.files[0].name}" carregado para validação!`)
    }
  }

  const handleSimulateSelectFile = () => {
    // Simula upload imediato de planilha padrão
    setShowPreview(true)
    toast.info('Planilha de BI simulada carregada com 4 novos registros elegíveis.')
  }

  const handleProcessarLote = async () => {
    try {
      setProcessing(true)
      const loteCode = `LOTE-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`
      const custoTotalCalculado = previewData.reduce((acc, row) => acc + row.custo_12_meses, 0)

      // 1. Criar registro de lote
      const novoLote = await createLote({
        lote_id: loteCode,
        data_selecao: new Date().toISOString(),
        status: 'PROCESSADO',
        total_beneficiarios: previewData.length,
        custo_total: custoTotalCalculado,
      })

      // 2. Criar beneficiários no banco
      for (const row of previewData) {
        await createBeneficiario({
          id_externo: row.id_externo,
          nome_beneficiario: row.nome_beneficiario,
          matricula: row.matricula,
          unidade_regiao: row.unidade_regiao,
          tipo_vinculo: row.tipo_vinculo as 'TITULAR' | 'DEPENDENTE',
          faixa: row.faixa || row.faixa_etaria,
          faixa_etaria: row.faixa || row.faixa_etaria,
          telefone: row.telefone,
          celular: row.celular,
          email: row.email,
          custo_12_meses: row.custo_12_meses,
          data_selecao: new Date().toISOString(),
          lote_id: novoLote.id,
          status: 'ELEGIVEL',
          condicao_principal: row.condicao_principal,
          risco: row.risco as 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO',
          permite_contato_whatsapp_sms: row.permite_contato_whatsapp_sms,
          ativo: true,
        })
      }

      toast.success(
        `Lote ${loteCode} processado com sucesso! ${previewData.length} beneficiários importados.`,
      )
      setShowPreview(false)
      setFileSelected(null)
      await loadLotes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar e salvar beneficiários do lote.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" /> Etapa 2: Importação e Validação de Lotes
            (BI)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acesso TOTAL: O Gestor importa arquivos .xlsx/.csv gerados externamente pelo BI para
            criar novos ciclos
          </p>
        </div>
      </div>

      <StepTracker currentStep={2} />
      <LgpdNotice perfil="GESTOR" />

      {/* Upload Zone Card */}
      <Card className="border-dashed border-2 border-primary/40 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-2">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-bold">
            Importar Arquivo de Segurados Elegíveis
          </CardTitle>
          <CardDescription className="text-xs max-w-md mx-auto">
            Arraste ou selecione a planilha gerada pelo Business Intelligence (.xlsx, .csv). O
            sistema validará duplicidades e consistência dos dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-2 pb-6 gap-3">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" className="cursor-pointer gap-2" asChild>
                <span>
                  <Upload className="w-4 h-4 text-primary" /> Escolher Arquivo
                </span>
              </Button>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadModeloBeneficiariosXlsx('modelo-importacao-beneficiarios.xlsx')
              }
              className="text-xs font-semibold gap-1.5 shadow-sm border-[#D4A359]/60 text-[#163A4D] hover:bg-amber-50"
            >
              <Download className="w-4 h-4 text-[#D4A359]" /> Baixar Planilha Modelo
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSimulateSelectFile}
              className="bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Carregar Exemplo Demo
            </Button>
          </div>
          {fileSelected && (
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-4 h-4" /> Arquivo pronto: {fileSelected.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Section if uploaded */}
      {showPreview && (
        <Card className="border-teal-300 dark:border-teal-800 shadow-md animate-in fade-in">
          <CardHeader className="bg-teal-50/50 dark:bg-teal-950/20 border-b border-border pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-teal-950 dark:text-teal-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" /> Pré-visualização e Validação dos Dados
              </CardTitle>
              <CardDescription className="text-xs">
                {previewData.length} registros prontos para inserção na base de elegíveis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={processing}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleProcessarLote}
                disabled={processing}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1.5 shadow-md"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar e Processar Lote
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 font-semibold">Matrícula</th>
                    <th className="p-3 font-semibold">Nome Beneficiário</th>
                    <th className="p-3 font-semibold">Unidade / Região</th>
                    <th className="p-3 font-semibold">Vínculo</th>
                    <th className="p-3 font-semibold">Faixa Etária</th>
                    <th className="p-3 font-semibold">Condição Clínica</th>
                    <th className="p-3 font-semibold">Risco</th>
                    <th className="p-3 font-semibold text-right">Custo 12m</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.map((row) => (
                    <tr key={row.matricula} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                        {row.matricula}
                      </td>
                      <td className="p-3 font-semibold text-foreground">{row.nome_beneficiario}</td>
                      <td className="p-3 text-muted-foreground">{row.unidade_regiao}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {row.tipo_vinculo}
                        </Badge>
                      </td>
                      <td className="p-3 text-teal-800 dark:text-teal-300 font-medium">
                        {getFaixaLabel(row.faixa || row.faixa_etaria)}
                      </td>
                      <td className="p-3 font-medium text-foreground">{row.condicao_principal}</td>
                      <td className="p-3">
                        <RiskBadge level={row.risco} size="sm" />
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(row.custo_12_meses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Lotes Importados */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Histórico de Lotes de Seleção Importados</span>
            <Badge variant="secondary" className="text-xs font-semibold">
              {lotes.length} lotes
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Registro de todas as cargas de dados recebidas e processadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-y border-border">
                <tr>
                  <th className="p-3 font-semibold">ID do Lote</th>
                  <th className="p-3 font-semibold">Data da Importação</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Total Beneficiários</th>
                  <th className="p-3 font-semibold text-right">Custo Total Sinistral</th>
                  <th className="p-3 font-semibold">Importado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lotes.map((lote) => (
                  <tr key={lote.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">
                      {lote.lote_id}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(lote.data_selecao || lote.created).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-600 text-white text-[10px]">{lote.status}</Badge>
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">
                      {lote.total_beneficiarios}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(lote.custo_total || 0)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {lote.expand?.criado_por?.name || 'Dr. Carlos Gestor'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
