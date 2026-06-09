'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

import { AuthField } from '@/components/auth/auth-field';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useLogin } from '@/lib/auth/hooks';
import { safeNext } from '@/lib/auth/redirect';
import { loginSchema, type LoginValues } from '@/lib/auth/schemas';
import { applyApiErrors } from '@/lib/form';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  // mutateAsync + try/catch: success → navigate; failure → map 422 onto fields.
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      // Back to wherever they came from (e.g. an event page) so it re-renders
      // with the cookie and refetches personalised data — no manual reload.
      const next = safeNext(
        new URLSearchParams(window.location.search).get('next'),
      );
      router.replace(next);
      router.refresh();
    } catch (error) {
      applyApiErrors(error, form.setError, ['email', 'password']);
    }
  });

  return (
    <AuthLayout
      poster={
        <>
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/80">
            Eventino
          </div>
          <div className="font-display text-[clamp(2.4rem,4.5vw,4rem)] uppercase leading-[0.9]">
            Don’t
            <br />
            miss
            <br />
            out.
          </div>
          <p className="max-w-[30ch] text-sm text-white/85">
            RSVP to the best events in town — as a guest or with an account.
          </p>
        </>
      }
    >
      <div>
        <h1 className="font-display text-[2.2rem] uppercase leading-[0.95]">
          Welcome
          <br />
          back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to manage your events
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {errors.root ? (
          <p
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {errors.root.message}
          </p>
        ) : null}

        <AuthField label="Email" error={errors.email?.message}>
          <Mail className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            {...form.register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="flex-1 bg-transparent py-3 text-[0.92rem] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </AuthField>

        <AuthField label="Password" error={errors.password?.message}>
          <Lock className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            {...form.register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="flex-1 bg-transparent py-3 text-[0.92rem] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground transition hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </AuthField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold text-primary-foreground transition hover:shadow-[0_0_0_1px_rgba(205,255,58,0.25),0_10px_40px_-8px_rgba(205,255,58,0.35)] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <>
              Log in <ArrowUpRight className="h-[18px] w-[18px]" />
            </>
          )}
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="text-primary">
          Sign up →
        </Link>
      </p>
    </AuthLayout>
  );
}
