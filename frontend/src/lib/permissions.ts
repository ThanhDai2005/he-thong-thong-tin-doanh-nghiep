import type { User } from "@/types/user";

export const hasPermission = (
  user: User | null,
  requiredPermissions: string | string[],
): boolean => {
  if (!user || !user.roleId || !user.roleId.permissions) {
    return false;
  }

  const userPerms = user?.roleId?.permissions;

  if (Array.isArray(requiredPermissions)) {
    return requiredPermissions.some((perm) => userPerms.includes(perm));
  }

  return userPerms.includes(requiredPermissions);
};
