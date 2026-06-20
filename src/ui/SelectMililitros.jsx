import CustomSelect from "./CustomSelect";
import {
  getOpcionesMililitros,
  getPlaceholderMililitros,
} from "../functions/pricingDecant";

export default function SelectMililitros({
  value,
  onChange,
  parfum,
  direction = "down",
  variant = "default",
  pulse = false,
}) {
  const opciones = getOpcionesMililitros(parfum);
  const placeholder = getPlaceholderMililitros(parfum);
  const esCta = variant === "cta";

  return (
    <CustomSelect
      label={esCta ? undefined : "Selecciona cantidad (ml)"}
      value={value}
      onChange={onChange}
      options={opciones}
      placeholder={esCta ? "🛒 Elige los mililitros" : placeholder}
      direction={direction}
      variant={variant}
      pulse={pulse}
    />
  );
}
