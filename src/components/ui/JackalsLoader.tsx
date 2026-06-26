export function JackalsLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-32 w-32">
          {/* Spinning ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-jackals-red" />
          {/* Pulsing logo */}
          <img
            src="/brand/logo-transparent.png"
            alt=""
            className="absolute inset-2 h-28 w-28 animate-pulse object-contain"
          />
        </div>
        <p className="animate-pulse text-base font-medium tracking-wide text-zinc-500">
          Loading...
        </p>
      </div>
    </div>
  );
}
