import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PesquisasService } from '@/services/saude'
import { PesquisaSatisfacao } from '@/types/saude'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, CheckCircle2, AlertTriangle, ShieldCheck, ThumbsUp } from 'lucide-react'
import { GenkiLogo } from '@/components/common/GenkiLogo'

export default function PesquisaPublicaPage() {
  const { token } = useParams<{ token: string }>()
  const [survey, setSurvey] = useState<PesquisaSatisfacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comentario, setComentario] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function loadSurvey() {
      if (!token) {
        setError('Token de pesquisa não fornecido.')
        setLoading(false)
        return
      }

      try {
        const data = await PesquisasService.getByToken(token)
        setSurvey(data)
        if (data.status === 'RESPONDIDO') {
          setSubmitted(true)
          setRating(data.nota)
          setComentario(data.comentario || '')
        }
      } catch (err: any) {
        setError('Pesquisa não encontrada ou link expirado.')
      } finally {
        setLoading(false)
      }
    }

    loadSurvey()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    try {
      await PesquisasService.responder(token, rating, comentario)
      setSubmitted(true)
    } catch (err: any) {
      alert('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 space-y-4">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4 border-rose-200 shadow-lg">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-slate-800">Link Indisponível</CardTitle>
          <CardDescription className="text-slate-600">
            {error || 'Não foi possível carregar a pesquisa de satisfação solicitada.'}
          </CardDescription>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" className="text-xs">
                Ir para o Portal de Acesso
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf2f6] via-white to-slate-100 flex flex-col justify-between py-8 px-4">
      {/* Header */}
      <div className="max-w-xl mx-auto w-full text-center space-y-3 mb-6 flex flex-col items-center">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-flex flex-col items-center">
          <GenkiLogo variant="colored" width={220} height={44} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Apoio Grupo Genki</h1>
          <p className="text-xs text-[#163A4D] font-medium">
            Programa de Acompanhamento de Saúde e Cuidado Contínuo
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-xl mx-auto w-full">
        <Card className="shadow-xl border-slate-200/80 overflow-hidden bg-white">
          <div className="bg-[#163A4D] p-6 text-white text-center border-b-4 border-[#D4A359]">
            <h2 className="text-xl font-bold">Pesquisa de Satisfação do Beneficiário</h2>
            <p className="text-xs text-amber-200/90 mt-1">
              Sua opinião nos ajuda a melhorar a qualidade do atendimento e suporte em saúde
            </p>
          </div>

          <CardContent className="p-6">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Obrigado pelo seu feedback!</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Sua avaliação de <strong>{rating} de 5 estrelas</strong> foi registrada com
                  sucesso no seu prontuário de atendimento.
                </p>

                <div className="flex justify-center gap-1 pt-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>

                {comentario && (
                  <div className="bg-slate-50 p-4 rounded-lg border text-xs text-slate-700 text-left italic max-w-md mx-auto">
                    "{comentario}"
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <label className="text-sm font-semibold text-slate-800 block">
                    Como você avalia o atendimento recebido pela nossa equipe de saúde?
                  </label>
                  <p className="text-xs text-slate-500">Selecione uma nota de 0 a 5 estrelas</p>

                  {/* Star rating selector */}
                  <div className="flex justify-center items-center gap-2 py-4">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`w-9 h-9 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                : 'text-slate-300 hover:text-slate-400'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-xs font-semibold text-[#163A4D] uppercase tracking-wide">
                    {rating === 5 && '🌟 Excelente - Superou expectativas'}
                    {rating === 4 && '👍 Muito Bom - Atendimento de qualidade'}
                    {rating === 3 && '👌 Bom - Atendimento satisfatório'}
                    {rating === 2 && '⚠️ Regular - Há pontos de melhoria'}
                    {rating === 1 && '👎 Insatisfatório'}
                    {rating === 0 && '0 - Sem avaliação'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="comentario"
                    className="text-xs font-semibold text-slate-700 block"
                  >
                    Comentários ou Sugestões (Opcional):
                  </label>
                  <Textarea
                    id="comentario"
                    placeholder="Deixe uma mensagem para o profissional que te atendeu..."
                    rows={4}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#163A4D] hover:bg-[#1f4c64] text-white font-semibold h-11 shadow-sm"
                >
                  {submitting ? 'Gravando resposta...' : 'Enviar Avaliação de Satisfação'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 flex items-center justify-center text-xs text-slate-500 gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pesquisa anônima e protegida conforme a LGPD</span>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} Apoio Grupo Genki - Plataforma Apoio Saúde. Todos os
        direitos reservados.
      </footer>
    </div>
  )
}
