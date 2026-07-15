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
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "NaunoSeleccion2026!";

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
    console.log(`Usuario admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
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
    sitio_condicionantes: "Retiro ambiental de la línea de aguas máximas, pendiente pronunciada, POT municipal.",
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
  },
  {
    proposal_code: "NAUNO-DEMO02",
    status: "submitted",
    concepto_frase: "La arquitectura desaparece ante el paisaje.",
    concepto_desarrollo:
      "Cubiertas verdes y grandes aberturas que disuelven el límite entre interior y exterior; cada espacio es un mirador sobre el agua.",
    sitio_oportunidades: "Frente de agua amplio, topografía aprovechable para terrazas.",
    sitio_condicionantes: "Tres quebradas menores a proteger, primera línea de árboles a conservar.",
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
    sitio_condicionantes: "En desarrollo.",
    volumetria_estrategia: "En desarrollo.",
    volumetria_organizacion: "En desarrollo.",
    fachada_material_principal: "Por definir.",
    fachada_estrategia: "En desarrollo.",
    fachada_intencion: "En desarrollo.",
    fases_json: {},
    identification: null,
  },
];

async function seedProposals() {
  for (const sample of SAMPLE_PROPOSALS) {
    const { identification, ...proposalData } = sample;

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
  }
  console.log(
    "\nNota: las propuestas de ejemplo no tienen archivos adjuntos (Master Plan / Referentes)." +
      " Sirven para probar login, dashboard, detalle y la rúbrica de evaluación — para probar la" +
      " subida de archivos, envía una propuesta real desde /seleccion/participar."
  );
}

async function main() {
  const adminId = await ensureAdmin();
  await seedProposals();
  console.log("\nSeed completo.");
  console.log(`Login socios → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Admin user_id: ${adminId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
