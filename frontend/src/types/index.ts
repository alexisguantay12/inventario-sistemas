export interface Area {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}


export interface Sector {
  id: number;
  area: number;
  area_nombre: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}


export interface EquipoTrabajo {
  id: number;
  sector: number;
  sector_nombre: string;
  area_nombre: string;

  sistema_operativo_principal: string | null;
  ram_total_gb: number;

  nombre: string;
  uso_actual: string;
  foto: string | null;
  estado: "ACTIVO" | "INACTIVO";
  observaciones: string;
  cantidad_activos: number;
  hostname_principal: string | null;
}


export interface TipoActivo {
  id: number;
  nombre: string;
  prefijo: string;
  descripcion: string;
  activo: boolean;

  // NUEVO
  tiene_sistema_operativo: boolean;
  tiene_mac: boolean;
}


export interface Activo {
  id: number;

  codigo_inventario: string;

  tipo_activo: number;
  tipo_activo_nombre: string;

  sector: number;
  sector_nombre: string;

  area_nombre: string;

  equipo_trabajo: number | null;
  equipo_trabajo_nombre: string | null;

  marca: string;
  modelo: string;
  numero_serie: string;

  hostname: string;
  tiene_mac: boolean;
  tipo_activo_tiene_mac?: boolean;
  // NUEVO
  sistema_operativo: string;
  sistema_operativo_nombre: string;
  fecha_adquisicion: string | null;
  mac_address?: string | null;
  estado:
    | "EN_USO"
    | "DISPONIBLE"
    | "RESERVADO"
    | "EN_REPARACION"
    | "DEFECTUOSO"
    | "BAJA";

  observaciones: string;

  cantidad_componentes: number;
}


export type TipoComponente = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;

  // NUEVO
  tiene_capacidad: boolean;

  tipos_activo_permitidos: number[];
};


export type Componente = {
  id: number;

  tipo_componente: number;
  tipo_componente_nombre?: string;

  activo: number | null;
  activo_codigo?: string | null;
  activo_hostname?: string | null;

  marca: string;
  modelo: string;
  numero_serie: string;

  capacidad_valor: number | null;
  capacidad_unidad: string;

  estado: string;

  fecha_adquisicion: string | null;

  observaciones: string;

  created_at?: string;
  updated_at?: string;
};