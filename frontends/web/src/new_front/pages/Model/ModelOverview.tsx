import React, { FC, useState, useEffect } from "react";
import { ReactComponent as Model } from "new_front/assets/model.svg";
import { AllModelsInfo } from "new_front/types/model/modelInfo";
import useFetch from "use-http";
import Swal from "sweetalert2";
import { Button } from "react-bootstrap";
import { any } from "prop-types";

type ModelOverviewProps = {
  modelId?: number;
};

const ModelOverview: FC<ModelOverviewProps> = () => {
  const modelId = 1199;

  const [modelInfo, setModelInfo] = useState<AllModelsInfo>(
    {} as AllModelsInfo
  );
  const { get, response, loading } = useFetch();

  const getModelInfo = async () => {
    const modelInfo = await get(`/model/get_all_model_info_by_id/${modelId}`);
    if (response.ok) {
      setModelInfo(modelInfo);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  // useEffect(() => {
  //   getModelInfo()
  // }, [modelId])

  return (
    <></>
    // <div className="bg-gradient-to-b from-white to-[#ccebd44d] flex flex-col justify-center h-screen ">
    //   <div className="relative flex flex-col p-16 md:flex-row md:space-x-5 space-y-3 md:space-y-0 rounded-xl shadow-lg  max-w-xs md:max-w-4xl mx-auto border border-white bg-white">
    //     <div className="w-full md:w-1/3 grid place-items-center">
    //       <Model className="w-full h-full" />
    //     </div>
    //     <div className="w-full md:w-2/3 bg-white flex flex-col space-y-2 p-3">
    //       <div className="flex justify-between item-center">
    //         <p className="text-letter-color font-bold hidden md:block truncate">
    //           2021-09-01
    //         </p>
    //         <div className="flex items-center">
    //           <svg
    //             xmlns="http://www.w3.org/2000/svg"
    //             className="h-5 w-5 text-yellow-500"
    //             viewBox="0 0 20 20"
    //             fill="currentColor"
    //           >
    //             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    //           </svg>
    //           <p className="text-letter-color font-bold text-sm ml-1">
    //             4.96% &nbsp;
    //             <span className="text-letter-color font-normal">
    //               (General score)
    //             </span>
    //           </p>
    //         </div>

    //         <div className="bg-green-200 px-3 py-1 rounded-full text-sm font-medium text-gray-800 hidden md:block">
    //           Deployed
    //         </div>
    //       </div>
    //       <h3 className="font-black text-gray-800 md:text-3xl text-xl">
    //         Model test
    //       </h3>
    //       <p className="text-letter-color text-lg">
    //         Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae
    //         cupiditate incidunt in sapiente?
    //       </p>
    //       <p className="text-letter-color text-base">
    //         Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quidem
    //         modi ad ut praesentium sed dolor labore reiciendis aperiam ullam
    //         sint facilis, excepturi officiis, soluta molestiae numquam dolorum
    //         vel, animi possimus.
    //       </p>
    //       <h6>
    //         <span className="text-letter-color font-bold text-xl">Data</span>
    //       </h6>
    //       <ul
    //         className="
    //         grid grid-cols-2 gap-2 text-letter-color
    //       "
    //       >
    //         <li>
    //           <strong>Community:</strong> Flores
    //         </li>
    //         <li>
    //           <strong>Task:</strong> Flores MT Evaluation (Small task 1)
    //         </li>
    //         <li>
    //           <strong>Params:</strong> 10000000
    //         </li>
    //         <li>
    //           <strong>Languagues:</strong> English, Spanish
    //         </li>
    //       </ul>
    //       <div className="flex justify-between items-center pt-8 gap-2">
    //         <Button className="px-4 text-lg border-0 bg-primary-color font-semibold">
    //           Update
    //         </Button>
    //         <Button className="px-4 text-lg border-0 bg-letter-color font-medium text-white hover:bg-letter-color hover:text-white">
    //           Predictions
    //         </Button>
    //         <Button className="px-4 text-lg border-0 bg-third-color font-medium text-white hover:bg-third-color hover:text-white">
    //           Publish
    //         </Button>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default ModelOverview;
