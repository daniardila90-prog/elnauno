import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Evaluation, ProposalFile } from "@/lib/supabase/types";
import EvaluationForm from "@/components/seleccion-admin/EvaluationForm";
import RevealIdentityButton from "@/components/seleccion-admin/RevealIdentityButton";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", id).single();
  if (!proposal) notFound();

  const [{ data: files }, { data: identification }, { data: evaluations }, { data: userData }] =
    await Promise.all([
      supabase.from("proposal_files").select("*").eq("proposal_id", id),
      supabase.from("identification_forms").select("*").eq("proposal_id", id).maybeSingle(),
      supabase.from("evaluations").select("*").eq("proposal_id", id),
      supabase.auth.getUser(),
    ]);

  const currentUserId = userData.user?.id;
  const myEvaluation =
    (evaluations as Evaluation[] | null)?.find((e) => e.evaluator_id === currentUserId) ?? null;

  const filesWithUrls = await Promise.all(
    ((files as ProposalFile[] | null) ?? []).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from("seleccion-nauno-files")
        .createSignedUrl(f.storage_path, 60 * 10);
      return { ...f, url: signed?.signedUrl ?? null };
    })
  );

  const masterPlanFiles = filesWithUrls.filter((f) => f.kind === "master_plan");
  const referenteFiles = filesWithUrls.filter((f) => f.kind === "referente");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-light text-forest">{proposal.proposal_code}</h1>
        <p className="mt-1 text-sm text-forest/50">
          {proposal.status === "submitted" ? "Enviada" : "Borrador"}
          {proposal.submitted_at && ` · ${new Date(proposal.submitted_at).toLocaleString("es-CO")}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Master Plan">
            <FileList files={masterPlanFiles} empty="Sin archivos de Master Plan." />
            <Field label="Notas" value={proposal.master_plan_notes} />
          </Section>

          <Section title="Referentes">
            <FileList files={referenteFiles} empty="Sin imágenes de referentes." />
            <Field
              label="¿Cómo se siente/vibra la arquitectura?"
              value={proposal.referentes_narrativa}
            />
          </Section>

          <Section title="Memoria conceptual">
            <Field label="" value={proposal.memoria_conceptual} />
          </Section>

          <Section title="Identidad">
            {identification ? (
              identification.revealed_at ? (
                <div className="space-y-1 text-sm text-forest/80">
                  <p>
                    <span className="font-medium">Firma:</span> {identification.firm_name}
                  </p>
                  <p>
                    <span className="font-medium">Contacto:</span> {identification.contact_name}
                  </p>
                  <p>
                    <span className="font-medium">Correo:</span> {identification.email}
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span> {identification.phone}
                  </p>
                  <p className="pt-2 text-xs text-forest/40">
                    Revelada el {new Date(identification.revealed_at).toLocaleString("es-CO")}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-forest/50">
                    Identidad oculta mientras dure la evaluación anónima.
                  </p>
                  <div className="mt-3">
                    <RevealIdentityButton proposalId={id} />
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-forest/40">No se ha enviado el formulario de identificación.</p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-taupe/20 bg-white p-5">
            <h2 className="text-sm font-semibold text-forest">Análisis preliminar (IA)</h2>
            <p className="mt-1 text-xs text-forest/50">
              Comparará esta propuesta con las demás y sugerirá qué tan viable es, según los
              criterios que definan los socios.
            </p>
            <button
              type="button"
              disabled
              title="Pendiente de que los socios definan los criterios de viabilidad"
              className="eyebrow mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-taupe/30 bg-sand/20 px-5 py-2.5 text-xs text-forest/40"
            >
              Generar análisis
            </button>
            <p className="mt-2 text-xs text-forest/40">Pendiente de criterios.</p>
          </div>

          <div className="sticky top-6 rounded-xl border border-taupe/20 bg-white p-5">
            <h2 className="text-sm font-semibold text-forest">Rúbrica de evaluación</h2>
            <p className="mt-1 text-xs text-forest/50">
              {(evaluations?.length ?? 0) - (myEvaluation ? 1 : 0)} evaluación(es) registrada(s) de
              otros socios.
            </p>
            <div className="mt-5">
              <EvaluationForm proposalId={id} myEvaluation={myEvaluation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-taupe/20 bg-white p-5">
      <h2 className="text-sm font-semibold text-forest">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      {label && <span className="block text-xs font-medium text-forest/50">{label}</span>}
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-forest/80">{value || "—"}</p>
    </div>
  );
}

function FileList({
  files,
  empty,
}: {
  files: (ProposalFile & { url: string | null })[];
  empty: string;
}) {
  if (files.length === 0) {
    return <p className="text-sm text-forest/40">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-taupe/10">
      {files.map((f) => (
        <li key={f.id} className="flex items-center justify-between py-2 text-sm">
          <span className="text-forest/80">{f.file_name}</span>
          {f.url && (
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="text-taupe-dark hover:text-forest"
            >
              Descargar
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
