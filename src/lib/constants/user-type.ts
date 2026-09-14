/** Values for `user.user_type`. NULL in DB = regular user. */
export const USER_TYPE_ART_FIGHT = 'art-fight';

export function isArtFightUser(userType?: string | null): boolean {
  return userType === USER_TYPE_ART_FIGHT;
}

export function buildArtFightRegisterHref(returnPath: string): string {
  const params = new URLSearchParams({
    callbackUrl: returnPath,
    userType: USER_TYPE_ART_FIGHT,
  });
  return `/auth/register?${params.toString()}`;
}

export const PENDING_USER_TYPE_STORAGE_KEY = 'ptu_pending_user_type';
