import { create } from "zustand";
import type { AdminSurveyState } from "@/types/store";
import { adminSurveyService } from "@/services/adminSurveyService";
import { toast } from "sonner";

export const useAdminSurveyStore = create<AdminSurveyState>((set) => ({
  surveys: [],
  currentSurvey: null,
  totalPages: 1,
  loading: false,

  fetchSurveys: async (keyword = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminSurveyService.getList(
        keyword,
        status,
        page,
        limit,
      );
      set({
        surveys: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải khảo sát:", error);
      set({ loading: false });
    }
  },

  getSurveyDetail: async (surveyId) => {
    try {
      const response = await adminSurveyService.getDetail(surveyId);
      set({ currentSurvey: response.data });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khảo sát:", error);
      toast.error("Không thể tải thông tin khảo sát");
      throw error;
    }
  },

  createSurvey: async (data) => {
    try {
      set({ loading: true });
      await adminSurveyService.create(data);
      toast.success("Tạo khảo sát thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo khảo sát:", error);
      toast.error("Không thể tạo khảo sát");
      set({ loading: false });
      throw error;
    }
  },

  updateSurvey: async (surveyId, data) => {
    try {
      set({ loading: true });
      await adminSurveyService.update(surveyId, data);
      toast.success("Cập nhật khảo sát thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật khảo sát:", error);
      toast.error("Không thể cập nhật khảo sát");
      set({ loading: false });
      throw error;
    }
  },

  changeStatus: async (surveyId, status) => {
    try {
      set({ loading: true });
      await adminSurveyService.changeStatus(surveyId, status);
      toast.success(
        `${status === "active" ? "Kích hoạt" : "Vô hiệu hóa"} khảo sát thành công`,
      );
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái khảo sát:", error);
      toast.error("Không thể đổi trạng thái");
      set({ loading: false });
      throw error;
    }
  },

  getResponses: async (surveyId, page = 1, limit = 20) => {
    try {
      const response = await adminSurveyService.getResponses(
        surveyId,
        page,
        limit,
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi tải phản hồi:", error);
      toast.error("Không thể tải phản hồi");
      throw error;
    }
  },

  getStatistics: async (surveyId) => {
    try {
      const response = await adminSurveyService.getStatistics(surveyId);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      toast.error("Không thể tải thống kê");
      throw error;
    }
  },

  clearCurrentSurvey: () => {
    set({ currentSurvey: null });
  },
}));
