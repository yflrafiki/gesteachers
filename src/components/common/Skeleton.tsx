// Base building block — a single pulsing gray rectangle. Plain CSS animation
// (Tailwind's `animate-pulse`, a GPU-cheap opacity tween) — no JS-driven
// animation library, no per-frame work, so it stays cheap even with several
// on screen at once.
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// A small set of reusable shapes built from the primitive above. Each one
// uses only 2-4 blocks (not one block per real row/field) — a loading state
// should never cost more DOM/paint than the real content it's standing in for.

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 flex items-center gap-4">
    <Skeleton className="w-11 h-11 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-12" />
    </div>
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-3 w-72" />
  </div>
);

// A handful of card-shaped blocks — for history/list pages (transfers,
// promotions, applications). `count` stays small by default; these pages
// rarely show more than a few items above the fold anyway.
export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

// A simple table skeleton — fixed at a few rows regardless of how many real
// rows will eventually load, since the point is just to signal "a table is
// coming," not to mirror exact row count.
export const TableSkeleton = ({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <table className="w-full text-sm">
      <tbody className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className="px-4 py-3">
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// A whole dashboard's worth of loading state — header + a row of stat cards.
// Used as the default full-page skeleton since most landing pages share
// this basic shape.
export const DashboardSkeleton = ({ statCount = 4 }: { statCount?: number }) => (
  <div className="space-y-6">
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: statCount }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// A simple form-shaped skeleton — for profile/edit pages.
export const FormSkeleton = ({ fields = 6 }: { fields?: number }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
  </div>
);
