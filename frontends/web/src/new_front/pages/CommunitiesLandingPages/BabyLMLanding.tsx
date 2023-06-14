import React, { FC } from "react";
import useTasks from "../../hooks/useTasks";
import TaskCard from "../../components/Cards/TaskCard";

const BabyLMLandingOverview = () => {
  return (
    <>
      <div className="bg-[#e0e0e0] p-8  text-left rounded-md">
        <p className="text-lg">
          <strong> Summary:</strong> This shared task challenges community
          members to train a language model from scratch on the same amount of
          linguistic data available to a child. Submissions should be
          implemented in Huggingface's Transformers library and will be
          evaluated on a shared pipeline. This shared task is co-sponsored by
          <a href="https://cmclorg.github.io/"> CMCL</a> and
          <a href="https://www.conll.org/"> CoNLL.</a>
        </p>
        <ul className="list-disc list-inside text-lg">
          <li className="p-2">
            {" "}
            <a href="https://github.com/babylm/babylm.github.io/raw/main/babylm_data.zip">
              Download Dataset (700MB unzipped)
            </a>
          </li>
          <li className="p-2">
            Evaluate your model using our{" "}
            <a href="https://github.com/babylm/evaluation-pipeline">
              evaluation pipeline
            </a>
          </li>
          <li className="p-2">Models and results due July 15, 2023</li>
          <li className="p-2">Paper submission due August 1, 2023</li>
        </ul>
        <p className="text-lg">
          See the guidelines for an overview of submission tracks and
          pretraining data. See the call for papers for a detailed description
          of the task setup and data.
          <br />
          <br />
          Consider joining the BabyLM Slack if you have any questions for the
          organizers or want to connect with other participants!
        </p>
      </div>
      <div className="text-left">
        <h2 className="py-4 text-4xl font-thin text-[#0066ff]">Overview</h2>
        <div className="grid grid-cols-2">
          <div className="col-span-1">
            <p className="text-left text-lg">
              Huge effort has been put into optimizing LM pretraining at massive
              scales in the last several years. While growing parameter counts
              often get the most attention, datasets have also grown by orders
              of magnitude. For example,{" "}
              <a href="https://arxiv.org/abs/2203.15556v1">Chinchilla</a> sees
              1.4 trillion words during training---well over 10000 words for
              every one word a 13 year old child has heard in their entire life.
              <br />
              <br />
              The goal of this shared task is to incentivize researchers with an
              interest in pretraining or cognitive modeling to focus their
              efforts on optimizing pretraining given data limitations inspired
              by human development. <br />
              <br /> Additionally, we hope to democratize research on
              pretraining—which is typically thought to be practical only for
              large industry groups—by drawing attention to open problems that
              can be addressed on a university budget.
            </p>
          </div>
          <div className="p-6">
            <img
              src="https://babylm.github.io/images/model_sizes.png"
              alt="models"
            />
          </div>
        </div>
        <p></p>
      </div>
      <div className="text-left">
        <h2 className="py-4 text-4xl font-thin text-[#0066ff] ">
          Why &lt; 100 Million Words?
        </h2>
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <p className="text-left text-lg">
              Focusing on scaled down pretraining has several potential
              benefits: First, small scale pretraining can be a sandbox for
              developing novel techniques for improving data efficiency. These
              techniques have the potential to then scale up to larger scales
              commonly seen in applied NLP or used to enhance current approaches
              to modeling low-resource languages.
              <br />
              <br />
              Second, improving our ability to train LMs on the same kinds and
              quantities of data that humans learn from hopefully will give us
              greater access to plausible cognitive models of humans and help us
              understand what allows humans to acquire language so efficiently.
            </p>
          </div>
        </div>
        <p></p>
      </div>
      <div className="text-left">
        <h2 className="py-4 text-4xl font-thin  text-[#0066ff]">
          Organization Team
        </h2>
        <div className="grid grid-cols-3 py-4">
          <div className="col-span-1">
            <ul className="list-disc list-inside text-left pb-8 text-xl">
              <li className="pb-2">Leshem Choshen</li>
              <li className="pb-2">Ryan Cotterell</li>
              <li className="pb-2">Kundan Krishna</li>
              <li className="pb-2">Tal Linzen</li>
            </ul>
          </div>
          <div className="col-span-1">
            <ul className="list-disc list-inside text-left pb-8 text-xl">
              <li className="pb-2">Haokun Liu</li>
              <li className="pb-2">Aaron Mueller</li>
              <li className="pb-2">Alex Warstadt</li>
              <li className="pb-2">Ethan Wilcox</li>
            </ul>
          </div>
          <div className="col-span-1">
            <ul className="list-disc list-inside text-left pb-8 text-xl">
              <li className="pb-2">Adina Williams</li>
              <li className="pb-2">Chengxu Zhuang</li>
            </ul>
          </div>
        </div>
        <p></p>
      </div>
    </>
  );
};

const BabyLMLandingFAQ = () => {
  const questionsAnswers = [
    {
      question: "Can papers be submitted to multiple tracks?",
      answer:
        "Yes. For example, a single paper can describe models which are submitted separately to the strict and strict-small tracks.",
    },
    {
      question: "Can I submit a paper about my work?",
      answer:
        "Yes, we encourage all participants to submit their reports, which will be published in the proceedings of CoNLL. You may also describe any additional experiments beyond those required for the shared task evaluation.",
    },
    {
      question: "Can I submit additional evaluation metrics?",
      answer:
        "Yes, if you wish to submit your own evaluation metrics, along with model performance. These will be considered alongside our standardized evaluation results as part of the holistic evaluation in the loose track.",
    },
    {
      question: "What training regimes are permitted?      ",
      answer:
        "For the strict and strict-small tracks, any kind of training objective/regime is permitted, as long as the data restrictions are followed. Pretrained models may not be used for any purpose such as reranking or data augmentation. We do however require for evaluation purposes that the model provides a function to score a sequence---e.g., log-likelihood for autoregressive models or pseudo-log-likelihood for masked language models---without the need for additional fine-tuning.      ",
    },
    {
      question: "Are there any limits on hyperparameters or model scale?      ",
      answer:
        "No. In the loose track, parameter efficiency and training efficiency may be considered along with other factors in ranking submissions, but we do not impose any hard limits.      ",
    },
    {
      question: "Are there any limits on the number of epochs?     ",
      answer:
        "No. We put no restrictions on the number of epochs, for several reasons: First, from an engineering perspective, training LMs with SGD tends to require multiple epochs at these scales to achieve peak performance. Second, from a cognitive perspective, humans have a memory of linguistic experience, and can continue to access and learn from these memories. Third, we aim not to take a stand on implementation details to allow the most freedom for innovation.      ",
    },
    {
      question:
        "Are we allowed to use annotations from outside systems that rely on expert-annotated data, like POS taggers?      ",
      answer:
        "For the strict and strict-small tracks, we do not allow any systems that are trained on outside data, especially if they rely on expert-annotated data. However, if it is a hard-coded inductive bias that (for example) clusters words into n categories in an unsupervised manner, or relies on some outside clustering system trained only on the strict(-small) dataset, this is allowed. We allow systems that annotate (but do not augment) the pretraining dataset, and which are either hard-coded heuristics or trained systems that rely only on the pretraining data we release.      ",
    },
    {
      question:
        "Are we allowed to evaluate our model on outside benchmarks and use these results to select our model's hyperparameters?      ",
      answer: "Yes",
    },
  ];

  return (
    <>
      <div className="px-6">
        {questionsAnswers.map((qa, i) => {
          return (
            <div key={i} className="py-3 text-left">
              <h3 className="text-xl text-letter font-bold pb-2">
                {qa.question}
              </h3>
              <p className="text-xl text-letter">{qa.answer}</p>
            </div>
          );
        })}
      </div>
    </>
  );
};

const BabyLMLanding: FC = () => {
  const { tasksData, tasksCategories } = useTasks();
  const [openTab, setOpenTab] = React.useState(1);

  return (
    <div className="container text-center d-block">
      <div className="h-46">
        <h2 className="pt-4 text-6xl font-thin text-letter">BabyLM</h2>
        <h5 className="text-xl font-thin text-letter">
          Sample-efficient pretraining on a developmentally plausible corpus
        </h5>
      </div>
      <div>
        <div>
          <ul
            className="flex flex-row flex-wrap w-full pb-4 mb-0 list-none"
            role="tablist"
          >
            <li className="flex-auto mr-2 -mb-px text-center last:mr-0">
              <a
                className="relative block p-4"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(1);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <span
                  className={
                    "absolute inset-x-0 -bottom-px h-px w-full" +
                    (openTab === 1 ? " bg-primary-color" : "")
                  }
                ></span>
                <div className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span className="ml-3 text-base font-medium text-gray-900">
                    Challenges
                  </span>
                </div>
              </a>
            </li>
            <li className="flex-auto mr-2 -mb-px text-center last:mr-0">
              <a
                className="relative block p-4"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(2);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <span
                  className={
                    "absolute inset-x-0 -bottom-px h-px w-full" +
                    (openTab === 2 ? " bg-primary-color" : "")
                  }
                ></span>
                <div className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span className="ml-3 text-base font-medium text-gray-900">
                    Overview
                  </span>
                </div>
              </a>
            </li>
            <li className="flex-auto mr-2 -mb-px text-center last:mr-0">
              <a
                className="relative block p-4"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(3);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <span
                  className={
                    "absolute inset-x-0 -bottom-px h-px w-full" +
                    (openTab === 3 ? " bg-primary-color" : "")
                  }
                ></span>
                <div className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span className="ml-3 text-base font-medium text-gray-900">
                    FAQs
                  </span>
                </div>
              </a>
            </li>
          </ul>
        </div>
        <div className="pt-4">
          <div className="tab-content tab-space">
            <div className={openTab === 1 ? "block" : "hidden"} id="link1">
              <div
                className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                key="Dataperf"
              >
                {tasksData
                  .filter((t) => t.challenge_type === 3)
                  .map((task) => (
                    <div key={task.id}>
                      <TaskCard
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
              </div>
            </div>
            <div className={openTab === 2 ? "block" : "hidden"} id="link2">
              <BabyLMLandingOverview />
            </div>
            <div className={openTab === 3 ? "block" : "hidden"} id="link2">
              <BabyLMLandingFAQ />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabyLMLanding;
