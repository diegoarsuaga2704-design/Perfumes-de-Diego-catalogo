import { getBadgeEstatus } from "../functions/getBadgeEstatus";

function BadgesEstatus({ parfum }) {
  const badge = getBadgeEstatus(parfum);
  if (!badge) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span
        className={`${badge.color} text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-sm`}
      >
        {badge.texto}
      </span>
    </div>
  );
}

export default BadgesEstatus;
