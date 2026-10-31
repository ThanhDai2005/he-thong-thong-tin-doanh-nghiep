/**
 * Map role title → landing page sau khi đăng nhập
 */
export const getRoleLandingPage = (roleTitle: string): string => {
  const routes: Record<string, string> = {
    "Super Admin": "/admin/dashboard",
    "Nhân viên kho": "/admin/stock-receipts",
    "Nhân viên marketing": "/admin/blogs",
    "Nhân viên bán hàng": "/admin/orders",
    "Nhân viên tư vấn": "/admin/chats",
  };

  return routes[roleTitle] || "/admin/dashboard";
};

/**
 * Kiểm tra xem user có phải Super Admin không
 */
export const isSuperAdmin = (roleTitle?: string): boolean => {
  return roleTitle === "Super Admin";
};
