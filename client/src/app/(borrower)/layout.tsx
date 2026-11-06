import { AppBoot } from "@/components/AppBoot";

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-backdrop">
      <div className="app-shell">
        <AppBoot>{children}</AppBoot>
      </div>
    </div>
  );
}
