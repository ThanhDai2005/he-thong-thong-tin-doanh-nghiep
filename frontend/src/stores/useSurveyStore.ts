import { create } from "zustand";
import type { SurveyState } from "@/types/store";
import { surveyService } from "@/services/surveyService";
import { toast } from "sonner";

export const useSurveyStore = create<SurveyState>((set) => ({
  surveys: [],
  currentSurvey: null,
  totalPages: 1,
  loading: false,

  fetchSurveys: async (page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await surveyService.getList(page, limit);
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

  getSurveyDetail: async (surveyId: string) => {
    try {
      set({ loading: true, currentSurvey: null }); // clear trước
      const response = await surveyService.getDetail(surveyId);
      set({ currentSurvey: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khảo sát:", error);
      toast.error("Không thể tải khảo sát");
      set({ currentSurvey: null, loading: false });
      throw error;
    }
  },

  submitSurvey: async (surveyId: string, answers: any[]) => {
    try {
      set({ loading: true });
      await surveyService.submit(surveyId, answers);
      // Đánh dấu đã trả lời trên survey hiện tại
      set((state) => ({
        loading: false,
        currentSurvey: state.currentSurvey
          ? { ...state.currentSurvey, hasResponded: true }
          : null,
      }));
      toast.success("Cảm ơn bạn đã hoàn thành khảo sát!");
    } catch (error) {
      console.error("Lỗi khi gửi khảo sát:", error);
      toast.error("Không thể gửi khảo sát");
      set({ loading: false });
      throw error;
    }
  },

  getMyResponses: async () => {
    try {
      set({ loading: true });
      const response = await surveyService.getMyResponses();
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải lịch sử khảo sát:", error);
      toast.error("Không thể tải lịch sử");
      set({ loading: false });
      throw error;
    }
  },

  clearCurrentSurvey: () => {
    set({ currentSurvey: null });
  },
}));
