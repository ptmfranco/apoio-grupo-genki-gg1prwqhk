import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { User, UserPerfil, TemaPreferido } from '@/types/saude'

interface AuthContextType {
  user: User | null
  token: string | null
  perfil: UserPerfil | null
  tema: TemaPreferido
  setTema: (tema: TemaPreferido) => Promise<void>
  toggleTema: () => Promise<void>
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
  switchMockProfile?: (perfil: UserPerfil) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [tema, setTemaState] = useState<TemaPreferido>('LIGHT')
  const [isLoading, setIsLoading] = useState(true)

  const applyThemeToDocument = (t: TemaPreferido) => {
    const root = document.documentElement
    if (t === 'DARK') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const mapModelToUser = (model: any): User => {
    // PocketBase pode retornar select como string ou array de strings
    const rawPerfil = Array.isArray(model.perfil) ? model.perfil[0] : model.perfil

    let resolvedPerfil: UserPerfil = 'GESTOR_VENART'
    if (
      rawPerfil === 'SUPERUSUARIO' ||
      rawPerfil === 'GESTOR_VENART' ||
      rawPerfil === 'GESTOR_PROGRAMA' ||
      rawPerfil === 'GESTOR_RH' ||
      rawPerfil === 'OPERACAO'
    ) {
      resolvedPerfil = rawPerfil
    } else if (rawPerfil === 'GESTOR') {
      resolvedPerfil = 'GESTOR_VENART'
    } else if (rawPerfil === 'RH') {
      resolvedPerfil = 'GESTOR_RH'
    } else if (rawPerfil === 'ATENDENTE') {
      resolvedPerfil = 'OPERACAO'
    }

    const resolvedTema: TemaPreferido = model.tema_preferido === 'DARK' ? 'DARK' : 'LIGHT'

    return {
      id: model.id,
      name: model.name || model.email || 'Usuário',
      email: model.email,
      perfil: resolvedPerfil,
      tema_preferido: resolvedTema,
      categoria_profissional:
        model.categoria_profissional || model.tipo_profissional || 'ADMINISTRATIVO',
      tipo_profissional:
        model.tipo_profissional || model.categoria_profissional || 'ADMINISTRATIVO',
      registro_profissional: model.registro_profissional,
      unidade_regiao: model.unidade_regiao || model.unidade,
      ativo: model.ativo ?? true,
      created: model.created,
      updated: model.updated,
    }
  }

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const fresh = await pb.collection('users').getOne(pb.authStore.model.id)
        const mapped = mapModelToUser(fresh)
        setUser(mapped)
        setToken(pb.authStore.token)
        const t = mapped.tema_preferido || 'LIGHT'
        setTemaState(t)
        applyThemeToDocument(t)
      } else {
        setUser(null)
        setToken(null)
        setTemaState('LIGHT')
        applyThemeToDocument('LIGHT')
      }
    } catch {
      setUser(null)
      setToken(null)
      setTemaState('LIGHT')
      applyThemeToDocument('LIGHT')
      pb.authStore.clear()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setToken(pb.authStore.token)
      if (pb.authStore.model) {
        const mapped = mapModelToUser(pb.authStore.model)
        setUser(mapped)
        const t = mapped.tema_preferido || 'LIGHT'
        setTemaState(t)
        applyThemeToDocument(t)
      } else {
        setUser(null)
        setTemaState('LIGHT')
        applyThemeToDocument('LIGHT')
      }
    })

    refreshUser()

    return () => {
      unsub()
    }
  }, [])

  const setTema = async (novoTema: TemaPreferido) => {
    setTemaState(novoTema)
    applyThemeToDocument(novoTema)
    if (user?.id) {
      try {
        await pb.collection('users').update(user.id, { tema_preferido: novoTema })
        setUser((prev) => (prev ? { ...prev, tema_preferido: novoTema } : prev))
      } catch (err) {
        console.warn('Erro ao persistir tema do usuário:', err)
      }
    }
  }

  const toggleTema = async () => {
    const next = tema === 'DARK' ? 'LIGHT' : 'DARK'
    await setTema(next)
  }

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true)
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
      const mapped = mapModelToUser(authData.record)
      setUser(mapped)
      setToken(authData.token)
      const t = mapped.tema_preferido || 'LIGHT'
      setTemaState(t)
      applyThemeToDocument(t)
      return mapped
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
    setTemaState('LIGHT')
    applyThemeToDocument('LIGHT')
  }

  // Alternar rapidamente entre as contas demo de desenvolvimento (desabilitado em produção)
  const switchMockProfile = async (targetPerfil: UserPerfil) => {
    // Em produção com senhas individuais protegidas, redirecionar para a tela de login
    logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        perfil: user?.perfil || null,
        tema,
        setTema,
        toggleTema,
        isLoading,
        login,
        logout,
        refreshUser,
        switchMockProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
