"use client";

import { FormEvent, useEffect, useState } from "react";

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
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingArea, setEditingArea] =
    useState<Area | null>(null);

  const [form, setForm] =
    useState<AreaForm>(initialForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);


  async function loadAreas() {
    try {
      setLoading(true);

      const data = await apiGet<Area[]>(
        "/estructura/areas/",
      );

      setAreas(data);
    } catch {
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
      descripcion: area.descripcion,
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
      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo guardar el área. Revisá que no exista otra con el mismo nombre.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(area: Area) {
    const confirmed = window.confirm(
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


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Áreas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Estructura organizativa del hospital
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 sm:w-auto"
        >
          Nueva área
        </button>
      </div>


      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando áreas...
        </div>
      ) : areas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">
            Todavía no hay áreas cargadas
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Creá la primera área para comenzar
            a organizar la estructura.
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
                {areas.map((area) => (
                  <tr
                    key={area.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {area.nombre}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {area.descripcion || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={
                          area.activo
                            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
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
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(area)
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
                  {editingArea
                    ? "Editar área"
                    : "Nueva área"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingArea
                    ? "Modificá los datos del área seleccionada."
                    : "Completá los datos para crear una nueva área."}
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
                  placeholder="Ej.: Administración"
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
                    Área activa
                  </p>

                  <p className="text-xs text-slate-500">
                    Las áreas inactivas pueden mantenerse
                    registradas sin utilizarse para nuevas
                    asignaciones.
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
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}