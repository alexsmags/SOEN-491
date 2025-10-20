type Props = {
  caption: string | null;
};

export default function CaptionOutput({ caption }: Props) {
  if (!caption) return null;

  return (
    <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
      <h3 className="text-lg font-semibold mb-2">Generated Caption</h3>
      <p className="text-white/80 text-sm">{caption}</p>
    </div>
  );
}
