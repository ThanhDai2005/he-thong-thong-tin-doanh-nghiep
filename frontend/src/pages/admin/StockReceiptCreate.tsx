import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Loader2,
  Search,
  AlertCircle,
  ShoppingBag,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminStockReceiptStore } from "@/stores/useAdminStockReceiptStore";
import { useAdminSupplierStore } from "@/stores/useAdminSupplierStore";
import { hasPermission } from "@/lib/permissions";
import adminApi from "@/lib/adminAxios";

interface ProductOption {
  _id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  categoryId?: { name: string };
}

interface LineItem {
  id: string; // local uuid
  productId: string;
  productName: string;
  productImage: string;
  currentStock: number;
  quantity: number;
  importPrice: number;
}

const newLine = (): LineItem => ({
  id: crypto.randomUUID(),
  productId: "",
  productName: "",
  productImage: "",
  currentStock: 0,
  quantity: 1,
  importPrice: 0,
});

const StockReceiptCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { createReceipt, loading } = useAdminStockReceiptStore();
  const { suppliers, fetchSuppliers } = useAdminSupplierStore();

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<LineItem[]>([newLine()]);
  const [productSearch, setProductSearch] = useState({});
  const [productDropdown, setProductDropdown] = useState({});
  const [productResults, setProductResults] = useState({});
  const [searchLoading, setSearchLoading] = useState({});
  const searchTimers = useRef({});

  const canCreate = hasPermission(user, "stock_receipts_create");

  useEffect(() => {
    fetchSuppliers("", "active", 1, 200);
  }, []);

  const handleSearchChange = (lineId: string, value: string) => {
    setProductSearch((prev) => ({ ...prev, [lineId]: value }));
    setProductDropdown((prev) => ({ ...prev, [lineId]: true }));

    if (searchTimers.current[lineId]) {
      clearTimeout(searchTimers.current[lineId]);
    }

    searchTimers.current[lineId] = setTimeout(() => {
      searchProducts(lineId, value);
    }, 300);
  };

  // ── Tìm sản phẩm theo keyword (debounce) ─────────────────────────────
  const searchProducts = async (lineId: string, keyword: string) => {
    if (!keyword.trim()) {
      setProductResults((prev) => ({ ...prev, [lineId]: [] }));
      return;
    }
    try {
      setSearchLoading((prev) => ({ ...prev, [lineId]: true }));
      const res = await adminApi.get(
        `/admin/product?keyword=${encodeURIComponent(keyword)}&limit=10&page=1`,
      );
      setProductResults((prev) => ({
        ...prev,
        [lineId]: res.data?.data || [],
      }));
    } catch {
      setProductResults((prev) => ({ ...prev, [lineId]: [] }));
    } finally {
      setSearchLoading((prev) => ({ ...prev, [lineId]: false }));
    }
  };

  // ── Xử lý chọn sản phẩm ─────────────────────────────────────────────
  const handleSelectProduct = (lineId: string, product: ProductOption) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              productId: product._id,
              productName: product.name,
              productImage: product.images?.[0] || "",
              currentStock: product.stock,
              importPrice: item.importPrice || Math.round(product.price * 0.7),
            }
          : item,
      ),
    );
    setProductSearch((prev) => ({ ...prev, [lineId]: product.name }));
    setProductDropdown((prev) => ({ ...prev, [lineId]: false }));
    setProductResults((prev) => ({ ...prev, [lineId]: [] }));
  };

  // ── Xử lý thay đổi số liệu ──────────────────────────────────────────
  const updateItem = (
    lineId: string,
    field: keyof LineItem,
    value: unknown,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeItem = (lineId: string) => {
    if (items.length === 1) {
      toast.error("Phiếu nhập cần ít nhất một sản phẩm");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== lineId));
  };

  const addLine = () => {
    const line = newLine();
    setItems((prev) => [...prev, line]);
    setProductSearch((prev) => ({ ...prev, [line.id]: "" }));
  };

  // ── Tính tổng ────────────────────────────────────────────────────────
  const totalAmount = items.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.importPrice),
    0,
  );

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    for (const item of items) {
      if (!item.productId) {
        toast.error("Vui lòng chọn sản phẩm cho tất cả dòng");
        return;
      }
      if (item.quantity < 1) {
        toast.error("Số lượng phải lớn hơn 0");
        return;
      }
      if (item.importPrice < 0) {
        toast.error("Giá nhập không hợp lệ");
        return;
      }
    }

    // Kiểm tra trùng sản phẩm
    const ids = items.map((i) => i.productId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Không được chọn trùng sản phẩm trong một phiếu nhập");
      return;
    }

    try {
      await createReceipt({
        supplierId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          importPrice: Number(i.importPrice),
        })),
      });
      navigate("/admin/stock-receipts");
    } catch {
      // handled in store
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", href: "/admin/stock-receipts" },
          { label: "Tạo phiếu nhập", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-16">
      {/* HEADER */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", href: "/admin/stock-receipts" },
          { label: "Tạo phiếu nhập", isCurrentPage: true },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
          {/* Page heading */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/stock-receipts")}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-[#b51c00] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Tạo phiếu nhập hàng
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Nhập thông tin phiếu nhập và chọn sản phẩm
              </p>
            </div>
          </div>

          {/* ── 2-col layout: left (main) + right (summary) ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
            {/* ════ LEFT ════ */}
            <div className="space-y-5">
              {/* Card: Nhà cung cấp */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#b51c00]" />
                  <h2 className="text-base font-bold text-gray-900">
                    Nhà cung cấp
                  </h2>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chọn nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/25 focus:border-[#b51c00] text-gray-900 cursor-pointer transition-all"
                    required
                  >
                    <option value="">— Chọn nhà cung cấp —</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                        {s.phone ? ` · ${s.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Chưa có nhà cung cấp nào. Hãy tạo nhà cung cấp trước.
                    </p>
                  )}
                </div>
              </div>

              {/* Card: Danh sách sản phẩm */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden pb-16">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#b51c00]" />
                    <h2 className="text-base font-bold text-gray-900">
                      Sản phẩm nhập kho
                    </h2>
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 bg-[#b51c00] text-white text-[11px] font-bold rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#b51c00] bg-red-50 hover:bg-[#b51c00] hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm dòng
                  </button>
                </div>

                <div className="divide-y divide-gray-50">
                  {/* Table header */}
                  <div className="px-6 py-3 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                    <span>Sản phẩm</span>
                    <span>Tồn kho hiện tại</span>
                    <span>
                      SL nhập <span className="text-red-500">*</span>
                    </span>
                    <span>
                      Giá nhập (₫) <span className="text-red-500">*</span>
                    </span>
                    <span />
                  </div>

                  {items.map((item) => (
                    <div key={item.id} className="px-6 py-5">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                        {/* Product selector */}
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Tìm tên sản phẩm..."
                              value={
                                productSearch[item.id] !== undefined
                                  ? productSearch[item.id]
                                  : item.productName
                              }
                              onChange={(e) =>
                                handleSearchChange(item.id, e.target.value)
                              }
                              onFocus={() =>
                                setProductDropdown((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }))
                              }
                              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all"
                            />
                          </div>

                          {/* Dropdown results */}
                          {productDropdown[item.id] &&
                            (productResults[item.id]?.length > 0 ||
                              searchLoading[item.id]) && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                                {searchLoading[item.id] ? (
                                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang tìm...
                                  </div>
                                ) : (
                                  productResults[item.id]?.map((p) => (
                                    <button
                                      key={p._id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectProduct(item.id, p)
                                      }
                                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                                    >
                                      {p.images?.[0] ? (
                                        <img
                                          src={p.images[0]}
                                          alt={p.name}
                                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <Package className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                          {p.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Tồn:{" "}
                                          <span className="font-medium">
                                            {p.stock}
                                          </span>{" "}
                                          · Giá:{" "}
                                          {p.price.toLocaleString("vi-VN")}₫
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                        </div>

                        {/* Tồn kho hiện tại */}
                        <div className="flex items-center justify-center">
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              item.productId
                                ? item.currentStock > 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.currentStock > 0
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {item.productId ? item.currentStock : "—"}
                          </span>
                        </div>

                        {/* Số lượng */}
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all"
                          required
                        />

                        {/* Giá nhập */}
                        <input
                          type="number"
                          min={0}
                          value={item.importPrice}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "importPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-right font-semibold outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all"
                          required
                        />

                        {/* Xóa dòng */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Line subtotal */}
                      {item.productId && (
                        <div className="mt-2 flex justify-end">
                          <span className="text-xs text-gray-500">
                            Thành tiền:{" "}
                            <span className="font-bold text-gray-800">
                              {(
                                item.quantity * item.importPrice
                              ).toLocaleString("vi-VN")}
                              ₫
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add line button at bottom */}
                  <div className="px-6 py-4">
                    <button
                      type="button"
                      onClick={addLine}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-[#b51c00] hover:text-[#b51c00] hover:bg-red-50/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm sản phẩm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ════ RIGHT: Summary ════ */}
            <div className="xl:sticky xl:top-20 space-y-4">
              {/* Order summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">
                    Tổng kết phiếu nhập
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {items.map((item) =>
                    item.productId ? (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              x{item.quantity} ×{" "}
                              {Number(item.importPrice).toLocaleString("vi-VN")}
                              ₫
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                          {(item.quantity * item.importPrice).toLocaleString(
                            "vi-VN",
                          )}
                          ₫
                        </span>
                      </div>
                    ) : null,
                  )}

                  {items.every((i) => !i.productId) && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Chưa có sản phẩm nào
                    </p>
                  )}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Tổng số lượng mặt hàng:
                      </span>
                      <span className="font-bold text-gray-900">
                        {items.filter((i) => i.productId).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-gray-900">
                        Tổng giá trị:
                      </span>
                      <span className="text-xl font-bold text-[#b51c00]">
                        {totalAmount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Phiếu nhập tạo với trạng thái <strong>Chờ xác nhận</strong>.
                    Kho chỉ được cập nhật sau khi phiếu được xác nhận.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#b51c00] text-white font-bold rounded-xl hover:bg-[#9a1700] transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo phiếu...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Tạo phiếu nhập
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/stock-receipts")}
                  disabled={loading}
                  className="w-full py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StockReceiptCreate;
