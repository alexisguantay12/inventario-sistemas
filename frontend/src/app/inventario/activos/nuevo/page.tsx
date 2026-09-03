"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  apiGet,
  apiPost,
} from "@/lib/api";

import type {
  Activo,
  Area,
  EquipoTrabajo,
  Sector,
  TipoActivo,
  TipoComponente,
} from "@/types";


const FECHA_ADQUISICION_DEFAULT =
  "2024-04-01";


const ESTADOS_ACTIVO = [
  {
    value: "EN_USO",
    label: "En uso",
  },
  {
    value: "DISPONIBLE",
    label: "Disponible",
  },
  {
    value: "RESERVADO",
    label: "Reservado",
  },
  {
    value: "EN_REPARACION",
    label: "En reparación",
  },
  {
    value: "DEFECTUOSO",
    label: "Defectuoso",
  },
  {
    value: "BAJA",
    label: "Dado de baja",
  },
];


type SistemaOperativoOption = {
  id: number;
  nombre: string;
  activo: boolean;
};


type ActivoForm = {
  tipo_activo: string;
  area: string;
  sector: string;
  equipo_trabajo: string;
  marca: string;
  modelo: string;
  hostname: string;
  sistema_operativo: string;
  fecha_adquisicion: string;
  estado: string;
};


type ComponenteForm = {
  tipo_componente: string;
  marca: string;
  modelo: string;
  capacidad_valor: string;
  capacidad_unidad: string;
};


const initialForm: ActivoForm = {
  tipo_activo: "",
  area: "",
  sector: "",
  equipo_trabajo: "",
  marca: "",
  modelo: "",
  hostname: "",
  sistema_operativo: "",
  fecha_adquisicion:
    FECHA_ADQUISICION_DEFAULT,
  estado: "EN_USO",
};


const initialComponente: ComponenteForm = {
  tipo_componente: "",
  marca: "",
  modelo: "",
  capacidad_valor: "",
  capacidad_unidad: "GB",
};


export default function NuevoActivoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sectorParam =
    searchParams.get("sector");

  const equipoParam =
    searchParams.get("equipo");


  const [form, setForm] =
    useState<ActivoForm>(
      initialForm,
    );


  const [areas, setAreas] =
    useState<Area[]>([]);


  const [sectores, setSectores] =
    useState<Sector[]>([]);


  const [
    tiposActivo,
    setTiposActivo,
  ] = useState<TipoActivo[]>([]);


  const [
    equiposTrabajo,
    setEquiposTrabajo,
  ] = useState<
    EquipoTrabajo[]
  >([]);


  const [
    tiposComponente,
    setTiposComponente,
  ] = useState<
    TipoComponente[]
  >([]);


  const [
    sistemasOperativos,
    setSistemasOperativos,
  ] = useState<
    SistemaOperativoOption[]
  >([]);


  const [
    componentes,
    setComponentes,
  ] = useState<
    ComponenteForm[]
  >([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    loadingComponentes,
    setLoadingComponentes,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const [
    fieldErrors,
    setFieldErrors,
  ] = useState<
    Record<
      string,
      string[]
    >
  >({});


  const [
    modalComponenteAbierto,
    setModalComponenteAbierto,
  ] = useState(false);


  const [
    componenteModal,
    setComponenteModal,
  ] = useState<ComponenteForm>({
    ...initialComponente,
  });


  const [
    indiceComponenteEdicion,
    setIndiceComponenteEdicion,
  ] = useState<
    number | null
  >(null);


  const [
    modalError,
    setModalError,
  ] = useState<
    string | null
  >(null);


  useEffect(() => {
    async function loadBaseData() {
      try {
        setLoading(true);
        setError(null);

        const [
          areasData,
          sectoresData,
          tiposData,
          sistemasOperativosData,
        ] =
          await Promise.all([
            apiGet<Area[]>(
              "/estructura/areas/",
            ),

            apiGet<Sector[]>(
              "/estructura/sectores/",
            ),

            apiGet<TipoActivo[]>(
              "/inventario/tipos-activo/",
            ),

            apiGet<
              SistemaOperativoOption[]
            >(
              "/inventario/sistemas-operativos/?activo=true",
            ),
          ]);


        setAreas(
          areasData.filter(
            (area) =>
              area.activo,
          ),
        );


        setSectores(
          sectoresData.filter(
            (sector) =>
              sector.activo,
          ),
        );


        setTiposActivo(
          tiposData.filter(
            (tipo) =>
              tipo.activo,
          ),
        );


        setSistemasOperativos(
          sistemasOperativosData.filter(
            (sistema) =>
              sistema.activo,
          ),
        );


        if (sectorParam) {
          const sectorId =
            Number(
              sectorParam,
            );

          const sectorEncontrado =
            sectoresData.find(
              (sector) =>
                sector.id ===
                sectorId,
            );

          if (sectorEncontrado) {
            setForm(
              (prev) => ({
                ...prev,

                area:
                  String(
                    sectorEncontrado.area,
                  ),

                sector:
                  String(
                    sectorEncontrado.id,
                  ),

                equipo_trabajo:
                  equipoParam || "",
              }),
            );
          }
        }

      } catch (err) {
        console.error(err);

        setError(
          "No se pudieron cargar los datos necesarios para crear el activo.",
        );

      } finally {
        setLoading(false);
      }
    }

    loadBaseData();

  }, [
    sectorParam,
    equipoParam,
  ]);


  useEffect(() => {
    async function loadEquipos() {
      if (!form.sector) {
        setEquiposTrabajo([]);
        return;
      }

      try {
        const data =
          await apiGet<
            EquipoTrabajo[]
          >(
            `/inventario/equipos-trabajo/?sector=${form.sector}&estado=ACTIVO`,
          );

        setEquiposTrabajo(
          data,
        );

      } catch (err) {
        console.error(err);

        setEquiposTrabajo([]);
      }
    }

    loadEquipos();

  }, [
    form.sector,
  ]);


  useEffect(() => {
    async function loadTiposComponentes() {
      if (!form.tipo_activo) {
        setTiposComponente([]);
        setComponentes([]);
        return;
      }

      try {
        setLoadingComponentes(
          true,
        );

        const data =
          await apiGet<
            TipoComponente[]
          >(
            `/inventario/tipos-componentes/?tipo_activo=${form.tipo_activo}&activo=true`,
          );

        setTiposComponente(
          data,
        );

      } catch (err) {
        console.error(err);

        setTiposComponente([]);
        setComponentes([]);

      } finally {
        setLoadingComponentes(
          false,
        );
      }
    }

    loadTiposComponentes();

  }, [
    form.tipo_activo,
  ]);


  const sectoresFiltrados =
    useMemo(() => {
      if (!form.area) {
        return [];
      }

      const areaId =
        Number(
          form.area,
        );

      return sectores.filter(
        (sector) =>
          sector.area ===
          areaId,
      );

    }, [
      sectores,
      form.area,
    ]);


  const tipoSeleccionado =
    useMemo(() => {
      if (!form.tipo_activo) {
        return null;
      }

      return (
        tiposActivo.find(
          (tipo) =>
            tipo.id ===
            Number(
              form.tipo_activo,
            ),
        ) ?? null
      );

    }, [
      tiposActivo,
      form.tipo_activo,
    ]);


  const admiteComponentes =
    tiposComponente.length > 0;


  const permiteSistemaOperativo =
    Boolean(
      tipoSeleccionado
        ?.tiene_sistema_operativo,
    );


  const tipoComponenteModal =
    useMemo(() => {
      if (
        !componenteModal
          .tipo_componente
      ) {
        return null;
      }

      return (
        tiposComponente.find(
          (tipo) =>
            tipo.id ===
            Number(
              componenteModal
                .tipo_componente,
            ),
        ) ?? null
      );

    }, [
      tiposComponente,
      componenteModal
        .tipo_componente,
    ]);


  function obtenerTipoComponente(
    tipoId: string,
  ) {
    return (
      tiposComponente.find(
        (tipo) =>
          tipo.id ===
          Number(tipoId),
      ) ?? null
    );
  }


  function descripcionComponente(
    componente: ComponenteForm,
  ) {
    const tipo =
      obtenerTipoComponente(
        componente
          .tipo_componente,
      );

    const partes: string[] =
      [];

    if (componente.marca) {
      partes.push(
        componente.marca,
      );
    }

    if (componente.modelo) {
      partes.push(
        componente.modelo,
      );
    }

    if (
      tipo?.tiene_capacidad &&
      componente.capacidad_valor
    ) {
      partes.push(
        `${componente.capacidad_valor} ${componente.capacidad_unidad}`,
      );
    }

    return (
      partes.join(" · ") ||
      "Sin detalle adicional"
    );
  }


  function handleChange(
    field: keyof ActivoForm,
    value: string,
  ) {
    setForm(
      (prev) => ({
        ...prev,
        [field]: value,
      }),
    );

    setFieldErrors(
      (prev) => {
        const copy = {
          ...prev,
        };

        delete copy[field];

        return copy;
      },
    );
  }


  function handleTipoActivoChange(
    value: string,
  ) {
    setForm(
      (prev) => ({
        ...prev,

        tipo_activo:
          value,

        marca: "",
        modelo: "",
        hostname: "",
        sistema_operativo: "",
      }),
    );

    setTiposComponente([]);
    setComponentes([]);

    setModalComponenteAbierto(
      false,
    );

    setFieldErrors(
      (prev) => {
        const copy = {
          ...prev,
        };

        delete copy.tipo_activo;

        return copy;
      },
    );
  }


  function handleAreaChange(
    value: string,
  ) {
    setForm(
      (prev) => ({
        ...prev,

        area:
          value,

        sector:
          "",

        equipo_trabajo:
          "",
      }),
    );

    setEquiposTrabajo([]);
  }


  function handleSectorChange(
    value: string,
  ) {
    setForm(
      (prev) => ({
        ...prev,

        sector:
          value,

        equipo_trabajo:
          "",
      }),
    );
  }


  function abrirModalNuevoComponente(
    tipoComponenteId?: number,
  ) {
    setIndiceComponenteEdicion(
      null,
    );

    setModalError(null);

    setComponenteModal({
      ...initialComponente,

      tipo_componente:
        tipoComponenteId
          ? String(
              tipoComponenteId,
            )
          : "",
    });

    setModalComponenteAbierto(
      true,
    );
  }


  function abrirModalEditarComponente(
    index: number,
  ) {
    setIndiceComponenteEdicion(
      index,
    );

    setModalError(null);

    setComponenteModal({
      ...componentes[index],
    });

    setModalComponenteAbierto(
      true,
    );
  }


  function cerrarModalComponente() {
    setModalComponenteAbierto(
      false,
    );

    setIndiceComponenteEdicion(
      null,
    );

    setModalError(null);

    setComponenteModal({
      ...initialComponente,
    });
  }


  function actualizarComponenteModal(
    field: keyof ComponenteForm,
    value: string,
  ) {
    if (
      field ===
      "tipo_componente"
    ) {
      const nuevoTipo =
        tiposComponente.find(
          (tipo) =>
            tipo.id ===
            Number(value),
        );

      setComponenteModal(
        (prev) => ({
          ...prev,

          tipo_componente:
            value,

          capacidad_valor:
            nuevoTipo
              ?.tiene_capacidad
              ? prev
                  .capacidad_valor
              : "",

          capacidad_unidad:
            nuevoTipo
              ?.tiene_capacidad
              ? prev
                  .capacidad_unidad
              : "GB",
        }),
      );

      return;
    }

    setComponenteModal(
      (prev) => ({
        ...prev,
        [field]: value,
      }),
    );
  }


  function guardarComponenteModal() {
    setModalError(null);

    if (
      !componenteModal
        .tipo_componente
    ) {
      setModalError(
        "Seleccioná un tipo de componente.",
      );

      return;
    }

    const tipo =
      obtenerTipoComponente(
        componenteModal
          .tipo_componente,
      );

    if (!tipo) {
      setModalError(
        "El tipo de componente seleccionado no es válido.",
      );

      return;
    }

    const componenteNormalizado: ComponenteForm =
      {
        ...componenteModal,

        marca:
          componenteModal
            .marca
            .trim(),

        modelo:
          componenteModal
            .modelo
            .trim(),

        capacidad_valor:
          tipo.tiene_capacidad
            ? componenteModal
                .capacidad_valor
            : "",

        capacidad_unidad:
          tipo.tiene_capacidad
            ? componenteModal
                .capacidad_unidad
            : "GB",
      };


    if (
      indiceComponenteEdicion !==
      null
    ) {
      setComponentes(
        (prev) =>
          prev.map(
            (
              componente,
              index,
            ) =>
              index ===
              indiceComponenteEdicion
                ? componenteNormalizado
                : componente,
          ),
      );

    } else {
      setComponentes(
        (prev) => [
          ...prev,
          componenteNormalizado,
        ],
      );
    }

    cerrarModalComponente();
  }


  function eliminarComponente(
    index: number,
  ) {
    setComponentes(
      (prev) =>
        prev.filter(
          (
            _,
            currentIndex,
          ) =>
            currentIndex !==
            index,
        ),
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError(null);
    setFieldErrors({});


    if (!form.tipo_activo) {
      setFieldErrors({
        tipo_activo: [
          "Seleccioná un tipo de activo.",
        ],
      });

      return;
    }


    if (!form.area) {
      setFieldErrors({
        area: [
          "Seleccioná un área.",
        ],
      });

      return;
    }


    if (!form.sector) {
      setFieldErrors({
        sector: [
          "Seleccioná un sector.",
        ],
      });

      return;
    }


    const payload = {
      tipo_activo:
        Number(
          form.tipo_activo,
        ),

      sector:
        Number(
          form.sector,
        ),

      equipo_trabajo:
        form.equipo_trabajo
          ? Number(
              form.equipo_trabajo,
            )
          : null,

      marca:
        admiteComponentes
          ? ""
          : form.marca.trim(),

      modelo:
        admiteComponentes
          ? ""
          : form.modelo.trim(),

      numero_serie:
        "",

      hostname:
        permiteSistemaOperativo
          ? form.hostname
              .trim()
              .toUpperCase()
          : "",

      sistema_operativo:
        permiteSistemaOperativo &&
        form.sistema_operativo
          ? Number(
              form.sistema_operativo,
            )
          : null,

      fecha_adquisicion:
        form.fecha_adquisicion ||
        FECHA_ADQUISICION_DEFAULT,

      estado:
        form.estado,

      observaciones:
        "",

      componentes:
        componentes.map(
          (componente) => {
            const tipo =
              obtenerTipoComponente(
                componente
                  .tipo_componente,
              );

            const tieneCapacidad =
              Boolean(
                tipo
                  ?.tiene_capacidad,
              );

            return {
              tipo_componente:
                Number(
                  componente
                    .tipo_componente,
                ),

              marca:
                componente
                  .marca
                  .trim(),

              modelo:
                componente
                  .modelo
                  .trim(),

              numero_serie:
                "",

              capacidad_valor:
                tieneCapacidad &&
                componente
                  .capacidad_valor
                  ? Number(
                      componente
                        .capacidad_valor,
                    )
                  : null,

              capacidad_unidad:
                tieneCapacidad &&
                componente
                  .capacidad_valor
                  ? componente
                      .capacidad_unidad
                  : "",

              fecha_adquisicion:
                form
                  .fecha_adquisicion ||
                FECHA_ADQUISICION_DEFAULT,

              observaciones:
                "",
            };
          },
        ),
    };


    try {
      setSaving(true);

      const nuevoActivo =
        await apiPost<Activo>(
          "/inventario/activos/",
          payload,
        );

      if (equipoParam) {
        router.push(
          `/inventario/equipos/${equipoParam}`,
        );

        return;
      }

      router.push(
        `/inventario/activos/${nuevoActivo.id}`,
      );

    } catch (err: unknown) {
      console.error(err);

      const apiError =
        err as {
          data?: Record<
            string,
            string[]
          >;

          message?: string;
        };

      if (
        apiError?.data &&
        typeof apiError.data ===
          "object"
      ) {
        setFieldErrors(
          apiError.data,
        );
      }

      const componentesError =
        apiError?.data
          ?.componentes?.[0];

      if (componentesError) {
        setError(
          componentesError,
        );

      } else {
        setError(
          "No se pudo crear el activo. Revisá los datos ingresados.",
        );
      }

    } finally {
      setSaving(false);
    }
  }


  function getFieldError(
    field: string,
  ) {
    return fieldErrors[
      field
    ]?.[0];
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

            <p className="mt-4 text-sm text-slate-500">
              Cargando formulario...
            </p>

          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50/70">

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">


        <div className="mb-4">

          <Link
            href={
              equipoParam
                ? `/inventario/equipos/${equipoParam}`
                : "/inventario/activos"
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-700"
          >
            ←{" "}

            {equipoParam
              ? "Volver al equipo"
              : "Volver a activos"}

          </Link>

        </div>


        <section className="relative mb-6 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

          <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />

          <div className="px-5 py-6 sm:px-7">

            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">

              <span className="h-2 w-2 rounded-full bg-sky-500" />

              Inventario

            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Nuevo activo
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Registrá un nuevo elemento físico en el inventario.
              El código interno se genera automáticamente según el tipo de activo.
            </p>

          </div>

        </section>


        {error && (

          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>

        )}


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >


          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">

              <h2 className="text-base font-bold text-slate-900">
                Datos del activo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Información principal, ubicación y estado actual.
              </p>

            </div>


            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                  Tipo de activo

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>


                <select
                  value={
                    form.tipo_activo
                  }
                  onChange={(
                    event,
                  ) =>
                    handleTipoActivoChange(
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:bg-white focus:ring-4 sm:text-sm ${
                    getFieldError(
                      "tipo_activo",
                    )
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-300 focus:border-sky-400 focus:ring-sky-100"
                  }`}
                >

                  <option value="">
                    Seleccionar tipo...
                  </option>

                  {tiposActivo.map(
                    (tipo) => (

                      <option
                        key={
                          tipo.id
                        }
                        value={
                          tipo.id
                        }
                      >
                        {tipo.nombre}
                      </option>

                    ),
                  )}

                </select>


                {getFieldError(
                  "tipo_activo",
                ) && (

                  <p className="mt-1.5 text-xs font-medium text-red-600">

                    {getFieldError(
                      "tipo_activo",
                    )}

                  </p>

                )}

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Código de inventario
                </label>


                <div className="flex min-h-[46px] items-center rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">

                  {tipoSeleccionado ? (

                    <div>

                      <p className="font-mono text-sm font-bold text-sky-800">

                        {tipoSeleccionado.prefijo
                          ? `${tipoSeleccionado.prefijo}-XXX`
                          : "Automático"}

                      </p>

                      <p className="mt-0.5 text-xs text-sky-600">
                        Se asignará el próximo correlativo al guardar.
                      </p>

                    </div>

                  ) : (

                    <p className="text-sm text-slate-500">
                      Se generará al seleccionar el tipo.
                    </p>

                  )}

                </div>

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                  Área

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>


                <select
                  value={
                    form.area
                  }
                  onChange={(
                    event,
                  ) =>
                    handleAreaChange(
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:bg-white focus:ring-4 sm:text-sm ${
                    getFieldError(
                      "area",
                    )
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-300 focus:border-sky-400 focus:ring-sky-100"
                  }`}
                >

                  <option value="">
                    Seleccionar área...
                  </option>

                  {areas.map(
                    (area) => (

                      <option
                        key={
                          area.id
                        }
                        value={
                          area.id
                        }
                      >
                        {area.nombre}
                      </option>

                    ),
                  )}

                </select>

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                  Sector

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>


                <select
                  value={
                    form.sector
                  }
                  disabled={
                    !form.area
                  }
                  onChange={(
                    event,
                  ) =>
                    handleSectorChange(
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm ${
                    getFieldError(
                      "sector",
                    )
                      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  }`}
                >

                  <option value="">

                    {form.area
                      ? "Seleccionar sector..."
                      : "Primero seleccioná un área"}

                  </option>

                  {sectoresFiltrados.map(
                    (sector) => (

                      <option
                        key={
                          sector.id
                        }
                        value={
                          sector.id
                        }
                      >
                        {sector.nombre}
                      </option>

                    ),
                  )}

                </select>

              </div>


              <div className="sm:col-span-2">

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Equipo de trabajo
                </label>


                <select
                  value={
                    form.equipo_trabajo
                  }
                  disabled={
                    !form.sector
                  }
                  onChange={(
                    event,
                  ) =>
                    handleChange(
                      "equipo_trabajo",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                >

                  <option value="">
                    Sin equipo de trabajo
                  </option>


                  {equiposTrabajo.map(
                    (equipo) => (

                      <option
                        key={
                          equipo.id
                        }
                        value={
                          equipo.id
                        }
                      >

                        {equipo.nombre}

                        {equipo.uso_actual
                          ? ` — ${equipo.uso_actual}`
                          : ""}

                      </option>

                    ),
                  )}

                </select>


                {equipoParam && (

                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">

                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />

                    <p className="text-xs leading-5 text-sky-700">
                      El equipo de trabajo fue precargado desde la ficha anterior.
                    </p>

                  </div>

                )}

              </div>


              {form.tipo_activo &&
                loadingComponentes && (

                <div className="sm:col-span-2">

                  <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />

                    <p className="text-sm text-sky-700">
                      Consultando configuración del tipo de activo...
                    </p>

                  </div>

                </div>

              )}


              {form.tipo_activo &&
                permiteSistemaOperativo && (
                <>

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Hostname
                    </label>


                    <input
                      type="text"
                      value={
                        form.hostname
                      }
                      onChange={(
                        event,
                      ) =>
                        handleChange(
                          "hostname",
                          event.target.value,
                        )
                      }
                      spellCheck={false}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 font-mono text-base uppercase text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Sistema operativo
                    </label>


                    <select
                      value={
                        form.sistema_operativo
                      }
                      onChange={(
                        event,
                      ) =>
                        handleChange(
                          "sistema_operativo",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    >

                      <option value="">
                        Sin especificar
                      </option>

                      {sistemasOperativos.map(
                        (sistema) => (

                          <option
                            key={
                              sistema.id
                            }
                            value={
                              sistema.id
                            }
                          >
                            {sistema.nombre}
                          </option>

                        ),
                      )}

                    </select>

                  </div>

                </>
              )}


              {form.tipo_activo &&
                !loadingComponentes &&
                !admiteComponentes && (
                <>

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Marca
                    </label>

                    <input
                      type="text"
                      value={
                        form.marca
                      }
                      onChange={(
                        event,
                      ) =>
                        handleChange(
                          "marca",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Modelo
                    </label>

                    <input
                      type="text"
                      value={
                        form.modelo
                      }
                      onChange={(
                        event,
                      ) =>
                        handleChange(
                          "modelo",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>

                </>
              )}


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Fecha de adquisición
                </label>


                <input
                  type="date"
                  value={
                    form.fecha_adquisicion
                  }
                  onChange={(
                    event,
                  ) =>
                    handleChange(
                      "fecha_adquisicion",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                />


                {admiteComponentes && (

                  <p className="mt-1.5 text-xs text-slate-400">
                    Esta fecha se aplicará también a los componentes.
                  </p>

                )}

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Estado
                </label>


                <select
                  value={
                    form.estado
                  }
                  onChange={(
                    event,
                  ) =>
                    handleChange(
                      "estado",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                >

                  {ESTADOS_ACTIVO.map(
                    (estado) => (

                      <option
                        key={
                          estado.value
                        }
                        value={
                          estado.value
                        }
                      >
                        {estado.label}
                      </option>

                    ),
                  )}

                </select>

              </div>

            </div>

          </section>


          {!loadingComponentes &&
            admiteComponentes && (

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="text-base font-bold text-slate-900">
                        Componentes
                      </h2>


                      {componentes.length > 0 && (

                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">

                          {componentes.length}

                        </span>

                      )}

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Componentes instalados actualmente en el activo.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      abrirModalNuevoComponente()
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800"
                  >
                    + Agregar componente
                  </button>

                </div>


                {tiposComponente.length > 0 && (

                  <div className="mt-4 flex flex-wrap gap-2">

                    {tiposComponente.map(
                      (tipo) => (

                        <button
                          key={
                            tipo.id
                          }
                          type="button"
                          onClick={() =>
                            abrirModalNuevoComponente(
                              tipo.id,
                            )
                          }
                          className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                        >
                          + {tipo.nombre}
                        </button>

                      ),
                    )}

                  </div>

                )}

              </div>


              <div className="p-5 sm:p-6">

                {componentes.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-5 py-7 text-center">

                    <p className="text-sm font-semibold text-slate-700">
                      Todavía no agregaste componentes.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Usá los accesos rápidos o agregá un componente manualmente.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        abrirModalNuevoComponente()
                      }
                      className="mt-4 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                    >
                      + Agregar primer componente
                    </button>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {componentes.map(
                      (
                        componente,
                        index,
                      ) => {
                        const tipo =
                          obtenerTipoComponente(
                            componente
                              .tipo_componente,
                          );

                        return (
                          <div
                            key={
                              index
                            }
                            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold text-slate-900">

                                  {tipo
                                    ?.nombre ||
                                    `Componente ${index + 1}`}

                                </p>


                                {tipo
                                  ?.tiene_capacidad &&
                                  componente
                                    .capacidad_valor && (

                                  <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">

                                    {
                                      componente
                                        .capacidad_valor
                                    }{" "}
                                    {
                                      componente
                                        .capacidad_unidad
                                    }

                                  </span>

                                )}

                              </div>


                              <p className="mt-1 truncate text-sm text-slate-500">
                                {descripcionComponente(
                                  componente,
                                )}
                              </p>

                            </div>


                            <div className="flex shrink-0 items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditarComponente(
                                    index,
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Editar
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  eliminarComponente(
                                    index,
                                  )
                                }
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Eliminar
                              </button>

                            </div>

                          </div>
                        );
                      },
                    )}


                    <button
                      type="button"
                      onClick={() =>
                        abrirModalNuevoComponente()
                      }
                      className="w-full rounded-xl border border-dashed border-sky-300 bg-sky-50/40 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                    >
                      + Agregar otro componente
                    </button>

                  </div>

                )}

              </div>

            </section>

          )}


          <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.04)] backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:gap-3 sm:rounded-2xl sm:border sm:border-slate-200 sm:px-5 sm:py-4 sm:shadow-sm">

            <div className="grid grid-cols-2 gap-2 sm:flex">

              <Link
                href={
                  equipoParam
                    ? `/inventario/equipos/${equipoParam}`
                    : "/inventario/activos"
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>


              <button
                type="submit"
                disabled={
                  saving
                }
                className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {saving
                  ? "Guardando..."
                  : "Crear activo"}

              </button>

            </div>

          </div>

        </form>

      </div>


      {modalComponenteAbierto && (

        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarModalComponente();
            }
          }}
        >

          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">


            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Componente
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">

                  {indiceComponenteEdicion !==
                  null
                    ? "Editar componente"
                    : "Agregar componente"}

                </h2>

              </div>


              <button
                type="button"
                onClick={
                  cerrarModalComponente
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="space-y-5 p-5 sm:p-6">


              {modalError && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {modalError}
                </div>

              )}


              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                  Tipo de componente

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>


                <select
                  value={
                    componenteModal
                      .tipo_componente
                  }
                  onChange={(
                    event,
                  ) =>
                    actualizarComponenteModal(
                      "tipo_componente",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                >

                  <option value="">
                    Seleccionar...
                  </option>


                  {tiposComponente.map(
                    (tipo) => (

                      <option
                        key={
                          tipo.id
                        }
                        value={
                          tipo.id
                        }
                      >
                        {tipo.nombre}
                      </option>

                    ),
                  )}

                </select>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Marca
                  </label>


                  <input
                    type="text"
                    value={
                      componenteModal
                        .marca
                    }
                    onChange={(
                      event,
                    ) =>
                      actualizarComponenteModal(
                        "marca",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Modelo
                  </label>


                  <input
                    type="text"
                    value={
                      componenteModal
                        .modelo
                    }
                    onChange={(
                      event,
                    ) =>
                      actualizarComponenteModal(
                        "modelo",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>

              </div>


              {tipoComponenteModal
                ?.tiene_capacidad && (

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Capacidad
                    </label>


                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={
                        componenteModal
                          .capacidad_valor
                      }
                      onChange={(
                        event,
                      ) =>
                        actualizarComponenteModal(
                          "capacidad_valor",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Unidad
                    </label>


                    <select
                      value={
                        componenteModal
                          .capacidad_unidad
                      }
                      onChange={(
                        event,
                      ) =>
                        actualizarComponenteModal(
                          "capacidad_unidad",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    >

                      <option value="MB">
                        MB
                      </option>

                      <option value="GB">
                        GB
                      </option>

                      <option value="TB">
                        TB
                      </option>

                    </select>

                  </div>

                </div>

              )}

            </div>


            <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={
                  cerrarModalComponente
                }
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={
                  guardarComponenteModal
                }
                className="flex-1 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:flex-none"
              >

                {indiceComponenteEdicion !==
                null
                  ? "Guardar cambios"
                  : "Agregar componente"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}