import React, { useState, useEffect } from 'react'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleAtivoUsuario,
} from '@/services/healthService'
import {
  Users,
  Plus,
  Search,
  Edit,
  Power,
  PowerOff,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LgpdNotice } from '@/components/common/LgpdNotice'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { User, UserPerfil, TipoProfissional } from '@/types'

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    perfil: 'ATENDENTE' as UserPerfil,
    tipo_profissional: 'ENFERMEIRO' as TipoProfissional,
    registro_profissional: '',
    unidade_regiao: 'São Paulo',
    ativo: true,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      email: '',
      password: 'senha' + Math.floor(100000 + Math.random() * 900000),
      perfil: 'OPERACAO',
      tipo_profissional: 'ENFERMEIRO',
      registro_profissional: '',
      unidade_regiao: 'São Paulo',
      ativo: true,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setEditingItem(u)
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      perfil: (u.perfil || 'OPERACAO') as UserPerfil,
      tipo_profissional: (u.tipo_profissional || 'ENFERMEIRO') as TipoProfissional,
      registro_profissional: u.registro_profissional || '',
      unidade_regiao: u.unidade_regiao || 'São Paulo',
      ativo: u.ativo ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingItem) {
        if (!editingItem.id) {
          throw new Error('ID do usuário ausente para atualização.')
        }
        await updateUsuario(editingItem.id, {
          name: formData.name,
          perfil: formData.perfil,
          tipo_profissional: formData.tipo_profissional,
          registro_profissional: formData.registro_profissional,
          unidade_regiao: formData.unidade_regiao,
          ativo: formData.ativo,
          ...(formData.password ? { password: formData.password } : {}),
        })
        toast.success('Usuário atualizado com sucesso!')
      } else {
        await createUsuario({
          ...formData,
          tema_preferido: 'LIGHT',
          categoria_profissional:
            formData.perfil === 'OPERACAO'
              ? 'ENFERMEIRO'
              : formData.perfil === 'GESTOR_PROGRAMA'
                ? 'MEDICO'
                : 'ADMINISTRATIVO',
        })
        toast.success(`Usuário ${formData.name} criado com sucesso!`)
      }
      setModalOpen(false)
      await loadData()
    } catch (err: any) {
      console.error(err)
      const detail = err?.data?.data
      let extra = ''
      if (detail && typeof detail === 'object') {
        extra = Object.entries(detail)
          .map(([k, v]: [string, any]) => `${k}: ${v?.message || JSON.stringify(v)}`)
          .join(', ')
      }
      toast.error(extra ? `Erro: ${extra}` : err?.message || 'Erro ao salvar usuário.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = (email: string) => {
    toast.info(`Instruções de redefinição de senha simuladas enviadas para ${email}!`)
  }

  const handleToggleAtivo = async (u: User) => {
    try {
      await toggleAtivoUsuario(u.id, u.ativo ?? true)
      toast.success(u.ativo ? 'Usuário inativado!' : 'Usuário ativado!')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status do usuário.')
    }
  }

  const filtered = usuarios.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.perfil?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Controle de Usuários e Perfis de Acesso
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerenciamento de contas de Gestores, Recursos Humanos (RH) e Atendentes de Saúde
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      <LgpdNotice perfil="GESTOR" />

      {/* Busca */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, email ou perfil..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total de contas: <span className="font-bold text-foreground">{filtered.length}</span>
          </p>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Nome</th>
                  <th className="p-3 font-semibold">E-mail</th>
                  <th className="p-3 font-semibold">Perfil de Acesso</th>
                  <th className="p-3 font-semibold">Tipo Profissional</th>
                  <th className="p-3 font-semibold">Registro</th>
                  <th className="p-3 font-semibold">Unidade / Polo</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-muted/30 transition-colors ${!u.ativo ? 'opacity-60 bg-muted/20' : ''}`}
                  >
                    <td className="p-3 font-semibold text-foreground">{u.name}</td>
                    <td className="p-3 text-muted-foreground font-mono">{u.email}</td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] ${
                          u.perfil === 'GESTOR'
                            ? 'bg-teal-600'
                            : u.perfil === 'RH'
                              ? 'bg-blue-600'
                              : 'bg-emerald-600'
                        }`}
                      >
                        {u.perfil || 'GESTOR'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.tipo_profissional || '—'}</td>
                    <td className="p-3 text-muted-foreground font-mono">
                      {u.registro_profissional || '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">{u.unidade_regiao || 'Brasil'}</td>
                    <td className="p-3 text-center">
                      <Badge className={`text-[10px] ${u.ativo ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        {u.ativo ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPassword(u.email)}
                          className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                          title="Resetar Senha (Simulado)"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(u)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAtivo(u)}
                          className={`h-7 w-7 ${u.ativo ? 'text-amber-600' : 'text-emerald-600'}`}
                          title={u.ativo ? 'Desativar' : 'Reativar'}
                        >
                          {u.ativo ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal CRUD Usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-primary">
                {editingItem ? 'Editar Dados do Usuário' : 'Criar Nova Conta de Usuário'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina o perfil de acesso e permissões LGPD da conta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nome Completo</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dra. Juliana Santos"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">E-mail Corporativo</Label>
                <Input
                  type="email"
                  required
                  disabled={!!editingItem}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@saude.com"
                  className="text-xs"
                />
              </div>

              {!editingItem && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Senha Inicial</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="text-xs font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Perfil RBAC</Label>
                <select
                  value={formData.perfil}
                  onChange={(e) =>
                    setFormData({ ...formData, perfil: e.target.value as UserPerfil })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                >
                  <option value="SUPERUSUARIO">SUPERUSUARIO (Super Usuário Exclusivo)</option>
                  <option value="GESTOR_VENART">GESTOR_VENART (Acesso Total & Governança)</option>
                  <option value="GESTOR_PROGRAMA">GESTOR_PROGRAMA (Médico)</option>
                  <option value="GESTOR_RH">GESTOR_RH (RH / Distribuição)</option>
                  <option value="OPERACAO">OPERACAO (Atendente de Saúde)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipo de Profissional</Label>
                  <select
                    value={formData.tipo_profissional || 'ENFERMEIRO'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo_profissional: e.target.value as TipoProfissional,
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="ENFERMEIRO">Enfermeiro(a)</option>
                    <option value="MEDICO">Médico(a)</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Registro (CRM / COREN)</Label>
                  <Input
                    value={formData.registro_profissional}
                    onChange={(e) =>
                      setFormData({ ...formData, registro_profissional: e.target.value })
                    }
                    placeholder="Ex: CRM/SP 123456"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unidade / Polo Regional</Label>
                <Input
                  value={formData.unidade_regiao}
                  onChange={(e) => setFormData({ ...formData, unidade_regiao: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Salvar Usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
