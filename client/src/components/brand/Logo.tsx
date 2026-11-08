/**
 * Brand mark used across the welcome screen, splash and auth prompts.
 * Mirrors `public/favicon.svg` (green rounded square, white coin, light-green
 * ring) so the in-app logo and the installed app icon stay identical.
 */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="BoA Micro Finance"
      className={className}
    >
      <rect width="32" height="32" rx="7" className="fill-primary-700" />
      <circle cx="16" cy="14" r="8" className="fill-white" />
      <circle cx="16" cy="14" r="5" fill="none" strokeWidth="2" className="stroke-primary-500" />
    </svg>
  );
}

export function BrandLockup({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span className="text-left leading-tight">
        <span className="block text-base font-extrabold text-secondary-900">BoA Micro Finance</span>
        <span className="block text-[10px] font-medium uppercase tracking-widest text-primary-600">
          Mobile loans
        </span>
      </span>
    </span>
  );
}
