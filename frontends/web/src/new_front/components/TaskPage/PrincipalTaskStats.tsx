import React, { FC, useEffect, useState } from "react";
import useFetch from "use-http";
import { useTranslation } from "react-i18next";

import DropDownStats from "new_front/components/Inputs/DropDownStats";

type PrincipalTaskStatsProps = {
  totalCollected?: any;
  totalRounds?: any;
  maxScore?: number;
  amountOfModels?: number;
  taskId?: number;
};

const PrincipalTaskStats: FC<PrincipalTaskStatsProps> = ({
  totalCollected,
  totalRounds,
  maxScore,
  amountOfModels,
  taskId,
}) => {
  const [selectedRound, setSelectedRound] = useState(totalRounds);
  const [totalExamples, setTotalExamples] = useState(totalCollected);

  const { get, response } = useFetch();

  const { t } = useTranslation();

  const getAmountOfExamplesPerRound = async () => {
    const amountOfExamples = await get(
      `/round/get_examples_collected_per_round/${selectedRound}-${taskId}`
    );
    if (response.ok) {
      setTotalExamples(amountOfExamples);
    }
  };

  useEffect(() => {
    getAmountOfExamplesPerRound();
  }, [selectedRound]);

  return (
    <div className="pl-32 md:grid md:grid-rows-2">
      <div className="grid items-center justify-end px-8 py-4 gap-y-8 md:grid-cols-2">
        {totalRounds !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{selectedRound}</h6>
            <DropDownStats
              options={Array.from({ length: totalRounds }, (_, i) => i + 1)}
              placeholder={t("tasks:information.rounds")}
              onChange={setSelectedRound}
            />
          </div>
        )}
        {totalCollected !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{totalExamples}</h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              {t("tasks:information.examples")}
            </p>
          </div>
        )}
      </div>
      <div className="grid items-center justify-end px-8 py-4 md:grid-cols-2">
        {maxScore !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">
              {maxScore!.toFixed(2)}
            </h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              {t("tasks:information.topScore")}
            </p>
          </div>
        )}
        {amountOfModels !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{amountOfModels}</h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              {t("tasks:information.submissions")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalTaskStats;
