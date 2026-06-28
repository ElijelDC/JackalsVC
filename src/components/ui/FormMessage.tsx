export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-400">{message}</p>;
}

export function AlertBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-6 border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-6 border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
      {message}
    </div>
  );
}

export function WarningBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      {message}
    </div>
  );
}
