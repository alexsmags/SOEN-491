import SkeletonCard from "./SkeletonCard";

export default function SkeletonGrid({ count }: { count: number }) {
  return (
    <div role="status" aria-live="polite" className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
