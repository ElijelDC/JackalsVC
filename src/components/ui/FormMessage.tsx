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
