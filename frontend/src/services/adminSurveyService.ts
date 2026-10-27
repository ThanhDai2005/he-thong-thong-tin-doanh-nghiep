import api from "@/lib/adminAxios";

export const adminSurveyService = {
  getList: async (keyword = "", status = "", page = 1, limit = 10) => {
    const response = await api.get(
      `/admin/survey?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (surveyId: string) => {
    const response = await api.get(`/admin/survey/${surveyId}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    questions: Array<{
      questionText: string;
      type: "single_choice" | "text";
      options?: string[];
    }>;
    status?: "active" | "inactive";
  }) => {
    const response = await api.post("/admin/survey", data);
    return response.data;
  },

  update: async (
    surveyId: string,
    data: {
      title: string;
      description?: string;
      questions: Array<{
        questionText: string;
        type: "single_choice" | "text";
        options?: string[];
      }>;
      status?: "active" | "inactive";
    },
  ) => {
    const response = await api.patch(`/admin/survey/${surveyId}`, data);
    return response.data;
  },

  changeStatus: async (surveyId: string, status: "active" | "inactive") => {
    const response = await api.patch(
      `/admin/survey/change-status/${surveyId}`,
      { status },
    );
    return response.data;
  },

  getResponses: async (surveyId: string, page = 1, limit = 20) => {
    const response = await api.get(
      `/admin/survey/${surveyId}/responses?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getStatistics: async (surveyId: string) => {
    const response = await api.get(`/admin/survey/${surveyId}/statistics`);
    return response.data;
  },
};
