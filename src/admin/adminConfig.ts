export const ADMIN_EMAIL =
  'aqiffaroo@gmail.com';

export function isAdminEmail(
  email: string | null | undefined
): boolean {
  return (
    email?.trim().toLowerCase() ===
    ADMIN_EMAIL
  );
}
