import { useState, useEffect } from "react";

const MENSAJES = [
  "Envío GRATIS en decants desde $1,950",
  "Prueba desde 1 ml antes de tu botella completa",
  "Envíos a todo México con DHL",
];

function TopBanner() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((prev) => (prev + 1) % MENSAJES.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#A47E3B] text-white text-center text-[11px] sm:text-base px-3 min-h-[2.25rem] sm:min-h-[3rem] flex items-center justify-center">
      <p
        className={`font-medium transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="mr-1">✅</span>
        {MENSAJES[i]}
      </p>
    </div>
  );
}

export default TopBanner;
