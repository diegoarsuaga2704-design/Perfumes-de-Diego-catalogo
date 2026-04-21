export default function SelectMililitros({ value, onChange }) {
  const opciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30];

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange?.(null);
      return;
    }
    onChange?.(parseInt(raw));
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="mililitros"
        className="text-sm font-medium text-gray-700 mb-1"
      >
        Selecciona cantidad (ml)
      </label>
      <select
        id="mililitros"
        value={value ?? ""}
        onChange={handleChange}
        className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] transition duration-200"
      >
        <option value="" disabled>
          -- Elige mililitros --
        </option>
        {opciones.map((num) => (
          <option key={num} value={num}>
            {num} ml
          </option>
        ))}
      </select>
    </div>
  );
}