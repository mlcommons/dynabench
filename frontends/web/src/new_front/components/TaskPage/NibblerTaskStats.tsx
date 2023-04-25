import React, { FC } from "react";

type NibblerTaskStatsProps = {
  totalRounds?: any;
  amountOfModels?: number;
};

const NibblerTaskStats: FC<NibblerTaskStatsProps> = ({
  totalRounds,
  amountOfModels,
}) => {
  return (
    <div className="grid grid-rows-1 pl-32">
      <div className="grid items-center justify-end grid-cols-1 px-8 py-4">
        <div className="text-center ">
          <h6 className="text-3xl font-bold text-white">{totalRounds}</h6>
          <p className="text-sm font-medium tracking-widest text-white uppercase ">
            Rounds
          </p>
        </div>
      </div>
      <div className="text-center ">
        <h6 className="text-3xl font-bold text-white">{amountOfModels}</h6>
        <p className="text-sm font-medium tracking-widest text-white uppercase ">
          Submissions
        </p>
      </div>
    </div>
  );
};

export default NibblerTaskStats;
