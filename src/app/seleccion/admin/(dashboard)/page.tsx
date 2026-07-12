import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, proposal_code, status, submitted_at, created_at")
    .order("created_at", { ascending: false });

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("proposal_id, total_score");

  const avgByProposal = new Map<string, number>();
  if (evaluations) {
    const grouped = new Map<string, number[]>();
    for (const e of evaluations) {
      const list = grouped.get(e.proposal_id) ?? [];
      list.push(e.total_score);
      grouped.set(e.proposal_id, list);
    }
    for (const [id, scores] of grouped) {
      avgByProposal.set(id, scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const list = proposals ?? [];
  const submitted = list.filter((p) => p.status === "submitted");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light text-forest">Propuestas</h1>
        <span className="text-sm text-forest/50">
          {submitted.length} enviadas · {list.length - submitted.length} en borrador
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-taupe/20 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-sand/20 text-left text-xs text-forest/50">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Puntaje promedio</th>
              <th className="px-4 py-3 font-medium">Enviada</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-forest/40">
                  Aún no hay propuestas registradas.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-t border-taupe/10">
                <td className="px-4 py-3 font-medium text-forest">{p.proposal_code}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === "submitted"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-taupe/10 text-forest/50"
                    }`}
                  >
                    {p.status === "submitted" ? "Enviada" : "Borrador"}
                  </span>
                </td>
                <td className="px-4 py-3 text-forest/70">
                  {avgByProposal.has(p.id) ? avgByProposal.get(p.id)!.toFixed(1) : "Sin evaluar"}
                </td>
                <td className="px-4 py-3 text-forest/50">
                  {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString("es-CO") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/seleccion/admin/propuestas/${p.id}`}
                    className="text-sm font-medium text-taupe-dark hover:text-forest"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
