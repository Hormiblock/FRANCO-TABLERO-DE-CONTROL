export type Empresa = 'ostara' | 'hormiblock' | 'blockera' | 'granny'
export type Rol = 'admin' | 'gerente'
export type TareaEstado = 'pendiente' | 'en_curso' | 'bloqueado' | 'completado'
export type TareaPrioridad = 'alta' | 'media' | 'baja'

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  empresas: Empresa[]
  whatsapp: string
  email: string
  avatar: string
  created_at: string
}

export interface Tarea {
  id: string
  titulo: string
  descripcion: string
  empresa: Empresa
  estado: TareaEstado
  prioridad: TareaPrioridad
  asignado_a: string | null
  creado_por: string | null
  fecha_limite: string | null
  created_at: string
  updated_at: string
  // joins
  perfil_asignado?: Pick<Perfil, 'id' | 'nombre' | 'avatar'> | null
}

export interface TareaComentario {
  id: string
  tarea_id: string
  autor_id: string
  mensaje: string
  created_at: string
  perfil_autor?: Pick<Perfil, 'id' | 'nombre' | 'avatar'> | null
}

export interface TareaAdjunto {
  id: string
  tarea_id: string
  tipo: 'archivo' | 'link'
  nombre: string
  url: string
  subido_por: string | null
  created_at: string
}
