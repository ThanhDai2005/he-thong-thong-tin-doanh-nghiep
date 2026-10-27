import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminProductPromotionStore } from "@/stores/useAdminProductPromotionStore";
import { useAdminProductStore } from "@/stores/useAdminProductStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { Tag, Calendar, Users, Info, Package, X, Search } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const ProductPromotionCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { loading, create } = useAdminProductPromotionStore();
  const { products, fetchProducts } = useAdminProductStore();

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  const [selectedProducts, setSelectedProducts] = useState<
    Array<{
      _id: string;
      name: string;
      images: string[];
      price: number;
    }>
  >([]);

  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearchKeyword, setProductSearchKeyword] = useState("");

  const canCreate = hasPermission(user, "product_promotions_create");

  useEffect(() => {
    fetchProducts("", "", "active", 1, 100);
  }, [fetchProducts]);

  const handleAddProduct = (product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  }) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearchKeyword.toLowerCase()) &&
      !selectedProducts.find((sp) => sp._id === p._id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.code.trim() ||
      !formData.discountValue ||
      !formData.startDate ||
      !formData.endDate ||
      selectedProducts.length === 0
    ) {
      return;
    }

    try {
      await create({
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount
          ? Number(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status as "active" | "inactive",
        productIds: selectedProducts.map((p) => p._id),
      });
      navigate("/admin/product-promotions");
    } catch (error) {
      // Error already handled in store
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý khuyến mãi sản phẩm",
            href: "/admin/product-promotions",
          },
          { label: "Thêm khuyến mãi", isCurrentPage: true },
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
            label: "Quản lý khuyến mãi sản phẩm",
            href: "/admin/product-promotions",
          },
          { label: "Thêm khuyến mãi", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Thêm khuyến mãi sản phẩm"
          subtitle="Tạo chương trình giảm giá cho các sản phẩm được chọn"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THÔNG TIN CỐT LÕI */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#b51c00]/5 to-transparent">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thông tin cơ bản
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tên khuyến mãi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="VD: Giảm giá các món ăn vùng Bắc"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  required
                />
              </div>

              {/* Mã khuyến mãi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VD: BACBAC2024"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all font-mono uppercase"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Mã sẽ tự động viết hoa, không có khoảng trắng
                </p>
              </div>

              {/* Loại & Giá trị giảm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: e.target.value,
                        })
                      }
                      placeholder={
                        formData.discountType === "percentage"
                          ? "VD: 10"
                          : "VD: 50000"
                      }
                      min="0"
                      max={
                        formData.discountType === "percentage"
                          ? "100"
                          : undefined
                      }
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 font-semibold">
                      {formData.discountType === "percentage" ? (
                        <>
                          <span className="text-xs">%</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs">VND</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Giảm tối đa (cho %) */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm giá tối đa (VND)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: e.target.value,
                        })
                      }
                      placeholder="VD: 100000 (bỏ trống = không giới hạn)"
                      min="0"
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 font-semibold">
                      <span className="text-xs">VND</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Số tiền giảm tối đa khi áp dụng phần trăm
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CHỌN SẢN PHẨM */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Sản phẩm áp dụng
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Đã chọn:{" "}
                  <span className="font-bold text-purple-600">
                    {selectedProducts.length}
                  </span>{" "}
                  sản phẩm
                  {selectedProducts.length === 0 && (
                    <span className="text-red-500 ml-2">
                      (Phải chọn ít nhất 1 sản phẩm)
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  {showProductSelector ? "Đóng" : "Chọn sản phẩm"}
                </button>
              </div>

              {/* Product Selector */}
              {showProductSelector && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="mb-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm..."
                        value={productSearchKeyword}
                        onChange={(e) =>
                          setProductSearchKeyword(e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => handleAddProduct(product)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
                        >
                          <img
                            src={product.images?.[0] || "/placeholder.png"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-gray-500 py-4">
                        Không tìm thấy sản phẩm
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <img
                        src={product.images?.[0] || "/placeholder.png"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product._id)}
                        className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* THỜI GIAN & GIỚI HẠN */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thời gian & Giới hạn
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Giới hạn số lần dùng */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới hạn số lần sử dụng
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    placeholder="VD: 100 (bỏ trống = không giới hạn)"
                    min="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Tổng số lần mã này có thể được sử dụng bởi tất cả khách hàng
                </p>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <AdminFormActions loading={loading} submitLabel="Thêm khuyến mãi" />
        </form>
      </div>
    </div>
  );
};

export default ProductPromotionCreate;
