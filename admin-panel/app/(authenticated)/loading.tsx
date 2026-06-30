export default function AuthenticatedLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-4">
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-3/4 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
