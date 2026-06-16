import CustomSelect from "./CustomSelect";
import {
  getOpcionesMililitros,
  getPlaceholderMililitros,
} from "../functions/pricingDecant";

export default function SelectMililitros({ value, onChange, parfum, direction = "down" }) {
  const opciones = getOpcionesMililitros(parfum);
  const placeholder = getPlaceholderMililitros(parfum);

  return (
    <CustomSelect
      label="Selecciona cantidad (ml)"
      value={value}
      onChange={onChange}
      options={opciones}
      placeholder={placeholder}
      direction={direction}
    />
  );
}
