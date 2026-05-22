# Perfumes de Diego — Contexto del proyecto

## Stack
React 19 + Vite 7 + Tailwind 3 + React Router 7 + Supabase + Vercel

## Quién soy
Diego, CEO. Trabajo solo. Una pregunta máxima por mensaje. Doy formato exacto: "Archivo X. Busca Y. Reemplázalo por Z." NUNCA frases vagas. Sin disculpas largas. Estudio el archivo ANTES de proponer cambios.

## Sistemas
- **Sistema A (catálogo público):** /, /botellas, /decants, /casa/:slug, /sobre-mi. Admin en /admin/perfumes.
- **Sistema B (admin financiero interno):** /admin/pedidos-botellas, /admin/decants-parciales, /admin/tandas, /admin/finanzas, /admin/clientes, /admin/proveedores.

## Convenciones técnicas
- Wrapper de rutas admin: `ProtectedAdminRoute` (NO RequireAuth).
- Import de Supabase: `import supabase from "../services/supabase"` (default export, ruta /services no /lib).
- parfums."botellasDisponibles" usa camelCase → comillas dobles en SQL.
- parfums.stock boolean: true=botella, false=decant.
- En supabase-js usar `.order('col', { ascending: false, nullsFirst: false })`.
- CSS .no-spinner solo aplicado a clase específica, NUNCA global.
- Ctrl+Z global filtra si tag === INPUT/TEXTAREA/SELECT.
- Drag-to-mark requiere onMouseDown con e.preventDefault().
- En inputs date de Supabase, parsear con `+ "T12:00:00"` para evitar bug de timezone UTC.

## Tablas Supabase principales
- parfums, avisos_stock (público)
- proveedores, clientes_admin (con es_propio para Diego)
- pedidos_botellas (con disponible_stock checkbox manual, trigger pedidos_botellas_sync_stock)
- decants_parciales (id, fecha, cliente_id, cliente_texto, monto, notas, created_at)
- tandas, tanda_participantes (con campo notas), tanda_pagos (monto + monto_pagado)

## Archivos clave
- src/pages/AdminPanel.jsx, AdminPedidosBotellas.jsx, AdminDecantsParciales.jsx, AdminTandasList.jsx, AdminTandaDetalle.jsx, AdminFinanzas.jsx, SobreMi.jsx
- src/functions/getPedidosBotellas.js, getDecantsParciales.js, getTandas.js, getFinanzas.js, getProveedores.js, getClientesAdmin.js, getParfumsAdmin.js
- src/ui/ClienteCombobox.jsx, PerfumeCombobox.jsx, ProveedorCombobox.jsx
- src/services/supabase.js

## Reglas operativas para Claude
- Cualquier cambio de código: dar instrucción tipo "Archivo X. Busca Y. Reemplázalo por Z" — formato exacto, nunca vago.
- Siempre incluir un bloque "Cómo probar" al final con pasos concretos: comando a correr, URL a abrir, qué tocar, qué dato debería aparecer, cómo confirmar persistencia.
- Si hay BD involucrada, incluir SELECT de verificación.
- Verificar archivo existente ANTES de proponer cambio.
- Mi nombre como cliente en pedidos_botellas = es_propio=true.
- WhatsApp: +52 221 203 4647.
- Tono honesto, sin hipérboles ni clichés.