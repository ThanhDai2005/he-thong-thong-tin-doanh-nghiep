import { useState, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminBlogStore } from "@/stores/useAdminBlogStore";
import { useAdminBlogCategoryStore } from "@/stores/useAdminBlogCategoryStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const BlogCreate = () => {
  const navigate = useNavigate();
  const { user, accessToken } = useAdminAuthStore();
  const { loading, createBlog } = useAdminBlogStore();
  const { blogCategories, fetchBlogCategories } = useAdminBlogCategoryStore();
  const editorRef = useRef<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    blogCategory: "",
    status: "active",
  });

  const canCreate = hasPermission(user, "blogs_create");

  useEffect(() => {
    fetchBlogCategories("", "active", 1, 100);
  }, [fetchBlogCategories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    if (!imageFile) {
      toast.error("Vui lòng chọn hình ảnh");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("content", formData.content);
      submitData.append("imageUrl", imageFile);
      if (formData.blogCategory) {
        submitData.append("blogCategory", formData.blogCategory);
      }
      submitData.append("status", formData.status);

      await createBlog(submitData);
      navigate("/admin/blogs");
    } catch (error) {
      // Error already handled in store
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý bài viết", href: "/admin/blogs" },
          { label: "Thêm bài viết", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý bài viết", href: "/admin/blogs" },
          { label: "Thêm bài viết", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Thêm bài viết mới"
          subtitle="Điền thông tin để tạo bài viết"
        />

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Thông tin bài viết
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              {/* Danh mục */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={formData.blogCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, blogCategory: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent text-gray-900 cursor-pointer"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {blogCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hình ảnh <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <Editor
                  apiKey="6zf850rtn9cn61onukfwj5whpbpwri2c4v6v0kstyv23ag13"
                  onInit={(_evt, editor) => (editorRef.current = editor)}
                  value={formData.content}
                  onEditorChange={(content) => {
                    setFormData({ ...formData, content });
                  }}
                  init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
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
                      "link image | removeformat | help",
                    content_style:
                      "body { font-family:Inter,Arial,sans-serif; font-size:14px } " +
                      "img { max-width: 100%; height: auto; border-radius: 1rem; margin: 2.5rem 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }",
                    images_upload_handler: (blobInfo) => {
                      return new Promise(async (resolve, reject) => {
                        try {
                          const formData = new FormData();
                          formData.append(
                            "file",
                            blobInfo.blob(),
                            blobInfo.filename(),
                          );

                          const response = await axios.post(
                            `${import.meta.env.VITE_API_URL}/admin/upload`,
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                                Authorization: `Bearer ${accessToken}`,
                              },
                            },
                          );

                          // Trả về URL cho TinyMCE
                          resolve(response.data.location);
                        } catch (error) {
                          console.error("Upload error:", error);
                          reject("Upload hình ảnh thất bại. Vui lòng thử lại.");
                        }
                      });
                    },
                  }}
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
                      className="w-4 h-4 accent-[#b51c00] cursor-pointer"
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
                      className="w-4 h-4 accent-[#b51c00] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ngưng hoạt động
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <AdminFormActions loading={loading} submitLabel="Lưu bài viết" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCreate;
