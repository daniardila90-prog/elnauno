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
    master_plan_notes:
      "El proyecto se implanta en la ladera norte del lote, retirado de la línea de aguas máximas del embalse, con acceso principal desde la vía existente y un recorrido escalonado que sigue la topografía natural.",
    referentes_narrativa:
      "Buscamos una arquitectura que se sienta como una extensión del bosque: materiales cálidos, luz filtrada por la vegetación, y espacios que se abren progresivamente hacia el agua. El huésped debe sentir que entra a un refugio, no a un edificio.",
    memoria_conceptual:
      "La lectura del lote parte de sus tres condiciones dominantes: la pendiente hacia el embalse, la vegetación densa en el borde de agua y las visuales panorámicas hacia las montañas. El master plan organiza el programa en tres bandas paralelas a las curvas de nivel — llegada y servicios en la cota alta, habitaciones escalonadas en la cota media, y amenidades y muelle en la cota baja junto al agua — minimizando el movimiento de tierra y preservando los árboles existentes en el borde de la ribera.",
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
    master_plan_notes:
      "Implantación en forma de peine perpendicular a la orilla, con un eje central peatonal que conecta el acceso con el muelle, y volúmenes de habitaciones organizados en abanico para maximizar las visuales al embalse.",
    referentes_narrativa:
      "La arquitectura debe desaparecer ante el paisaje: cubiertas verdes, fachadas en madera y piedra local, y grandes aberturas que disuelven el límite entre interior y exterior. Cada habitación es un mirador privado sobre el agua.",
    memoria_conceptual:
      "Partimos de proteger las tres quebradas menores que cruzan el lote y de mantener libre la primera línea de árboles frente al embalse. El programa se organiza en un eje longitudinal que reduce la huella de circulaciones vehiculares al mínimo indispensable, dejando el resto del lote como zona de conservación activa y senderos peatonales.",
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
    master_plan_notes: "Propuesta en desarrollo — borrador de trabajo.",
    referentes_narrativa: "En desarrollo.",
    memoria_conceptual: "En desarrollo.",
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
