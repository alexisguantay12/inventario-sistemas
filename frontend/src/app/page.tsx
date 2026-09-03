export default function Home() {
  return (
    <div className="p-8">
      <div className="mb-10">
        <p className="text-sm font-medium text-slate-500">
          Sistemas
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Inventario de infraestructura
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Gestión centralizada de equipos, activos y componentes
          informáticos del hospital.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Activos
          </p>

          <p className="mt-2 text-3xl font-semibold">
            —
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Equipos de trabajo
          </p>

          <p className="mt-2 text-3xl font-semibold">
            —
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Componentes disponibles
          </p>

          <p className="mt-2 text-3xl font-semibold">
            —
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            En reparación
          </p>

          <p className="mt-2 text-3xl font-semibold">
            —
          </p>
        </div>
      </div>
    </div>
  );
}