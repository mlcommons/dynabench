import React, { useState } from "react";
import GeneralButton from "new_front/components/Buttons/GeneralButton";
import { SimpleChatbotProps } from "new_front/types/createSamples/createSamples/utils";
import parse from "html-react-parser";
import BasicInput from "new_front/components/Inputs/BasicInput";
import { Button } from "react-bootstrap";

const SimpleChatbot: React.FC<SimpleChatbotProps> = ({
  instructions,
  chatHistory,
  username,
  modelName,
  provider,
  setChatHistory,
  updateModelInputs,
  setIsGenerativeContext,
}) => {
  const [prompt, setPrompt] = React.useState<string>("");
  const [chatHistoryState, setChatHistoryState] = useState(chatHistory);

  const askQuestion = () => {
    console.log("askQuestion");
  };

  return (
    <div>
      <h3 className="pt-1 pb-6 pl-6 text-lg font-bold text-letter-color">
        {parse(instructions)}
      </h3>
      <div id="interacion block">
        <div className="flex items-end">
          <div className="grid w-full grid-cols-12 gap-4">
            <div className="col-span-10">
              <BasicInput
                placeholder="Enter text here. Do not copy and paste"
                onChange={(e) => setPrompt(e.target.value)}
                onEnter={askQuestion}
              />
            </div>
            <div className="col-span-2">
              <GeneralButton
                onClick={askQuestion}
                text="Send"
                className="px-4 mt-[2px] font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
              />
            </div>
          </div>
        </div>
      </div>
      <div id="model block" className="mt-4">
        <div className="flex items-end justify-end">
          <div className="flex flex-col items-end order-1 max-w-lg mx-2 space-y-2">
            <div className="min-w-[16rem] md:min-w-[26rem] lg:min-w-[32rem]">
              <textarea
                className="inline-block w-full px-3 py-2 text-white rounded-lg rounded-bl-none bg-third-color"
                disabled={true}
                value="This is the response from the model"
                rows={10}
              />
            </div>
          </div>
          <img
            src="https://cdn-icons-png.flaticon.com/512/427/427995.png?w=1060&t=st=1687313158~exp=1687313758~hmac=a9f0bae6d29fe6f316f7fa531188e34fe0f562db16c7ea5fa53b3105bab66f6f"
            alt="My profile"
            className="order-2 rounded-full w-7 h-7"
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleChatbot;
