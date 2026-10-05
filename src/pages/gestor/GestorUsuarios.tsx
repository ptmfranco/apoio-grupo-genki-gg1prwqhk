import React, { useEffect, useState } from 'react'
import { UsuariosService } from '@/services/saude'
import { User, UserPerfil, TipoProfissional } from '@/types/saude'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Edit, UserCheck, Shield, Stethoscope, Eye, EyeOff } from 'lucide-react'

export default function GestorUsuariosCrud() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)

  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    name: '',
    email: '',
    password: '',
    perfil: 'OPERACAO',
    tipo_profissional: 'ENFERMEIRO',
    categoria_profissional: 'ENFERMEIRO',
    registro_profissional: '',
    unidade_regiao: '',
    tema_preferido: 'LIGHT',
    ativo: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await UsuariosService.list()
      setUsuarios(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setErrorMessage(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      perfil: 'OPERACAO',
      tipo_profissional: 'ENFERMEIRO',
      categoria_profissional: 'ENFERMEIRO',
      registro_profissional: 'COREN/SP 000000',
      unidade_regiao: 'São Paulo',
      tema_preferido: 'LIGHT',
      ativo: true,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setEditingItem(u)
    setErrorMessage(null)
    setFormData({
      name: u.name,
      email: u.email,
      perfil: u.perfil || 'GESTOR_VENART',
      tipo_profissional: u.tipo_profissional || 'ENFERMEIRO',
      categoria_profissional: u.categoria_profissional || 'ADMINISTRATIVO',
      registro_profissional: u.registro_profissional || '',
      unidade_regiao: u.unidade_regiao || 'São Paulo',
      tema_preferido: u.tema_preferido || 'LIGHT',
      ativo: u.ativo ?? true,
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingUser(true)
    setErrorMessage(null)
    try {
      if (editingItem) {
        await UsuariosService.update(editingItem.id, formData)
      } else {
        await UsuariosService.create(formData)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err: any) {
      console.error('Erro ao gravar usuário:', err)
      const detail = err?.data?.data
      let extra = ''
      if (detail && typeof detail === 'object') {
        extra = Object.entries(detail)
          .map(([k, v]: [string, any]) => `${k}: ${v?.message || JSON.stringify(v)}`)
          .join(', ')
      }
      setErrorMessage(
        extra
          ? `Erro nos campos: ${extra}`
          : err?.message || 'Falha ao salvar usuário no PocketBase.',
      )
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleAtivo = async (u: User) => {
    try {
      await UsuariosService.toggleAtivo(u.id, !u.ativo)
      await loadData()
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err?.message || 'Falha ao alterar status'))
    }
  }

  const filtered = usuarios.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.perfil || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Usuários & Operadores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de perfis RBAC (Gestores, RH e Atendentes de Saúde)
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Novo Usuário
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Pesquisar por nome, email ou perfil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="p-3.5">Nome</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Perfil RBAC</th>
                  <th className="p-3.5">Profissão</th>
                  <th className="p-3.5">Registro (CRM/COREN)</th>
                  <th className="p-3.5">Região</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-medium text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {u.name?.[0] || 'U'}
                      </div>
                      {u.name}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          u.perfil === 'GESTOR_VENART'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : u.perfil === 'GESTOR_PROGRAMA'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : u.perfil === 'GESTOR_RH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-teal-100 text-teal-800 border border-teal-300'
                        }`}
                      >
                        {u.perfil || 'GESTOR_VENART'}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700 font-medium">
                      {u.tipo_profissional || '—'}
                    </td>
                    <td className="p-3.5 text-xs font-mono text-slate-600">
                      {u.registro_profissional || '—'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">{u.unidade_regiao || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(u)}
                        className={`text-xs h-8 px-2 ${u.ativo ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Criar/Editar Usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Editar Usuário: ${editingItem.name}` : 'Criar Novo Usuário'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure os privilégios e dados profissionais
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {errorMessage && (
              <div className="p-3 text-xs rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {errorMessage}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Nome Completo</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">E-mail (Login)</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Senha {editingItem ? '(deixe em branco para não alterar)' : ''}
              </Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="text-xs pr-9"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Perfil RBAC</Label>
                <Select
                  value={formData.perfil || 'OPERACAO'}
                  onValueChange={(val) => {
                    const perfilVal = val as UserPerfil
                    // Sugerir categoria padrão conforme o perfil
                    let cat = formData.categoria_profissional || 'ADMINISTRATIVO'
                    if (perfilVal === 'OPERACAO') cat = 'ENFERMEIRO'
                    if (perfilVal === 'GESTOR_PROGRAMA') cat = 'MEDICO'
                    setFormData({
                      ...formData,
                      perfil: perfilVal,
                      categoria_profissional: cat as any,
                    })
                  }}
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GESTOR_VENART">GESTOR_VENART (Administrador)</SelectItem>
                    <SelectItem value="GESTOR_PROGRAMA">GESTOR_PROGRAMA (Médico)</SelectItem>
                    <SelectItem value="GESTOR_RH">GESTOR_RH (Recursos Humanos)</SelectItem>
                    <SelectItem value="OPERACAO">OPERACAO (Atendente/Enfermeiro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Categoria Profissional</Label>
                <Select
                  value={formData.categoria_profissional || 'ADMINISTRATIVO'}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      categoria_profissional: val as any,
                      tipo_profissional:
                        val === 'ENFERMEIRO' || val === 'MEDICO'
                          ? (val as TipoProfissional)
                          : undefined,
                    })
                  }
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENFERMEIRO">Enfermeiro(a)</SelectItem>
                    <SelectItem value="MEDICO">Médico(a)</SelectItem>
                    <SelectItem value="ADMINISTRATIVO">Administrativo / Gestão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tipo Clínico (Se aplicável)</Label>
                <Select
                  value={formData.tipo_profissional || 'NENHUM'}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      tipo_profissional: val === 'NENHUM' ? undefined : (val as TipoProfissional),
                    })
                  }
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUM">Não aplicável (Geral)</SelectItem>
                    <SelectItem value="ENFERMEIRO">Enfermeiro(a)</SelectItem>
                    <SelectItem value="MEDICO">Médico(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Tema Preferido</Label>
                <Select
                  value={formData.tema_preferido || 'LIGHT'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, tema_preferido: val as 'LIGHT' | 'DARK' })
                  }
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIGHT">Claro (LIGHT)</SelectItem>
                    <SelectItem value="DARK">Escuro (DARK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Registro Profissional</Label>
                <Input
                  placeholder="Ex: CRM/SP 123456"
                  value={formData.registro_profissional || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, registro_profissional: e.target.value })
                  }
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Unidade / Região</Label>
                <Input
                  value={formData.unidade_regiao || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_regiao: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="user-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="user-ativo" className="text-xs font-medium cursor-pointer">
                Usuário Habilitado para Login
              </Label>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingUser}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                {savingUser ? 'Gravando...' : 'Salvar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
