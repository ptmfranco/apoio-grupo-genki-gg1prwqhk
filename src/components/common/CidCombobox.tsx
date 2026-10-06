import React, { useState, useEffect, useRef, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { CidService } from '@/services/cidService'
import { Cid10Item } from '@/types/saude'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Search,
  ChevronsUpDown,
  Check,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react'

export interface CidComboboxProps {
  value?: string
  onChange: (val: string, item?: Cid10Item | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  required?: boolean
  id?: string
}

export function CidCombobox({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Selecione ou busque por código ou descrição...',
  className = '',
  required = false,
  id,
}: CidComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<Cid10Item[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const searchTimeoutRef = useRef<any>(null)

  // Carregar status inicial e contagem total
  useEffect(() => {
    let mounted = true
    CidService.count()
      .then((c) => {
        if (mounted) setTotalCount(c)
      })
      .catch(() => {
        if (mounted) setTotalCount(0)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Buscar itens quando o popover abrir ou quando a busca mudar
  const fetchCids = (search: string) => {
    setLoading(true)
    CidService.list({ search, perPage: 40 })
      .then((res) => {
        setItems(res.items)
        if (totalCount === null) {
          setTotalCount(res.totalItems)
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar lista CID-10:', err)
        setItems([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    if (!open) return
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        fetchCids(searchTerm)
      })
    }, 200)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [open, searchTerm])

  const handleSelect = (item: Cid10Item) => {
    const formatted = `${item.codigo} — ${item.descricao}`
    onChange(formatted, item)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', null)
  }

  // Format de exibição do botão: se já selecionado ou valor legado
  const displayLabel = value || ''

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input para HTML form validation se required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          value={value}
          onChange={() => {}}
          required={required}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={`w-full justify-between text-xs h-9 font-normal bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 px-3 ${
              !displayLabel ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'
            }`}
          >
            <span className="truncate max-w-[85%] text-left">{displayLabel || placeholder}</span>
            <div className="flex items-center gap-1 ml-1 shrink-0">
              {displayLabel && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Limpar seleção"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[380px] sm:w-[480px] p-0 shadow-lg border-slate-200 dark:border-slate-800"
          align="start"
        >
          {/* Header de Busca */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o código (ex: I10, E11) ou nome..."
              className="h-8 text-xs border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
              autoFocus
            />
            {(loading || isPending) && (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin shrink-0 mr-1" />
            )}
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Estado: Lista CID-10 Vazia (Aviso não hardcoded) */}
          {totalCount === 0 ? (
            <div className="p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Lista CID-10 não importada
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Para selecionar uma condição clínica oficial, importe a planilha de CID-10 no menu
                de gestão.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="text-xs border-[#D4A359] text-[#163A4D] hover:bg-amber-50 dark:text-amber-300"
                >
                  <Link to="/gestor/cid10" onClick={() => setOpen(false)}>
                    Importar em Gestão &gt; CID-10
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 && !loading ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Nenhum código ou descrição encontrado para &ldquo;{searchTerm}&rdquo;.
                </div>
              ) : (
                items.map((item) => {
                  const label = `${item.codigo} — ${item.descricao}`
                  const isSelected =
                    value === label ||
                    value === item.codigo ||
                    value.startsWith(`${item.codigo} `) ||
                    value.startsWith(`${item.codigo}—`) ||
                    value.toLowerCase() === item.descricao.toLowerCase()

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left p-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-slate-100 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded text-[11px] border border-teal-200 dark:border-teal-800">
                            {item.codigo}
                          </span>
                          {item.capitulo && (
                            <span className="text-[10px] text-slate-400">Cap. {item.capitulo}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                          {item.descricao}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* Footer com link de gestão e contagem */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {totalCount !== null && totalCount > 0
                ? `${totalCount.toLocaleString('pt-BR')} itens no catálogo`
                : 'Catálogo CID-10'}
            </span>
            <Link
              to="/gestor/cid10"
              onClick={() => setOpen(false)}
              className="text-teal-700 hover:text-teal-800 dark:text-teal-400 font-medium hover:underline flex items-center gap-1"
            >
              Gerenciar CID-10 <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
