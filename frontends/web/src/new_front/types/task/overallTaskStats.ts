export type OverallTaskStatsProps = {
  curRound: number;
  round: RoundProps;
  lastUpdated: string;
};

export type RoundProps = {
  total_fooled: number;
  total_collected: number;
  total_verified_fooled: number;
};
