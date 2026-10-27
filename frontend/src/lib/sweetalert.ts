import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Styled SweetAlert2 for delete confirmation
export const confirmDelete = (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#b51c00",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Xác nhận",
    cancelButtonText: "Hủy",
    reverseButtons: true,
    customClass: {
      popup: "rounded-xl",
      confirmButton: "rounded-lg font-semibold px-6 py-2.5",
      cancelButton: "rounded-lg font-semibold px-6 py-2.5",
    },
  });
};

// Styled SweetAlert2 for restore confirmation
export const confirmRestore = (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#ec4899",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Khôi phục",
    cancelButtonText: "Hủy",
    reverseButtons: true,
    customClass: {
      popup: "rounded-xl",
      confirmButton: "rounded-lg font-semibold px-6 py-2.5",
      cancelButton: "rounded-lg font-semibold px-6 py-2.5",
    },
  });
};

// Styled SweetAlert2 for permanent delete confirmation
export const confirmPermanentDelete = (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: "error",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Xóa vĩnh viễn",
    cancelButtonText: "Hủy",
    reverseButtons: true,
    customClass: {
      popup: "rounded-xl",
      confirmButton: "rounded-lg font-semibold px-6 py-2.5",
      cancelButton: "rounded-lg font-semibold px-6 py-2.5",
    },
  });
};

// Styled SweetAlert2 for order cancellation confirmation
export const confirmCancelOrder = () => {
  return MySwal.fire({
    title: "Hủy đơn hàng?",
    html: `
      <div class="text-gray-600 text-sm leading-relaxed">
        <p class="mb-3">Đơn hàng sẽ bị hủy và <strong>không thể khôi phục</strong>.</p>
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
          <p class="text-green-800 font-medium">
              ✓ Các quyền lợi liên quan (nếu có) sẽ được hệ thống tự động hoàn lại.
          </p>
        </div>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Hủy đơn hàng",
    cancelButtonText: "Không hủy",
    reverseButtons: true,
    customClass: {
      popup: "rounded-2xl",
      title: "text-xl font-bold text-gray-900",
      htmlContainer: "mt-2",
      confirmButton: "rounded-xl font-bold px-6 py-3 shadow-md",
      cancelButton: "rounded-xl font-bold px-6 py-3",
    },
  });
};
