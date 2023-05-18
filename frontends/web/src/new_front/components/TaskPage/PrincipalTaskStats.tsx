import React, { FC } from "react";

type PrincipalTaskStatsProps = {
  totalCollected?: any;
  totalRounds?: any;
  maxScore?: number;
  amountOfModels?: number;
};

const PrincipalTaskStats: FC<PrincipalTaskStatsProps> = ({
  totalCollected,
  totalRounds,
  maxScore,
  amountOfModels,
}) => {
  return (
    <div className="grid grid-rows-2 pl-32">
      <div className="grid items-center justify-end grid-cols-2 px-8 py-4">
        {totalRounds !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{totalRounds}</h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              Rounds
            </p>
          </div>
        )}
        {totalCollected !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{totalCollected}</h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              Examples
            </p>
          </div>
        )}
      </div>
      <div className="grid items-center justify-end grid-cols-2 px-8 py-4">
        {maxScore !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">
              {maxScore!.toFixed(2)}
            </h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              Max score
            </p>
          </div>
        )}
        {amountOfModels !== 0 && (
          <div className="text-center ">
            <h6 className="text-3xl font-bold text-white">{amountOfModels}</h6>
            <p className="text-sm font-medium tracking-widest text-white uppercase ">
              Submissions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalTaskStats;
