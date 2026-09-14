import { DeleteAccountCard } from '@/components/settings/security/delete-account-card';
import { PasswordCardWrapper } from '@/components/settings/security/password-card-wrapper';
import { websiteConfig } from '@/config/website';

export default function SecurityPage() {
  const showPasswordColumn = websiteConfig.auth.enableCredentialLogin;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {showPasswordColumn ? <PasswordCardWrapper /> : null}
        <DeleteAccountCard
          className={showPasswordColumn ? undefined : 'md:col-span-2'}
        />
      </div>
    </div>
  );
}
