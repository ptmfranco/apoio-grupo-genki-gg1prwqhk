import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { Search, Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

export default function GestorUsuariosCrud() {
  const navigate = useNavigate()
  const location = useLocation()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)

  const [formData, setFormData] = useState<
    Partial<User> & {
      password?: string
      passwordConfirm?: string
      oldPassword?: string
    }
  >({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    oldPassword: '',
    perfil: 'OPERACAO',
    tipo_profissional: 'ENFERMEIRO',
    categoria_profissional: 'ENFERMEIRO',
    registro_profissional: '',
    unidade_regiao: '',
    tema_preferido: 'LIGHT',
    ativo: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Identificar se o usuário sendo editado é a própria conta conectada
  const isEditingSelf = Boolean(
    editingItem && pb.authStore.record && editingItem.id === pb.authStore.record.id,
  )

  const checkAuthOrRedirect = (): boolean => {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      toast.error('Sessão expirada. Faça login novamente como Super Usuário.')
      navigate('/login', {
        state: {
          from: location,
          feedback: 'Sua sessão expirou. Por favor, faça login com a conta de Super Usuário.',
        },
        replace: true,
      })
      return false
    }
    return true
  }

  const loadData = async () => {
    if (!checkAuthOrRedirect()) return
    setLoading(true)
    try {
      const res = await UsuariosService.list()
      setUsuarios(res)
    } catch (err: any) {
      console.error('Erro ao listar usuários:', err)
      const msg = getErrorMessage(err)
      toast.error(msg)
      if (err?.status === 401 || err?.status === 403) {
        checkAuthOrRedirect()
      }
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
    setShowPassword(false)
    setShowPasswordConfirm(false)
    setShowOldPassword(false)
    setFormData({
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      oldPassword: '',
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
    setShowPassword(false)
    setShowPasswordConfirm(false)
    setShowOldPassword(false)
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      passwordConfirm: '',
      oldPassword: '',
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
    if (!checkAuthOrRedirect()) return

    // Validação de senhas no frontend antes de enviar
    const newPass = formData.password?.trim() || ''
    const confirmPass = formData.passwordConfirm?.trim() || ''
    const oldPass = formData.oldPassword?.trim() || ''

    if (newPass) {
      if (newPass.length < 8) {
        const msg = 'A nova senha deve ter no mínimo 8 caracteres.'
        setErrorMessage(msg)
        toast.error(msg)
        return
      }
      if (confirmPass && newPass !== confirmPass) {
        const msg = 'A confirmação de senha não confere com a nova senha digitada.'
        setErrorMessage(msg)
        toast.error(msg)
        return
      }
      if (isEditingSelf && !oldPass) {
        const msg = 'Ao alterar sua própria senha, informe sua senha atual.'
        setErrorMessage(msg)
        toast.error(msg)
        return
      }
    }

    setSavingUser(true)
    setErrorMessage(null)
    try {
      if (editingItem) {
        if (!editingItem.id) {
          throw new Error('Identificador do usuário ausente na edição.')
        }

        // Montar payload limpo:
        // Enviar o e-mail informado (ele é o login do usuário e deve persistir de fato)
        const payloadToUpdate: any = {
          name: formData.name?.trim(),
          email: formData.email?.trim().toLowerCase(),
          perfil: formData.perfil,
          tipo_profissional: formData.tipo_profissional,
          categoria_profissional: formData.categoria_profissional,
          registro_profissional: formData.registro_profissional?.trim(),
          unidade_regiao: formData.unidade_regiao?.trim(),
          tema_preferido: formData.tema_preferido,
          ativo: formData.ativo,
        }

        if (newPass) {
          payloadToUpdate.password = newPass
          payloadToUpdate.passwordConfirm = confirmPass || newPass
          if (isEditingSelf && oldPass) {
            payloadToUpdate.oldPassword = oldPass
          }
        }

        await UsuariosService.update(editingItem.id, payloadToUpdate)
        toast.success(`Usuário ${formData.name || ''} atualizado com sucesso!`)
      } else {
        await UsuariosService.create({
          ...formData,
          password: newPass || undefined,
        })
        toast.success(`Novo usuário ${formData.name || ''} criado com sucesso!`)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err: any) {
      console.error('Erro ao gravar usuário:', err)
      if (err?.status === 401) {
        toast.error('Sua sessão expirou. Redirecionando ao login...')
        navigate('/login', {
          state: {
            from: location,
            feedback: 'Sessão expirada. Entre novamente para continuar a edição.',
          },
          replace: true,
        })
        return
      }
      const friendlyMsg = getErrorMessage(err)
      setErrorMessage(friendlyMsg)
      toast.error(friendlyMsg)
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleAtivo = async (u: User) => {
    if (!checkAuthOrRedirect()) return
    try {
      await UsuariosService.toggleAtivo(u.id, !u.ativo)
      toast.success(u.ativo ? 'Usuário inativado!' : 'Usuário ativado com sucesso!')
      await loadData()
    } catch (err: any) {
      console.error('Erro ao alternar status do usuário:', err)
      const msg = getErrorMessage(err)
      toast.error(msg)
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
            Exclusivo do Super Usuário — Criação e administração de credenciais de acesso
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
                          u.perfil === 'SUPERUSUARIO'
                            ? 'bg-amber-100 text-amber-900 border border-amber-400 font-extrabold'
                            : u.perfil === 'GESTOR_VENART'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : u.perfil === 'GESTOR_PROGRAMA'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : u.perfil === 'GESTOR_RH'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-teal-100 text-teal-800 border border-teal-300'
                        }`}
                      >
                        {u.perfil === 'SUPERUSUARIO'
                          ? 'SUPER USUÁRIO'
                          : u.perfil || 'GESTOR_VENART'}
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

            {/* Campo de Senha Atual (exigido SOMENTE se for o próprio usuário alterando a própria senha) */}
            {isEditingSelf && (
              <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200/70 space-y-1">
                <Label className="text-xs font-semibold text-amber-900">
                  Senha Atual (obrigatória apenas se for alterar a própria senha)
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={formData.oldPassword || ''}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    placeholder="Digite sua senha atual"
                    className="text-xs pr-9 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                    title={showOldPassword ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={showOldPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Nova Senha & Confirmação de Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">
                  {editingItem ? 'Nova Senha' : 'Senha Inicial'}
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingItem ? 'Em branco = não alterar' : 'Mínimo 8 caracteres'}
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
                {editingItem && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    O Super Usuário pode redefinir sem saber a senha anterior
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold">Confirmar Nova Senha</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={formData.passwordConfirm || ''}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    placeholder="Repita a nova senha"
                    className="text-xs pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                    title={showPasswordConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'}
                    aria-label={showPasswordConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                    <SelectItem value="SUPERUSUARIO">
                      SUPERUSUARIO (Super Usuário Exclusivo)
                    </SelectItem>
                    <SelectItem value="GESTOR_VENART">
                      GESTOR_VENART (Gestor Geral VenArt)
                    </SelectItem>
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
