"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  apiDelete,
  apiGet,
  apiPatchForm,
  apiPostForm,
} from "@/lib/api";

import type {
  Area,
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

const initialForm: EquipoForm = {
  sector: "",
  nombre: "",
  uso_actual: "",
  estado: "ACTIVO",
  observaciones: "",
};


export default function EquiposPage() {
  const [equipos, setEquipos] =
    useState<EquipoTrabajo[]>([]);

  const [sectores, setSectores] =
    useState<Sector[]>([]);

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingEquipo,
    setEditingEquipo,
  ] = useState<EquipoTrabajo | null>(null);

  const [form, setForm] =
    useState<EquipoForm>(initialForm);

  const [foto, setFoto] =
    useState<File | null>(null);

  const [
    fotoPreview,
    setFotoPreview,
  ] = useState<string | null>(null);

  const [
    removeFoto,
    setRemoveFoto,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [
    filterArea,
    setFilterArea,
  ] = useState("");

  const [
    filterSector,
    setFilterSector,
  ] = useState("");

  const [
    filterEstado,
    setFilterEstado,
  ] = useState("ACTIVO");

  const [
    equipoEliminar,
    setEquipoEliminar,
  ] = useState<EquipoTrabajo | null>(null);

  const [
    showDeleteBlocked,
    setShowDeleteBlocked,
  ] = useState(false);

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);


  /* ============================================================
     CARGA
  ============================================================ */

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [
        equiposData,
        sectoresData,
        areasData,
      ] = await Promise.all([
        apiGet<EquipoTrabajo[]>(
          "/inventario/equipos-trabajo/",
        ),

        apiGet<Sector[]>(
          "/estructura/sectores/",
        ),

        apiGet<Area[]>(
          "/estructura/areas/",
        ),
      ]);

      setEquipos(equiposData);

      setSectores(
        sectoresData.filter(
          (sector) => sector.activo,
        ),
      );

      setAreas(
        areasData.filter(
          (area) => area.activo,
        ),
      );

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo cargar la información.",
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadData();
  }, []);


  /* ============================================================
     FILTROS
  ============================================================ */

  const sectoresFiltro =
    useMemo(() => {
      if (!filterArea) {
        return sectores;
      }

      return sectores.filter(
        (sector) =>
          sector.area === Number(filterArea),
      );

    }, [
      sectores,
      filterArea,
    ]);


  const equiposFiltrados =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return equipos.filter(
        (equipo) => {
          const matchesSearch =
            !term ||
            equipo.nombre
              .toLowerCase()
              .includes(term) ||
            equipo.uso_actual
              .toLowerCase()
              .includes(term) ||
            equipo.area_nombre
              .toLowerCase()
              .includes(term) ||
            equipo.sector_nombre
              .toLowerCase()
              .includes(term) ||
            (
              equipo.hostname_principal ??
              ""
            )
              .toLowerCase()
              .includes(term);

          const matchesArea =
            !filterArea ||
            equipo.area_nombre ===
              areas.find(
                (area) =>
                  area.id ===
                  Number(filterArea),
              )?.nombre;

          const matchesSector =
            !filterSector ||
            equipo.sector ===
              Number(filterSector);

          const matchesEstado =
            !filterEstado ||
            equipo.estado ===
              filterEstado;

          return (
            matchesSearch &&
            matchesArea &&
            matchesSector &&
            matchesEstado
          );
        },
      );

    }, [
      equipos,
      search,
      filterArea,
      filterSector,
      filterEstado,
      areas,
    ]);


  /* ============================================================
     CREAR / EDITAR
  ============================================================ */

  function openCreate() {
    setEditingEquipo(null);
    setForm(initialForm);
    setFoto(null);
    setFotoPreview(null);
    setRemoveFoto(false);
    setError(null);
    setShowForm(true);
  }


  function openEdit(
    equipo: EquipoTrabajo,
  ) {
    setEditingEquipo(equipo);

    setForm({
      sector: equipo.sector,
      nombre: equipo.nombre,
      uso_actual: equipo.uso_actual,
      estado: equipo.estado,
      observaciones: equipo.observaciones,
    });

    setFoto(null);
    setFotoPreview(equipo.foto);
    setRemoveFoto(false);
    setError(null);
    setShowForm(true);
  }


  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingEquipo(null);
    setForm(initialForm);
    setFoto(null);
    setFotoPreview(null);
    setRemoveFoto(false);
    setError(null);
  }


  /* ============================================================
     FOTO
  ============================================================ */
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
      setError(
        "El archivo seleccionado debe ser una imagen.",
      );

      return;
    }

    try {
      setError(null);

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
        error,
      );

      setError(
        "No se pudo procesar la imagen.",
      );
    }
  }


  function handleRemoveFoto() {
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


  /* ============================================================
     GUARDAR
  ============================================================ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.sector) {
      setError(
        "Seleccioná un sector.",
      );

      return;
    }

    if (!form.nombre.trim()) {
      setError(
        "El nombre es obligatorio.",
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

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

      if (
        editingEquipo &&
        removeFoto
      ) {
        data.append(
          "foto",
          "",
        );
      }

      if (editingEquipo) {
        await apiPatchForm(
          `/inventario/equipos-trabajo/${editingEquipo.id}/`,
          data,
        );
      } else {
        await apiPostForm(
          "/inventario/equipos-trabajo/",
          data,
        );
      }

      await loadData();

      closeForm();

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo guardar el equipo.",
      );

    } finally {
      setSaving(false);
    }
  }


  /* ============================================================
     ELIMINAR
  ============================================================ */

  function requestDelete(
    equipo: EquipoTrabajo,
  ) {
    setEquipoEliminar(equipo);

    if (
      equipo.cantidad_activos >
      0
    ) {
      setShowDeleteBlocked(true);

      return;
    }

    setShowDeleteConfirm(true);
  }


  function closeDeleteModals() {
    if (deleting) {
      return;
    }

    setShowDeleteBlocked(false);
    setShowDeleteConfirm(false);
    setEquipoEliminar(null);
  }


  async function confirmDelete() {
    if (!equipoEliminar) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await apiDelete(
        `/inventario/equipos-trabajo/${equipoEliminar.id}/`,
      );

      await loadData();

      setShowDeleteConfirm(false);
      setEquipoEliminar(null);

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo eliminar el equipo.",
      );

    } finally {
      setDeleting(false);
    }
  }


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>

      <div className="min-h-screen bg-slate-50/70">

        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-7 2xl:px-8">


          {/* ====================================================
              HERO
          ==================================================== */}

          <section className="relative mb-6 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

            <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


            <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">

              <div>

                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">

                  <span className="h-2 w-2 rounded-full bg-sky-500" />

                  Inventario

                </div>


                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Equipos de trabajo
                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Gestioná los puestos y conjuntos
                  de equipamiento utilizados en los
                  distintos sectores del hospital.
                </p>

              </div>


              <button
                type="button"
                onClick={openCreate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:w-auto"
              >

                <span className="text-xl leading-none">
                  +
                </span>

                Nuevo equipo

              </button>

            </div>

          </section>


          {/* ====================================================
              ERROR
          ==================================================== */}

          {error &&
            !showForm && (

            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>

          )}


          {/* ====================================================
              FILTROS
          ==================================================== */}

          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <p className="text-sm font-semibold text-slate-900">
                  Buscar y filtrar
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Encontrá rápidamente un puesto,
                  sector o hostname.
                </p>

              </div>


              <div className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">

                {equiposFiltrados.length}{" "}
                resultado(s)

              </div>

            </div>


            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_1fr_1fr_160px]">


              {/* BUSCAR */}

              <div className="relative">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                >

                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <path d="m21 21-4.3-4.3" />

                </svg>


                <input
                  type="text"
                  placeholder="Buscar equipo, uso, hostname..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/70 py-2.5 pl-10 pr-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                />

              </div>


              {/* ÁREA */}

              <select
                value={filterArea}
                onChange={(event) => {
                  setFilterArea(
                    event.target.value,
                  );

                  setFilterSector("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              >

                <option value="">
                  Todas las áreas
                </option>


                {areas.map(
                  (area) => (

                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.nombre}
                  </option>

                ))}

              </select>


              {/* SECTOR */}

              <select
                value={filterSector}
                onChange={(event) =>
                  setFilterSector(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              >

                <option value="">
                  Todos los sectores
                </option>


                {sectoresFiltro.map(
                  (sector) => (

                  <option
                    key={sector.id}
                    value={sector.id}
                  >
                    {sector.nombre}
                  </option>

                ))}

              </select>


              {/* ESTADO */}

              <select
                value={filterEstado}
                onChange={(event) =>
                  setFilterEstado(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              >

                <option value="">
                  Todos los estados
                </option>

                <option value="ACTIVO">
                  Activos
                </option>

                <option value="INACTIVO">
                  Inactivos
                </option>

              </select>

            </div>

          </section>


          {/* ====================================================
              CONTADOR MOBILE
          ==================================================== */}

          <div className="mb-3 flex items-center justify-between sm:hidden">

            <span className="text-sm font-medium text-slate-500">

              {equiposFiltrados.length ===
              1
                ? "1 equipo encontrado"
                : `${equiposFiltrados.length} equipos encontrados`}

            </span>

          </div>


          {/* ====================================================
              ESTADOS
          ==================================================== */}

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

              <p className="mt-4 text-sm text-slate-500">
                Cargando equipos...
              </p>

            </div>

          ) : equiposFiltrados.length ===
            0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700">

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


              <h2 className="mt-4 font-semibold text-slate-800">
                No se encontraron equipos
              </h2>


              <p className="mt-1 text-sm text-slate-500">
                Modificá los filtros o registrá
                un nuevo equipo de trabajo.
              </p>

            </div>

          ) : (

            <>


              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="space-y-4 md:hidden">

                {equiposFiltrados.map(
                  (equipo) => (

                  <article
                    key={equipo.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >

                    <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />


                    <div className="px-5 pb-4 pt-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h2 className="break-words text-lg font-semibold leading-6 text-slate-900">
                            {equipo.nombre}
                          </h2>


                          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0 text-sky-600"
                            >

                              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />

                              <circle
                                cx="12"
                                cy="10"
                                r="3"
                              />

                            </svg>


                            <span>
                              {equipo.area_nombre}
                              {" / "}
                              {equipo.sector_nombre}
                            </span>

                          </div>

                        </div>


                        <span
                          className={
                            equipo.estado ===
                            "ACTIVO"
                              ? "shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                              : "shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
                          }
                        >

                          {equipo.estado ===
                          "ACTIVO"
                            ? "Activo"
                            : "Inactivo"}

                        </span>

                      </div>


                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Uso actual
                          </p>

                          <p className="mt-1.5 text-sm font-medium text-slate-700">

                            {equipo.uso_actual ||
                              "Sin referencia"}

                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Hostname
                          </p>

                          <p className="mt-1.5 break-all font-mono text-sm font-medium text-slate-700">

                            {equipo.hostname_principal ||
                              "—"}

                          </p>

                        </div>

                      </div>


                      <div className="mt-3 flex items-center gap-2">

                        <div className="flex flex-1 items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sky-700">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">

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


                          <div>

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-500">
                              Activos
                            </p>

                            <p className="text-sm font-bold">
                              {equipo.cantidad_activos}
                            </p>

                          </div>

                        </div>


                        <div className="flex flex-1 items-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-violet-700">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">

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

                              <rect
                                width="18"
                                height="18"
                                x="3"
                                y="3"
                                rx="2"
                              />

                              <circle
                                cx="9"
                                cy="9"
                                r="2"
                              />

                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />

                            </svg>

                          </div>


                          <div>

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
                              Foto
                            </p>

                            <p className="text-sm font-bold">

                              {equipo.foto
                                ? "Sí"
                                : "No"}

                            </p>

                          </div>

                        </div>

                      </div>

                    </div>


                    <div className="grid grid-cols-3 border-t border-slate-200 bg-slate-50/60">

                      <Link
                        href={`/inventario/equipos/${equipo.id}`}
                        className="flex items-center justify-center gap-1.5 border-r border-slate-200 px-3 py-3.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                      >
                        Ver
                      </Link>


                      <button
                        type="button"
                        onClick={() =>
                          openEdit(equipo)
                        }
                        className="border-r border-slate-200 px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Editar
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          requestDelete(equipo)
                        }
                        className="px-3 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>

                    </div>

                  </article>

                ))}

              </div>


              {/* =================================================
                  NOTEBOOK / MONITOR INTERMEDIO
              ================================================= */}

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block 2xl:hidden">

                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <h2 className="text-sm font-semibold text-slate-900">
                        Listado de equipos
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Vista general de los puestos registrados.
                      </p>

                    </div>


                    <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {equiposFiltrados.length}{" "}
                      registro(s)
                    </span>

                  </div>

                </div>


                <div className="overflow-x-auto">

                  <table className="w-full table-fixed">

                    <thead className="bg-slate-50/70">

                      <tr className="text-slate-500">

                        <th className="w-[29%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Equipo
                        </th>

                        <th className="w-[27%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Ubicación
                        </th>

                        <th className="w-[17%] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Hostname
                        </th>

                        <th className="w-[12%] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Estado
                        </th>

                        <th className="w-[15%] px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {equiposFiltrados.map(
                        (equipo) => (

                        <tr
                          key={equipo.id}
                          className="border-t border-slate-100 transition hover:bg-sky-50/30"
                        >

                          <td className="px-4 py-4 align-middle">

                            <div className="flex items-start gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">

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


                              <div className="min-w-0">

                                <Link
                                  href={`/inventario/equipos/${equipo.id}`}
                                  className="block truncate text-[13px] font-semibold text-slate-900 transition hover:text-sky-700"
                                >
                                  {equipo.nombre}
                                </Link>


                                <p className="mt-1 truncate text-[12px] text-slate-500">

                                  {equipo.uso_actual ||
                                    "Sin uso actual"}

                                </p>


                                <div className="mt-2 flex flex-wrap items-center gap-1.5">

                                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">

                                    {equipo.cantidad_activos}

                                    <span className="font-medium text-sky-500">

                                      activo
                                      {equipo.cantidad_activos ===
                                      1
                                        ? ""
                                        : "s"}

                                    </span>

                                  </span>


                                  {equipo.foto && (

                                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                      Foto
                                    </span>

                                  )}

                                </div>

                              </div>

                            </div>

                          </td>


                          <td className="px-4 py-4 align-middle">

                            <div className="flex items-start gap-2">

                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />


                              <div className="min-w-0 text-[12px] leading-5">

                                <p className="truncate font-medium text-slate-700">
                                  {equipo.area_nombre}
                                </p>

                                <p className="truncate text-slate-500">
                                  {equipo.sector_nombre}
                                </p>

                              </div>

                            </div>

                          </td>


                          <td className="px-4 py-4 align-middle">

                            {equipo.hostname_principal ? (

                              <span className="inline-block max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-medium text-slate-700">

                                {equipo.hostname_principal}

                              </span>

                            ) : (

                              <span className="text-xs text-slate-400">
                                —
                              </span>

                            )}

                          </td>


                          <td className="px-3 py-4 align-middle">

                            <span
                              className={
                                equipo.estado ===
                                "ACTIVO"
                                  ? "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                                  : "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500"
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

                          </td>


                          <td className="px-4 py-4 align-middle">

                            <div className="flex justify-end gap-1.5">

                              <Link
                                href={`/inventario/equipos/${equipo.id}`}
                                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[10px] font-semibold text-sky-700 transition hover:bg-sky-100"
                              >
                                Ver
                              </Link>


                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(equipo)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Editar
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  requestDelete(equipo)
                                }
                                className="flex h-[29px] w-[29px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                aria-label="Eliminar equipo"
                                title="Eliminar"
                              >

                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >

                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />

                                </svg>

                              </button>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* =================================================
                  MONITOR GRANDE
              ================================================= */}

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm 2xl:block">

                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-sm font-semibold text-slate-900">
                        Listado de equipos
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Vista general de los puestos registrados.
                      </p>

                    </div>


                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">

                      {equiposFiltrados.length}{" "}
                      registro(s)

                    </span>

                  </div>

                </div>


                <div className="overflow-x-auto">

                  <table className="min-w-full text-[13px]">

                    <thead className="bg-slate-50/70">

                      <tr className="text-slate-500">

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                          Equipo
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                          Ubicación
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                          Uso actual
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                          Hostname
                        </th>

                        <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide">
                          Activos
                        </th>

                        <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide">
                          Foto
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                          Estado
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {equiposFiltrados.map(
                        (equipo) => (

                        <tr
                          key={equipo.id}
                          className="border-t border-slate-100 transition hover:bg-sky-50/30"
                        >

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-2.5">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">

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


                              <Link
                                href={`/inventario/equipos/${equipo.id}`}
                                className="whitespace-nowrap font-semibold text-slate-900 transition hover:text-sky-700"
                              >
                                {equipo.nombre}
                              </Link>

                            </div>

                          </td>


                          <td className="px-4 py-4 text-slate-600">

                            <div className="flex items-center gap-2">

                              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />

                              <span>
                                {equipo.area_nombre}
                                {" / "}
                                {equipo.sector_nombre}
                              </span>

                            </div>

                          </td>


                          <td className="px-4 py-4 text-slate-600">

                            {equipo.uso_actual ||
                              "—"}

                          </td>


                          <td className="px-4 py-4">

                            {equipo.hostname_principal ? (

                              <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700">

                                {equipo.hostname_principal}

                              </span>

                            ) : (

                              <span className="text-slate-400">
                                —
                              </span>

                            )}

                          </td>


                          <td className="px-4 py-4 text-center">

                            <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">

                              {equipo.cantidad_activos}

                            </span>

                          </td>


                          <td className="px-4 py-4 text-center">

                            {equipo.foto ? (

                              <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                Disponible
                              </span>

                            ) : (

                              <span className="text-slate-400">
                                —
                              </span>

                            )}

                          </td>


                          <td className="px-4 py-4">

                            <span
                              className={
                                equipo.estado ===
                                "ACTIVO"
                                  ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                                  : "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
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

                          </td>


                          <td className="px-4 py-4">

                            <div className="flex justify-end gap-1.5">

                              <Link
                                href={`/inventario/equipos/${equipo.id}`}
                                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100"
                              >
                                Ver
                              </Link>


                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(equipo)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Editar
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  requestDelete(equipo)
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Eliminar
                              </button>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          )}

        </div>

      </div>


      {/* ========================================================
          MODAL CREAR / EDITAR
      ======================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">


            <div className="relative border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white px-5 py-5 sm:px-6">

              <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


              <div className="pr-12">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Equipo de trabajo
                </p>


                <h2 className="mt-1 text-xl font-bold text-slate-900">

                  {editingEquipo
                    ? "Editar equipo"
                    : "Nuevo equipo"}

                </h2>


                <p className="mt-1 text-sm text-slate-500">

                  {editingEquipo
                    ? "Actualizá la información del puesto."
                    : "Registrá un nuevo puesto o conjunto de trabajo."}

                </p>

              </div>


              <button
                type="button"
                onClick={closeForm}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto"
            >

              <div className="space-y-6 p-5 sm:p-6">

                <div className="grid gap-5 sm:grid-cols-2">


                  {/* SECTOR */}

                  <div className="sm:col-span-2">

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                      Sector

                      <span className="ml-1 text-red-500">
                        *
                      </span>

                    </label>


                    <select
                      value={form.sector}
                      onChange={(event) =>
                        setForm({
                          ...form,

                          sector:
                            Number(
                              event.target.value,
                            ) ||
                            "",
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
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

                      ))}

                    </select>

                  </div>


                  {/* NOMBRE */}

                  <div className="sm:col-span-2">

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                      Nombre

                      <span className="ml-1 text-red-500">
                        *
                      </span>

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
                      placeholder="Ej.: Equipo de Facturación Nacionales"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  {/* USO */}

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
                      placeholder="Ej.: Melisa Rufino"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                    />

                  </div>


                  {/* ESTADO */}

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
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
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
                          onClick={
                            handleRemoveFoto
                          }
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
                    placeholder="Información adicional sobre el puesto..."
                    className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50/60 px-3 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                {error && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>

                )}

              </div>


              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving
                    ? "Guardando..."
                    : editingEquipo
                      ? "Guardar cambios"
                      : "Crear equipo"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ========================================================
          ELIMINACIÓN BLOQUEADA
      ======================================================== */}

      {showDeleteBlocked &&
        equipoEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="h-1.5 bg-amber-400" />


            <div className="p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl font-bold text-amber-700">
                !
              </div>


              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No se puede eliminar
              </h2>


              <p className="mt-2 text-sm leading-6 text-slate-600">

                El equipo{" "}

                <strong className="text-slate-900">
                  {equipoEliminar.nombre}
                </strong>{" "}

                tiene actualmente{" "}

                <strong className="text-slate-900">
                  {equipoEliminar.cantidad_activos}
                </strong>{" "}

                activo(s) asociado(s).

              </p>


              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">

                <p className="text-sm leading-5 text-amber-800">
                  Primero deberán desasociarse o trasladarse los activos antes de eliminar este equipo.
                </p>

              </div>

            </div>


            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-4">

              <button
                type="button"
                onClick={closeDeleteModals}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Entendido
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ========================================================
          CONFIRMAR ELIMINACIÓN
      ======================================================== */}

      {showDeleteConfirm &&
        equipoEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="h-1.5 bg-red-500" />


            <div className="p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">

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

                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />

                </svg>

              </div>


              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Eliminar equipo
              </h2>


              <p className="mt-2 text-sm leading-6 text-slate-600">

                ¿Confirmás la eliminación del equipo{" "}

                <strong className="text-slate-900">
                  {equipoEliminar.nombre}
                </strong>
                ?

              </p>


              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-sm font-semibold text-slate-800">

                  {equipoEliminar.area_nombre}

                  {" / "}

                  {equipoEliminar.sector_nombre}

                </p>


                {equipoEliminar.uso_actual && (

                  <p className="mt-1 text-sm text-slate-500">

                    Uso actual:{" "}

                    {equipoEliminar.uso_actual}

                  </p>

                )}

              </div>


              <p className="mt-4 text-xs leading-5 text-slate-400">
                El registro será marcado como eliminado mediante soft-delete.
              </p>

            </div>


            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeDeleteModals}
                disabled={deleting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {deleting
                  ? "Eliminando..."
                  : "Eliminar equipo"}

              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}