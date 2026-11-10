export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-line" />
      <div className="h-64 animate-pulse rounded-3xl bg-line/70" />
    </div>
  );
}
