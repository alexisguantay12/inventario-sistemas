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

import type { Area } from "@/types";


type AreaForm = {
  nombre: string;
  descripcion: string;
  activo: boolean;
};


const initialForm: AreaForm = {
  nombre: "",
  descripcion: "",
  activo: true,
};


export default function AreasPage() {
  const [areas, setAreas] =
    useState<Area[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingArea, setEditingArea] =
    useState<Area | null>(null);

  const [form, setForm] =
    useState<AreaForm>(initialForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [filterEstado, setFilterEstado] =
    useState("");


  /* ============================================================
     CARGA
  ============================================================ */

  async function loadAreas() {
    try {
      setLoading(true);
      setError(null);

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
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAreas();
  }, []);


  /* ============================================================
     FILTROS
  ============================================================ */

  const areasFiltradas =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return areas.filter((area) => {
        const matchesSearch =
          !term ||
          area.nombre
            .toLowerCase()
            .includes(term) ||
          (
            area.descripcion ?? ""
          )
            .toLowerCase()
            .includes(term);

        const matchesEstado =
          !filterEstado ||
          (
            filterEstado === "ACTIVO"
              ? area.activo
              : !area.activo
          );

        return (
          matchesSearch &&
          matchesEstado
        );
      });

    }, [
      areas,
      search,
      filterEstado,
    ]);


  /* ============================================================
     FORMULARIO
  ============================================================ */

  function openCreate() {
    setEditingArea(null);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  }


  function openEdit(area: Area) {
    setEditingArea(area);

    setForm({
      nombre: area.nombre,
      descripcion:
        area.descripcion ?? "",
      activo: area.activo,
    });

    setError(null);
    setShowForm(true);
  }


  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingArea(null);
    setForm(initialForm);
    setError(null);
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setError(
        "El nombre del área es obligatorio.",
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        nombre: form.nombre.trim(),
        descripcion:
          form.descripcion.trim(),
        activo: form.activo,
      };

      if (editingArea) {
        await apiPatch<Area>(
          `/estructura/areas/${editingArea.id}/`,
          payload,
        );
      } else {
        await apiPost<Area>(
          "/estructura/areas/",
          payload,
        );
      }

      await loadAreas();

      setShowForm(false);
      setEditingArea(null);
      setForm(initialForm);

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo guardar el área. Revisá que no exista otra con el mismo nombre.",
      );

    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(
    area: Area,
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar el área "${area.nombre}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await apiDelete(
        `/estructura/areas/${area.id}/`,
      );

      await loadAreas();

    } catch (err) {
      console.error(err);

      setError(
        "No se pudo eliminar el área. Puede estar siendo utilizada por algún sector.",
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

                  Áreas

                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

                  Organizá las áreas principales del hospital
                  para luego relacionarlas con sectores,
                  equipos y activos.

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

                Nueva área

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

                Encontrá rápidamente un área.

              </p>

            </div>


            <div className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">

              {areasFiltradas.length} resultado(s)

            </div>

          </div>


          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px]">

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
                placeholder="Buscar área..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 py-2.5 pl-10 pr-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:text-sm"
              />

            </div>


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
                Activas
              </option>

              <option value="INACTIVO">
                Inactivas
              </option>

            </select>

          </div>

        </section>


        {/* ======================================================
            CONTADOR MOBILE
        ====================================================== */}

        <div className="mb-3 sm:hidden">

          <span className="text-sm font-medium text-slate-500">

            {areasFiltradas.length === 1
              ? "1 área encontrada"
              : `${areasFiltradas.length} áreas encontradas`}

          </span>

        </div>


        {/* ======================================================
            ESTADOS
        ====================================================== */}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

            <p className="mt-4 text-sm text-slate-500">
              Cargando áreas...
            </p>

          </div>

        ) : areasFiltradas.length === 0 ? (

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
                <path d="M3 21h18" />
                <path d="M6 21V7l6-4 6 4v14" />
                <path d="M9 9h.01" />
                <path d="M15 9h.01" />
                <path d="M9 13h.01" />
                <path d="M15 13h.01" />
                <path d="M9 17h.01" />
                <path d="M15 17h.01" />
              </svg>

            </div>

            <h2 className="mt-4 font-semibold text-slate-800">

              No se encontraron áreas

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Modificá los filtros o registrá
              una nueva área.

            </p>

          </div>

        ) : (

          <>


            {/* ==================================================
                MOBILE
            ================================================== */}

            <div className="space-y-4 md:hidden">

              {areasFiltradas.map(
                (area) => (

                <article
                  key={area.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />


                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <h2 className="break-words text-lg font-semibold leading-6 text-slate-900">

                          {area.nombre}

                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">

                          {area.descripcion ||
                            "Sin descripción registrada."}

                        </p>

                      </div>


                      <span
                        className={
                          area.activo
                            ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100"
                            : "shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
                        }
                      >

                        {area.activo
                          ? "Activo"
                          : "Inactivo"}

                      </span>

                    </div>


                    <div className="mt-5 grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(area)
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
                          handleDelete(area)
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

                    {areasFiltradas.map(
                      (area) => (

                      <tr
                        key={area.id}
                        className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">

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
                                <path d="M3 21h18" />
                                <path d="M6 21V7l6-4 6 4v14" />
                              </svg>

                            </div>


                            <span className="font-semibold text-slate-900">

                              {area.nombre}

                            </span>

                          </div>

                        </td>


                        <td className="max-w-md px-5 py-4 text-slate-600">

                          {area.descripcion || "—"}

                        </td>


                        <td className="whitespace-nowrap px-5 py-4">

                          <span
                            className={
                              area.activo
                                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                            }
                          >

                            {area.activo
                              ? "Activo"
                              : "Inactivo"}

                          </span>

                        </td>


                        <td className="whitespace-nowrap px-5 py-4 text-right">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(area)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(area)
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

                    {editingArea
                      ? "Editar área"
                      : "Nueva área"}

                  </h2>

                  <p className="mt-1 text-sm text-slate-500">

                    {editingArea
                      ? "Actualizá los datos del área seleccionada."
                      : "Creá una nueva área para organizar la estructura del hospital."}

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
                    placeholder="Ej.: Administración"
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

                      Área activa

                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">

                      Las áreas inactivas permanecen
                      registradas, pero no se utilizarán
                      para nuevas asignaciones.

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
                    disabled={saving}
                    className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {saving
                      ? "Guardando..."
                      : editingArea
                        ? "Guardar cambios"
                        : "Crear área"}

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