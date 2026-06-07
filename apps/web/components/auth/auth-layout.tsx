import type { ReactNode } from 'react';

/**
 * Split auth shell (poster | form), per the design framework §8 "Login".
 * Presentational only — pages pass the gradient poster and the form as slots.
 */
export function AuthLayout({
  poster,
  children,
}: {
  poster: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[1180px] px-7 py-14">
      <div className="grid min-h-[540px] overflow-hidden rounded-[24px] border border-border-strong md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-between gap-8 bg-[linear-gradient(150deg,#ff3d8b,#7b5cff_92%)] p-10 text-white">
          {poster}
        </div>
        <div className="flex flex-col justify-center gap-4 bg-card p-7 md:p-[clamp(28px,4vw,54px)]">
          {children}
        </div>
      </div>
    </main>
  );
}
