-- Registro de la autorización de tratamiento de datos personales (Ley 1581 de
-- 2012). Al enviar, la firma debe autorizar el tratamiento; aquí se guarda la
-- prueba: cuándo autorizó y qué versión del aviso aceptó.
--
-- Columnas NULLABLE a propósito: son retrocompatibles. El código anterior, que
-- no las conoce, sigue funcionando; el nuevo las rellena en cada envío.

alter table public.identification_forms
  add column if not exists data_consent_at timestamptz,
  add column if not exists data_consent_version text;
