import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { CidService, CidUpsertResult } from '@/services/cidService'
import { Cid10Item } from '@/types/saude'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react'

interface ParsedRawRow {
  [key: string]: any
}

export default function GestorCid10Page() {
  const [totalDbCount, setTotalDbCount] = useState<number>(0)
  const [existingList, setExistingList] = useState<Cid10Item[]>([])
  const [listSearch, setListSearch] = useState('')
  const [listPage, setListPage] = useState(1)
  const [listTotalPages, setListTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(false)

  // Estados de upload e parsing
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [rawRows, setRawRows] = useState<ParsedRawRow[]>([])
  const [availableColumns, setAvailableColumns] = useState<string[]>([])

  // Mapeamento de colunas
  const [colCodigo, setColCodigo] = useState<string>('')
  const [colDescricao, setColDescricao] = useState<string>('')
  const [colCapitulo, setColCapitulo] = useState<string>('')
  const [colGrupo, setColGrupo] = useState<string>('')
  const [colCategoria, setColCategoria] = useState<string>('')
  const [colSubcategoria, setColSubcategoria] = useState<string>('')

  // Processamento e relatório
  const [processing, setProcessing] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [report, setReport] = useState<CidUpsertResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Carregar dados existentes
  const loadExistingData = async () => {
    setLoadingList(true)
    try {
      const count = await CidService.count()
      setTotalDbCount(count)

      const res = await CidService.list({
        search: listSearch,
        page: listPage,
        perPage: 15,
      })
      setExistingList(res.items)
      setListTotalPages(res.totalPages)
    } catch (err: any) {
      console.warn('Erro ao carregar dados CID-10:', err)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadExistingData()
  }, [listPage, listSearch])

  // Processar leitura de arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrorMsg(null)
    setReport(null)
    setProgressPercent(0)

    try {
      const buffer = await selectedFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      setWorkbook(wb)
      setSheetNames(wb.SheetNames)

      // Seleciona a primeira aba por padrão
      if (wb.SheetNames.length > 0) {
        const firstSheet = wb.SheetNames[0]
        setSelectedSheet(firstSheet)
        parseSheet(wb, firstSheet)
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao ler arquivo: ${err?.message || 'Formato inválido'}`)
      setRawRows([])
    }
  }

  // Parse da aba selecionada
  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName]
    if (!ws) return

    const json = XLSX.utils.sheet_to_json<ParsedRawRow>(ws, { defval: '' })
    setRawRows(json)

    if (json.length > 0) {
      const cols = Object.keys(json[0])
      setAvailableColumns(cols)
      autoDetectColumns(cols)
    } else {
      setAvailableColumns([])
      setErrorMsg('A aba selecionada não contém linhas de dados.')
    }
  }

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName)
    if (workbook) {
      parseSheet(workbook, sheetName)
    }
  }

  // Auto-detecção inteligente de colunas
  const autoDetectColumns = (cols: string[]) => {
    // Código: 'codigo', 'cod', 'cid', 'subcat', 'cat', 'cd_cid', 'código'
    const foundCodigo = cols.find((c) =>
      /^(c[oó]digo|cod|cid|cid10|subcat|cat|cd_)/i.test(c.trim()),
    )
    if (foundCodigo) setColCodigo(foundCodigo)
    else if (cols.length > 0) setColCodigo(cols[0])

    // Descrição: 'descricao', 'desc', 'nome', 'doenca', 'diagnostico', 'descri[cç][aã]o'
    const foundDescricao = cols.find((c) =>
      /^(descri[cç][aã]o|desc|nome|doen[cç]a|diagn[oó]stico|especifica[cç][aã]o)/i.test(c.trim()),
    )
    if (foundDescricao) setColDescricao(foundDescricao)
    else if (cols.length > 1) setColDescricao(cols[1])

    // Capítulo
    const foundCapitulo = cols.find((c) => /^cap[ií]tulo|^cap/i.test(c.trim()))
    if (foundCapitulo) setColCapitulo(foundCapitulo)

    // Grupo
    const foundGrupo = cols.find((c) => /^grupo/i.test(c.trim()))
    if (foundGrupo) setColGrupo(foundGrupo)

    // Categoria
    const foundCat = cols.find((c) => /^categoria|^cat$/i.test(c.trim()))
    if (foundCat) setColCategoria(foundCat)

    // Subcategoria
    const foundSubcat = cols.find((c) => /^subcategoria|^subcat$/i.test(c.trim()))
    if (foundSubcat) setColSubcategoria(foundSubcat)
  }

  // Executar Upsert em lote
  const handleExecuteImport = async () => {
    if (!colCodigo || !colDescricao) {
      setErrorMsg('Mapeie pelo menos as colunas de Código e Descrição.')
      return
    }

    if (rawRows.length === 0) {
      setErrorMsg('Nenhuma linha para importar.')
      return
    }

    setProcessing(true)
    setErrorMsg(null)
    setReport(null)
    setProgressPercent(0)
    setProgressText('Preparando registros...')

    try {
      const itemsToUpsert = rawRows
        .map((row) => {
          const cod = String(row[colCodigo] || '').trim()
          const desc = String(row[colDescricao] || '').trim()
          return {
            codigo: cod,
            descricao: desc,
            capitulo: colCapitulo ? String(row[colCapitulo] || '').trim() : '',
            grupo: colGrupo ? String(row[colGrupo] || '').trim() : '',
            categoria: colCategoria ? String(row[colCategoria] || '').trim() : '',
            subcategoria: colSubcategoria ? String(row[colSubcategoria] || '').trim() : '',
            ativo: true,
          }
        })
        .filter((item) => item.codigo && item.descricao)

      const result = await CidService.upsertBatch(itemsToUpsert, (processed, total) => {
        const pct = Math.round((processed / total) * 100)
        setProgressPercent(pct)
        setProgressText(`Processando ${processed} de ${total} registros... (${pct}%)`)
      })

      setReport(result)
      await loadExistingData()
    } catch (err: any) {
      setErrorMsg(`Erro ao processar importação: ${err?.message || 'Falha de comunicação'}`)
    } finally {
      setProcessing(false)
    }
  }

  // Linhas de preview
  const previewRows = rawRows.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#163A4D] dark:text-slate-100">
              Catálogo Oficial CID-10
            </h1>
            <span className="bg-[#D4A359]/20 text-[#163A4D] dark:text-amber-300 font-bold px-2 py-0.5 rounded text-xs border border-[#D4A359]/40">
              Gestão Médica
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Importação via planilha (.xlsx / .csv) com parser client-side, modo Upsert e busca em
            lote
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Card className="p-3 border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 flex items-center gap-3">
            <Database className="w-6 h-6 text-teal-700 dark:text-teal-400" />
            <div>
              <p className="text-[11px] font-semibold text-teal-900 dark:text-teal-300 uppercase">
                Total no Banco
              </p>
              <p className="text-lg font-bold text-teal-800 dark:text-teal-200 leading-none">
                {totalDbCount.toLocaleString('pt-BR')} registros
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Relatório Final */}
      {report && (
        <Alert className="bg-emerald-50 border-emerald-300 text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="font-bold text-sm">Importação Finalizada com Sucesso!</AlertTitle>
          <AlertDescription className="text-xs space-y-2 mt-1">
            <p>
              Processamento concluído:{' '}
              <span className="font-bold">{report.inseridos} inseridos</span>,{' '}
              <span className="font-bold">{report.atualizados} atualizados</span> e{' '}
              <span className="font-bold">{report.erros.length} erros</span>.
            </p>
            {report.erros.length > 0 && (
              <div className="mt-2 p-2 bg-white/70 rounded border border-emerald-200 max-h-36 overflow-y-auto font-mono text-[11px] text-rose-700">
                <p className="font-semibold text-rose-800 mb-1">Linhas com erro:</p>
                {report.erros.map((e, idx) => (
                  <div key={idx}>
                    Linha {e.linha} (cód: {e.codigo}): {e.erro}
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold text-xs">Atenção</AlertTitle>
          <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Seção 1: Upload e Configuração do Arquivo */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-[#163A4D] dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            1. Carregar Arquivo de CID-10 (.xlsx ou .csv)
          </CardTitle>
          <CardDescription className="text-xs">
            Selecione a planilha oficial de CID-10. O parser client-side lerá as abas e permitirá o
            mapeamento de colunas antes do processamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
              {file ? file.name : 'Selecione ou arraste sua planilha de CID-10'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Formatos aceitos: .xlsx, .xls ou .csv (volume suportado: ~2.000 linhas)
            </p>

            <label htmlFor="cid-file-upload">
              <Input
                id="cid-file-upload"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                disabled={processing}
                className="hidden"
              />
              <Button
                type="button"
                variant="default"
                disabled={processing}
                className="bg-[#163A4D] hover:bg-[#122e3d] text-white cursor-pointer text-xs"
                asChild
              >
                <span>Escolher Arquivo</span>
              </Button>
            </label>
          </div>

          {/* Seleção de Aba se houver múltiplas */}
          {sheetNames.length > 1 && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Planilha com Múltiplas Abas ({sheetNames.length})
                </Label>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Escolha qual aba contém os códigos e descrições do CID-10 que deseja importar:
                </p>
              </div>
              <Select value={selectedSheet} onValueChange={handleSheetChange} disabled={processing}>
                <SelectTrigger className="w-[220px] text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Selecione a aba..." />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mapeamento de Colunas */}
          {availableColumns.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Mapeamento de Colunas da Planilha
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Confira ou ajuste o mapeamento correspondente às colunas encontradas no arquivo:
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {rawRows.length.toLocaleString('pt-BR')} linhas detectadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Código CID-10 <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={colCodigo} onValueChange={setColCodigo} disabled={processing}>
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Descrição Clínica <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={colDescricao}
                    onValueChange={setColDescricao}
                    disabled={processing}
                  >
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Capítulo (Opcional)
                  </Label>
                  <Select value={colCapitulo} onValueChange={setColCapitulo} disabled={processing}>
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="(Nenhum)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(Nenhum)</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Grupo (Opcional)
                  </Label>
                  <Select value={colGrupo} onValueChange={setColGrupo} disabled={processing}>
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="(Nenhum)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(Nenhum)</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoria (Opcional)
                  </Label>
                  <Select
                    value={colCategoria}
                    onValueChange={setColCategoria}
                    disabled={processing}
                  >
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="(Nenhum)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(Nenhum)</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subcategoria (Opcional)
                  </Label>
                  <Select
                    value={colSubcategoria}
                    onValueChange={setColSubcategoria}
                    disabled={processing}
                  >
                    <SelectTrigger className="text-xs mt-1 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="(Nenhum)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(Nenhum)</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Prévia das primeiras 5 linhas */}
          {previewRows.length > 0 && colCodigo && colDescricao && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  3. Pré-visualização com Mapeamento Aplicado (Primeiras 5 Linhas)
                </span>
                <span className="text-[11px] text-slate-500">
                  Modo Upsert: insere novos e atualiza descrição de códigos existentes
                </span>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">Código Mapeado</th>
                      <th className="p-2.5">Descrição Mapeada</th>
                      {colCapitulo && colCapitulo !== 'none' && <th className="p-2.5">Capítulo</th>}
                      {colGrupo && colGrupo !== 'none' && <th className="p-2.5">Grupo</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono font-bold text-teal-700 dark:text-teal-400">
                          {String(r[colCodigo] || '')}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {String(r[colDescricao] || '')}
                        </td>
                        {colCapitulo && colCapitulo !== 'none' && (
                          <td className="p-2.5 text-slate-500">{String(r[colCapitulo] || '—')}</td>
                        )}
                        {colGrupo && colGrupo !== 'none' && (
                          <td className="p-2.5 text-slate-500">{String(r[colGrupo] || '—')}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Barra de Progresso durante processamento */}
          {processing && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-900 dark:text-teal-200">
                <span>{progressText}</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-teal-200 dark:bg-teal-900" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t bg-slate-50/50 dark:bg-slate-900/20 p-4">
          <p className="text-xs text-slate-500">
            {rawRows.length > 0
              ? `${rawRows.length.toLocaleString('pt-BR')} linhas prontas para sincronização.`
              : 'Nenhum arquivo carregado.'}
          </p>

          <Button
            onClick={handleExecuteImport}
            disabled={processing || rawRows.length === 0 || !colCodigo || !colDescricao}
            className="bg-[#163A4D] hover:bg-[#122e3d] text-white font-semibold text-xs"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#D4A359]" />
                Confirmar e Importar {rawRows.length > 0 ? `(${rawRows.length} linhas)` : ''}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Seção 2: Registros já cadastrados no PocketBase */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Catálogo Atual no Banco de Dados ({totalDbCount.toLocaleString('pt-BR')} registros)
            </CardTitle>
            <CardDescription className="text-xs">
              Códigos ativos que alimentam os dropdowns de Condição Principal no aplicativo
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <Input
                value={listSearch}
                onChange={(e) => {
                  setListSearch(e.target.value)
                  setListPage(1)
                }}
                placeholder="Filtrar por código ou descrição..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadExistingData}
              className="h-8 text-xs"
              title="Recarregar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3 w-32">Código CID</th>
                  <th className="p-3">Descrição Oficial</th>
                  <th className="p-3 w-28">Capítulo</th>
                  <th className="p-3 w-28">Grupo</th>
                  <th className="p-3 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {existingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      {totalDbCount === 0
                        ? 'Nenhum CID-10 importado ainda. Carregue a planilha no formulário acima.'
                        : 'Nenhum registro encontrado para a busca informada.'}
                    </td>
                  </tr>
                ) : (
                  existingList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                        {item.codigo}
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                        {item.descricao}
                      </td>
                      <td className="p-3 text-slate-500">{item.capitulo || '—'}</td>
                      <td className="p-3 text-slate-500">{item.grupo || '—'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.ativo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {listTotalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-3 border-t text-xs text-slate-500">
            <span>
              Página {listPage} de {listTotalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={listPage >= listTotalPages}
                onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                className="h-7 text-xs"
              >
                Próxima
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
