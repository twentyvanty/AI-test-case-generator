import { Link } from "react-router-dom";

// "← Back to projects"
function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-ink"
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}

export default BackLink;
