// import ExamplesCreatedStrategy from 'new_front/components/ProfilePage/ExamplesCreated/Contexts/ExamplesCreatedStrategy'
import { ValidationConfigurationTask } from "new_front/types/createSamples/createSamples/configurationTask";
import React, { FC, useContext, useEffect, useState } from "react";
import { PacmanLoader } from "react-spinners";
import useFetch from "use-http";
import ExamplesCreatedStrategy from "./Contexts/ExamplesCreatedStrategy";
import Carousel from "react-grid-carousel";
import Swal from "sweetalert2";
import UserContext from "containers/UserContext";

type ExampleCreatedProps = {
  taskId: number;
};

const ExampleCreated: FC<ExampleCreatedProps> = ({ taskId }) => {
  const [examplesCreated, setExamplesCreated] = useState<any[]>();
  const [validationConfigInfo, setValidationConfigInfo] =
    useState<ValidationConfigurationTask>();
  const { get, post, response, loading } = useFetch();
  const { user } = useContext(UserContext);

  const loadExampleData = async () => {
    const [validationConfigInfo, examplesCreated] = await Promise.all([
      get(`/example/get_validate_configuration?task_id=${taskId}`),
      post(`/example/download_created_examples_user`, {
        task_id: taskId,
        user_id: user.id,
        amount: 5,
      }),
    ]);
    if (response.ok) {
      setValidationConfigInfo(validationConfigInfo);
      setExamplesCreated(examplesCreated);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  useEffect(() => {
    loadExampleData();
  }, [taskId]);

  return (
    <>
      {validationConfigInfo && examplesCreated && !loading ? (
        <>
          <div className="container p-3 py-6">
            <h3 className="flex justify-center pt-8 pb-6 pl-16 text-2xl font-bold">
              Examples created by you
            </h3>
            <div className="w-9/12 py-16 mx-auto ">
              <Carousel cols={1} rows={1} loop>
                {examplesCreated.map((example) => (
                  <Carousel.Item>
                    <div className="flex justify-center">
                      <div>
                        <ExamplesCreatedStrategy
                          config={
                            validationConfigInfo?.validation_context as any
                          }
                          infoExampleToValidate={example.context_info}
                        />
                      </div>
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            </div>
          </div>
        </>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Data is being prepared, please wait...
          </div>
          <PacmanLoader
            color="#ccebd4"
            loading={loading}
            size={50}
            className="align-center"
          />
        </div>
      )}
    </>
  );
};

export default ExampleCreated;
