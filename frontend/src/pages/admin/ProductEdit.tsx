import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminProductStore } from "@/stores/useAdminProductStore";
import { useAdminCategoryStore } from "@/stores/useAdminCategoryStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const ProductEdit = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [fetching, setFetching] = useState(true);
  const { user } = useAdminAuthStore();
  const { loading, getProductDetail, updateProduct } = useAdminProductStore();
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
    existingImages: [],
  });
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const canEdit = hasPermission(user, "products_edit");

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setFetching(true);
      await fetchCategories("", "active", 1, 100);

      if (productId) {
        const product = await getProductDetail(productId);
        setFormData({
          name: product.name,
          description: product.description,
          ingredients: product.ingredients,
          category: product.categoryId?._id || "",
          price: product.price.toString(),
          stock: product.stock.toString(),
          status: product.status,
          existingImages: product.images,
        });
      }
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm");
      navigate("/admin/products");
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setNewImageFiles((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

      // Send existing images as JSON string
      submitData.append(
        "existingImages",
        JSON.stringify(formData.existingImages),
      );

      // Append new image files
      newImageFiles.forEach((file) => {
        submitData.append("images", file);
      });

      await updateProduct(productId!, submitData);
      navigate("/admin/products");
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
          { label: "Quản lý sản phẩm", href: "/admin/products" },
          { label: "Chỉnh sửa sản phẩm", isCurrentPage: true },
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
          { label: "Chỉnh sửa sản phẩm", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Chỉnh sửa sản phẩm"
          subtitle="Cập nhật thông tin sản phẩm"
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
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent placeholder-gray-400 transition-shadow bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Tồn kho chỉ thay đổi qua phiếu nhập. Không chỉnh tay tại
                    đây.
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

                  {/* Existing Images Preview */}
                  {formData.existingImages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Ảnh hiện tại:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.existingImages.map((url, index) => (
                          <div
                            key={`existing-${index}`}
                            className="relative group rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={url}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {newImagePreviews.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Ảnh mới:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newImagePreviews.map((url, index) => (
                          <div
                            key={`new-${index}`}
                            className="relative group rounded-lg overflow-hidden border border-green-200"
                          >
                            <img
                              src={url}
                              alt={`New ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AdminFormActions
              loading={loading}
              submitLabel="Cập nhật sản phẩm"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEdit;
