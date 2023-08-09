import { fetchEventSource } from "@microsoft/fetch-event-source";
import Swal from "sweetalert2";

type FetchType<TData> = {
  post: (props: FetchProps<TData>) => Promise<void>;
  clear: () => void;
};

type FetchProps<TData> = {
  url: string;
  body: any;
  setSaveData: (value: any) => void;
  setExternalLoading?: (value: boolean) => void;
  firstMessage?: boolean;
  setFirstMessage?: (value: boolean) => void;
  setAllowsGeneration?: (value: boolean) => void;
};

function useFetchSSE<TData = unknown>(baseUrl: string): FetchType<TData> {
  const CACHE_PREFIX = "cache_";

  const UseFetch = async ({
    url,
    body,
    setSaveData,
    setExternalLoading,
    firstMessage,
    setFirstMessage,
    setAllowsGeneration,
  }: FetchProps<TData>) => {
    const fullUrl = new URL(url, baseUrl);
    setExternalLoading && setExternalLoading(true);
    await fetchEventSource(fullUrl.toString(), {
      body: JSON.stringify(body),
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      },
      onclose: () => {
        setExternalLoading && setExternalLoading(false);
        setFirstMessage && setFirstMessage(false);
        setAllowsGeneration && setAllowsGeneration(true);
      },
      onerror(err) {
        setExternalLoading && setExternalLoading(false);
        setFirstMessage && setFirstMessage(false);
        setAllowsGeneration && setAllowsGeneration(true);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
        throw err;
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

  const checkCachedRequest = (key: string) => {
    const data = sessionStorage.getItem(CACHE_PREFIX + key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  };

  const generateKey = (key: string) => {
    return CACHE_PREFIX + key;
  };

  const persist = (body: any, res: TData) => {
    const key = body.artifacts.prompt.replace(/"|'/g, "");
    const data = sessionStorage.getItem(CACHE_PREFIX + key);
    const fullResponse = [];
    if (data) {
      const localData = JSON.parse(data);
      for (const d of localData) {
        fullResponse.push(d);
      }
    }
    fullResponse.push(...JSON.parse(res as any));
    sessionStorage.setItem(generateKey(key), JSON.stringify(fullResponse));
  };

  const clear = () => {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.includes(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  };

  return {
    post,
    clear,
  };
}

export default useFetchSSE;
