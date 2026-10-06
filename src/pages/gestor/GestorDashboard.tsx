import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BeneficiariosService, FichasService, PesquisasService } from '@/services/saude'
import { getFaixaLabel } from '@/constants/faixasEtarias'
import { Beneficiario, FichaAtendimento, PesquisaSatisfacao } from '@/types/saude'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiscoBadge, StatusBeneficiarioBadge, LgpdBadge } from '@/components/common/Badges'
import {
  Users,
  UserCheck,
  CheckCircle,
  Star,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  Upload,
  CheckSquare,
  ShieldCheck,
  DollarSign,
  HeartPulse,
  FileText,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#6366f1']

export default function GestorDashboard() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [fichas, setFichas] = useState<FichaAtendimento[]>([])
  const [pesquisas, setPesquisas] = useState<PesquisaSatisfacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, fRes, pRes] = await Promise.all([
          BeneficiariosService.list({ perPage: 1200, perfil: 'GESTOR_PROGRAMA' }),
          FichasService.list(),
          PesquisasService.listAll(),
        ])
        setBeneficiarios(bRes.items)
        setFichas(fRes)
        setPesquisas(pRes)
      } catch (err) {
        console.error('Erro ao carregar dashboard do gestor:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Métricas calculadas
  const totalBeneficiarios = beneficiarios.length
  const emAtendimento = beneficiarios.filter(
    (b) => b.status === 'APROVADO' || b.status === 'EM_ATENDIMENTO',
  ).length
  const atendidosAlta = beneficiarios.filter((b) => b.status === 'ATENDIDO').length
  const selecionados = beneficiarios.filter((b) => b.status === 'SELECIONADO').length
  const custoTotal = beneficiarios.reduce(
    (acc, curr) =>
      acc + ((curr.custo_12m !== undefined ? curr.custo_12m : curr.custo_12_meses) || 0),
    0,
  )

  // Média de satisfação
  const pesquisasComNota = pesquisas.filter((p) => p.status === 'RESPONDIDO' && p.nota > 0)
  const mediaSatisfacao = pesquisasComNota.length
    ? (pesquisasComNota.reduce((acc, p) => acc + p.nota, 0) / pesquisasComNota.length).toFixed(1)
    : '5.0'

  // Dados para gráficos
  const riscoCount: Record<string, number> = { BAIXO: 0, MEDIO: 0, ALTO: 0, CRITICO: 0 }
  const regiaoCount: Record<string, number> = {}
  const statusCount: Record<string, number> = {}

  beneficiarios.forEach((b) => {
    if (b.risco) riscoCount[b.risco] = (riscoCount[b.risco] || 0) + 1
    const reg = b.unidade_regiao ? b.unidade_regiao.split(' - ')[0] : 'Outros'
    regiaoCount[reg] = (regiaoCount[reg] || 0) + 1
    statusCount[b.status] = (statusCount[b.status] || 0) + 1
  })

  const riscoData = [
    { name: 'Baixo', value: riscoCount.BAIXO, color: '#10b981' },
    { name: 'Médio', value: riscoCount.MEDIO, color: '#f59e0b' },
    { name: 'Alto', value: riscoCount.ALTO, color: '#f97316' },
    { name: 'Crítico', value: riscoCount.CRITICO, color: '#ef4444' },
  ]

  const regiaoData = Object.keys(regiaoCount).map((key) => ({
    name: key,
    total: regiaoCount[key],
  }))

  const statusData = [
    { name: 'Elegível', value: statusCount.ELEGIVEL || 0 },
    { name: 'Selecionado', value: statusCount.SELECIONADO || 0 },
    { name: 'Aprovado', value: (statusCount.APROVADO || 0) + (statusCount.EM_ATENDIMENTO || 0) },
    { name: 'Atendido (Alta)', value: statusCount.ATENDIDO || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Painel Executivo da Gestão de Saúde
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão gerencial consolidada, volumetria clínica, indicadores e controle de custos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/gestor/importar">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" /> Importar Planilha
            </Button>
          </Link>
          <Link to="/gestor/selecionar">
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
              <CheckSquare className="w-4 h-4" /> Selecionar População
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Beneficiários
            </CardTitle>
            <Users className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalBeneficiarios}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-teal-700 font-semibold">{selecionados}</span> em fase de
              triagem/seleção
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Em Cuidado Ativo
            </CardTitle>
            <HeartPulse className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{emAtendimento}</div>
            <p className="text-xs text-slate-500 mt-1">
              Distribuídos entre equipes de enfermagem/medicina
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Casos Concluídos (Alta)
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{atendidosAlta}</div>
            <p className="text-xs text-slate-500 mt-1">
              {((atendidosAlta / (totalBeneficiarios || 1)) * 100).toFixed(0)}% da população total
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-gradient-to-br from-white to-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Satisfação Média (NPS)
            </CardTitle>
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 flex items-center gap-1.5">
              <span>{mediaSatisfacao}</span>
              <span className="text-sm font-normal text-slate-500">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Baseado em {pesquisasComNota.length} pesquisas respondidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Custo Total Card (Acesso Gestor Exclusivo) */}
      <Card className="border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Custo Assistencial 12 Meses (Acesso Restrito ao Gestor)
              </span>
              <h3 className="text-2xl font-extrabold text-emerald-950">
                {custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs text-emerald-800 max-w-sm">
              Visualização de métricas financeiras habilitada pelo papel{' '}
              <strong>GESTOR_VENART / GESTOR_PROGRAMA</strong>. Perfis GESTOR_RH e OPERACAO possuem
              máscara LGPD dinâmica conforme a coleção config_lgpd_campos.
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risco Clínico */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Distribuição por Risco Clínico
            </CardTitle>
            <CardDescription className="text-xs">
              Classificação preditiva da população
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riscoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riscoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Beneficiários por Região */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Beneficiários por Região/Unidade
            </CardTitle>
            <CardDescription className="text-xs">Concentração geográfica</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regiaoData}>
                <XAxis dataKey="name" fontSize={12} stroke="#888888" />
                <YAxis fontSize={12} stroke="#888888" />
                <Tooltip />
                <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status do Funil de Cuidado */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Status no Ciclo de Acompanhamento
            </CardTitle>
            <CardDescription className="text-xs">
              Funil operacional de beneficiários
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Beneficiários com Acesso Total Gestor */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Beneficiários em Acompanhamento (Acesso Total Gestão)
            </CardTitle>
            <CardDescription className="text-xs">
              Visualização completa sem restrições LGPD (Condição, Risco e Custos)
            </CardDescription>
          </div>
          <Link to="/gestor/beneficiarios">
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-700 hover:text-teal-800 gap-1 text-xs"
            >
              Ver CRUD Completo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Nome Beneficiário</th>
                  <th className="p-3">Faixa Etária</th>
                  <th className="p-3">Unidade</th>
                  <th className="p-3">Condição Principal</th>
                  <th className="p-3">Risco</th>
                  <th className="p-3">Custo 12m</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Atendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {beneficiarios.slice(0, 8).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-slate-600">{b.matricula}</td>
                    <td className="p-3 font-medium text-slate-900">
                      {b.nome || b.nome_beneficiario}
                    </td>
                    <td className="p-3 text-xs font-medium text-teal-800">
                      {getFaixaLabel(b.faixa || b.faixa_etaria)}
                    </td>
                    <td className="p-3 text-xs text-slate-600">{b.unidade || b.unidade_regiao}</td>
                    <td className="p-3 text-xs text-slate-800 max-w-xs truncate font-medium">
                      {b.condicao_principal || '—'}
                    </td>
                    <td className="p-3">
                      <RiscoBadge risco={b.risco} />
                    </td>
                    <td className="p-3 font-mono text-xs font-semibold text-emerald-700">
                      {(
                        (b.custo_12m !== undefined ? b.custo_12m : b.custo_12_meses) || 0
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="p-3">
                      <StatusBeneficiarioBadge status={b.status} />
                    </td>
                    <td className="p-3 text-xs text-slate-600">
                      {b.expand?.atendente_id?.name || 'Não atribuído'}
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
