export default function FullscreenLoader() {
  return (
    <div
      data-testid="fullscreen-loader-container"
      className="min-h-screen grid place-items-center bg-black text-white/80"
    >
      <div className="animate-pulse text-sm tracking-wide">
        Checking session…
      </div>
    </div>
  );
}
