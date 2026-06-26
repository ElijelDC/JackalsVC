export function JackalsLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          {/* Spinning ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-jackals-red" />
          {/* Pulsing logo */}
          <img
            src="/brand/logo-transparent.png"
            alt=""
            className="absolute inset-1 h-14 w-14 animate-pulse object-contain"
          />
        </div>
        <p className="animate-pulse text-sm font-medium tracking-wide text-zinc-500">
          Loading...
        </p>
      </div>
    </div>
  );
}
