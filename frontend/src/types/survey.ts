export interface Survey {
  _id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: "active" | "inactive";
  createdBy: {
    _id: string;
    userId: {
      displayName: string;
      email: string;
    };
  };
  responseCount?: number;
  recipientIds?: string[];
  recipientCount?: number;
  hasResponded?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  _id: string;
  questionText: string;
  type: "single_choice" | "text";
  options?: string[];
}

export interface SurveyAnswer {
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
}

export interface SurveyRecipient {
  _id: string;
  userId: { _id: string; displayName: string; email: string; phone: string; avatarUrl?: string };
}

export interface SurveyResponse {
  _id: string;
  surveyId: string | Survey;
  customerId: string;
  answers: SurveyAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface SurveyStatistics {
  surveyId: string;
  title: string;
  totalResponses: number;
  totalCustomers: number;
  completedRecipients: number;
  completionRate: string;
  questionStats: QuestionStatistics[];
}

export interface QuestionStatistics {
  questionId: string;
  questionText: string;
  type: "single_choice" | "text";
  totalAnswers: number;
  optionStats?: OptionStatistics[];
  textAnswers?: string[];
}

export interface OptionStatistics {
  option: string;
  count: number;
  percentage: string;
}
