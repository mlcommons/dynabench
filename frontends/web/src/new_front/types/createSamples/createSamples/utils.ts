export interface ChatHistoryType {
  user: any[];
  bot: any[];
}

export type ChatbotProps = {
  instructions: string;
  chatHistory: ChatHistoryType;
  username: string;
  modelName: any;
  provider: string;
  numOfSamplesChatbot: number;
  numInteractionsChatbot: number;
  finishConversation: boolean;
  optionsSlider?: string[];
  allowPaste?: boolean;
  setChatHistory: (chatHistory: ChatHistoryType) => void;
  showOriginalInteractions: () => void;
  setFinishConversation: (finishConversation: boolean) => void;
  updateModelInputs: (modelInputs: any) => void;
  setIsGenerativeContext: (isGenerativeContext: boolean) => void;
  modelInputs?: any;
  chooseWhenTie?: boolean;
  showChosenHistory?: boolean;
  rateAtTheEnd?: boolean;
};

export type SimpleChatbotProps = {
  instructions: string;
  chatHistory: ChatHistoryType;
  username: string;
  modelName: string;
  provider: string;
  setChatHistory: (chatHistory: ChatHistoryType) => void;
  updateModelInputs: (modelInputs: any) => void;
  setIsGenerativeContext: (isGenerativeContext: boolean) => void;
};
