"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api";

import type {
  Area,
  Sector,
} from "@/types";


type SectorForm = {
  area: number | "";
  nombre: string;
  descripcion: string;
  activo: boolean;
};


const initialForm: SectorForm = {
  area: "",
  nombre: "",
  descripcion: "",
  activo: true,
};


export default function SectoresPage() {
  const [sectores, setSectores] =
    useState<Sector[]>([]);

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingAreas, setLoadingAreas] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingSector,
    setEditingSector,
  ] = useState<Sector | null>(null);

  const [form, setForm] =
    useState<SectorForm>(initialForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [filterArea, setFilterArea] =
    useState("");

  const [filterEstado, setFilterEstado] =
    useState("");


  /* ============================================================
     CARGA
  ============================================================ */

  async function loadSectores() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<Sector[]>(
        "/estructura/sectores/",
      );

      setSectores(data);

    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron cargar los sectores.",
      );

    } finally {
      setLoading(false);
    }
  }


  async function loadAreas() {
    try {
      setLoadingAreas(true);

      const data = await apiGet<Area[]>(
        "/estructura/areas/",
      );

      setAreas(data);

    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron cargar las áreas.",
      );

    } finally {
      setLoadingAreas(false);
    }
  }


  useEffect(() => {
    loadSectores();
    loadAreas();
  }, []);


  /* ============================================================
     FILTROS
  ============================================================ */

  const sectoresFiltrados =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return sectores.filter(
        (sector) => {
          const matchesSearch =
            !term ||
            sector.nombre
              .toLowerCase()
              .includes(term) ||
            sector.area_nombre
              .toLowerCase()
              .includes(term) ||
            (
              sector.descripcion ?? ""
            )
              .toLowerCase()
              .includes(term);

          const matchesArea =
            !filterArea ||
            sector.area ===
              Number(filterArea);

          const matchesEstado =
            !filterEstado ||
            (
              filterEstado === "ACTIVO"
                ? sector.activo
                : !sector.activo
            );

          return (
            matchesSearch &&
            matchesArea &&
            matchesEstado
          );
        },
      );

    }, [
      sectores,
      search,
      filterArea,
      filterEstado,
    ]);


  const areasActivas =
    useMemo(() => {
      return areas.filter(
        (area) =>
          area.activo ||
          area.id === editingSector?.area,
      );
    }, [
      areas,
      editingSector,
    ]);


  /* ============================================================
     FORMULARIO
  ============================================================ */

  function openCreate() {
    setEditingSector(null);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  }


  function openEdit(
    sector: Sector,
  ) {
    setEditingSector(sector);

    setForm({
      area: sector.area,
      nombre: sector.nombre,
      descripcion:
        sector.descripcion ?? "",
      activo: sector.activo,
    });

    setError(null);
    setShowForm(true);
  }


  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingSector(null);
    setForm(initialForm);
    setError(null);
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.area) {
      setError(
        "Tenés que seleccionar un área.",
      );

      return;
    }

    if (!form.nombre.trim()) {
      setError(
        "El nombre del sector es obligatorio.",
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        area: form.area,
        nombre: form.nombre.trim(),
        descripcion:
          form.descripcion.trim(),
        activo: form.activo,
      };

      if (editingSector) {
        await apiPatch<Sector>(
          `/estructura/sectores/${editingSector.id}/`,
          payload,
        );
      } else {
        await apiPost<Sector>(
          "/estructura/sectores/",
          payload,
        );
      }

      await loadSectores();

      setShowForm(false);
      setEditingSector(null);
      setForm(initialForm);

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo guardar el sector. Revisá que no exista otro sector con el mismo nombre dentro del área.",
      );

    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(
    sector: Sector,
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar el sector "${sector.nombre}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await apiDelete(
        `/estructura/sectores/${sector.id}/`,
      );

      await loadSectores();

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo eliminar el sector. Puede estar siendo utilizado por equipos de trabajo o activos.",
      );
    }
  }


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-slate-100/70">

      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">


        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-500" />

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">

                  <span className="h-2 w-2 rounded-full bg-sky-500" />

                  Estructura

                </div>


                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">

                  Sectores

                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

                  Administrá los sectores pertenecientes
                  a cada área y utilizalos luego para
                  organizar equipos y activos.

                </p>

              </div>


              <button
                type="button"
                onClick={openCreate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100 lg:w-auto"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>

                Nuevo sector

              </button>

            </div>

          </div>

        </section>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && !showForm && (

          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">

            {error}

          </div>

        )}


        {/* ======================================================
            FILTROS
        ====================================================== */}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="mb-4 flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold text-slate-900">

                Buscar y filtrar

              </p>

              <p className="mt-0.5 text-xs text-slate-400">

                Buscá por sector, área o descripción.

              </p>

            </div>


            <div className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">

              {sectoresFiltrados.length} resultado(s)

            </div>

          </div>


          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_1fr_180px]">

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
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar sector..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 py-2.5 pl-10 pr-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              />

            </div>


            <select
              value={filterArea}
              onChange={(event) =>
                setFilterArea(
                  event.target.value,
                )
              }
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


        {/* ======================================================
            CONTADOR MOBILE
        ====================================================== */}

        <div className="mb-3 sm:hidden">

          <span className="text-sm font-medium text-slate-500">

            {sectoresFiltrados.length === 1
              ? "1 sector encontrado"
              : `${sectoresFiltrados.length} sectores encontrados`}

          </span>

        </div>


        {/* ======================================================
            ESTADOS
        ====================================================== */}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

            <p className="mt-4 text-sm text-slate-500">
              Cargando sectores...
            </p>

          </div>

        ) : sectoresFiltrados.length === 0 ? (

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
                  height="18"
                  x="3"
                  y="3"
                  rx="2"
                />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>

            </div>

            <h2 className="mt-4 font-semibold text-slate-800">

              No se encontraron sectores

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Modificá los filtros o registrá
              un nuevo sector.

            </p>

          </div>

        ) : (

          <>


            {/* ==================================================
                MOBILE
            ================================================== */}

            <div className="space-y-4 md:hidden">

              {sectoresFiltrados.map(
                (sector) => (

                <article
                  key={sector.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />


                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="text-xs font-semibold text-sky-700">

                          {sector.area_nombre}

                        </p>


                        <h2 className="mt-1 break-words text-lg font-semibold leading-6 text-slate-900">

                          {sector.nombre}

                        </h2>

                      </div>


                      <span
                        className={
                          sector.activo
                            ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100"
                            : "shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
                        }
                      >

                        {sector.activo
                          ? "Activo"
                          : "Inactivo"}

                      </span>

                    </div>


                    <p className="mt-3 text-sm leading-6 text-slate-500">

                      {sector.descripcion ||
                        "Sin descripción registrada."}

                    </p>


                    <div className="mt-5 grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(sector)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                      >

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>

                        Editar

                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(sector)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
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

                        Eliminar

                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>


            {/* ==================================================
                DESKTOP
            ================================================== */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

              <div className="overflow-x-auto">

                <table className="min-w-full text-sm">

                  <thead className="border-b border-slate-200 bg-slate-50/80">

                    <tr>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Área
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Sector
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Descripción
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Estado
                      </th>

                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acciones
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {sectoresFiltrados.map(
                      (sector) => (

                      <tr
                        key={sector.id}
                        className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60"
                      >

                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700">

                            {sector.area_nombre}

                          </span>

                        </td>


                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="font-semibold text-slate-900">

                            {sector.nombre}

                          </span>

                        </td>


                        <td className="max-w-md px-5 py-4 text-slate-600">

                          {sector.descripcion || "—"}

                        </td>


                        <td className="whitespace-nowrap px-5 py-4">

                          <span
                            className={
                              sector.activo
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                            }
                          >

                            {sector.activo
                              ? "Activo"
                              : "Inactivo"}

                          </span>

                        </td>


                        <td className="whitespace-nowrap px-5 py-4 text-right">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(sector)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(sector)
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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


        {/* ======================================================
            MODAL
        ====================================================== */}

        {showForm && (

          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">

            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">

              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-6">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">

                    Estructura

                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">

                    {editingSector
                      ? "Editar sector"
                      : "Nuevo sector"}

                  </h2>

                  <p className="mt-1 text-sm text-slate-500">

                    {editingSector
                      ? "Actualizá los datos del sector seleccionado."
                      : "Creá un sector y vinculalo con un área del hospital."}

                  </p>

                </div>


                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
                >

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
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>

                </button>

              </div>


              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5 sm:p-6"
              >

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Área

                  </label>

                  <select
                    value={form.area}
                    disabled={loadingAreas}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        area: event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : "",
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >

                    <option value="">
                      Seleccionar área
                    </option>

                    {areasActivas.map(
                      (area) => (

                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.nombre}
                      </option>

                    ))}

                  </select>


                  {!loadingAreas &&
                    areasActivas.length === 0 && (

                    <p className="mt-2 text-xs font-medium text-amber-600">

                      No hay áreas activas disponibles.
                      Primero tenés que crear un área.

                    </p>

                  )}

                </div>


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Nombre

                  </label>

                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        nombre:
                          event.target.value,
                      })
                    }
                    autoFocus
                    placeholder="Ej.: Facturación"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Descripción

                  </label>

                  <textarea
                    value={form.descripcion}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        descripcion:
                          event.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Descripción opcional"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
                  />

                </div>


                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">

                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        activo:
                          event.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-sky-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-slate-800">

                      Sector activo

                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">

                      Los sectores inactivos permanecen
                      registrados, pero no deberían
                      utilizarse para nuevas asignaciones.

                    </p>

                  </div>

                </label>


                {error && (

                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    {error}

                  </div>

                )}


                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >

                    Cancelar

                  </button>


                  <button
                    type="submit"
                    disabled={
                      saving ||
                      loadingAreas ||
                      areasActivas.length === 0
                    }
                    className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {saving
                      ? "Guardando..."
                      : editingSector
                        ? "Guardar cambios"
                        : "Crear sector"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}