export const forgotPasswordTemplate = (otp) => {
  return `
    <div style="background:#f4f6f8;padding:40px 0;font-family:sans-serif">
      <div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:12px">
        
        <h2 style="text-align:center">Khôi phục mật khẩu</h2>

        <p style="text-align:center;color:#6b7280">
          Mã OTP của bạn (hiệu lực 3 phút)
        </p>

        <div style="
          text-align:center;
          font-size:28px;
          letter-spacing:6px;
          font-weight:600;
          margin:20px 0;
          color:#2B7FFF;
        ">
          ${otp}
        </div>

        <p style="text-align:center;font-size:13px;color:#9ca3af">
          Nếu bạn không yêu cầu, hãy bỏ qua email này.
        </p>

      </div>
    </div>
  `;
};
