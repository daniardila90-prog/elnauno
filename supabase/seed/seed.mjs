// Seed de datos de prueba: 1 socio/admin + 3 propuestas de ejemplo (2 enviadas, 1 en borrador).
// Uso: node --env-file=.env.local supabase/seed/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "socios@elnauno.co";
// La contraseña NUNCA se hardcodea: debe venir de una variable de entorno.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error(
    "Falta SEED_ADMIN_PASSWORD en el entorno. Ejecuta con:\n" +
      "  SEED_ADMIN_PASSWORD='una-contraseña-fuerte' node --env-file=.env.local supabase/seed/seed.mjs"
  );
  process.exit(1);
}

async function ensureAdmin() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing.users.find((u) => u.email === ADMIN_EMAIL);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`Usuario admin creado: ${ADMIN_EMAIL} (contraseña tomada de SEED_ADMIN_PASSWORD).`);
  } else {
    console.log(`Usuario admin ya existía: ${ADMIN_EMAIL}`);
  }

  const { error: adminInsertError } = await supabase
    .from("admins")
    .upsert({ user_id: user.id, full_name: "Socios El Nauno" }, { onConflict: "user_id" });
  if (adminInsertError) throw adminInsertError;

  return user.id;
}

const SAMPLE_PROPOSALS = [
  {
    proposal_code: "NAUNO-DEMO01",
    status: "submitted",
    concepto_frase: "Un volumen que traduce el paisaje local en una fachada viva.",
    concepto_desarrollo:
      "El anteproyecto se piensa como una extensión del bosque: materiales cálidos, luz filtrada por la vegetación y espacios que se abren progresivamente hacia el agua.",
    sitio_oportunidades: "Visuales hacia el embalse, orientación norte-sur, acceso desde la vía existente.",
    volumetria_estrategia:
      "Volumen escalonado que sigue las curvas de nivel; llegada en la cota alta y amenidades hacia el agua.",
    volumetria_organizacion: "Núcleo central de circulación que separa zonas públicas y privadas.",
    fachada_material_principal: "Concreto a la vista",
    fachada_material_secundario: "Madera local",
    fachada_acabado: "Microtexturado mate",
    fachada_carpinteria: "Aluminio negro, vidrio control solar",
    fachada_estrategia:
      "Materiales de bajo mantenimiento que envejecen bien en clima cálido-húmedo y dialogan con la vegetación.",
    fachada_intencion: "Una fachada que se difumina entre los árboles.",
    fases_json: { anteproyecto_semanas: 6, proyecto_semanas: 10, coordinacion_semanas: 6, documentos_semanas: 8 },
    enfoque_trabajo: "Equipo integrado con coordinación BIM desde el anteproyecto.",
    identification: {
      firm_name: "Taller Cerro y Piedra",
      contact_name: "Laura Gómez",
      email: "laura@tallercerroypiedra.co",
      phone: "3001234567",
    },
    // Adjuntos de prueba tomados de las imágenes reales del sitio, para poder
    // verificar el dossier en PDF con archivos de verdad.
    files: [
      { kind: "concepto", source: "public/images/entorno-panoramica.jpg" },
      { kind: "masterplan", source: "generated:masterplan.pdf" },
      { kind: "volumetria", source: "public/images/terreno-aereo-1.jpg" },
      { kind: "organizacion", source: "public/images/terreno-aereo-2.jpg" },
      { kind: "proyecto", source: "public/images/hero-embalse.jpg" },
      { kind: "proyecto", source: "public/images/logo-negro-icon.png" },
    ],
  },
  {
    proposal_code: "NAUNO-DEMO02",
    status: "submitted",
    concepto_frase: "La arquitectura desaparece ante el paisaje.",
    concepto_desarrollo:
      "Cubiertas verdes y grandes aberturas que disuelven el límite entre interior y exterior; cada espacio es un mirador sobre el agua.",
    sitio_oportunidades: "Frente de agua amplio, topografía aprovechable para terrazas.",
    volumetria_estrategia: "Peine perpendicular a la orilla con eje peatonal central hacia el muelle.",
    volumetria_organizacion: "Circulación vehicular reducida al mínimo; el resto del lote como conservación activa.",
    fachada_material_principal: "Piedra local",
    fachada_material_secundario: "Madera",
    fachada_acabado: "Aparejo rústico",
    fachada_carpinteria: "Perfilería mínima, vidrio de piso a techo",
    fachada_estrategia: "Materiales del lugar que reducen huella de transporte y se integran al entorno.",
    fachada_intencion: "Una fachada que enmarca el agua desde cada habitación.",
    fases_json: { anteproyecto_semanas: 8, proyecto_semanas: 12, coordinacion_semanas: 8, documentos_semanas: 10 },
    enfoque_trabajo: "Metodología por fases con entregables validados en cada etapa.",
    identification: {
      firm_name: "Estudio Ladera",
      contact_name: "Carlos Restrepo",
      email: "carlos@estudioladera.co",
      phone: "3109876543",
    },
  },
  {
    proposal_code: "NAUNO-DEMO03",
    status: "draft",
    concepto_frase: "Propuesta en desarrollo.",
    concepto_desarrollo: "Borrador de trabajo.",
    sitio_oportunidades: "En desarrollo.",
    volumetria_estrategia: "En desarrollo.",
    volumetria_organizacion: "En desarrollo.",
    fachada_material_principal: "Por definir.",
    fachada_estrategia: "En desarrollo.",
    fachada_intencion: "En desarrollo.",
    fases_json: {},
    identification: null,
  },
];

const BUCKET = "seleccion-nauno-files";

/** PDF mínimo generado al vuelo: el repo no trae un masterplan de ejemplo. */
async function makeSampleMasterplanPdf() {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const [n, titulo] of [
    ["1", "Implantacion general"],
    ["2", "Etapa I - unidades licenciadas"],
  ]) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Masterplan de ejemplo - lamina ${n}`, {
      x: 56,
      y: 760,
      size: 16,
      font,
      color: rgb(0.13, 0.18, 0.14),
    });
    page.drawText(titulo, { x: 56, y: 735, size: 11, font, color: rgb(0.45, 0.48, 0.45) });
    page.drawRectangle({
      x: 56,
      y: 200,
      width: 483,
      height: 500,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });
  }
  return Buffer.from(await doc.save());
}

async function uploadSeedFiles(proposalId, files) {
  const { readFile } = await import("node:fs/promises");
  const { randomUUID } = await import("node:crypto");

  for (const file of files) {
    let bytes;
    let fileName;
    if (file.source.startsWith("generated:")) {
      fileName = file.source.slice("generated:".length);
      bytes = await makeSampleMasterplanPdf();
    } else {
      fileName = file.source.split("/").pop();
      bytes = await readFile(file.source);
    }

    const ext = fileName.split(".").pop().toLowerCase();
    const contentType =
      ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
    const storagePath = `${proposalId}/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType });
    if (upErr) throw upErr;

    const { error: rowErr } = await supabase.from("proposal_files").insert({
      proposal_id: proposalId,
      kind: file.kind,
      storage_path: storagePath,
      file_name: fileName,
    });
    if (rowErr) {
      // 23514 = el check constraint no conoce este kind todavía.
      if (rowErr.code === "23514") {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        console.warn(
          `   OMITIDO ${file.kind}: la base aún no acepta este tipo. Aplique la migración 0004.`
        );
        continue;
      }
      throw rowErr;
    }
    console.log(`   adjunto ${file.kind}: ${fileName}`);
  }
}

async function seedProposals() {
  for (const sample of SAMPLE_PROPOSALS) {
    const { identification, files, ...proposalData } = sample;

    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("proposal_code", sample.proposal_code)
      .maybeSingle();
    if (existing) {
      console.log(`Propuesta ${sample.proposal_code} ya existía, se omite.`);
      continue;
    }

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        ...proposalData,
        submitted_at: sample.status === "submitted" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (identification) {
      const { error: idError } = await supabase
        .from("identification_forms")
        .insert({ ...identification, proposal_id: proposal.id });
      if (idError) throw idError;
    }

    console.log(`Propuesta ${sample.proposal_code} creada (${sample.status}).`);
    if (files?.length) await uploadSeedFiles(proposal.id, files);
  }
}

async function main() {
  const adminId = await ensureAdmin();
  await seedProposals();
  console.log("\nSeed completo.");
  console.log(`Login socios → ${ADMIN_EMAIL} (usa la contraseña que definiste en SEED_ADMIN_PASSWORD).`);
  console.log(`Admin user_id: ${adminId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
