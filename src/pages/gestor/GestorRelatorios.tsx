import React, { useEffect, useState } from 'react'
import {
  BeneficiariosService,
  FichasService,
  PesquisasService,
  LotesService,
} from '@/services/saude'
import { Beneficiario, FichaAtendimento, PesquisaSatisfacao, LoteSelecao } from '@/types/saude'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileSpreadsheet,
  Download,
  Filter,
  Star,
  DollarSign,
  TrendingDown,
  Users,
} from 'lucide-react'
import { FAIXAS_ETARIAS, getFaixaLabel, normalizeFaixaId } from '@/constants/faixasEtarias'
import { CidCombobox } from '@/components/common/CidCombobox'

export default function GestorRelatoriosPage() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [pesquisas, setPesquisas] = useState<PesquisaSatisfacao[]>([])
  const [lotes, setLotes] = useState<LoteSelecao[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroRegiao, setFiltroRegiao] = useState('ALL')
  const [filtroCondicao, setFiltroCondicao] = useState('')
  const [filtroFaixa, setFiltroFaixa] = useState('ALL')

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, fRes, pRes, lRes] = await Promise.all([
          BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_PROGRAMA' }),
          FichasService.list(),
          PesquisasService.listAll(),
          LotesService.list(),
        ])
        setBeneficiarios(bRes.items)
        setFichas(fRes)
        setPesquisas(pRes)
        setLotes(lRes)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const exportCSV = (tipo: string) => {
    let rows: any[] = []
    let filename = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`

    const rowsFiltradas = beneficiarios.filter((b) => {
      const matchRegiao = filtroRegiao === 'ALL' || (b.unidade_regiao || '').includes(filtroRegiao)
      const matchFaixa =
        filtroFaixa === 'ALL' || normalizeFaixaId(b.faixa || b.faixa_etaria) === filtroFaixa
      let matchCondicao = true
      if (filtroCondicao && filtroCondicao.trim()) {
        const c = (b.condicao_principal || '').toLowerCase()
        const term = filtroCondicao.trim().toLowerCase()
        const parts = term.split('—').map((s) => s.trim().toLowerCase())
        matchCondicao = parts.some((p) => p && c.includes(p)) || c.includes(term)
      }
      return matchRegiao && matchFaixa && matchCondicao
    })

    if (tipo === 'acompanhamento') {
      rows = rowsFiltradas.map((b) => ({
        Matricula: b.matricula,
        Nome: b.nome_beneficiario,
        Unidade: b.unidade_regiao,
        FaixaEtaria: getFaixaLabel(b.faixa || b.faixa_etaria),
        Vinculo: b.tipo_vinculo,
        Risco: b.risco,
        Condicao: b.condicao_principal,
        Custo12m: b.custo_12m !== undefined ? b.custo_12m : b.custo_12_meses,
        Status: b.status,
      }))
    } else if (tipo === 'satisfacao') {
      rows = pesquisas.map((p) => ({
        ID: p.id,
        FichaID: p.expand?.ficha_id?.ficha_id || '',
        Beneficiario: p.expand?.ficha_id?.expand?.beneficiario_id?.nome_beneficiario || '',
        Atendente: p.expand?.ficha_id?.expand?.atendente_id?.name || '',
        Nota: p.nota,
        Canal: p.canal,
        Status: p.status,
        Comentario: p.comentario,
        DataEnvio: p.data_envio,
        DataResposta: p.data_resposta || '',
      }))
    }

    if (rows.length === 0) return

    const headers = Object.keys(rows[0]).join(';')
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers,
        ...rows.map((r) =>
          Object.values(r)
            .map((v) => `"${v ?? ''}"`)
            .join(';'),
        ),
      ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatórios Estratégicos & Custo-Benefício
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Geração de relatórios consolidados de acompanhamento, satisfação e auditoria LGPD
          </p>
        </div>
      </div>

      <Tabs defaultValue="acompanhamento" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="acompanhamento" className="text-xs">
            1. Relatório de Acompanhamento
          </TabsTrigger>
          <TabsTrigger value="satisfacao" className="text-xs">
            2. Relatório de Satisfação & NPS
          </TabsTrigger>
          <TabsTrigger value="custo" className="text-xs">
            3. Análise de Custo-Benefício & Sinistro
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Acompanhamento */}
        <TabsContent value="acompanhamento" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Acompanhamento Populacional Completo
                </CardTitle>
                <CardDescription className="text-xs">
                  Listagem detalhada com status, diagnósticos e equipe alocada
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
                    <SelectTrigger className="w-[170px] text-xs h-8">
                      <SelectValue placeholder="Faixa Etária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as Faixas</SelectItem>
                      {FAIXAS_ETARIAS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.id} - {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filtroRegiao} onValueChange={setFiltroRegiao}>
                  <SelectTrigger className="w-[150px] text-xs h-8">
                    <SelectValue placeholder="Região / Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Unidades</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                    <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="Curitiba">Curitiba</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-[220px]">
                  <CidCombobox
                    value={filtroCondicao}
                    onChange={(val) => setFiltroCondicao(val)}
                    placeholder="Filtrar por CID-10..."
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCSV('acompanhamento')}
                  className="text-xs gap-1.5 h-8"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                    <tr>
                      <th className="p-3">Matrícula</th>
                      <th className="p-3">Beneficiário</th>
                      <th className="p-3">Faixa Etária</th>
                      <th className="p-3">Unidade</th>
                      <th className="p-3">Condição Principal</th>
                      <th className="p-3">Risco</th>
                      <th className="p-3">Custo 12m</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {beneficiarios
                      .filter((b) => {
                        const matchRegiao =
                          filtroRegiao === 'ALL' || (b.unidade_regiao || '').includes(filtroRegiao)
                        const matchFaixa =
                          filtroFaixa === 'ALL' ||
                          normalizeFaixaId(b.faixa || b.faixa_etaria) === filtroFaixa
                        let matchCondicao = true
                        if (filtroCondicao && filtroCondicao.trim()) {
                          const c = (b.condicao_principal || '').toLowerCase()
                          const term = filtroCondicao.trim().toLowerCase()
                          const parts = term.split('—').map((s) => s.trim().toLowerCase())
                          matchCondicao = parts.some((p) => p && c.includes(p)) || c.includes(term)
                        }
                        return matchRegiao && matchFaixa && matchCondicao
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 text-xs">
                          <td className="p-3 font-mono">{b.matricula}</td>
                          <td className="p-3 font-medium text-slate-900">{b.nome_beneficiario}</td>
                          <td className="p-3 font-medium text-teal-800">
                            {getFaixaLabel(b.faixa || b.faixa_etaria)}
                          </td>
                          <td className="p-3 text-slate-600">{b.unidade_regiao}</td>
                          <td className="p-3 text-slate-800 font-medium">{b.condicao_principal}</td>
                          <td className="p-3">{b.risco}</td>
                          <td className="p-3 font-mono font-semibold text-emerald-700">
                            {(
                              (b.custo_12m !== undefined ? b.custo_12m : b.custo_12_meses) || 0
                            ).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="p-3 font-semibold">{b.status}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Satisfação */}
        <TabsContent value="satisfacao" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Pesquisas de Satisfação Registradas
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparadas automaticamente após fechamento e alta clínica
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportCSV('satisfacao')}
                className="text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                    <tr>
                      <th className="p-3">Ficha</th>
                      <th className="p-3">Beneficiário</th>
                      <th className="p-3">Atendente</th>
                      <th className="p-3">Nota (0-5)</th>
                      <th className="p-3">Comentário do Paciente</th>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pesquisas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 text-xs">
                        <td className="p-3 font-mono">{p.expand?.ficha_id?.ficha_id || '—'}</td>
                        <td className="p-3 font-medium text-slate-900">
                          {p.expand?.ficha_id?.expand?.beneficiario_id?.nome_beneficiario ||
                            'Paciente'}
                        </td>
                        <td className="p-3 text-slate-600">
                          {p.expand?.ficha_id?.expand?.atendente_id?.name || '—'}
                        </td>
                        <td className="p-3 font-bold text-amber-600">
                          {p.nota > 0 ? `${p.nota} ★` : 'Pendente'}
                        </td>
                        <td className="p-3 italic text-slate-700 max-w-sm truncate">
                          {p.comentario || 'Sem comentário'}
                        </td>
                        <td className="p-3">{p.canal}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              p.status === 'RESPONDIDO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Custo-Benefício */}
        <TabsContent value="custo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 text-white rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-800">
                    Custo Histórico População
                  </span>
                  <p className="text-xl font-bold text-emerald-950">
                    {beneficiarios
                      .reduce(
                        (a, c) =>
                          a + ((c.custo_12m !== undefined ? c.custo_12m : c.custo_12_meses) || 0),
                        0,
                      )
                      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-blue-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-800">
                    Economia Estimada por Prevenção
                  </span>
                  <p className="text-xl font-bold text-blue-950">
                    {(
                      beneficiarios.reduce(
                        (a, c) =>
                          a + ((c.custo_12m !== undefined ? c.custo_12m : c.custo_12_meses) || 0),
                        0,
                      ) * 0.18
                    ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{' '}
                    <span className="text-xs text-blue-600 font-normal">(-18%)</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-teal-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-600 text-white rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-teal-800">
                    Casos Críticos Estabilizados
                  </span>
                  <p className="text-xl font-bold text-teal-950">
                    {
                      beneficiarios.filter((b) => b.risco === 'CRITICO' && b.status === 'ATENDIDO')
                        .length
                    }{' '}
                    de {beneficiarios.filter((b) => b.risco === 'CRITICO').length} pacientes
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
