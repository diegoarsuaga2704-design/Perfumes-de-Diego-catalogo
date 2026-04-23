import { useNavigate } from "react-router-dom";
import ComoFunciona from "../ui/ComoFunciona";
import HomeBrand from "../ui/HomeBrand";
import CTAWhatsApp from "../ui/CTAWhatsApp";

function Prehome() {
  const navigate = useNavigate();

  const collections = [
    {
      image:
        "https://filipposorcinelli.com/cdn/shop/files/slide-bn-FIlReli-desktop.jpg?v=1707475834&width=1680",
      title: "Decants",
      description:
        "Prueba tus perfumes favoritos antes de comprar el frasco completo.",
    },
    {
      image:
        "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/bestseller.jpeg",
      title: "Mejor vendidos",
      description: "Los favoritos de nuestros clientes.",
    },
    {
      image: "https://fraguru.com/himg/o.gxxUAHYdeV7.jpg",
      title: "Botellas completas y parciales",
      description: "Perfumes sellados y parciales disponibles.",
    },
  ];

  const handleClick = (store) => {
    if (store === "Botellas completas y parciales") {
      navigate("/home", { state: { mode: "stock" } });
    } else if (store === "Decants") {
      navigate("/home", { state: { mode: "decants" } });
    } else if (store === "Mejor vendidos") {
      navigate("/best-sellers");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="bg-gray-100">
      <div className="text-[#A47E3B] text-center font-extrabold sm:text-3xl text-2xl px-14 py-4 subpixel-antialiased ">
        Compra tus perfumes favoritos.
      </div>
      <div className="grid gap-6 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 max-w-6xl mx-auto p-6">
        {collections.map((item, index) => (
          <div key={index} onClick={() => handleClick(item.title)}>
            <HomeBrand
              image={item.image}
              title={item.title}
              description={item.description}
            />
          </div>
        ))}
      </div>
      <ComoFunciona />

      <div className="bg-white py-8 px-6 text-center border-t border-gray-100">
        <p className="text-gray-700 text-sm sm:text-base mb-2">
          ¿Tienes dudas antes de comprar?
        </p>
        <a
          href="/faqs"
          className="inline-block text-[#A47E3B] font-semibold text-sm sm:text-base hover:underline"
        >
          Revisa nuestras preguntas frecuentes →
        </a>
      </div>

      <CTAWhatsApp />
    </div>
  );
}

export default Prehome;
