"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  apiGet,
  apiPatch,
  apiPatchForm,
} from "@/lib/api";

import type {
  Activo,
  EquipoTrabajo,
  Sector,
} from "@/types";


type EquipoForm = {
  sector: number | "";
  nombre: string;
  uso_actual: string;
  estado: "ACTIVO" | "INACTIVO";
  observaciones: string;
};


function estadoActivoLabel(
  estado: string,
) {
  const estados: Record<string, string> = {
    EN_USO: "En uso",
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    EN_REPARACION: "En reparación",
    DEFECTUOSO: "Defectuoso",
    BAJA: "Dado de baja",
  };

  return estados[estado] ?? estado;
}

async function comprimirImagen(
  file: File,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height =
            Math.round(
              height *
              (MAX_WIDTH / width),
            );

          width =
            MAX_WIDTH;
        }

        if (height > MAX_HEIGHT) {
          width =
            Math.round(
              width *
              (MAX_HEIGHT / height),
            );

          height =
            MAX_HEIGHT;
        }

        const canvas =
          document.createElement(
            "canvas",
          );

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          reject(
            new Error(
              "No se pudo procesar la imagen.",
            ),
          );

          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "No se pudo comprimir la imagen.",
                ),
              );

              return;
            }

            const nombreBase =
              file.name.replace(
                /\.[^/.]+$/,
                "",
              );

            const archivoComprimido =
              new File(
                [blob],
                `${nombreBase}.jpg`,
                {
                  type: "image/jpeg",
                  lastModified:
                    Date.now(),
                },
              );

            resolve(
              archivoComprimido,
            );
          },
          "image/jpeg",
          0.82,
        );
      };

      img.onerror = () => {
        reject(
          new Error(
            "No se pudo leer la imagen.",
          ),
        );
      };

      img.src =
        reader.result as string;
    };

    reader.onerror = () => {
      reject(
        new Error(
          "No se pudo leer el archivo.",
        ),
      );
    };

    reader.readAsDataURL(file);
  });
}



function estadoActivoClasses(
  estado: string,
) {
  switch (estado) {
    case "EN_USO":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "DISPONIBLE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "RESERVADO":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "EN_REPARACION":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "DEFECTUOSO":
      return "bg-red-50 text-red-700 border-red-100";

    case "BAJA":
      return "bg-slate-100 text-slate-500 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}


const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_API_URL ??
    "/api"
  ).replace(/\/api\/?$/, "");


function obtenerUrlFoto(
  foto: string | null,
): string | null {
  if (!foto) {
    return null;
  }

  if (
    foto.startsWith("http://") ||
    foto.startsWith("https://") ||
    foto.startsWith("blob:")
  ) {
    return foto;
  }

  return `${API_BASE_URL}${foto}`;
}



export default function EquipoDetallePage() {
  const params = useParams();

  const id = Number(params.id);


  const [equipo, setEquipo] =
    useState<EquipoTrabajo | null>(null);

  const [activos, setActivos] =
    useState<Activo[]>([]);

  const [sectores, setSectores] =
    useState<Sector[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  // ============================================================
  // EDITAR EQUIPO
  // ============================================================

  const [
    editarModalOpen,
    setEditarModalOpen,
  ] = useState(false);

  const [form, setForm] =
    useState<EquipoForm>({
      sector: "",
      nombre: "",
      uso_actual: "",
      estado: "ACTIVO",
      observaciones: "",
    });

  const [foto, setFoto] =
    useState<File | null>(null);

  const [
    fotoPreview,
    setFotoPreview,
  ] = useState<string | null>(null);

  const [removeFoto, setRemoveFoto] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    errorEdicion,
    setErrorEdicion,
  ] = useState<string | null>(null);


  // ============================================================
  // ASOCIAR ACTIVO
  // ============================================================

  const [
    asociarModalOpen,
    setAsociarModalOpen,
  ] = useState(false);

  const [
    activosDisponibles,
    setActivosDisponibles,
  ] = useState<Activo[]>([]);

  const [
    loadingDisponibles,
    setLoadingDisponibles,
  ] = useState(false);

  const [
    errorDisponibles,
    setErrorDisponibles,
  ] = useState<string | null>(null);

  const [
    busquedaActivo,
    setBusquedaActivo,
  ] = useState("");

  const [
    activoSeleccionado,
    setActivoSeleccionado,
  ] = useState<Activo | null>(null);

  const [
    confirmarModalOpen,
    setConfirmarModalOpen,
  ] = useState(false);

  const [asociando, setAsociando] =
    useState(false);

  const [
    errorAsociacion,
    setErrorAsociacion,
  ] = useState<string | null>(null);


  // ============================================================
  // CARGA
  // ============================================================

  const cargarDatos =
    useCallback(async () => {
      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError(
          "El identificador del equipo no es válido.",
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          equipoData,
          activosData,
          sectoresData,
        ] = await Promise.all([
          apiGet<EquipoTrabajo>(
            `/inventario/equipos-trabajo/${id}/`,
          ),

          apiGet<Activo[]>(
            `/inventario/activos/?equipo=${id}`,
          ),

          apiGet<Sector[]>(
            "/estructura/sectores/",
          ),
        ]);

        setEquipo(equipoData);
        setActivos(activosData);

        setSectores(
          sectoresData.filter(
            (sector) => sector.activo,
          ),
        );

      } catch (err) {
        console.error(err);

        setError(
          "No se pudo cargar el equipo de trabajo.",
        );

      } finally {
        setLoading(false);
      }
    }, [id]);


  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);


  // ============================================================
  // EDITAR
  // ============================================================

  function abrirEditar() {
    if (!equipo) {
      return;
    }

    setForm({
      sector: equipo.sector,
      nombre: equipo.nombre,
      uso_actual: equipo.uso_actual,
      estado: equipo.estado,
      observaciones:
        equipo.observaciones,
    });

    setFoto(null);
    setFotoPreview(
      obtenerUrlFoto(
        equipo.foto,
      ),
    );
    setRemoveFoto(false);
    setErrorEdicion(null);

    setEditarModalOpen(true);
  }


  function cerrarEditar() {
    if (saving) {
      return;
    }

    if (
      fotoPreview &&
      fotoPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        fotoPreview,
      );
    }

    setEditarModalOpen(false);
    setFoto(null);
    setFotoPreview(null);
    setRemoveFoto(false);
    setErrorEdicion(null);
  }

  async function handleFotoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      setErrorEdicion(
        "El archivo seleccionado debe ser una imagen.",
      );

      return;
    }

    try {
      setErrorEdicion(null);

      const fotoComprimida =
        await comprimirImagen(
          file,
        );

      setFoto(
        fotoComprimida,
      );

      setRemoveFoto(
        false,
      );

      setFotoPreview(
        (previewAnterior) => {
          if (
            previewAnterior &&
            previewAnterior.startsWith(
              "blob:",
            )
          ) {
            URL.revokeObjectURL(
              previewAnterior,
            );
          }

          return URL.createObjectURL(
            fotoComprimida,
          );
        },
      );

    } catch (error) {
      console.error(
        "Error comprimiendo imagen:",
        error,
      );

      setErrorEdicion(
        "No se pudo procesar la imagen.",
      );
    }
  }


  function quitarFoto() {
    if (
      fotoPreview &&
      fotoPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        fotoPreview,
      );
    }

    setFoto(null);
    setFotoPreview(null);
    setRemoveFoto(true);
  }


  async function guardarEdicion(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!equipo) {
      return;
    }

    if (!form.sector) {
      setErrorEdicion(
        "Seleccioná un sector.",
      );

      return;
    }

    if (!form.nombre.trim()) {
      setErrorEdicion(
        "El nombre es obligatorio.",
      );

      return;
    }

    try {
      setSaving(true);
      setErrorEdicion(null);

      const data =
        new FormData();

      data.append(
        "sector",
        String(form.sector),
      );

      data.append(
        "nombre",
        form.nombre.trim(),
      );

      data.append(
        "uso_actual",
        form.uso_actual.trim(),
      );

      data.append(
        "estado",
        form.estado,
      );

      data.append(
        "observaciones",
        form.observaciones.trim(),
      );

      if (foto) {
        data.append(
          "foto",
          foto,
        );
      }

      if (removeFoto) {
        data.append(
          "foto",
          "",
        );
      }

      await apiPatchForm(
        `/inventario/equipos-trabajo/${equipo.id}/`,
        data,
      );

      await cargarDatos();

      setEditarModalOpen(false);
      setFoto(null);
      setFotoPreview(null);
      setRemoveFoto(false);

    } catch (err) {
      console.error(err);

      setErrorEdicion(
        "No se pudo actualizar el equipo.",
      );

    } finally {
      setSaving(false);
    }
  }


  // ============================================================
  // ASOCIAR ACTIVO
  // ============================================================

  async function abrirModalAsociar() {
    if (!equipo) {
      return;
    }

    setAsociarModalOpen(true);
    setActivoSeleccionado(null);
    setBusquedaActivo("");
    setErrorDisponibles(null);

    try {
      setLoadingDisponibles(true);

      const data =
        await apiGet<Activo[]>(
          `/inventario/activos/?sector=${equipo.sector}&sin_equipo=true`,
        );

      setActivosDisponibles(data);

    } catch (err) {
      console.error(err);

      setErrorDisponibles(
        "No se pudieron cargar los activos disponibles.",
      );

    } finally {
      setLoadingDisponibles(false);
    }
  }


  function cerrarModalAsociar() {
    if (asociando) {
      return;
    }

    setAsociarModalOpen(false);
    setActivoSeleccionado(null);
    setBusquedaActivo("");
    setErrorDisponibles(null);
  }


  async function confirmarAsociacion() {
    if (
      !equipo ||
      !activoSeleccionado
    ) {
      return;
    }

    try {
      setAsociando(true);
      setErrorAsociacion(null);

      await apiPatch<Activo>(
        `/inventario/activos/${activoSeleccionado.id}/`,
        {
          equipo_trabajo:
            equipo.id,
        },
      );

      setConfirmarModalOpen(false);
      setAsociarModalOpen(false);
      setActivoSeleccionado(null);

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorAsociacion(
        "No se pudo asociar el activo.",
      );

    } finally {
      setAsociando(false);
    }
  }


  const activosFiltrados =
    useMemo(() => {
      const term =
        busquedaActivo
          .trim()
          .toLowerCase();

      if (!term) {
        return activosDisponibles;
      }

      return activosDisponibles.filter(
        (activo) => {
          return [
            activo.codigo_inventario,
            activo.tipo_activo_nombre,
            activo.hostname,
            activo.marca,
            activo.modelo,
            activo.numero_serie,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(term),
          );
        },
      );
    }, [
      activosDisponibles,
      busquedaActivo,
    ]);


  // ============================================================
  // ESTADOS INICIALES
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1600px] rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando equipo...
          </p>

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>

        <Link
          href="/inventario/equipos"
          className="mt-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Volver a equipos
        </Link>

      </div>
    );
  }


  if (!equipo) {
    return null;
  }


  return (
    <>

      <div className="min-h-screen bg-slate-50/70">

        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">


          {/* ================================================= */}
          {/* NAVEGACIÓN */}
          {/* ================================================= */}

          <div className="mb-5 flex items-center justify-between gap-3">

            <Link
              href="/inventario/equipos"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-700"
            >
              ← Volver a equipos
            </Link>


            <button
              type="button"
              onClick={abrirEditar}
              className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Editar equipo
            </button>

          </div>


          <div
            className={`grid gap-6 ${
              equipo.foto
                ? "xl:grid-cols-[minmax(0,1fr)_340px]"
                : ""
            }`}
          >

            <main className="min-w-0">


              {/* ================================================= */}
              {/* CABECERA */}
              {/* ================================================= */}

              <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

                <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


                <div className="p-5 sm:p-7">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <p className="text-sm font-medium text-sky-700">
                        {equipo.area_nombre}
                        {" / "}
                        {equipo.sector_nombre}
                      </p>


                      <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {equipo.nombre}
                      </h1>

                    </div>


                    <span
                      className={
                        equipo.estado ===
                        "ACTIVO"
                          ? "inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                          : "inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
                      }
                    >

                      <span
                        className={
                          equipo.estado ===
                          "ACTIVO"
                            ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                            : "h-1.5 w-1.5 rounded-full bg-slate-400"
                        }
                      />

                      {equipo.estado ===
                      "ACTIVO"
                        ? "Activo"
                        : "Inactivo"}

                    </span>

                  </div>


                  {/* ================================================= */}
                  {/* RESUMEN TÉCNICO */}
                  {/* ================================================= */}

                  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

                    <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Uso actual
                      </p>

                      <p className="mt-1.5 break-words text-sm font-semibold text-slate-700">
                        {equipo.uso_actual ||
                          "Sin referencia"}
                      </p>

                    </div>


                    <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Hostname
                      </p>

                      <p className="mt-1.5 break-all font-mono text-sm font-semibold text-slate-700">
                        {equipo.hostname_principal ||
                          "—"}
                      </p>

                    </div>


                    <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Sistema operativo
                      </p>

                      <p className="mt-1.5 break-words text-sm font-semibold text-slate-700">
                        {equipo.sistema_operativo_principal ||
                          "—"}
                      </p>

                    </div>


                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 shadow-sm">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-500">
                        Memoria RAM
                      </p>

                      <div className="mt-1 flex items-baseline gap-1">

                        <span className="text-xl font-bold tracking-tight text-sky-700">
                          {equipo.ram_total_gb ?? 0}
                        </span>

                        <span className="text-xs font-semibold text-sky-600">
                          GB
                        </span>

                      </div>

                    </div>

                  </div>


                  {equipo.observaciones && (

                    <div className="mt-5 border-t border-sky-100 pt-4">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Observaciones
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {equipo.observaciones}
                      </p>

                    </div>

                  )}

                </div>

              </section>


              {/* ================================================= */}
              {/* ACTIVOS */}
              {/* ================================================= */}

              <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-sky-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="text-lg font-bold text-slate-900">
                        Activos asociados
                      </h2>

                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                        {activos.length}
                      </span>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Equipamiento físico que forma actualmente este puesto.
                    </p>

                  </div>


                  <div className="grid grid-cols-2 gap-2 sm:flex">

                    <button
                      type="button"
                      onClick={
                        abrirModalAsociar
                      }
                      className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Asociar existente
                    </button>


                    <Link
                      href={`/inventario/activos/nuevo?equipo=${equipo.id}&sector=${equipo.sector}`}
                      className="rounded-xl bg-sky-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800"
                    >
                      + Crear activo
                    </Link>

                  </div>

                </div>


                {activos.length === 0 ? (

                  <div className="px-5 py-10 text-center sm:py-12">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >

                        <rect
                          width="18"
                          height="12"
                          x="3"
                          y="4"
                          rx="2"
                        />

                        <line
                          x1="8"
                          x2="16"
                          y1="20"
                          y2="20"
                        />

                        <line
                          x1="12"
                          x2="12"
                          y1="16"
                          y2="20"
                        />

                      </svg>

                    </div>


                    <h3 className="mt-4 text-sm font-semibold text-slate-800">
                      Todavía no hay activos asociados
                    </h3>


                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                      Podés asociar un activo existente
                      del mismo sector o registrar uno nuevo.
                    </p>

                  </div>

                ) : (

                  <>

                    {/* ============================================= */}
                    {/* MOBILE */}
                    {/* ============================================= */}

                    <div className="divide-y divide-slate-100 md:hidden">

                      {activos.map(
                        (activo) => (

                          <article
                            key={activo.id}
                            className="p-4"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <Link
                                  href={`/inventario/activos/${activo.id}`}
                                  className="font-semibold text-slate-900 transition hover:text-sky-700"
                                >
                                  {activo.codigo_inventario}
                                </Link>


                                <p className="mt-1 text-sm font-medium text-slate-500">
                                  {activo.tipo_activo_nombre}
                                </p>

                              </div>


                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoActivoClasses(
                                  activo.estado,
                                )}`}
                              >
                                {estadoActivoLabel(
                                  activo.estado,
                                )}
                              </span>

                            </div>


                            <div className="mt-4 rounded-xl bg-slate-50 p-3">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Marca / modelo
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {[
                                  activo.marca,
                                  activo.modelo,
                                ]
                                  .filter(Boolean)
                                  .join(" ") ||
                                  "Sin información"}
                              </p>

                            </div>


                            <Link
                              href={`/inventario/activos/${activo.id}`}
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              Ver activo

                              <span>
                                →
                              </span>
                            </Link>

                          </article>

                        ),
                      )}

                    </div>


                    {/* ============================================= */}
                    {/* DESKTOP */}
                    {/* ============================================= */}

                    <div className="hidden overflow-x-auto md:block">

                      <table className="min-w-full text-sm">

                        <thead className="bg-slate-50/70">

                          <tr className="text-slate-500">

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                              Código
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                              Tipo
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                              Marca / Modelo
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                              Estado
                            </th>

                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                              Acción
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {activos.map(
                            (activo) => (

                              <tr
                                key={activo.id}
                                className="border-t border-slate-100 transition hover:bg-sky-50/30"
                              >

                                <td className="px-5 py-4">

                                  <Link
                                    href={`/inventario/activos/${activo.id}`}
                                    className="font-semibold text-slate-900 transition hover:text-sky-700"
                                  >
                                    {activo.codigo_inventario}
                                  </Link>

                                </td>


                                <td className="px-5 py-4 text-slate-600">
                                  {activo.tipo_activo_nombre}
                                </td>


                                <td className="px-5 py-4 text-slate-600">

                                  {[
                                    activo.marca,
                                    activo.modelo,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") ||
                                    "—"}

                                </td>


                                <td className="px-5 py-4">

                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoActivoClasses(
                                      activo.estado,
                                    )}`}
                                  >
                                    {estadoActivoLabel(
                                      activo.estado,
                                    )}
                                  </span>

                                </td>


                                <td className="px-5 py-4 text-right">

                                  <Link
                                    href={`/inventario/activos/${activo.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                                  >
                                    Ver

                                    <span>
                                      →
                                    </span>
                                  </Link>

                                </td>

                              </tr>

                            ),
                          )}

                        </tbody>

                      </table>

                    </div>

                  </>

                )}

              </section>

            </main>


            {/* ================================================= */}
            {/* FOTO */}
            {/* ================================================= */}

            {equipo.foto && (

              <aside>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-200 px-4 py-3">

                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Foto identificatoria
                    </p>

                  </div>


                  <img
                    src={
                      obtenerUrlFoto(
                        equipo.foto,
                      ) ?? ""
                    }
                    alt={equipo.nombre}
                    className="aspect-[4/3] w-full object-cover"
                  />

                </div>

              </aside>

            )}

          </div>

        </div>

      </div>


      {/* ======================================================= */}
      {/* MODAL EDITAR EQUIPO */}
      {/* ======================================================= */}

      {editarModalOpen && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">


            <div className="relative border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white px-5 py-5 sm:px-6">

              <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


              <div className="pr-12">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Equipo de trabajo
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Editar equipo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Actualizá la información general del puesto.
                </p>

              </div>


              <button
                type="button"
                onClick={cerrarEditar}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={guardarEdicion}
              className="min-h-0 flex-1 overflow-y-auto"
            >

              <div className="space-y-5 p-5 sm:p-6">


                {/* SECTOR */}

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Sector *
                  </label>


                  <select
                    value={form.sector}
                    onChange={(event) =>
                      setForm({
                        ...form,

                        sector:
                          Number(
                            event.target.value,
                          ) || "",
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  >

                    <option value="">
                      Seleccionar sector...
                    </option>


                    {sectores.map(
                      (sector) => (

                        <option
                          key={sector.id}
                          value={sector.id}
                        >
                          {sector.area_nombre}
                          {" — "}
                          {sector.nombre}
                        </option>

                      ),
                    )}

                  </select>

                </div>


                {/* NOMBRE */}

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nombre *
                  </label>


                  <input
                    value={form.nombre}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        nombre:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                {/* USO / ESTADO */}

                <div className="grid gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Uso actual
                    </label>

                    <input
                      value={form.uso_actual}
                      onChange={(event) =>
                        setForm({
                          ...form,

                          uso_actual:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Estado
                    </label>

                    <select
                      value={form.estado}
                      onChange={(event) =>
                        setForm({
                          ...form,

                          estado:
                            event.target.value as
                              | "ACTIVO"
                              | "INACTIVO",
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    >

                      <option value="ACTIVO">
                        Activo
                      </option>

                      <option value="INACTIVO">
                        Inactivo
                      </option>

                    </select>

                  </div>

                </div>


                {/* =================================================
                    FOTO - CÁMARA / GALERÍA
                ================================================= */}

                <div>

                  <div className="mb-3">

                    <label className="block text-sm font-semibold text-slate-700">
                      Foto identificatoria
                    </label>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Una única imagen para reconocer visualmente el puesto.
                    </p>

                  </div>


                  {fotoPreview ? (

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                      <img
                        src={fotoPreview}
                        alt="Vista previa"
                        className="aspect-video w-full object-cover"
                      />


                      <div className="border-t border-slate-200 bg-white p-3">

                        <p className="mb-3 text-xs font-medium text-slate-500">
                          {foto
                            ? "Nueva imagen seleccionada"
                            : "Foto actual del equipo"}
                        </p>


                        <div className="grid grid-cols-2 gap-2">

                          {/* TOMAR FOTO */}

                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100">

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                              <circle
                                cx="12"
                                cy="13"
                                r="3"
                              />
                            </svg>

                            Tomar foto

                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={
                                handleFotoChange
                              }
                              className="hidden"
                            />

                          </label>


                          {/* SUBIR FOTO */}

                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line
                                x1="12"
                                x2="12"
                                y1="3"
                                y2="15"
                              />
                            </svg>

                            Subir foto

                            <input
                              type="file"
                              accept="image/*"
                              onChange={
                                handleFotoChange
                              }
                              className="hidden"
                            />

                          </label>

                        </div>


                        <button
                          type="button"
                          onClick={quitarFoto}
                          className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Quitar foto
                        </button>

                      </div>

                    </div>

                  ) : (

                    <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 px-4 py-6 sm:px-6">

                      <div className="text-center">

                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle
                              cx="12"
                              cy="13"
                              r="3"
                            />
                          </svg>

                        </div>


                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          Agregar fotografía
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Elegí cómo querés obtener la imagen.
                        </p>

                      </div>


                      <div className="mt-4 grid grid-cols-2 gap-2">

                        {/* TOMAR FOTO */}

                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-700 px-3 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800">

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle
                              cx="12"
                              cy="13"
                              r="3"
                            />
                          </svg>

                          Tomar foto

                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={
                              handleFotoChange
                            }
                            className="hidden"
                          />

                        </label>


                        {/* SUBIR FOTO */}

                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line
                              x1="12"
                              x2="12"
                              y1="3"
                              y2="15"
                            />
                          </svg>

                          Subir foto

                          <input
                            type="file"
                            accept="image/*"
                            onChange={
                              handleFotoChange
                            }
                            className="hidden"
                          />

                        </label>

                      </div>


                      <p className="mt-3 text-center text-[11px] text-slate-400">
                        JPG, PNG u otra imagen · Máximo 15 MB
                      </p>

                    </div>

                  )}

                </div>


                {/* OBSERVACIONES */}

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Observaciones
                  </label>


                  <textarea
                    value={form.observaciones}
                    onChange={(event) =>
                      setForm({
                        ...form,

                        observaciones:
                          event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                {errorEdicion && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorEdicion}
                  </div>

                )}

              </div>


              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  disabled={saving}
                  onClick={cerrarEditar}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================= */}
      {/* MODAL ASOCIAR ACTIVO */}
      {/* ======================================================= */}

      {asociarModalOpen && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">

            <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white p-5">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                    Activos
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Asociar activo existente
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Activos sin equipo de trabajo
                    del sector{" "}
                    <strong>
                      {equipo.sector_nombre}
                    </strong>
                    .
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarModalAsociar
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400"
                  aria-label="Cerrar"
                >
                  ×
                </button>

              </div>

            </div>


            <div className="border-b border-slate-200 p-4">

              <input
                value={busquedaActivo}
                onChange={(event) =>
                  setBusquedaActivo(
                    event.target.value,
                  )
                }
                placeholder="Buscar por código, tipo, hostname, marca..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              />

            </div>


            <div className="min-h-0 flex-1 overflow-y-auto">

              {loadingDisponibles ? (

                <div className="p-10 text-center text-sm text-slate-500">
                  Cargando activos...
                </div>

              ) : errorDisponibles ? (

                <div className="p-5">

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorDisponibles}
                  </div>

                </div>

              ) : activosFiltrados.length === 0 ? (

                <div className="p-10 text-center">

                  <p className="text-sm font-semibold text-slate-700">
                    No hay activos disponibles
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    No encontramos activos sin equipo de trabajo para asociar en este sector.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-slate-100">

                  {activosFiltrados.map(
                    (activo) => {

                      const selected =
                        activoSeleccionado?.id ===
                        activo.id;


                      return (

                        <button
                          type="button"
                          key={activo.id}
                          onClick={() =>
                            setActivoSeleccionado(
                              activo,
                            )
                          }
                          className={`w-full p-4 text-left transition ${
                            selected
                              ? "bg-sky-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-start gap-3">

                            <span
                              className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                                selected
                                  ? "border-[5px] border-sky-600"
                                  : "border-slate-300"
                              }`}
                            />


                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="font-semibold text-slate-900">
                                  {activo.codigo_inventario}
                                </span>

                                <span className="text-sm text-slate-500">
                                  {activo.tipo_activo_nombre}
                                </span>


                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${estadoActivoClasses(
                                    activo.estado,
                                  )}`}
                                >
                                  {estadoActivoLabel(
                                    activo.estado,
                                  )}
                                </span>

                              </div>


                              <p className="mt-1 text-sm text-slate-500">

                                {[
                                  activo.marca,
                                  activo.modelo,
                                ]
                                  .filter(Boolean)
                                  .join(" ") ||
                                  "Sin marca/modelo"}

                              </p>


                              {activo.hostname && (

                                <p className="mt-1 font-mono text-xs text-slate-400">
                                  {activo.hostname}
                                </p>

                              )}

                            </div>

                          </div>

                        </button>

                      );
                    },
                  )}

                </div>

              )}

            </div>


            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  cerrarModalAsociar
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>


              <button
                type="button"
                disabled={
                  !activoSeleccionado
                }
                onClick={() => {
                  setErrorAsociacion(null);

                  setConfirmarModalOpen(
                    true,
                  );
                }}
                className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Asociar seleccionado
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================= */}
      {/* CONFIRMAR ASOCIACIÓN */}
      {/* ======================================================= */}

      {confirmarModalOpen &&
        activoSeleccionado && (

          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="h-1.5 bg-sky-600" />


              <div className="p-6">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Confirmación
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Asociar activo
                </h2>


                <p className="mt-3 text-sm leading-6 text-slate-600">

                  El activo{" "}

                  <strong className="text-slate-900">
                    {activoSeleccionado.codigo_inventario}
                  </strong>

                  {" "}quedará asociado al equipo{" "}

                  <strong className="text-slate-900">
                    {equipo.nombre}
                  </strong>

                  .

                </p>


                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-sm font-semibold text-slate-800">
                    {activoSeleccionado.tipo_activo_nombre}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {[
                      activoSeleccionado.marca,
                      activoSeleccionado.modelo,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                      "Sin marca/modelo"}
                  </p>

                </div>


                {errorAsociacion && (

                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorAsociacion}
                  </div>

                )}

              </div>


              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={asociando}
                  onClick={() =>
                    setConfirmarModalOpen(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  disabled={asociando}
                  onClick={
                    confirmarAsociacion
                  }
                  className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
                >
                  {asociando
                    ? "Asociando..."
                    : "Confirmar asociación"}
                </button>

              </div>

            </div>

          </div>

        )}

    </>
  );
}