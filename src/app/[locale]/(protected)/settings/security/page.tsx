import { DeleteAccountCard } from '@/components/settings/security/delete-account-card';
import { PasswordCardWrapper } from '@/components/settings/security/password-card-wrapper';
import { websiteConfig } from '@/config/website';

export default function SecurityPage() {
  const credentialLoginEnabled = websiteConfig.auth.enableCredentialLogin;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
      {credentialLoginEnabled && <PasswordCardWrapper />}
      <DeleteAccountCard />
    </div>
  );
}
