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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Search,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
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

  // Modo de importação: 'replace' (substituir toda a lista) ou 'upsert' (atualizar/adicionar)
  const [importMode, setImportMode] = useState<'replace' | 'upsert'>('replace')
  const [confirmReplaceModalOpen, setConfirmReplaceModalOpen] = useState(false)

  // Mapeamento de colunas
  const [colCodigo, setColCodigo] = useState<string>('')
  const [colDescricao, setColDescricao] = useState<string>('')
  const [colCategoria, setColCategoria] = useState<string>('')
  const [colCapitulo, setColCapitulo] = useState<string>('')
  const [colGrupo, setColGrupo] = useState<string>('')
  const [colSubcategoria, setColSubcategoria] = useState<string>('')

  // Processamento e relatório
  const [processing, setProcessing] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressPhase, setProgressPhase] = useState<'idle' | 'deleting' | 'importing'>('idle')
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

      // Seleciona preferencialmente a aba "Planilha1" ou a primeira aba
      if (wb.SheetNames.length > 0) {
        const preferred =
          wb.SheetNames.find((s) => s.trim().toLowerCase() === 'planilha1') || wb.SheetNames[0]
        setSelectedSheet(preferred)
        parseSheet(wb, preferred)
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
      // Filtrar colunas vazias ou anônimas como "__EMPTY"
      const cols = Object.keys(json[0]).filter((c) => c && !c.startsWith('__EMPTY'))
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

  // Auto-detecção inteligente de colunas (especialmente CID, Categoria, DESCRIÇÃO)
  const autoDetectColumns = (cols: string[]) => {
    // 1. Código: 'CID', 'código', 'codigo', 'cod', 'subcat', 'cd_'
    const foundCodigo = cols.find((c) => {
      const norm = c.trim().toLowerCase()
      return norm === 'cid' || norm === 'codigo' || norm === 'código' || /^(cid|cod|cd_)/.test(norm)
    })
    if (foundCodigo) setColCodigo(foundCodigo)
    else if (cols.length > 0) setColCodigo(cols[0])

    // 2. Descrição completa: 'DESCRIÇÃO', 'descricao', 'desc', 'nome', etc.
    const foundDescricao = cols.find((c) => {
      const norm = c.trim().toLowerCase()
      return (
        norm === 'descrição' ||
        norm === 'descricao' ||
        norm.startsWith('descri') ||
        norm === 'desc' ||
        norm === 'nome' ||
        norm.includes('diagnostico')
      )
    })
    if (foundDescricao) setColDescricao(foundDescricao)
    else if (cols.length > 2) setColDescricao(cols[2]) // se colunas forem CID, Categoria, DESCRIÇÃO

    // 3. Categoria: 'Categoria', 'cat'
    const foundCat = cols.find((c) => {
      const norm = c.trim().toLowerCase()
      return norm === 'categoria' || norm === 'cat'
    })
    if (foundCat) setColCategoria(foundCat)

    // 4. Capítulo
    const foundCapitulo = cols.find((c) => /^cap[ií]tulo|^cap/i.test(c.trim()))
    if (foundCapitulo) setColCapitulo(foundCapitulo)

    // 5. Grupo
    const foundGrupo = cols.find((c) => /^grupo/i.test(c.trim()))
    if (foundGrupo) setColGrupo(foundGrupo)

    // 6. Subcategoria
    const foundSubcat = cols.find((c) => /^subcategoria|^subcat$/i.test(c.trim()))
    if (foundSubcat) setColSubcategoria(foundSubcat)
  }

  // Clique no botão principal de importar: checa confirmação se for 'replace'
  const handleInitiateImport = () => {
    if (!colCodigo || !colDescricao) {
      setErrorMsg(
        'Mapeie pelo menos as colunas de Código (ex: "CID") e Descrição (ex: "DESCRIÇÃO").',
      )
      return
    }

    if (rawRows.length === 0) {
      setErrorMsg('Nenhuma linha carregada para importar.')
      return
    }

    if (importMode === 'replace' && totalDbCount > 0) {
      setConfirmReplaceModalOpen(true)
    } else {
      executeImport()
    }
  }

  // Executar Importação em lote
  const executeImport = async () => {
    setConfirmReplaceModalOpen(false)
    setProcessing(true)
    setErrorMsg(null)
    setReport(null)
    setProgressPercent(0)
    setProgressPhase('idle')
    setProgressText('Iniciando processamento...')

    try {
      const itemsToProcess = rawRows
        .map((row) => {
          const cod = String(row[colCodigo] || '').trim()
          const desc = String(row[colDescricao] || '').trim()
          const cat =
            colCategoria && colCategoria !== 'none' ? String(row[colCategoria] || '').trim() : ''
          const cap =
            colCapitulo && colCapitulo !== 'none' ? String(row[colCapitulo] || '').trim() : ''
          const grp = colGrupo && colGrupo !== 'none' ? String(row[colGrupo] || '').trim() : ''
          const sub =
            colSubcategoria && colSubcategoria !== 'none'
              ? String(row[colSubcategoria] || '').trim()
              : ''

          return {
            codigo: cod,
            descricao: desc,
            categoria: cat,
            capitulo: cap,
            grupo: grp,
            subcategoria: sub,
            ativo: true,
          }
        })
        .filter((item) => item.codigo && item.descricao)

      const result = await CidService.importBatch(
        itemsToProcess,
        importMode,
        (processed, total, phase) => {
          setProgressPhase(phase)
          if (phase === 'deleting') {
            const pct = total > 0 ? Math.round((processed / total) * 100) : 0
            setProgressPercent(pct)
            setProgressText(`Removendo registros antigos do catálogo (${processed} de ${total})...`)
          } else {
            const pct = total > 0 ? Math.round((processed / total) * 100) : 0
            setProgressPercent(pct)
            setProgressText(
              `Gravando no banco: ${processed} de ${total} registros processados (${pct}%)...`,
            )
          }
        },
      )

      setReport(result)
      await loadExistingData()
    } catch (err: any) {
      setErrorMsg(`Erro ao processar importação: ${err?.message || 'Falha de comunicação'}`)
    } finally {
      setProcessing(false)
      setProgressPhase('idle')
    }
  }

  // Linhas de preview (primeiras 5)
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
            Importação via planilha (.xlsx / .csv) com parser client-side, escolha de modo
            (Substituição ou Upsert) e sincronização em lotes para alta volumetria (~1.800+ linhas)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Card className="p-3 border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 flex items-center gap-3 shadow-xs">
            <Database className="w-6 h-6 text-teal-700 dark:text-teal-400 shrink-0" />
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
        <Alert className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="ml-2">
            <AlertTitle className="font-bold text-sm">
              Importação Finalizada com Sucesso!
            </AlertTitle>
            <AlertDescription className="text-xs space-y-2 mt-1">
              <p className="leading-relaxed">
                Relatório de processamento:{' '}
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {report.inseridos.toLocaleString('pt-BR')} inseridos
                </span>
                ,{' '}
                <span className="font-bold text-teal-800 dark:text-teal-200">
                  {report.atualizados.toLocaleString('pt-BR')} atualizados
                </span>
                {report.removidos > 0 && (
                  <>
                    ,{' '}
                    <span className="font-bold text-amber-800 dark:text-amber-200">
                      {report.removidos.toLocaleString('pt-BR')} removidos (lista substituída)
                    </span>
                  </>
                )}{' '}
                e{' '}
                <span className="font-bold text-rose-800 dark:text-rose-200">
                  {report.erros.length} erros
                </span>
                .
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Os registros já estão ativos e disponíveis nos seletores e comboboxes de Condição
                Principal de todo o sistema.
              </p>
              {report.erros.length > 0 && (
                <div className="mt-2 p-2.5 bg-white/80 dark:bg-slate-900/80 rounded border border-rose-200 dark:border-rose-900 max-h-40 overflow-y-auto font-mono text-[11px] text-rose-700 dark:text-rose-300">
                  <p className="font-semibold text-rose-800 dark:text-rose-200 mb-1">
                    Linhas com erro / inconsistências:
                  </p>
                  {report.erros.map((e, idx) => (
                    <div key={idx}>
                      Linha {e.linha} (cód: {e.codigo}): {e.erro}
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </div>
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
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-[#163A4D] dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            1. Carregar Planilha Oficial de CID-10 (.xlsx ou .csv)
          </CardTitle>
          <CardDescription className="text-xs">
            Selecione a planilha oficial de CID-10 do seu computador (suporta ~1.800+ linhas sem
            travar o navegador). Os dados serão lidos e importados pelo seu navegador diretamente
            para a base de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Caixa de Upload */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
              {file ? file.name : 'Selecione ou arraste sua planilha de CID-10'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Formatos aceitos: .xlsx, .xls ou .csv (volume testado: 1.835+ linhas)
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
                className="bg-[#163A4D] hover:bg-[#122e3d] text-white cursor-pointer text-xs font-semibold shadow-xs"
                asChild
              >
                <span>Escolher Arquivo do Computador</span>
              </Button>
            </label>
          </div>

          {/* Seleção de Aba se houver múltiplas */}
          {sheetNames.length > 1 && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" /> Planilha com Múltiplas Abas (
                  {sheetNames.length})
                </Label>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Aba ativa para leitura dos registros de CID-10:
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

          {/* Configuração do Modo de Importação: Substituir vs Upsert */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#163A4D] dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4A359]" /> Modo de Importação dos Registros
              </Label>
              <span className="text-[11px] text-slate-500 font-medium">
                Escolha como os novos registros interagem com o banco atual
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Opção 1: Substituir toda a lista */}
              <div
                onClick={() => !processing && setImportMode('replace')}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  importMode === 'replace'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    importMode === 'replace'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-slate-400 bg-transparent'
                  }`}
                >
                  {importMode === 'replace' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                      Substituir toda a lista existente
                    </span>
                    <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-800">
                      Recomendado para nova base
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    Apaga os {totalDbCount.toLocaleString('pt-BR')} registros do catálogo CID-10
                    antes de gravar a nova planilha. Não afeta questionários clínicos, fichas ou
                    beneficiários. Exige confirmação prévia.
                  </p>
                </div>
              </div>

              {/* Opção 2: Atualizar/adicionar (Upsert) */}
              <div
                onClick={() => !processing && setImportMode('upsert')}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  importMode === 'upsert'
                    ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    importMode === 'upsert'
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-400 bg-transparent'
                  }`}
                >
                  {importMode === 'upsert' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                    Atualizar e adicionar (Upsert incremental)
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    Preserva os registros atuais: atualiza a descrição se o código CID já existir e
                    insere se for um código novo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mapeamento de Colunas */}
          {availableColumns.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Mapeamento de Colunas da Planilha
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mapeamento automático detectado para "CID", "Categoria" e "DESCRIÇÃO" (ajuste
                    conforme necessário):
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  {rawRows.length.toLocaleString('pt-BR')} linhas prontas
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Ex: A00, I10, E11, Z00</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Descrição Completa (Rótulo) <span className="text-rose-500">*</span>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ex: "A00 - Cólera" (exibido nos comboboxes)
                  </p>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Ex: Cólera, Febres tifóide</p>
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
                  3. Prévia com Mapeamento Aplicado (Primeiras 5 Linhas)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Modo selecionado:{' '}
                  <strong className={importMode === 'replace' ? 'text-rose-600' : 'text-teal-600'}>
                    {importMode === 'replace' ? 'Substituir toda a lista' : 'Atualizar e adicionar'}
                  </strong>
                </span>
              </div>

              <div className="border rounded-lg overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5 w-28">Código (CID)</th>
                      <th className="p-2.5">Descrição Clínica Completa</th>
                      {colCategoria && colCategoria !== 'none' && (
                        <th className="p-2.5 w-44">Categoria</th>
                      )}
                      {colCapitulo && colCapitulo !== 'none' && <th className="p-2.5">Capítulo</th>}
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
                        {colCategoria && colCategoria !== 'none' && (
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {String(r[colCategoria] || '—')}
                          </td>
                        )}
                        {colCapitulo && colCapitulo !== 'none' && (
                          <td className="p-2.5 text-slate-500">{String(r[colCapitulo] || '—')}</td>
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
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {progressText}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-teal-200 dark:bg-teal-900" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t bg-slate-50/50 dark:bg-slate-900/20 p-4">
          <p className="text-xs text-slate-500">
            {rawRows.length > 0
              ? `${rawRows.length.toLocaleString('pt-BR')} linhas prontas para importação.`
              : 'Nenhum arquivo carregado.'}
          </p>

          <Button
            onClick={handleInitiateImport}
            disabled={processing || rawRows.length === 0 || !colCodigo || !colDescricao}
            className={`font-semibold text-xs text-white shadow-xs ${
              importMode === 'replace'
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-[#163A4D] hover:bg-[#122e3d]'
            }`}
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando Importação...
              </>
            ) : importMode === 'replace' ? (
              <>
                <Trash2 className="w-4 h-4 mr-2 text-rose-200" />
                Substituir Lista e Importar ({rawRows.length.toLocaleString('pt-BR')} registros)
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#D4A359]" />
                Atualizar/Adicionar {rawRows.length > 0 ? `(${rawRows.length} linhas)` : ''}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de Confirmação para Substituição da Lista */}
      <Dialog open={confirmReplaceModalOpen} onOpenChange={setConfirmReplaceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-center text-slate-900 dark:text-slate-100">
              Confirmar Substituição do Catálogo CID-10
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-slate-600 dark:text-slate-400 space-y-2 pt-1">
              <p>
                Esta operação irá apagar todos os{' '}
                <strong className="text-rose-700 font-bold">
                  {totalDbCount.toLocaleString('pt-BR')} registros existentes
                </strong>{' '}
                do catálogo CID-10 antes de gravar os{' '}
                <strong>{rawRows.length.toLocaleString('pt-BR')} novos itens</strong> da planilha.
              </p>
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-left text-[11px]">
                <strong>Garantia de Integridade:</strong> Somente os registros de doenças do
                catálogo CID-10 serão substituídos. Templates de questionários clínicos, histórico
                de fichas e dados de beneficiários NÃO serão afetados.
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmReplaceModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeImport}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Sim, Substituir {totalDbCount.toLocaleString('pt-BR')} Registros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seção 2: Registros já cadastrados no PocketBase */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Catálogo Atual no Banco de Dados ({totalDbCount.toLocaleString('pt-BR')} registros)
            </CardTitle>
            <CardDescription className="text-xs">
              Lista oficial ativa que alimenta os dropdowns e comboboxes de Condição Principal em
              todo o aplicativo
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
                  <th className="p-3">Descrição Oficial (Rótulo no Combobox)</th>
                  <th className="p-3 w-40">Categoria</th>
                  <th className="p-3 w-28">Capítulo</th>
                  <th className="p-3 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {existingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      {totalDbCount === 0
                        ? 'Nenhum CID-10 importado ainda. Carregue a planilha oficial no formulário acima.'
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
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.categoria || '—'}
                      </td>
                      <td className="p-3 text-slate-500">{item.capitulo || '—'}</td>
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
