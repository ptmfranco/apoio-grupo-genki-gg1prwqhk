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
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getFaixaLabel } from '@/constants/faixasEtarias'

export default function GestorImportarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<Array<Partial<Beneficiario>>>([])
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Amostra mock para quando o usuário seleciona um arquivo ou clica em "Carregar Planilha Modelo"
  const mockSpreadsheetRows: Array<Partial<Beneficiario>> = [
    {
      id_externo: `BENEF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: 'Claudia Regina Duarte',
      matricula: 'MAT-3001',
      unidade_regiao: 'São Paulo - Matriz',
      tipo_vinculo: 'TITULAR',
      faixa: '06',
      faixa_etaria: '06',
      telefone: '(11) 3344-5566',
      celular: '(11) 97788-9900',
      email: 'claudia.duarte@empresa.com.br',
      custo_12_meses: 14200,
      condicao_principal: 'Hipertensão com Resistência Medicamentosa',
      risco: 'ALTO' as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    },
    {
      id_externo: `BENEF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: 'Felipe Duarte (Dependente)',
      matricula: 'MAT-3001-D1',
      unidade_regiao: 'São Paulo - Matriz',
      tipo_vinculo: 'DEPENDENTE',
      faixa: '01',
      faixa_etaria: '01',
      telefone: '(11) 3344-5566',
      celular: '(11) 97788-9900',
      email: 'claudia.duarte@empresa.com.br',
      custo_12_meses: 4600,
      condicao_principal: 'Diabetes Mellitus Tipo 1 Infantil',
      risco: 'CRITICO' as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    },
    {
      id_externo: `BENEF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: 'Lucas Vasconcelos Ribeiro',
      matricula: 'MAT-3002',
      unidade_regiao: 'Curitiba - Fábrica',
      tipo_vinculo: 'TITULAR',
      faixa: '08',
      faixa_etaria: '08',
      telefone: '(41) 3456-1122',
      celular: '(41) 98877-2233',
      email: 'lucas.ribeiro@empresa.com.br',
      custo_12_meses: 9800,
      condicao_principal: 'Lombalgia Crônica com Incapacidade Funcional',
      risco: 'MEDIO' as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    },
    {
      id_externo: `BENEF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: 'Renata Albuquerque Lima',
      matricula: 'MAT-3003',
      unidade_regiao: 'Rio de Janeiro - Filial',
      tipo_vinculo: 'TITULAR',
      faixa: '05',
      faixa_etaria: '05',
      telefone: '(21) 2233-4455',
      celular: '(21) 99123-4567',
      email: 'renata.albuquerque@empresa.com.br',
      custo_12_meses: 18900,
      condicao_principal: 'Depressão Maior Recorrente e Pânico',
      risco: 'ALTO' as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    },
    {
      id_externo: `BENEF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nome_beneficiario: 'Marcos Vinicius Santos',
      matricula: 'MAT-3004',
      unidade_regiao: 'Belo Horizonte - Operações',
      tipo_vinculo: 'TITULAR',
      faixa: '10',
      faixa_etaria: '10',
      telefone: '(31) 3211-9988',
      celular: '(31) 98711-2233',
      email: 'marcos.santos@empresa.com.br',
      custo_12_meses: 27500,
      condicao_principal: 'Insuficiência Cardíaca Congestiva NYHA II',
      risco: 'CRITICO' as NivelRisco,
      permite_contato_whatsapp_sms: true,
      status: 'ELEGIVEL',
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // Carrega os dados simulados a partir da planilha
      setPreviewData(mockSpreadsheetRows)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }

  const loadExampleSpreadsheet = () => {
    setFileName('beneficiarios_cuidado_saude_lote_marco.xlsx')
    setPreviewData(mockSpreadsheetRows)
    setErrorMsg(null)
    setSuccessMsg(null)
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

      {/* Upload Box */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Carregar Arquivo .XLSX ou .CSV</CardTitle>
          <CardDescription className="text-xs">
            A planilha deve conter matrícula, nome, vínculo, unidade, contatos, custo 12m, risco e
            condição clínica
          </CardDescription>
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

            <div className="flex justify-center items-center gap-3">
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
                Carregar Planilha Modelo Demo
              </Button>
            </div>
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
