export type PoolDetails = {
  question: string;
  sponsor: string;
  totalPrincipal: bigint;
  bettingEndTime: bigint;
  participantCount: bigint;
  isSettled: boolean;
  winningOutcomeId: bigint;
  totalYield: bigint;
};
