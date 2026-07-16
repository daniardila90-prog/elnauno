import type { Metadata } from "next";
import { CONSENT_VERSION } from "@/lib/validation/wizard";

export const metadata: Metadata = {
  title: "Aviso de privacidad · Selección arquitectónica El Nauno",
  robots: { index: false },
};

/**
 * Aviso de privacidad / política de tratamiento de datos (ARCASTI LIMITADA).
 * Cubre el mecanismo exigido por la Ley 1581 de 2012. Se recomienda que un
 * abogado revise y apruebe el texto final; si el contenido cambia, subir la
 * versión en CONSENT_VERSION (src/lib/validation/wizard.ts).
 */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-forest">
      <h1 className="text-2xl font-light">Aviso de privacidad y tratamiento de datos personales</h1>
      <p className="mt-2 text-sm text-forest/50">
        ARCASTI LIMITADA · Selección arquitectónica Hotel El Nauno · Versión {CONSENT_VERSION}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-forest/80">
        <section>
          <h2 className="font-semibold text-forest">1. Responsable del tratamiento</h2>
          <p className="mt-1">
            ARCASTI LIMITADA, identificada con NIT 800.208.249-3, con domicilio en Calle 43 # 35-44,
            Bucaramanga, Colombia, es responsable del tratamiento de los datos personales recogidos
            en este sitio. Contacto para asuntos de datos personales: info@arcasti.co.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">2. Datos que se recogen</h2>
          <p className="mt-1">
            Del contacto de cada firma participante: nombre de la firma, nombre de contacto, correo
            electrónico y teléfono. Además, el contenido de la propuesta y los archivos que la firma
            decida subir.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">3. Finalidad</h2>
          <p className="mt-1">
            Gestionar la participación de la firma en la selección arquitectónica del Hotel El Nauno:
            recibir y evaluar propuestas de forma anónima, comunicar resultados y contactar a la
            firma seleccionada. Los datos de identidad se mantienen sellados y separados del contenido
            durante la evaluación anónima, y solo se revelan al cierre del proceso.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">4. Encargados y terceros</h2>
          <p className="mt-1">
            La información se almacena en la infraestructura de <strong>Supabase</strong> (base de
            datos y archivos) y <strong>Vercel</strong> (alojamiento de la aplicación), que actúan
            como encargados del tratamiento. No se comparten los datos con otros terceros ni se usan
            con fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">5. Derechos del titular</h2>
          <p className="mt-1">
            Conforme a la Ley 1581 de 2012, el titular puede conocer, actualizar, rectificar y
            suprimir sus datos, así como revocar la autorización. Para ejercer estos derechos, escriba
            a info@arcasti.co. Su solicitud se atenderá en los términos y plazos que establece la
            normativa colombiana de protección de datos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">6. Conservación</h2>
          <p className="mt-1">
            Los datos se conservan durante el desarrollo del proceso y por seis (6) meses después de
            su cierre; vencido ese plazo se eliminan o anonimizan, salvo obligación legal de
            conservarlos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-forest">7. Autorización</h2>
          <p className="mt-1">
            Al marcar la casilla de autorización en el formulario de identificación, la firma otorga
            su consentimiento previo, expreso e informado para el tratamiento aquí descrito. Se
            registra la fecha y la versión del aviso aceptado.
          </p>
        </section>
      </div>
    </main>
  );
}
