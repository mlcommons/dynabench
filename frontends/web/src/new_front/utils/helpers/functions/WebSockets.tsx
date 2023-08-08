import { useState } from "react";
import Swal from "sweetalert2";

type FetchProps = {
  url: string;
  body: any;
  setSaveData: (value: any) => void;
  setExternalLoading?: (value: boolean) => void;
  firstMessage: boolean;
  setFirstMessage: (value: boolean) => void;
  setAllowsGeneration: (value: boolean) => void;
};

type cacheObject = {
  [key: string]: any;
};

export default function UseWebSockets() {
  const [cacheMemory, setCacheMemory] = useState<cacheObject>({});

  const UseWebSockets = async ({
    url,
    body,
    setSaveData,
    setExternalLoading,
    firstMessage,
    setFirstMessage,
    setAllowsGeneration,
  }: FetchProps) => {
    setExternalLoading && setExternalLoading(true);
    const socket = new WebSocket(
      `${process.env.REACT_APP_WS_HOST}/context/ws/get_generative_contexts`,
    );
    socket.onopen = () => {
      setSaveData && setSaveData([]);
      setAllowsGeneration(false);
      console.log("WebSocket connection established");
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(body));
      }
    };
    socket.onmessage = (event) => {
      if (!firstMessage) {
        setExternalLoading && setExternalLoading(false);
        setFirstMessage && setFirstMessage(true);
      }
      if (event && Object.keys(event.data).length !== 0) {
        persist(body, event.data as any);
        setSaveData((prev: any) => [...prev, ...JSON.parse(event.data)] as any);
      }
    };
    socket.onerror = (error) => {
      setExternalLoading && setExternalLoading(false);
      setFirstMessage && setFirstMessage(false);
      setAllowsGeneration && setAllowsGeneration(true);
      console.log(error);
      throw error;
    };
    socket.onclose = (event) => {
      console.log("WebSocket connection closed", event.code);
      setAllowsGeneration(true);
      setExternalLoading && setExternalLoading(false);
    };
  };

  const checkCachedRequest = (key: string) => {
    const data = cacheMemory[key];
    if (data) {
      return data;
    }
    return null;
  };

  const post = async ({
    url,
    body,
    setSaveData,
    setExternalLoading,
    firstMessage,
    setFirstMessage,
    setAllowsGeneration,
  }: FetchProps) => {
    const cachedResponse = checkCachedRequest(
      body.artifacts.prompt.replace(/"|'/g, ""),
    );
    if (cachedResponse) {
      setSaveData(cachedResponse);
    } else {
      await UseWebSockets({
        url,
        body,
        setSaveData,
        setExternalLoading,
        firstMessage,
        setFirstMessage,
        setAllowsGeneration,
      });
    }
  };

  const persist = (body: any, res: unknown) => {
    const key = body.artifacts.prompt.replace(/"|'/g, "");
    // verify if key exists in cacheMemory
    const data = cacheMemory[key];
    const fullResponse: any[] = [];
    if (data) {
      const localData = JSON.parse(data);
      for (const d of localData) {
        fullResponse.push(d);
      }
    }
    fullResponse.push(...JSON.parse(res as any));
    setCacheMemory((prev) => {
      let data = prev[key];
      if (data) {
        data = [...data, ...fullResponse];
      } else {
        data = fullResponse;
      }
      return {
        ...prev,
        [key]: data,
      };
    });
  };

  return {
    post,
  };
}
