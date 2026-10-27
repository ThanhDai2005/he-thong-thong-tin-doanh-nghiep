import { useState, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminProductStore } from "@/stores/useAdminProductStore";
import { useAdminCategoryStore } from "@/stores/useAdminCategoryStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { Editor } from "@tinymce/tinymce-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const ProductCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { loading, createProduct } = useAdminProductStore();
  const { categories, fetchCategories } = useAdminCategoryStore();
  const editorRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: "",
    category: "",
    price: "",
    stock: "",
    status: "active",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const canCreate = hasPermission(user, "products_create");

  useEffect(() => {
    fetchCategories("", "active", 1, 100);
  }, [fetchCategories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.price ||
      Number(formData.price) <= 0
    ) {
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("ingredients", formData.ingredients);
      submitData.append("category", formData.category);
      submitData.append("price", formData.price);
      submitData.append("stock", formData.stock || "0");
      submitData.append("status", formData.status);

      // Append all image files
      imageFiles.forEach((file) => {
        submitData.append("images", file);
      });

      await createProduct(submitData);
      navigate("/admin/products");
    } catch (error) {
      // Error already handled in store
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý sản phẩm", href: "/admin/products" },
          { label: "Thêm sản phẩm", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* HEADER BREADCRUMB */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý sản phẩm", href: "/admin/products" },
          { label: "Thêm sản phẩm", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Thêm sản phẩm mới"
          subtitle="Điền thông tin để tạo sản phẩm"
        />

        {/* FORM CARD */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Thông tin sản phẩm
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                  required
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả sản phẩm..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow resize-none"
                  required
                />
              </div>

              {/* Nguyên liệu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nguyên liệu <span className="text-red-500">*</span>
                </label>
                <Editor
                  apiKey="6zf850rtn9cn61onukfwj5whpbpwri2c4v6v0kstyv23ag13"
                  onInit={(_evt, editor) => (editorRef.current = editor)}
                  value={formData.ingredients}
                  onEditorChange={(content) => {
                    setFormData({ ...formData, ingredients: content });
                  }}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "table",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | " +
                      "bold italic forecolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "removeformat | help",
                    content_style:
                      "body { font-family:Inter,Arial,sans-serif; font-size:14px }",
                  }}
                />
              </div>

              {/* Danh mục & Giá */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 cursor-pointer"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                    required
                  />
                </div>
              </div>

              {/* Số lượng & Trạng thái */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng trong kho
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Chỉ nhập khi tạo mới sản phẩm. Sau này tồn kho sẽ cập nhật
                    qua phiếu nhập hàng.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="flex gap-4 h-[50px] items-center">
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

              {/* Hình ảnh */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#b51c00] transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Tải ảnh lên
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Image Preview */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((url, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AdminFormActions loading={loading} submitLabel="Lưu sản phẩm" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreate;
