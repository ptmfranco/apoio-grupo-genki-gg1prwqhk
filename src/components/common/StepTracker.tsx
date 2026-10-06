import React from 'react'
import { ETAPAS_FLUXO } from '@/types'
import { Check, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepTrackerProps {
  currentStep: number
  className?: string
}

export const StepTracker: React.FC<StepTrackerProps> = ({ currentStep, className }) => {
  return (
    <div className={cn('w-full bg-card rounded-xl border border-border p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Ciclo de Cuidado em 9 Etapas
        </h4>
        <span className="text-xs font-semibold text-primary">Etapa {currentStep} de 9</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
        {ETAPAS_FLUXO.map((item) => {
          const isDone = item.etapa < currentStep
          const isCurrent = item.etapa === currentStep

          return (
            <div
              key={item.etapa}
              className={cn(
                'relative flex flex-col p-2 rounded-lg border text-left transition-all duration-200',
                isDone
                  ? 'bg-[#163A4D]/10 border-[#163A4D]/30 dark:bg-[#163A4D]/25 dark:border-[#163A4D]/50 text-[#163A4D] dark:text-[#9bc2d7]'
                  : isCurrent
                    ? 'bg-[#163A4D] dark:bg-[#D4A359] text-white dark:text-[#0b1d28] border-[#163A4D] dark:border-[#D4A359] shadow-sm ring-2 ring-[#D4A359]/30'
                    : 'bg-muted/40 border-border text-muted-foreground',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    isDone
                      ? 'bg-[#163A4D] dark:bg-[#D4A359] text-white dark:text-[#0b1d28]'
                      : isCurrent
                        ? 'bg-[#D4A359] dark:bg-[#163A4D] text-[#0b1d28] dark:text-white font-extrabold'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : item.etapa}
                </span>
                {isCurrent && (
                  <Clock className="w-3.5 h-3.5 animate-spin text-white dark:text-[#0b1d28] opacity-80" />
                )}
              </div>
              <p
                className={cn(
                  'text-[11px] font-bold truncate',
                  isCurrent ? 'text-white dark:text-[#0b1d28]' : '',
                )}
              >
                {item.titulo}
              </p>
              <span
                className={cn(
                  'text-[9px] font-semibold mt-0.5 truncate uppercase tracking-tight',
                  isCurrent ? 'text-amber-200 dark:text-[#0b1d28]/80' : 'text-muted-foreground',
                )}
              >
                {item.responsavel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
