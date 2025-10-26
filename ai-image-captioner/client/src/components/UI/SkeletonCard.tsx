export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
      <div className="aspect-[4/5] w-full bg-white/10 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/5 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}
