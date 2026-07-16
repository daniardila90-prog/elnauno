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
        // download: fuerza Content-Disposition: attachment para que el archivo
        // se descargue en vez de renderizarse en el navegador (evita XSS por
        // HTML/SVG malicioso servido desde el dominio de Storage).
        .createSignedUrl(f.storage_path, 60 * 10, { download: f.file_name });
      return { ...f, url: signed?.signedUrl ?? null };
    })
  );

  const conceptoFiles = filesWithUrls.filter((f) => f.kind === "concepto");
  const masterplanFiles = filesWithUrls.filter((f) => f.kind === "masterplan");
  const volumetriaFiles = filesWithUrls.filter((f) => f.kind === "volumetria");
  const organizacionFiles = filesWithUrls.filter((f) => f.kind === "organizacion");
  const proyectoFiles = filesWithUrls.filter((f) => f.kind === "proyecto");

  const fases = (proposal.fases_json ?? {}) as Record<string, number | undefined>;
  const fasesLabels: [string, string][] = [
    ["Anteproyecto", "anteproyecto_semanas"],
    ["Proyecto arquitectónico", "proyecto_semanas"],
    ["Coordinación técnica", "coordinacion_semanas"],
    ["Documentos de construcción", "documentos_semanas"],
  ];

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
          <Section title="Concepto de diseño">
            <Field label="Concepto (una frase)" value={proposal.concepto_frase} />
            <Field label="Desarrollo del concepto" value={proposal.concepto_desarrollo} />
            <FileList files={conceptoFiles} empty="Sin imagen conceptual / moodboard." />
          </Section>

          <Section title="Análisis de sitio y emplazamiento">
            <FileList files={masterplanFiles} empty="Sin plano de implantación (Masterplan)." />
            <Field label="Oportunidades del sitio" value={proposal.sitio_oportunidades} />
          </Section>

          <Section title="Volumetría">
            <Field label="Estrategia volumétrica" value={proposal.volumetria_estrategia} />
            <FileList files={volumetriaFiles} empty="Sin imagen de la estrategia volumétrica." />
            <Field
              label="Organización funcional y circulaciones"
              value={proposal.volumetria_organizacion}
            />
            <FileList files={organizacionFiles} empty="Sin imagen de la organización funcional." />
          </Section>

          <Section title="Materialidad de fachada">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Material principal" value={proposal.fachada_material_principal} />
              <Field label="Material secundario" value={proposal.fachada_material_secundario} />
              <Field label="Acabado / textura" value={proposal.fachada_acabado} />
              <Field label="Carpintería / vidrio" value={proposal.fachada_carpinteria} />
            </div>
            <Field label="Estrategia de materiales" value={proposal.fachada_estrategia} />
            <Field label="Intención de la fachada" value={proposal.fachada_intencion} />
          </Section>

          <Section title="Imagen del proyecto">
            <FileList files={proyectoFiles} empty="Sin perspectiva exterior." />
          </Section>

          <Section title="Fases de diseño">
            <div className="grid grid-cols-2 gap-3">
              {fasesLabels.map(([label, key]) => (
                <Field key={key} label={label} value={fases[key] != null ? `${fases[key]} semanas` : null} />
              ))}
            </div>
            <Field label="Metodología de trabajo" value={proposal.enfoque_trabajo} />
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
