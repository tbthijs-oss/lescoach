import Link from "next/link";
import { NoorAvatar } from "@/components/JeroenAvatar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6">
          <NoorAvatar size={120} />
        </div>
        <div className="text-6xl font-bold text-blue-600 mb-2">404</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Deze pagina bestaat niet
        </h1>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Of hij is verplaatst. Geen probleem — ga terug naar de homepage en
          Noor staat klaar.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Naar home
        </Link>
      </div>
    </div>
  );
}
