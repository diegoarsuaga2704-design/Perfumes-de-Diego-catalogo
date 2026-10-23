/**
 * Campo "Descripción" (tu reseña del perfume) en el admin de perfumes.
 * Se usa en AdminPerfumeCreate y AdminPerfumeEdit.
 */
export default function CamposSeoPerfume({ form, onChange, inputClass }) {
  const largo = (form.descripcion || "").trim().length;

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Descripción
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Tu reseña del perfume. Se muestra en la página y es lo que Google lee
        como contenido propio. Separa párrafos con una línea en blanco.
      </p>
      <textarea
        value={form.descripcion || ""}
        onChange={(e) => onChange("descripcion", e.target.value)}
        rows="8"
        className={inputClass}
      />
      <p
        className={`text-xs mt-1 ${
          largo > 0 && largo < 300 ? "text-amber-600" : "text-gray-400"
        }`}
      >
        {largo} caracteres
        {largo > 0 && largo < 300 ? " · recomendado: 300 o más" : ""}
      </p>
    </div>
  );
}
