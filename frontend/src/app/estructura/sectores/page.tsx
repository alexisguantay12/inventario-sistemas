"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api";

import type { Area, Sector } from "@/types";


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
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingSector, setEditingSector] =
    useState<Sector | null>(null);

  const [form, setForm] =
    useState<SectorForm>(initialForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);


  async function loadSectores() {
    try {
      setLoading(true);

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

      setAreas(
        data.filter((area) => area.activo),
      );
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


  function openCreate() {
    setEditingSector(null);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  }


  function openEdit(sector: Sector) {
    setEditingSector(sector);

    setForm({
      area: sector.area,
      nombre: sector.nombre,
      descripcion: sector.descripcion,
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
      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo guardar el sector. Revisá que no exista otro sector con el mismo nombre dentro del área.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(sector: Sector) {
    const confirmed = window.confirm(
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


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Sectores
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sectores pertenecientes a cada área
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 sm:w-auto"
        >
          Nuevo sector
        </button>
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando sectores...
        </div>
      ) : sectores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">
            Todavía no hay sectores cargados
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Creá un sector y asignalo a un área.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">
                    Área
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Sector
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Descripción
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Estado
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {sectores.map((sector) => (
                  <tr
                    key={sector.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {sector.area_nombre}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {sector.nombre}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {sector.descripcion || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={
                          sector.activo
                            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
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
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(sector)
                          }
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
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
      )}


      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingSector
                    ? "Editar sector"
                    : "Nuevo sector"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingSector
                    ? "Modificá los datos del sector seleccionado."
                    : "Asigná el sector a un área del hospital."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>


            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Área
                </label>

                <select
                  value={form.area}
                  disabled={loadingAreas}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      area: event.target.value
                        ? Number(event.target.value)
                        : "",
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    Seleccionar área
                  </option>

                  {areas.map((area) => (
                    <option
                      key={area.id}
                      value={area.id}
                    >
                      {area.nombre}
                    </option>
                  ))}
                </select>

                {!loadingAreas &&
                  areas.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No hay áreas activas disponibles.
                      Primero tenés que crear un área.
                    </p>
                  )}
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  placeholder="Ej.: Facturación"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  placeholder="Descripción opcional"
                />
              </div>


              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
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
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium">
                    Sector activo
                  </p>

                  <p className="text-xs text-slate-500">
                    Los sectores inactivos se mantienen
                    registrados, pero no deberían utilizarse
                    para nuevas asignaciones.
                  </p>
                </div>
              </label>


              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingAreas ||
                    areas.length === 0
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}