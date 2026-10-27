import api from "@/lib/axios";

export const surveyService = {
  getList: async (page = 1, limit = 10) => {
    const response = await api.get(`/survey?page=${page}&limit=${limit}`);
    return response.data;
  },

  getDetail: async (surveyId: string) => {
    const response = await api.get(`/survey/${surveyId}`);
    return response.data;
  },

  submit: async (
    surveyId: string,
    answers: Array<{
      questionId: string;
      selectedOption?: string;
      textAnswer?: string;
    }>,
  ) => {
    const response = await api.post(`/survey/${surveyId}/submit`, {
      answers,
    });
    return response.data;
  },

  getMyResponses: async () => {
    const response = await api.get("/survey/my-responses");
    return response.data;
  },
};
