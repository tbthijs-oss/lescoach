import { NoorAvatar } from "@/components/JeroenAvatar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <NoorAvatar size={80} />
        </div>
        <div className="mt-4 text-sm text-slate-500">Een ogenblik…</div>
      </div>
    </div>
  );
}
