import React from 'react'
import { cn } from '@/lib/utils'

interface GenkiLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'colored' | 'white' | 'dark' | 'auto'
  className?: string
  width?: number | string
  height?: number | string
  showBar?: boolean
}

/**
 * Logotipo oficial Grupo Genki:
 * Tipografia em caixa alta com barra/trilho dourado-âmbar logo abaixo do texto.
 * Baseado na identidade visual do site oficial https://grupogenki.com.br/
 */
export function GenkiLogo({
  variant = 'auto',
  className,
  width = 220,
  height = 44,
  showBar = true,
  ...props
}: GenkiLogoProps) {
  // Cores institucionais
  const textColor =
    variant === 'white'
      ? '#FFFFFF'
      : variant === 'dark'
        ? '#0D2431'
        : variant === 'colored'
          ? '#163A4D'
          : 'currentColor'

  const barColor = variant === 'white' ? '#E5B263' : variant === 'dark' ? '#C89240' : '#D4A359'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 64"
      width={width}
      height={height}
      fill="none"
      className={cn('inline-block select-none overflow-visible', className)}
      role="img"
      aria-label="Grupo Genki"
      {...props}
    >
      <text
        x="160"
        y="44"
        textAnchor="middle"
        fill={textColor}
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="34"
        letterSpacing="2.5"
      >
        GRUPO GENKI
      </text>
      {showBar && <rect x="12" y="54" width="296" height="4.5" rx="2.25" fill={barColor} />}
    </svg>
  )
}

/**
 * Ícone compacto de marca Grupo Genki ("G" com base âmbar/dourada)
 * Ideal para avatares, favicons, cabeçalhos compactos e badges.
 */
export function GenkiIcon({
  className,
  size = 36,
  variant = 'petrol',
}: {
  className?: string
  size?: number | string
  variant?: 'petrol' | 'amber' | 'white'
}) {
  const isPetrol = variant === 'petrol'
  const isAmber = variant === 'amber'

  const bgFill = isPetrol ? '#163A4D' : isAmber ? '#D4A359' : '#FFFFFF'
  const textFill = isPetrol ? '#FFFFFF' : isAmber ? '#163A4D' : '#163A4D'
  const barFill = isPetrol ? '#D4A359' : isAmber ? '#FFFFFF' : '#D4A359'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      className={cn('inline-block shrink-0 rounded-xl overflow-hidden shadow-sm', className)}
      role="img"
      aria-label="Grupo Genki Ícone"
    >
      <rect width="40" height="40" rx="10" fill={bgFill} />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill={textFill}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="19"
        letterSpacing="0.5"
      >
        G
      </text>
      <rect x="9" y="30.5" width="22" height="3" rx="1.5" fill={barFill} />
    </svg>
  )
}
