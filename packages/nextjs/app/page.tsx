"use client";

import { useEffect, useState } from "react";
import { Address, EtherInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Pool structure type (adjust based on actual contract return type)
type PoolDetails = {
  question: string;
  sponsor: string;
  totalPrincipal: bigint;
  bettingEndTime: bigint;
  participantCount: bigint;
  isSettled: boolean;
  winningOutcomeId: bigint;
  totalYield: bigint;
};

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // State for pool creation
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState("");
  const [sponsorDeposit, setSponsorDeposit] = useState("");

  // State for pool joining
  const [selectedOutcome, setSelectedOutcome] = useState<{ [poolId: number]: number }>({});

  // State for pool settlement
  const [settlePoolId, setSettlePoolId] = useState<number | null>(null);
  const [winningOutcomeId, setWinningOutcomeId] = useState("1");
  const [simulatedYield, setSimulatedYield] = useState("");

  // State for claiming

  // Fetch nextPoolId to determine total pools
  const { data: nextPoolId } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "nextPoolId",
  });

  // Fetch TICKET_FEE constant
  const { data: ticketFee } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "TICKET_FEE",
  });

  // State to store active pools
  const [activePools, setActivePools] = useState<Array<{ id: number; details: PoolDetails | null }>>([]);
  const [settleablePools, setSettleablePools] = useState<Array<{ id: number; details: PoolDetails | null }>>([]);
  const [claimablePools, setClaimablePools] = useState<Array<{ id: number; details: PoolDetails | null }>>([]);

  // Fetch pool details for the most recent 3 pools
  // nextPoolId represents the next ID to be assigned, so existing pools are 0 to nextPoolId-1
  const poolId1 = nextPoolId && Number(nextPoolId) > 0 ? Number(nextPoolId) - 1 : null;
  const poolId2 = nextPoolId && Number(nextPoolId) > 1 ? Number(nextPoolId) - 2 : null;
  const poolId3 = nextPoolId && Number(nextPoolId) > 2 ? Number(nextPoolId) - 3 : null;

  const { data: pool1Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId1 !== null ? [BigInt(poolId1)] : (undefined as any),
    query: {
      enabled: poolId1 !== null,
    },
  });

  const { data: pool2Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId2 !== null ? [BigInt(poolId2)] : (undefined as any),
    query: {
      enabled: poolId2 !== null,
    },
  });

  const { data: pool3Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId3 !== null ? [BigInt(poolId3)] : (undefined as any),
    query: {
      enabled: poolId3 !== null,
    },
  });

  // Write hooks
  const { writeContractAsync: writeNoLossPoolAsync, isMining: isCreatingPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const { writeContractAsync: writeJoinPoolAsync, isMining: isJoiningPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const { writeContractAsync: writeSettlePoolAsync, isMining: isSettlingPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const { writeContractAsync: writeClaimFundsAsync, isMining: isClaimingFunds } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  // Update active pools when data changes
  useEffect(() => {
    const pools: Array<{ id: number; details: PoolDetails | null }> = [];

    // Helper function to check if pool data is valid (not a ghost/empty pool)
    const isValidPool = (details: any, expectedId: number): boolean => {
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
    const extractPoolDetails = (details: any): PoolDetails => {
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

    if (pool1Details && poolId1 !== null && isValidPool(pool1Details, poolId1)) {
      pools.push({ id: poolId1, details: extractPoolDetails(pool1Details) });
    }
    if (pool2Details && poolId2 !== null && isValidPool(pool2Details, poolId2)) {
      pools.push({ id: poolId2, details: extractPoolDetails(pool2Details) });
    }
    if (pool3Details && poolId3 !== null && isValidPool(pool3Details, poolId3)) {
      pools.push({ id: poolId3, details: extractPoolDetails(pool3Details) });
    }

    // Filter out null details and only show non-settled pools as active
    setActivePools(pools.filter(pool => pool.details && !pool.details.isSettled));

    // Separate settled pools for claiming
    const settled = pools.filter(pool => pool.details && pool.details.isSettled);

    // Filter settleable pools (where user is sponsor and bettingEndTime has passed)
    if (connectedAddress) {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const settleable = pools.filter(pool => {
        if (!pool.details || !pool.details.sponsor) return false;
        const sponsorAddress =
          typeof pool.details.sponsor === "string" ? pool.details.sponsor : String(pool.details.sponsor);
        return (
          sponsorAddress.toLowerCase() === connectedAddress.toLowerCase() &&
          pool.details.bettingEndTime < currentTime &&
          !pool.details.isSettled
        );
      });
      setSettleablePools(settleable);

      // Filter claimable pools (settled pools where user is sponsor or participant)
      // Note: In production, you'd also check hasClaimed mapping
      setClaimablePools(settled);
    } else {
      setSettleablePools([]);
      setClaimablePools([]);
    }
  }, [pool1Details, pool2Details, pool3Details, poolId1, poolId2, poolId3, connectedAddress]);

  // Handlers
  const handleCreatePool = async () => {
    if (!question || !duration || !sponsorDeposit) {
      notification.error("Please fill in all fields");
      return;
    }

    const depositAmount = parseFloat(sponsorDeposit);
    if (depositAmount < 0.1) {
      notification.error("Sponsor deposit must be at least 0.1 MON");
      return;
    }

    try {
      await writeNoLossPoolAsync({
        functionName: "createPool",
        args: [question, BigInt(duration)],
        value: parseEther(sponsorDeposit),
      });
      notification.success("Pool created successfully!");
      setQuestion("");
      setDuration("");
      setSponsorDeposit("");
    } catch (error: any) {
      notification.error(error?.message || "Failed to create pool");
    }
  };

  const handleJoinPool = async (poolId: number) => {
    const outcomeId = selectedOutcome[poolId];
    if (!outcomeId || (outcomeId !== 1 && outcomeId !== 2)) {
      notification.error("Please select an outcome (Yes or No)");
      return;
    }

    if (!ticketFee) {
      notification.error("Ticket fee not available");
      return;
    }

    try {
      await writeJoinPoolAsync({
        functionName: "joinPool",
        args: [BigInt(poolId), outcomeId] as [bigint, number],
        value: ticketFee,
      });
      notification.success("Successfully joined pool!");
      setSelectedOutcome({ ...selectedOutcome, [poolId]: 0 });
    } catch (error: any) {
      notification.error(error?.message || "Failed to join pool");
    }
  };

  const handleSettlePool = async () => {
    if (settlePoolId === null || !winningOutcomeId || !simulatedYield) {
      notification.error("Please fill in all fields");
      return;
    }

    const outcomeId = parseInt(winningOutcomeId);
    if (outcomeId !== 1 && outcomeId !== 2) {
      notification.error("Winning outcome must be 1 (Yes) or 2 (No)");
      return;
    }

    try {
      await writeSettlePoolAsync({
        functionName: "settlePool",
        args: [BigInt(settlePoolId), outcomeId, parseEther(simulatedYield)] as [bigint, number, bigint],
      });
      notification.success("Pool settled successfully!");
      setSettlePoolId(null);
      setWinningOutcomeId("1");
      setSimulatedYield("");
    } catch (error: any) {
      notification.error(error?.message || "Failed to settle pool");
    }
  };

  const handleClaimFunds = async (poolId: number) => {
    try {
      await writeClaimFundsAsync({
        functionName: "claimFunds",
        args: [BigInt(poolId)],
      });
      notification.success("Funds claimed successfully!");
    } catch (error: any) {
      notification.error(error?.message || "Failed to claim funds");
    }
  };
  // Helper function to format time remaining
  const formatTimeRemaining = (endTime: bigint | null | undefined): string => {
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

    const days = Math.floor(remainingSeconds / secondsInDay);
    const hours = Math.floor((remainingSeconds % secondsInDay) / secondsInHour);
    const minutes = Math.floor((remainingSeconds % secondsInHour) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">No-Loss Prediction Pool</h1>
          <p className="text-lg text-base-content/70">Monad Blitz - Predict, Participate, Win!</p>
          {connectedAddress && (
            <div className="mt-4">
              <p className="text-sm text-base-content/60">Connected:</p>
              <Address address={connectedAddress} />
            </div>
          )}
        </div>

        {/* Section 1: Pool Creation */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Create New Pool (Sponsor View)</h2>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Question</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Will Monad hit 100k TPS by EOY?"
                  className="input input-bordered w-full"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Betting Duration (seconds)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 86400 (24 hours)"
                  className="input input-bordered w-full"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Sponsor Deposit (MON)</span>
                  <span className="label-text-alt">Minimum: 0.1 MON</span>
                </label>
                <EtherInput
                  defaultValue={sponsorDeposit}
                  onValueChange={({ valueInEth }) => setSponsorDeposit(valueInEth || "")}
                  placeholder="0.1"
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleCreatePool}
                disabled={isCreatingPool || !connectedAddress}
              >
                {isCreatingPool ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Creating...
                  </>
                ) : (
                  "Create Pool"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Active Pools List */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Active Pools (Participant View)</h2>
            {activePools.length === 0 ? (
              <p className="text-center text-base-content/60 py-8">No active pools available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePools.map(pool => {
                  if (!pool.details) return null;
                  const timeRemaining = formatTimeRemaining(pool.details.bettingEndTime);
                  const isEnded = pool.details.bettingEndTime <= BigInt(Math.floor(Date.now() / 1000));

                  return (
                    <div key={pool.id} className="card bg-base-200 shadow-md">
                      <div className="card-body">
                        <h3 className="card-title text-lg">Pool #{pool.id}</h3>
                        <p className="text-sm font-semibold mb-2">{pool.details.question}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Sponsor:</span>
                            {pool.details.sponsor ? (
                              <Address address={String(pool.details.sponsor) as `0x${string}`} format="short" />
                            ) : (
                              <span className="text-base-content/60">N/A</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Total Principal:</span>
                            <span className="font-semibold">
                              {pool.details.totalPrincipal !== undefined && pool.details.totalPrincipal !== null
                                ? `${formatEther(pool.details.totalPrincipal)} ${targetNetwork.nativeCurrency?.symbol || "MON"}`
                                : "Loading..."}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Ends:</span>
                            <span className={isEnded ? "text-error" : "text-success"}>{timeRemaining}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Participants:</span>
                            <span className="font-semibold">
                              {pool.details.participantCount !== undefined && pool.details.participantCount !== null
                                ? Number(pool.details.participantCount)
                                : "Loading..."}
                            </span>
                          </div>
                        </div>
                        {!isEnded && connectedAddress && (
                          <div className="mt-4 space-y-2">
                            <div className="flex gap-2">
                              <button
                                className={`btn btn-sm flex-1 ${
                                  selectedOutcome[pool.id] === 1 ? "btn-primary" : "btn-outline"
                                }`}
                                onClick={() => setSelectedOutcome({ ...selectedOutcome, [pool.id]: 1 })}
                              >
                                Yes
                              </button>
                              <button
                                className={`btn btn-sm flex-1 ${
                                  selectedOutcome[pool.id] === 2 ? "btn-primary" : "btn-outline"
                                }`}
                                onClick={() => setSelectedOutcome({ ...selectedOutcome, [pool.id]: 2 })}
                              >
                                No
                              </button>
                            </div>
                            <button
                              className="btn btn-primary btn-sm w-full"
                              onClick={() => handleJoinPool(pool.id)}
                              disabled={isJoiningPool || !selectedOutcome[pool.id]}
                            >
                              {isJoiningPool ? (
                                <>
                                  <span className="loading loading-spinner loading-xs"></span>
                                  Joining...
                                </>
                              ) : (
                                `Join (${ticketFee ? formatEther(ticketFee) : "0.1"} ${targetNetwork.nativeCurrency.symbol})`
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Pool Settlement */}
        {connectedAddress && settleablePools.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Settle Pool (Sponsor Action)</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Select Pool to Settle</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={settlePoolId || ""}
                    onChange={e => setSettlePoolId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Choose a pool...</option>
                    {settleablePools.map(pool => (
                      <option key={pool.id} value={pool.id}>
                        Pool #{pool.id}: {pool.details?.question || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
                {settlePoolId !== null && (
                  <>
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">Winning Outcome ID</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={winningOutcomeId}
                        onChange={e => setWinningOutcomeId(e.target.value)}
                      >
                        <option value="1">1 - Yes</option>
                        <option value="2">2 - No</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">Simulated Yield (MON)</span>
                      </label>
                      <EtherInput
                        defaultValue={simulatedYield}
                        onValueChange={({ valueInEth }) => setSimulatedYield(valueInEth || "")}
                        placeholder="e.g., 20.0"
                      />
                    </div>
                    <button className="btn btn-primary w-full" onClick={handleSettlePool} disabled={isSettlingPool}>
                      {isSettlingPool ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Settling...
                        </>
                      ) : (
                        "Declare Winner & Settle"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Claim Funds */}
        {connectedAddress && claimablePools.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Claim Funds (Claimants View)</h2>
              <div className="space-y-4">
                {claimablePools.map(pool => {
                  if (!pool.details || !pool.details.sponsor) return null;
                  const sponsorAddress =
                    typeof pool.details.sponsor === "string" ? pool.details.sponsor : String(pool.details.sponsor);
                  const isSponsor = sponsorAddress.toLowerCase() === connectedAddress.toLowerCase();
                  const isWinner = pool.details.winningOutcomeId > 0n; // Simplified check

                  return (
                    <div key={pool.id} className="card bg-base-200 shadow-md">
                      <div className="card-body">
                        <h3 className="card-title text-lg">Pool #{pool.id}</h3>
                        <p className="text-sm font-semibold mb-2">{pool.details.question}</p>
                        <div className="space-y-1 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Status:</span>
                            <span className="badge badge-success">Settled</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Winning Outcome:</span>
                            <span className="font-semibold">
                              {pool.details.winningOutcomeId !== undefined && pool.details.winningOutcomeId !== null
                                ? Number(pool.details.winningOutcomeId) === 1
                                  ? "Yes"
                                  : "No"
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Total Yield:</span>
                            <span className="font-semibold">
                              {pool.details.totalYield !== undefined && pool.details.totalYield !== null
                                ? `${formatEther(pool.details.totalYield)} ${targetNetwork.nativeCurrency?.symbol || "MON"}`
                                : "Loading..."}
                            </span>
                          </div>
                          {isSponsor && (
                            <div className="text-info text-xs mt-2">
                              As sponsor, you can claim: Principal + 40% Yield Cut
                            </div>
                          )}
                          {!isSponsor && isWinner && (
                            <div className="text-success text-xs mt-2">
                              As winner, you can claim: Principal + Yield Share
                            </div>
                          )}
                          {!isSponsor && !isWinner && (
                            <div className="text-base-content/60 text-xs mt-2">
                              As participant, you can claim: Principal only
                            </div>
                          )}
                        </div>
                        <button
                          className="btn btn-primary btn-sm w-full"
                          onClick={() => handleClaimFunds(pool.id)}
                          disabled={isClaimingFunds}
                        >
                          {isClaimingFunds ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Claiming...
                            </>
                          ) : (
                            "Claim Principal & Winnings"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Connection Prompt */}
        {!connectedAddress && (
          <div className="card bg-warning/20 shadow-xl">
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-2xl">Connect Your Wallet</h2>
              <p className="text-base-content/70">
                Please connect your wallet to interact with the No-Loss Prediction Pool
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
