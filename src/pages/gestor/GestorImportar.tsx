import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LotesService } from '@/services/saude'
import { Beneficiario, NivelRisco, TipoVinculo } from '@/types/saude'
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
import { RiscoBadge } from '@/components/common/Badges'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  AlertTriangle,
  Download,
  HelpCircle,
  Info,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import { formatPhone, isValidPhone11, onlyDigits } from '@/lib/phoneMask'
import {
  downloadModeloBeneficiariosXlsx,
  DADOS_EXEMPLO_MODELO,
} from '@/services/modeloPlanilhaService'
import * as XLSX from 'xlsx'

export default function GestorImportarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<Array<Partial<Beneficiario>>>([])
  const [validationErrors, setValidationErrors] = useState<
    Array<{ linha: number; matricula?: string; nome?: string; motivo: string }>
  >([])
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Amostra modelo com 10 registros padronizados (coerentes com a planilha modelo baixada)
  const mockSpreadsheetRows: Array<Partial<Beneficiario>> = DADOS_EXEMPLO_MODELO.map((item, i) => {
    const faixaId = normalizeFaixaId(item.faixa_etaria)
    return {
      id_externo: `BENEF-IMP-${Date.now().toString().slice(-4)}-${i + 1}`,
      matricula: item.matricula,
      nome_beneficiario: item.nome,
      tipo_vinculo: item.vinculo,
      unidade_regiao: item.unidade,
      faixa: faixaId,
      faixa_etaria: faixaId,
      telefone: item.telefone,
      celular: item.celular,
      email: item.email || '',
      custo_12_meses: item.custo_12m,
      custo_12m: item.custo_12m,
      condicao_principal: item.condicao_principal,
      risco: item.risco as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    }
  })

  // Normalização e validação das linhas importadas
  const processAndValidateRows = (
    rows: Array<Partial<Beneficiario>>,
  ): { validRows: Array<Partial<Beneficiario>>; errors: typeof validationErrors } => {
    const validRows: Array<Partial<Beneficiario>> = []
    const errors: typeof validationErrors = []

    rows.forEach((row, idx) => {
      const linha = idx + 1
      const celDigits = onlyDigits(row.celular)
      const telDigits = onlyDigits(row.telefone)

      const rowErrors: string[] = []
      if (!celDigits) {
        rowErrors.push('Celular/WhatsApp ausente')
      } else if (celDigits.length !== 11) {
        rowErrors.push(`Celular/WhatsApp inválido: ${celDigits.length} dígitos (requer 11)`)
      }

      if (!telDigits) {
        rowErrors.push('Telefone ausente')
      } else if (telDigits.length !== 11) {
        rowErrors.push(`Telefone inválido: ${telDigits.length} dígitos (requer 11)`)
      }

      if (rowErrors.length > 0) {
        errors.push({
          linha,
          matricula: row.matricula || '—',
          nome: row.nome_beneficiario || '—',
          motivo: rowErrors.join(' | '),
        })
      } else {
        validRows.push({
          ...row,
          celular: formatPhone(celDigits),
          telefone: formatPhone(telDigits),
        })
      }
    })

    return { validRows, errors }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const firstSheet = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheet]
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (json.length === 0) {
        setErrorMsg('Arquivo vazio ou sem dados legíveis.')
        setPreviewData([])
        return
      }

      // Mapear campos flexíveis do Excel
      const rawBeneficiarios: Array<Partial<Beneficiario>> = json.map((r, i) => {
        const matricula = String(r.matricula || r.Matricula || r.MATRICULA || `MAT-${1000 + i}`)
        const nome = String(r.nome || r.Nome || r.nome_beneficiario || r['Nome Completo'] || '')
        const rawVinculo = String(
          r.vinculo || r.tipo_vinculo || r.Vínculo || r.Vinculo || 'TITULAR',
        ).toUpperCase()
        const vinculo: TipoVinculo = rawVinculo.includes('DEP') ? 'DEPENDENTE' : 'TITULAR'

        const unidade = String(r.unidade || r.unidade_regiao || r.Unidade || 'Matriz')

        // Normalização flexível de faixa etária ("01".."10" ou rótulos "34 a 38 anos")
        const rawFaixa = String(
          r.faixa || r.faixa_etaria || r.Faixa || r['Faixa Etária'] || r['Faixa Etaria'] || '05',
        )
        const faixa = normalizeFaixaId(rawFaixa)

        const tel = String(r.telefone || r.Telefone || r.fone || r.fixo || '')
        const cel = String(r.celular || r.Celular || r.whatsapp || r.WhatsApp || '')
        const cond = String(
          r.condicao ||
            r.condicao_principal ||
            r['Condição Principal'] ||
            r['Condicao Principal'] ||
            r.diagnostico ||
            r.cid ||
            '',
        )

        // Normalização de risco com fallback seguro
        const rawRisco = String(r.risco || r.Risco || 'MEDIO')
          .toUpperCase()
          .trim()
        const riscoVal: NivelRisco = ['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'].includes(rawRisco)
          ? (rawRisco as NivelRisco)
          : 'MEDIO'

        const custo =
          parseFloat(r.custo || r.custo_12m || r.custo_12_meses || r['Custo 12m'] || '0') || 0
        const email = String(r.email || r.Email || r['E-mail'] || '')

        return {
          id_externo: `BENEF-IMP-${Date.now().toString().slice(-4)}-${i + 1}`,
          matricula,
          nome_beneficiario: nome,
          tipo_vinculo: vinculo,
          unidade_regiao: unidade,
          faixa,
          faixa_etaria: faixa,
          telefone: tel,
          celular: cel,
          email,
          condicao_principal: cond,
          risco: riscoVal,
          custo_12_meses: custo,
          custo_12m: custo,
          status: 'ELEGIVEL',
          permite_contato_whatsapp_sms: true,
        }
      })

      const { validRows, errors } = processAndValidateRows(rawBeneficiarios)
      setPreviewData(validRows)
      setValidationErrors(errors)
    } catch (err: any) {
      setErrorMsg(`Erro ao processar arquivo: ${err?.message || 'Formato inválido'}`)
      setPreviewData([])
    }
  }

  const loadExampleSpreadsheet = () => {
    setFileName('modelo-importacao-beneficiarios.xlsx (10 registros)')
    const { validRows, errors } = processAndValidateRows(mockSpreadsheetRows)
    setPreviewData(validRows)
    setValidationErrors(errors)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleDownloadTemplate = () => {
    try {
      downloadModeloBeneficiariosXlsx('modelo-importacao-beneficiarios.xlsx')
    } catch (err: any) {
      setErrorMsg(`Erro ao gerar planilha modelo: ${err?.message || 'Falha no download'}`)
    }
  }

  const handleProcessLote = async () => {
    if (previewData.length === 0) return
    setProcessing(true)
    setErrorMsg(null)

    try {
      const loteId = `LOTE-2026-${Date.now().toString().slice(-4)}`
      const custoTotal = previewData.reduce(
        (acc, curr) =>
          acc + ((curr.custo_12m !== undefined ? curr.custo_12m : curr.custo_12_meses) || 0),
        0,
      )

      await LotesService.createWithBeneficiarios(
        {
          codigo_lote: loteId,
          tipo_lote: 'NOVO_REGISTRO',
          total_registros: previewData.length,
          custo_total: custoTotal,
          usuario_importador_id: user?.id || '',
        },
        previewData,
      )

      setSuccessMsg(
        `Lote ${loteId} processado com sucesso! ${previewData.length} beneficiários importados no status ELEGÍVEL.`,
      )
      setPreviewData([])
      setFileName(null)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar lote no PocketBase.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Importação de Planilha de Beneficiários (Etapa 1)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Faça upload de dados de sinistro, risco e prontuários para alimentar o ciclo de gestão de
          saúde
        </p>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-sm font-medium flex items-center justify-between w-full">
            <span>{successMsg}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/gestor/selecionar')}
              className="bg-white text-emerald-800 border-emerald-400 text-xs ml-4"
            >
              Ir para Seleção <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Relatório de Validação de Contatos */}
      {validationErrors.length > 0 && (
        <Alert className="bg-amber-50 border-amber-300 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-bold text-sm">
            Linhas Descartadas por Inconsistência de Contato ({validationErrors.length})
          </AlertTitle>
          <AlertDescription className="text-xs space-y-2 mt-1">
            <p>
              Telefone e WhatsApp são obrigatórios com exatamente 11 dígitos numéricos (DDD +
              celular). As seguintes linhas foram excluídas da importação para garantir a
              integridade:
            </p>
            <div className="mt-2 p-2 bg-white/80 rounded border border-amber-200 max-h-36 overflow-y-auto font-mono text-[11px] text-amber-950 space-y-1">
              {validationErrors.map((err, i) => (
                <div key={i}>
                  Linha {err.linha} | Matrícula: {err.matricula} ({err.nome}) — {err.motivo}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Box de Instruções e Download de Modelo */}
      <Card className="border-[#D4A359]/40 bg-gradient-to-r from-amber-50/70 to-slate-50 border shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-[#163A4D] font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-[#D4A359]" />
              <span>Precisa do modelo padrão para preenchimento?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Baixe nossa <strong>planilha modelo oficial (.xlsx)</strong> com as colunas já
              formatadas e <strong>10 registros de exemplo</strong> com matrículas, vínculos, faixas
              etárias padronizadas, condições clínicas (CID-10), riscos e telefones no formato
              obrigatório de 11 dígitos.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleDownloadTemplate}
            className="bg-[#163A4D] hover:bg-[#163A4D]/90 text-white border border-[#D4A359]/30 text-xs font-semibold gap-2 shadow-sm shrink-0"
          >
            <Download className="w-4 h-4 text-[#D4A359]" />
            Baixar Planilha Modelo (.xlsx)
          </Button>
        </CardContent>
      </Card>

      {/* Upload Box */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Carregar Arquivo .XLSX ou .CSV</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                A planilha deve conter matrícula, nome, vínculo, unidade, contatos (celular e
                telefone obrigatórios com 11 dígitos), custo 12m, risco e condição clínica
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs text-slate-700 border-slate-300 hover:bg-slate-100 self-start sm:self-auto gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#163A4D]" />
              Baixar Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              {fileName ? fileName : 'Arraste a planilha ou clique para selecionar'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou CSV (.csv)
            </p>

            <div className="flex flex-wrap justify-center items-center gap-3">
              <label htmlFor="file-upload">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="default"
                  className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                  asChild
                >
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>

              <Button
                type="button"
                variant="outline"
                onClick={loadExampleSpreadsheet}
                className="text-slate-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1 text-teal-600" />
                Carregar 10 Registros Modelo Demo
              </Button>
            </div>
          </div>

          {/* Dicas e Requisitos de Importação */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>Regras importantes para a importação sem descartes:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-slate-600">
              <li>
                <strong>Telefones e WhatsApp são obrigatórios:</strong> ambos devem conter
                exatamente 11 dígitos numéricos (DDD + 9 dígitos), ex:{' '}
                <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">
                  (11) 98888-7777
                </code>
                .
              </li>
              <li>
                <strong>Faixas Etárias:</strong> utilize uma das 10 faixas padronizadas (ex:{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">0 a 18 anos</code>,{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">34 a 38 anos</code>,
                ...,{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">59 anos ou mais</code>
                ) ou o código da faixa de{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">01</code> a{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">10</code>.
              </li>
              <li>
                <strong>Vínculo:</strong> informe{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">TITULAR</code> ou{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">DEPENDENTE</code>.
              </li>
              <li>
                <strong>Classificação de Risco:</strong> valores aceitos:{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">BAIXO</code>,{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">MEDIO</code>,{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">ALTO</code> ou{' '}
                <code className="bg-slate-200/70 px-1 rounded text-slate-800">CRITICO</code>.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {previewData.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Pré-visualização dos Dados Importados ({previewData.length} registros)
              </CardTitle>
              <CardDescription className="text-xs">
                Confira os campos antes de processar e gerar o Lote no sistema
              </CardDescription>
            </div>
            <Button
              onClick={handleProcessLote}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {processing ? 'Processando Lote...' : 'Processar e Criar Lote'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Matrícula</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Vínculo</th>
                    <th className="p-3">Unidade</th>
                    <th className="p-3">Faixa Etária</th>
                    <th className="p-3">Condição Principal</th>
                    <th className="p-3">Risco</th>
                    <th className="p-3">Custo 12 Meses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{row.matricula}</td>
                      <td className="p-3 font-medium text-slate-900">{row.nome_beneficiario}</td>
                      <td className="p-3 text-xs">{row.tipo_vinculo}</td>
                      <td className="p-3 text-xs">{row.unidade_regiao}</td>
                      <td className="p-3 text-xs font-medium text-teal-800">
                        {getFaixaLabel(row.faixa || row.faixa_etaria)}
                      </td>
                      <td className="p-3 text-xs text-slate-800 font-medium">
                        {row.condicao_principal}
                      </td>
                      <td className="p-3">
                        <RiscoBadge risco={row.risco} />
                      </td>
                      <td className="p-3 font-mono text-xs font-semibold text-emerald-700">
                        {(row.custo_12_meses || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50 border-t p-4 text-xs text-slate-500">
            <span>
              Total Custo Estimado: R${' '}
              {previewData.reduce((a, c) => a + (c.custo_12_meses || 0), 0).toLocaleString('pt-BR')}
            </span>
            <span>Total Beneficiários: {previewData.length}</span>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
