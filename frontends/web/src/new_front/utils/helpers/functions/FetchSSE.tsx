import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
class RetriableError extends Error {}

type FetchType<TData> = {
  post: (props: FetchProps<TData>) => Promise<void>;
  clear: () => void;
};

type FetchProps<TData> = {
  url: string;
  body: any;
  setSaveData: (value: any) => void;
  setExternalLoading?: (value: boolean) => void;
  firstMessage: boolean;
  setFirstMessage: (value: boolean) => void;
  setAllowsGeneration: (value: boolean) => void;
  setIsGenerativeContext: (value: boolean) => void;
};

type cacheObject = {
  [key: string]: any;
};

function useFetchSSE<TData = unknown>(baseUrl: string): FetchType<TData> {
  const abortController = new AbortController();
  const [cacheMemory, setCacheMemory] = useState<cacheObject>({});
  const [amountMessages, setAmountMessages] = useState<number>(0);

  const UseFetch = async ({
    url,
    body,
    setSaveData,
    setExternalLoading,
    firstMessage,
    setFirstMessage,
    setAllowsGeneration,
    setIsGenerativeContext,
  }: FetchProps<TData>) => {
    const fullUrl = new URL(url, baseUrl);
    setExternalLoading && setExternalLoading(true);
    setIsGenerativeContext && setIsGenerativeContext(true);
    await fetchEventSource(fullUrl.toString(), {
      body: JSON.stringify(body),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
      async onopen(response) {
        await checkErrorResponse(response);
        setSaveData && setSaveData([]);
        setAllowsGeneration && setAllowsGeneration(false);
      },
      onmessage: (ev) => {
        if (!firstMessage) {
          setExternalLoading && setExternalLoading(false);
          setFirstMessage && setFirstMessage(true);
        }
        if (ev && Object.keys(ev.data).length !== 0) {
          persist(body, ev.data as TData);
          setSaveData((prev: any) => [...prev, ...JSON.parse(ev.data)] as any);
        }
        setAmountMessages((prev) => prev + 1);
        if (amountMessages === 3) {
          abortController.abort();
        }
      },
      onclose: () => {
        setExternalLoading && setExternalLoading(false);
        setFirstMessage && setFirstMessage(false);
        setAllowsGeneration && setAllowsGeneration(true);
      },
      onerror(error) {
        setExternalLoading && setExternalLoading(false);
        setFirstMessage && setFirstMessage(false);
        setAllowsGeneration && setAllowsGeneration(true);
        console.log("Error", error);
      },
    });
  };

  const post = async ({
    url,
    body,
    setSaveData,
    setExternalLoading,
    firstMessage,
    setFirstMessage,
    setAllowsGeneration,
    setIsGenerativeContext,
  }: FetchProps<TData>) => {
    const cachedResponse = checkCachedRequest(
      body.artifacts.prompt.replace(/"|'/g, ""),
    );
    if (cachedResponse) {
      setSaveData(cachedResponse);
    } else {
      await UseFetch({
        url,
        body,
        setSaveData,
        setExternalLoading,
        firstMessage,
        setFirstMessage,
        setAllowsGeneration,
        setIsGenerativeContext,
      });
    }
  };

  const checkErrorResponse = async (resp: Response) => {
    switch (resp.status) {
      case 400:
      case 401:
      case 500:
      case 404:
        console.log("Error");
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });

        break;
      default:
        break;
    }
  };

  const persist = (body: any, res: TData) => {
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

  const checkCachedRequest = (key: string) => {
    const data = cacheMemory[key];
    if (data) {
      return data;
    }
    return null;
  };

  const clear = () => {
    setCacheMemory({});
  };

  return {
    post,
    clear,
  };
}

export default useFetchSSE;
