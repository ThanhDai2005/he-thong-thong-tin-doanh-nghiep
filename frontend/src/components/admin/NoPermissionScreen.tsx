import AdminHeader, { type BreadcrumbItemType } from "./AdminHeader";

interface NoPermissionScreenProps {
  breadcrumbItems: BreadcrumbItemType[];
}

const NoPermissionScreen = ({ breadcrumbItems }: NoPermissionScreenProps) => {
  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
      <AdminHeader items={breadcrumbItems} />
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600">
            Bạn không có quyền xem trang này. Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoPermissionScreen;
