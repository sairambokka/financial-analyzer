import { DollarSign } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — animated gradient (hidden on mobile) */}
      <div className="auth-gradient relative hidden w-1/2 items-center justify-center lg:flex">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <DollarSign className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analyzer</h1>
          <p className="mt-2 text-sm text-white/70">
            Understand your spending. Master your finances.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile branded header */}
        <div className="auth-gradient flex items-center gap-2 px-4 py-3 text-white lg:hidden">
          <DollarSign className="h-5 w-5" />
          <span className="text-sm font-semibold">Financial Analyzer</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
