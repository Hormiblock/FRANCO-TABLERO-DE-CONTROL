import { type Empresa } from './utils'

export interface Gerente {
  id: string
  nombre: string
  empresas: Empresa[]
  whatsapp: string    // número con código de país sin + ni espacios, ej: 5491112345678
  email: string
  avatar: string      // iniciales
}

export interface Bajada {
  id: string
  gerenteId: string
  titulo: string
  descripcion: string
  pasos: string[]
  prioridad: 'alta' | 'media' | 'baja'
  empresa: Empresa
  fecha: string
  estado: 'pendiente' | 'en_curso' | 'completado'
  enviadoPor: 'whatsapp' | 'email' | 'ninguno'
}

export const GERENTES: Gerente[] = [
  {
    id: 'jose-sparks',
    nombre: 'Jose Sparks',
    empresas: ['hormiblock', 'blockera'],
    whatsapp: '',   // completar con el número real
    email: '',      // completar con el email real
    avatar: 'JS',
  },
  {
    id: 'santiago-dans',
    nombre: 'Santiago Dans',
    empresas: ['granny'],
    whatsapp: '',   // completar con el número real
    email: '',      // completar con el email real
    avatar: 'SD',
  },
]

export const BAJADAS_DEMO: Bajada[] = [
  {
    id: '1',
    gerenteId: 'jose-sparks',
    titulo: 'Preparar documentación licitación Municipal',
    descripcion: 'Necesitamos tener todo listo para el cierre del jueves 9/7.',
    pasos: [
      'Conseguir certificado de IERIC actualizado',
      'Imprimir y firmar planos del proyecto',
      'Armar sobre con toda la documentación',
      'Presentar en municipalidad antes de las 17hs',
    ],
    prioridad: 'alta',
    empresa: 'blockera',
    fecha: '2026-07-06',
    estado: 'en_curso',
    enviadoPor: 'whatsapp',
  },
  {
    id: '2',
    gerenteId: 'jose-sparks',
    titulo: 'Pedido de cemento urgente',
    descripcion: 'El stock está bajo mínimo. Coordinar entrega para esta semana.',
    pasos: [
      'Llamar a proveedor Cementos del Sur',
      'Pedir cotización para 50 toneladas',
      'Confirmar fecha de entrega',
      'Enviar orden de compra',
    ],
    prioridad: 'alta',
    empresa: 'hormiblock',
    fecha: '2026-07-05',
    estado: 'pendiente',
    enviadoPor: 'ninguno',
  },
  {
    id: '3',
    gerenteId: 'santiago-dans',
    titulo: 'Revisión cultivos lote norte',
    descripcion: 'Coordinar con el agrónomo la visita al campo para análisis de suelo.',
    pasos: [
      'Contactar al agrónomo Pérez para fijar fecha',
      'Preparar acceso al lote norte (abrir tranquera)',
      'Tomar muestras de suelo en 5 puntos',
      'Enviar resultados al mail antes del viernes',
    ],
    prioridad: 'media',
    empresa: 'granny',
    fecha: '2026-07-04',
    estado: 'completado',
    enviadoPor: 'whatsapp',
  },
]
