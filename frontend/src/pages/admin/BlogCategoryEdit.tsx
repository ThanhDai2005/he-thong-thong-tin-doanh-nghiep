import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminBlogCategoryStore } from "@/stores/useAdminBlogCategoryStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const BlogCategoryEdit = () => {
  const navigate = useNavigate();
  const { blogCategoryId } = useParams();
  const { user } = useAdminAuthStore();
  const { loading, getBlogCategoryDetail, updateBlogCategory } =
    useAdminBlogCategoryStore();
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });

  const canEdit = hasPermission(user, "blog_categories_edit");

  useEffect(() => {
    loadBlogCategory();
  }, [blogCategoryId]);

  const loadBlogCategory = async () => {
    try {
      setFetching(true);
      if (blogCategoryId) {
        const blogCategory = await getBlogCategoryDetail(blogCategoryId);
        setFormData({
          name: blogCategory.name,
          status: blogCategory.status,
        });
      }
    } catch (error) {
      toast.error("Không thể tải thông tin danh mục");
      navigate("/admin/blog-categories");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      await updateBlogCategory(blogCategoryId!, formData);
      navigate("/admin/blog-categories");
    } catch (error) {
      // Error already handled in store
    }
  };

  if (fetching) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý danh mục bài viết",
            href: "/admin/blog-categories",
          },
          { label: "Chỉnh sửa danh mục", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý danh mục bài viết",
            href: "/admin/blog-categories",
          },
          { label: "Chỉnh sửa danh mục", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-6">
        <AdminPageHeading
          title="Chỉnh sửa danh mục bài viết"
          subtitle="Cập nhật thông tin danh mục bài viết"
        />

        {/* FORM CARD */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Thông tin danh mục
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Tên danh mục */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                  required
                />
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-4 h-4 text-[#b51c00] border-gray-300 focus:ring-[#b51c00] cursor-pointer accent-[#b51c00]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Hoạt động
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-4 h-4 text-[#b51c00] border-gray-300 focus:ring-[#b51c00] cursor-pointer accent-[#b51c00]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ngưng hoạt động
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <AdminFormActions
              loading={loading}
              submitLabel="Cập nhật danh mục"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCategoryEdit;
