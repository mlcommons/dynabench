import React, { FC, useContext, useState, useEffect } from "react";
import useFetch from "use-http";
import UserContext from "containers/UserContext";
import Swal from "sweetalert2";
import { PacmanLoader } from "react-spinners";
import { UserInfoProps, UserStatsProps } from "new_front/types/user/userInfo";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";
import { Link } from "react-scroll";
import Carousel from "react-multi-carousel";
import BadgetsCard from "new_front/components/Cards/BadgetsCard";
import { TaskInfoType } from "new_front/types/task/taskInfo";
import { responsiveCarousel } from "new_front/utils/constants";
import TaskCard from "new_front/components/Cards/TaskCard";
import { TaskCategories } from "new_front/types/task/taskCategories";
import ExamplesCreated from "new_front/pages/ProfilePage/ExamplesCreated";
import ModelsTable from "new_front/components/Tables/ModelsTable";
import { ModelsInfo } from "new_front/types/model/modelInfo";
import { useHistory } from "react-router-dom";

type Props = {
  userName: string;
  affiliation: string;
};

const ProfilePage: FC<Props> = () => {
  const [userInfo, setUserInfo] = useState<UserInfoProps>({} as UserInfoProps);
  const [userStats, setUserStats] = useState<UserStatsProps>(
    {} as UserStatsProps,
  );
  const [modelsInfo, setModelsInfo] = useState<ModelsInfo[]>(
    [] as ModelsInfo[],
  );
  const [tasksCategories, setTasksCategories] = useState<TaskCategories[]>([]);
  const [tasksInfo, setTasksInfo] = useState<TaskInfoType[]>(
    [] as TaskInfoType[],
  );
  const { user } = useContext(UserContext);
  const { get, response, loading } = useFetch();
  const history = useHistory();

  const userId = user.id;
  const getUserInfo = async () => {
    if (!userId) {
      return;
    }
    const [userInfo, tasksInfo, modelsInfo, userStats] = await Promise.all([
      get(`/user/get_user_with_badges/${userId}`),
      get(`/task/get_active_tasks_by_user_id/${userId}`),
      get(`/model/get_models_by_user_id/${userId}`),
      get(`/user/get_stats_by_user_id/${userId}`),
    ]);
    if (response.ok) {
      setUserInfo(userInfo);
      setTasksInfo(tasksInfo);
      setModelsInfo(modelsInfo);
      setUserStats(userStats);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  const handleData = async () => {
    const isLogin = await checkUserIsLoggedIn(history, `/account`, null, null);
    if (isLogin) {
      getUserInfo();
    }
  };

  useEffect(() => {
    handleData();
  }, [userId]);

  useEffect(() => {
    localStorage.removeItem("originalPath");
  }, []);

  return (
    <>
      {!loading && user ? (
        <div className="bg-gradient-to-b from-white via-[#ccebd44d] to-white">
          <div className="container flex flex-col items-center justify-center ">
            <div>
              <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 ">
                <div className="flex flex-col items-center justify-center ">
                  <h2 className="text-5xl font-bold text-center text-letter-color">
                    Welcome {userInfo!.username}!
                  </h2>
                  <ul className="flex flex-col items-center justify-center">
                    <li className="text-xl font-bold leading-tight text-letter-color">
                      {userInfo!.affiliation}
                    </li>
                  </ul>
                  <div className="grid grid-cols-4 px-4 pt-2">
                    <div className="">
                      <div className="p-8">
                        <h4 className="text-4xl font-bold text-center text-letter-color">
                          {userStats!.total_examples}
                        </h4>
                        <p className="text-lg font-medium leading-tight text-center text-third-color">
                          <Link
                            activeClass="active"
                            className="font-bold no-underline cursor-pointer"
                            to="examples"
                            spy={true}
                            smooth={true}
                            offset={-70}
                            duration={500}
                          >
                            Total examples
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="">
                      <div className="p-8">
                        <h4 className="text-4xl font-bold text-center text-letter-color">
                          {userStats!.total_validations}
                        </h4>
                        <p className="text-lg font-medium leading-tight text-center text-third-color">
                          Total validation examples
                        </p>
                      </div>
                    </div>
                    <div className="">
                      <div className="p-8">
                        <h4 className="text-4xl font-bold text-center text-letter-color">
                          {userStats!.total_models}
                        </h4>
                        <p className="text-lg font-medium leading-tight text-center text-third-color">
                          <Link
                            activeClass="active"
                            className="font-bold no-underline cursor-pointer"
                            to="models"
                            spy={true}
                            smooth={true}
                            offset={-70}
                            duration={500}
                          >
                            Models
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="">
                      <div className="p-8">
                        <h4 className="text-4xl font-bold text-center text-letter-color">
                          {(userStats.model_fooling_rate * 100).toFixed(0)}%
                        </h4>
                        <p className="text-lg font-medium leading-tight text-center text-third-color">
                          Model fooling rate
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                to="models"
                spy={true}
                smooth={true}
                offset={-70}
                duration={1500}
                className="py-2"
              >
                <a
                  href="/text"
                  aria-label="Scroll down"
                  className="flex items-center justify-center w-8 h-8 mx-auto text-gray-600 duration-300 transform border border-gray-400 rounded-full hover:text-deep-purple-accent-400 hover:border-deep-purple-accent-400 hover:shadow hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M10.293,3.293,6,7.586,1.707,3.293A1,1,0,0,0,.293,4.707l5,5a1,1,0,0,0,1.414,0l5-5a1,1,0,1,0-1.414-1.414Z" />
                  </svg>
                </a>
              </Link>
            </div>
            <div className="container flex flex-col justify-center w-full h-full mx-auto max-w-7xl">
              <div id="challenges">
                <h4 className="justify-start py-4 text-4xl font-bold text-letter-color">
                  Your Challenges
                </h4>
                <div className="container flex flex-col justify-center w-full h-full mx-auto max-w-7xl">
                  <Carousel responsive={responsiveCarousel} key="tasks">
                    {tasksInfo.map((task) => (
                      <div key={task.id} className="px-2 py-2">
                        <TaskCard
                          key={task.id}
                          id={task.id}
                          name={task.name}
                          description={task.desc}
                          curRound={task.cur_round}
                          totalCollected={task.round.total_collected}
                          totalFooled={task.round.total_fooled}
                          taskCode={task.task_code}
                          imageUrl={task.image_url}
                          tasksCategories={tasksCategories}
                          isBuilding={task.is_building}
                          isFinished={task.is_finished}
                        />
                      </div>
                    ))}
                  </Carousel>
                </div>
              </div>
              <div id="badges" className="pt-16">
                <h4 className="justify-start py-8 text-4xl font-bold text-letter-color">
                  Badges
                </h4>
                <BadgetsCard badges={userInfo!.badges} />
              </div>
              <div id="models" className="pt-16">
                <h4 className="justify-start py-8 text-4xl font-bold text-letter-color">
                  Models
                </h4>
                <ModelsTable modelsInfo={modelsInfo} />
              </div>
              <div id="examples" className="pt-16 pb-72">
                <h4 className="justify-start py-4 text-4xl font-bold text-letter-color">
                  Examples
                </h4>
                <ExamplesCreated />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </>
  );
};

export default ProfilePage;
