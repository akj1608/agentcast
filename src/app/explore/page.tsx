import { Suspense } from "react";
import ExploreContent from "./ExploreContent";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[var(--color-text-muted)]">Loading…</div>}>
      <ExploreContent />
    </Suspense>
  );
}
