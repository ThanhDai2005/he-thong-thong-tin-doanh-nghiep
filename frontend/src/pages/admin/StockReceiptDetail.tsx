import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Building2,
  Clock,
  Ban,
  ShoppingBag,
  FileText,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminStockReceiptStore } from "@/stores/useAdminStockReceiptStore";
import { hasPermission } from "@/lib/permissions";
import type { StockReceipt } from "@/types/stockReceipt";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Chờ xác nhận",
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fcd34d]",
    icon: Clock,
    desc: "Phiếu nhập đang chờ được xác nhận. Kho chưa được cập nhật.",
  },
  completed: {
    label: "Hoàn thành",
    bg: "bg-[#d1fae5]",
    text: "text-[#15803d]",
    border: "border-[#86efac]",
    icon: CheckCircle2,
    desc: "Phiếu nhập đã được xác nhận. Tồn kho đã được cập nhật.",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "bg-[#fee2e2]",
    text: "text-[#b91c1c]",
    border: "border-[#fca5a5]",
    icon: Ban,
    desc: "Phiếu nhập đã bị hủy.",
  },
};

const StockReceiptDetail = () => {
  const navigate = useNavigate();
  const { receiptId } = useParams<{ receiptId: string }>();
  const { user } = useAdminAuthStore();
  const {
    currentReceipt,
    loading,
    getReceiptDetail,
    confirmReceipt,
    cancelReceipt,
    clearCurrentReceipt,
  } = useAdminStockReceiptStore();

  const [fetching, setFetching] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const canView = hasPermission(user, "stock_receipts_view");
  const canEdit = hasPermission(user, "stock_receipts_edit");

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phiếu Nhập Hàng #${receiptId?.slice(-8).toUpperCase()}`,
  });

  useEffect(() => {
    if (!receiptId) return;
    clearCurrentReceipt();
    getReceiptDetail(receiptId)
      .catch(() => navigate("/admin/stock-receipts"))
      .finally(() => setFetching(false));
  }, [receiptId]);

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", href: "/admin/stock-receipts" },
          { label: "Chi tiết phiếu", isCurrentPage: true },
        ]}
      />
    );
  }

  // TỐI ƯU UI LOADING
  if (fetching || loading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  if (!currentReceipt) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy phiếu nhập</p>
          <button
            onClick={() => navigate("/admin/stock-receipts")}
            className="mt-4 px-4 py-2 bg-[#b51c00] text-white rounded-lg hover:bg-[#8e1400] transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const r: StockReceipt = currentReceipt;
  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const formatDate = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

  const handleConfirm = async () => {
    if (!receiptId) return;
    try {
      setActionLoading(true);
      await confirmReceipt(receiptId);
      setConfirmOpen(false);
      await getReceiptDetail(receiptId);
    } catch {
      // handled in store
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!receiptId) return;
    try {
      setActionLoading(true);
      await cancelReceipt(receiptId);
      setCancelOpen(false);
      await getReceiptDetail(receiptId);
    } catch {
      // handled in store
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 12mm 10mm;
            size: A4 portrait;
          }

          header, footer, nav, .no-print, .header, .footer {
            display: none !important;
          }
        }
      `}</style>

      {/* ============================================================ */}
      {/* BẢN IN HÓA ĐƠN NHẬP HÀNG                                      */}
      {/* ============================================================ */}
      <div
        ref={printRef}
        className="hidden print:block text-gray-900 font-sans max-w-4xl mx-auto"
      >
        {currentReceipt && (
          <>
            {/* Brand header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-1">
                <img
                  src="/logo.webp"
                  alt="Logo Đặc Sản Ba Miền"
                  className="w-20 h-auto object-cover"
                />
              </div>

              <h1 className="text-3xl font-bold text-[#b51c00] tracking-tight">
                Đặc Sản Ba Miền
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Nền tảng đặt đồ ăn trực tuyến
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Hotline: 1900 xxxx | Email: support@ds3mvn.com
              </p>
            </div>

            <div className="border-t-2 border-gray-300 mb-8"></div>

            {/* Invoice meta row */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Mã Phiếu Nhập
                </p>
                <p className="text-lg font-bold text-gray-900">
                  #{r._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Ngày Tạo
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(r.createdAt)}
                </p>
              </div>
            </div>

            {/* Supplier info */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-3">
                Thông tin nhà cung cấp
              </h2>
              <div className="text-base text-gray-800 space-y-2">
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-32">
                    Tên NCC:
                  </span>
                  {r.supplierId?.name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-32">
                    Điện thoại:
                  </span>
                  {r.supplierId?.phone || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-32">
                    Email:
                  </span>
                  {r.supplierId?.email || "N/A"}
                </p>
                {r.supplierId?.address && (
                  <p>
                    <span className="font-semibold text-gray-900 inline-block w-32">
                      Địa chỉ:
                    </span>
                    {r.supplierId.address}
                  </p>
                )}
              </div>
            </div>

            {/* Stock items */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-3">
                Chi tiết sản phẩm nhập
              </h2>
              <table className="w-full text-base border-collapse mt-2">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 pr-2 font-bold w-12 text-gray-700">
                      STT
                    </th>
                    <th className="text-left py-2 pr-2 font-bold text-gray-700">
                      Sản phẩm
                    </th>
                    <th className="text-center py-2 px-2 font-bold w-16 text-gray-700">
                      SL
                    </th>
                    <th className="text-right py-2 px-2 font-bold w-32 text-gray-700">
                      Giá nhập
                    </th>
                    <th className="text-right py-2 pl-2 font-bold w-36 text-gray-700">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((item, idx) => {
                    const prod = item.productId;
                    return (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-3 pr-2 text-gray-600">{idx + 1}</td>
                        <td className="py-3 pr-2 font-semibold text-gray-900">
                          {prod?.name || "N/A"}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-800">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-800">
                          {formatMoney(item.importPrice)}
                        </td>
                        <td className="py-3 pl-2 text-right font-bold text-gray-900">
                          {formatMoney(item.quantity * item.importPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-12 pt-6 border-t-2 border-gray-800 print:break-inside-avoid">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Thông tin phiếu
                </h3>
                <div className="text-base space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người tạo</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {r.createdBy?.userId?.displayName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái</span>
                    <span className="font-semibold text-gray-900">
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 text-right">
                  Tổng kết phiếu nhập
                </h3>
                <div className="text-base space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng số mặt hàng</span>
                    <span className="font-semibold text-gray-900">
                      {r.items.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng SL nhập</span>
                    <span className="font-semibold text-indigo-600">
                      +{r.items.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-300">
                    <span className="font-bold text-gray-900 uppercase">
                      Tổng tiền nhập
                    </span>
                    <span className="font-black text-[#b51c00] text-xl">
                      {formatMoney(r.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* GIAO DIỆN HIỂN THỊ TRÊN MÀN HÌNH                             */}
      {/* ============================================================ */}
      <div className="print:hidden bg-[#f7f9fb] min-h-screen pb-16">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", href: "/admin/stock-receipts" },
          { label: `#${r._id.slice(-8).toUpperCase()}`, isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* HEADER WITH BACK BUTTON */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
                Chi tiết phiếu nhập
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Mã phiếu:{" "}
                <span className="font-mono font-bold text-[#b51c00]">
                  #{r._id.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b51c00] hover:bg-[#8e1400] text-white font-bold rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              In PDF
            </button>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${cfg.bg} ${cfg.text} font-bold`}
            >
              <StatusIcon className="w-5 h-5" />
              {cfg.label}
            </div>
          </div>
        </div>

        {/* CANCELLED STATUS ALERT */}
        {r.status === "cancelled" && (
          <div className="bg-[#fee2e2] border border-[#fecaca] rounded-[12px] p-6 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-[#b91c1c] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#991b1b] text-lg">
                Phiếu nhập đã bị hủy
              </h3>
              <p className="text-sm text-[#b91c1c] mt-1">
                Phiếu nhập này đã bị hủy và không thể thay đổi trạng thái hay
                cập nhật tồn kho.
              </p>
            </div>
          </div>
        )}

        {/* 2 COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[18px] font-bold text-gray-900">
                  Sản phẩm trong phiếu
                </h2>
                <span className="ml-1 inline-flex items-center justify-center w-6 h-6 bg-[#b51c00] text-white text-xs font-bold rounded-full">
                  {r.items.length}
                </span>
              </div>
              <div className="p-6 space-y-4">
                {r.items.map((item, idx) => {
                  const prod = item.productId;
                  return (
                    <div
                      key={idx}
                      className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                    >
                      {prod?.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-50"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {prod?.name || "N/A"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Số lượng nhập:{" "}
                          <span className="font-semibold text-indigo-600">
                            +{item.quantity}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Tồn kho hiện tại:{" "}
                          <span className="font-bold text-gray-700">
                            {prod?.stock ?? "—"}
                          </span>
                        </p>
                      </div>
                      <div className="text-right flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Giá nhập</p>
                          <p className="font-medium text-gray-900">
                            {formatMoney(item.importPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Thành tiền</p>
                          <p className="font-bold text-[#b51c00]">
                            {formatMoney(item.quantity * item.importPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[18px] font-bold text-gray-900">
                  Thông tin nhà cung cấp
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên nhà cung cấp</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {r.supplierId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {r.supplierId?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {r.supplierId?.email || "N/A"}
                    </p>
                  </div>
                  {r.supplierId?.taxCode && (
                    <div>
                      <p className="text-sm text-gray-500">Mã số thuế</p>
                      <p className="font-semibold text-gray-900 mt-1 font-mono">
                        {r.supplierId.taxCode}
                      </p>
                    </div>
                  )}
                </div>
                {r.supplierId?.address && (
                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {r.supplierId.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900">
                  Tổng kết phiếu
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng số mặt hàng</span>
                  <span className="font-semibold text-gray-900">
                    {r.items.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng SL nhập vào kho</span>
                  <span className="font-semibold text-indigo-600">
                    +{r.items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">
                    Tổng tiền nhập
                  </span>
                  <span className="font-bold text-[#b51c00] text-xl">
                    {formatMoney(r.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900">
                  Thông tin tạo
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Người tạo phiếu</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {r.createdBy?.userId?.displayName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            {canEdit && r.status === "pending" && (
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Thao tác
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận nhập kho
                  </button>
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Hủy phiếu nhập
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ ALERT DIALOG XÁC NHẬN ═══════════════ */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-lg font-bold text-gray-900">
                  Xác nhận phiếu nhập
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500 mt-0.5">
                  Hành động này sẽ cộng số lượng vào kho
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 my-4">
            <p className="text-sm text-emerald-800 font-medium">
              ✅ Sau khi xác nhận, số lượng tồn kho của các sản phẩm trong phiếu
              sẽ được tự động cập nhật và không thể hoàn tác.
            </p>
          </div>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Xác nhận phiếu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════ ALERT DIALOG HỦY ═══════════════ */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-lg font-bold text-gray-900">
                  Hủy phiếu nhập
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500 mt-0.5">
                  Phiếu sẽ bị hủy và không thể khôi phục
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Hành động này không thể hoàn tác. Phiếu nhập sẽ chuyển sang
              trạng thái "Đã hủy".
            </p>
          </div>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Xác nhận hủy"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
};

export default StockReceiptDetail;
