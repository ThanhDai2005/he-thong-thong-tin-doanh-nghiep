import * as React from "react";
import {
  FileText,
  Home,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Users,
  Utensils,
  Warehouse,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/roleRoutes";

const data = {
  navMain: [
    {
      title: "Quản Lý Món Ăn",
      url: "#",
      icon: Utensils,
      permission: ["categories_view", "products_view"],
      items: [
        {
          title: "Danh mục sản phẩm",
          url: "/admin/product-categories",
          permission: "categories_view",
        },
        {
          title: "Sản phẩm",
          url: "/admin/products",
          permission: "products_view",
        },
      ],
    },
    {
      title: "Quản Lý Phiếu Nhập",
      url: "#",
      icon: Warehouse,
      permission: ["suppliers_view", "stock_receipts_view"],
      items: [
        {
          title: "Nhà cung cấp",
          url: "/admin/suppliers",
          permission: "suppliers_view",
        },
        {
          title: "Phiếu nhập hàng",
          url: "/admin/stock-receipts",
          permission: "stock_receipts_view",
        },
      ],
    },
    {
      title: "Quản Lý Bài Viết",
      url: "#",
      icon: FileText,
      permission: ["blog_categories_view", "blogs_view"],
      items: [
        {
          title: "Danh mục bài viết",
          url: "/admin/blog-categories",
          permission: "blog_categories_view",
        },
        {
          title: "Bài viết",
          url: "/admin/blogs",
          permission: "blogs_view",
        },
      ],
    },
    {
      title: "Quản Lý Khuyến Mãi",
      url: "#",
      icon: Tag,
      permission: [
        "product_promotions_view",
        "order_promotions_view",
        "customer_vouchers_view",
      ],
      items: [
        {
          title: "Khuyến mãi sản phẩm",
          url: "/admin/product-promotions",
          permission: "product_promotions_view",
        },
        {
          title: "Khuyến mãi đơn hàng",
          url: "/admin/order-promotions",
          permission: "order_promotions_view",
        },
        {
          title: "Voucher khách hàng",
          url: "/admin/customer-vouchers",
          permission: "customer_vouchers_view",
        },
      ],
    },
    {
      title: "Quản Lý Tài Khoản",
      url: "#",
      icon: Users,
      permission: ["customers_view", "staffs_view"],
      items: [
        {
          title: "Khách hàng",
          url: "/admin/customers",
          permission: "customers_view",
        },
        {
          title: "Báo cáo khách hàng",
          url: "/admin/customer-report",
          permission: "customers_view",
        },
        {
          title: "Nhân viên",
          url: "/admin/staffs",
          permission: "staffs_view",
        },
      ],
    },
    {
      title: "Quản Lý Đơn Hàng",
      url: "#",
      icon: ShoppingCart,
      permission: "orders_view",
      items: [
        {
          title: "Danh sách đơn hàng",
          url: "/admin/orders",
          permission: "orders_view",
        },
      ],
    },
    {
      title: "Phân Quyền & Vai Trò",
      url: "#",
      icon: ShieldCheck,
      permission: ["roles_permissions", "roles_view"],
      items: [
        {
          title: "Quản lý phân quyền",
          url: "/admin/permissions",
          permission: "roles_permissions",
        },
        {
          title: "Quản lý vai trò",
          url: "/admin/roles",
          permission: "roles_view",
        },
      ],
    },
    {
      title: "Chăm sóc khách hàng",
      url: "#",
      icon: MessageSquare,
      permission: ["chats_view", "reviews_view", "surveys_view"],
      items: [
        {
          title: "Quản lý chat",
          url: "/admin/chats",
          permission: "chats_view",
        },
        {
          title: "Quản lý đánh giá",
          url: "/admin/reviews",
          permission: "reviews_view",
        },
        {
          title: "Quản lý khảo sát",
          url: "/admin/surveys",
          permission: "surveys_view",
        },
      ],
    },
  ],
};

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const location = useLocation();
  const isDashboardActive = location.pathname === "/admin/dashboard";
  const { user } = useAdminAuthStore();

  const filteredNavMain = data.navMain
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const showDashboard = isSuperAdmin(user?.roleId?.title);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/admin/dashboard">
              <div className="flex justify-center items-center">
                <img
                  className="w-[80px] h-[80px] object-cover"
                  src="/logo.webp"
                  alt="Logo Đặc Sản Ba Miền"
                />
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {showDashboard && (
          <SidebarGroup className="pb-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  isActive={isDashboardActive}
                  className={`cursor-pointer transition-all duration-200 hover:bg-sidebar-accent
                    ${isDashboardActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
                    } `}
                >
                  <Link to="/admin/dashboard" className="flex items-center gap-2">
                    <Home className="shrink-0" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};
