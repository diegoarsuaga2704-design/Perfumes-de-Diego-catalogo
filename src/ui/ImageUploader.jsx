import { useRef, useState } from "react";
import { Upload, Loader2, X, AlertCircle } from "lucide-react";
import supabase from "../services/supabase";

/**
 * Componente para subir una imagen al Storage de Supabase.
 * Acepta drag & drop o click para seleccionar.
 *
 * Props:
 *  - value: URL actual de la imagen (string)
 *  - onChange: función que recibe la nueva URL
 *  - bucket: nombre del bucket (default "perfumsImages")
 */
export default function ImageUploader({
  value,
  onChange,
  bucket = "perfumsImages",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const generateFileName = (originalName) => {
    // Limpia el nombre: lower, sin espacios, sin caracteres raros
    const cleaned = originalName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-");
    // Agrega timestamp para garantizar unicidad
    const ext = cleaned.split(".").pop();
    const base = cleaned.replace(`.${ext}`, "");
    const timestamp = Date.now();
    return `${base}-${timestamp}.${ext}`;
  };

  const handleFile = async (file) => {
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }

    // Validar tamaño (máx 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("La imagen es muy pesada (máx 5 MB).");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fileName = generateFileName(file.name);

      // Subir al bucket
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError("Error al subir. Intenta de nuevo.");
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        onChange?.(urlData.publicUrl);
      } else {
        setError("Imagen subida pero no se obtuvo la URL.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Resetear el input para que pueda seleccionar el mismo archivo de nuevo si quiere
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClickUpload = () => {
    inputRef.current?.click();
  };

  const handleClearImage = () => {
    onChange?.("");
  };

  return (
    <div className="space-y-2">
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Si ya hay imagen */}
      {value ? (
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={value}
              alt="preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
              title="Quitar imagen"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={handleClickUpload}
              disabled={uploading}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Reemplazar imagen
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 break-all">
              URL: {value}
            </p>
          </div>
        </div>
      ) : (
        // Si no hay imagen: zona de drop
        <div
          onClick={handleClickUpload}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-[#A47E3B] bg-amber-50"
              : "border-gray-300 hover:border-[#A47E3B] hover:bg-gray-50"
          } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-[#A47E3B]" />
              <p className="text-sm text-gray-600">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Arrastra una imagen aquí o haz click
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WEBP — máx 5 MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
