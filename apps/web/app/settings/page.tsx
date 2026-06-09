import type { Metadata } from 'next';

import { ProfileForm } from '@/components/auth/profile-form';

export const metadata: Metadata = { title: 'Edit profile · Eventino' };

export default function SettingsPage() {
  return (
    <main>
      <section className="pt-[54px] pb-24">
        <div className="wrap">
          <div className="eyebrow mb-2">Settings</div>
          <h1 className="anton mb-7 text-[clamp(2rem,5vw,3rem)]">Edit profile</h1>
          <ProfileForm />
        </div>
      </section>
    </main>
  );
}
