import React from "react";
import PairLanguageLeaderboard from "new_front/components/Tables/Leaderboard/PairLanguageLeaderboard";

type MultipleLeaderboardProps = {
  taskCode: string;
};

const MultipleLeaderboard = ({ taskCode }: MultipleLeaderboardProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PairLanguageLeaderboard />
    </div>
  );
};

export default MultipleLeaderboard;
