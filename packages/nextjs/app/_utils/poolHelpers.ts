// Helper function to format time remaining
export const formatTimeRemaining = (endTime: bigint | null | undefined): string => {
  if (endTime === null || endTime === undefined) {
    return "Loading...";
  }

  const currentTime = BigInt(Math.floor(Date.now() / 1000));

  if (endTime <= currentTime) {
    return "Ended";
  }

  // Calculate the difference in seconds as a BigInt
  const diff: bigint = endTime - currentTime;

  // Convert BigInt to number safely via string conversion
  const remainingSeconds: number = parseInt(diff.toString(), 10);

  const secondsInDay = 86400;
  const secondsInHour = 3600;
  const secondsInMinute = 60;

  const days = Math.floor(remainingSeconds / secondsInDay);
  const hours = Math.floor((remainingSeconds % secondsInDay) / secondsInHour);
  const minutes = Math.floor((remainingSeconds % secondsInHour) / secondsInMinute);
  const seconds = remainingSeconds % secondsInMinute;

  if (days > 0) return `${days}d:${hours}h:${seconds}s`;
  if (hours > 0) return `${hours}h:${minutes}m:${seconds}s`;
  return `${minutes}m:${seconds}s`;
};

// Helper function to check if pool data is valid (not a ghost/empty pool)
export const isValidPool = (details: any, expectedId: number): boolean => {
  if (!details) return false;

  // Handle tuple return type from contract (array with indexed values)
  const poolId = details[0] !== undefined ? Number(details[0]) : details.poolId ? Number(details.poolId) : 0;
  const question = details[1] !== undefined ? details[1] : details.question || "";
  const sponsor = details[2] !== undefined ? String(details[2]) : String(details.sponsor || "");

  // Check if poolId matches expected ID (non-existent pools return 0)
  if (poolId !== expectedId || poolId === 0) return false;

  // Check if sponsor is not zero address
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  if (!sponsor || sponsor.toLowerCase() === zeroAddress.toLowerCase()) return false;

  // Check if question is not empty
  if (!question || (typeof question === "string" && question.trim() === "")) return false;

  return true;
};

// Helper function to extract pool details from contract response
export const extractPoolDetails = (details: any) => {
  return {
    question: details[1] !== undefined ? details[1] : details.question || "",
    sponsor: String(details[2] !== undefined ? details[2] : details.sponsor || ""),
    totalPrincipal: BigInt(details[5] !== undefined ? details[5] : details.totalPrincipal || 0),
    bettingEndTime: BigInt(details[6] !== undefined ? details[6] : details.bettingEndTime || 0),
    participantCount: BigInt(details[4] !== undefined ? details[4] : details.participantCount || 0),
    isSettled:
      details[7] !== undefined
        ? details[7]
        : details.settled !== undefined
          ? details.settled
          : details.isSettled || false,
    winningOutcomeId: BigInt(details[8] !== undefined ? details[8] : details.winningOutcomeId || 0),
    totalYield: BigInt(details[9] !== undefined ? details[9] : details.totalYield || 0),
  };
};
