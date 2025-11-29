"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PoolDetails } from "../../_types/pool";
import { extractPoolDetails, formatTimeRemaining } from "../../_utils/poolHelpers";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const BetPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const poolId = params?.poolId ? Number(params.poolId) : null;
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);

  const { data: poolDetails } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId !== null ? [BigInt(poolId)] : (undefined as any),
    query: {
      enabled: poolId !== null,
    },
  });

  const { data: ticketFee } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "TICKET_FEE",
  });

  const { data: yesCountData } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getOutcomeTicketCount",
    args: poolId !== null ? [BigInt(poolId), 1] : (undefined as any),
    query: {
      enabled: poolId !== null,
    },
  });

  const { data: noCountData } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getOutcomeTicketCount",
    args: poolId !== null ? [BigInt(poolId), 2] : (undefined as any),
    query: {
      enabled: poolId !== null,
    },
  });

  // Fetch JoinedPool events to get participant list
  const { data: joinedPoolEvents } = useScaffoldEventHistory({
    contractName: "NoLossPredictionPool",
    eventName: "JoinedPool",
    filters: {
      poolId: poolId !== null ? BigInt(poolId) : undefined,
    },
    watch: true,
    enabled: poolId !== null,
  });

  const { writeContractAsync: writeJoinPoolAsync, isMining: isJoiningPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const [pool, setPool] = useState<PoolDetails | null>(null);

  // Process participants from events
  const participants = useMemo(() => {
    if (!joinedPoolEvents || !ticketFee) return [];

    return joinedPoolEvents
      .map((event: any) => ({
        address: event.args.user as string,
        outcome: Number(event.args.outcomeId),
        deposit: event.args.deposit as bigint,
      }))
      .sort((a: { deposit: bigint }, b: { deposit: bigint }) => {
        // Sort by deposit amount (highest first)
        if (a.deposit > b.deposit) return -1;
        if (a.deposit < b.deposit) return 1;
        return 0;
      });
  }, [joinedPoolEvents, ticketFee]);

  useEffect(() => {
    if (poolDetails && poolId !== null) {
      const extracted = extractPoolDetails(poolDetails);
      setPool(extracted);
      // Redirect to result page if pool is settled
      if (extracted.isSettled) {
        router.push(`/result/${poolId}`);
        return;
      }
      // Redirect to result or settle page if betting period has ended
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (extracted.bettingEndTime <= currentTime) {
        // If user is sponsor, redirect to settle page, otherwise result page
        if (connectedAddress && extracted.sponsor.toLowerCase() === connectedAddress.toLowerCase()) {
          router.push(`/settle/${poolId}`);
        } else {
          router.push(`/result/${poolId}`);
        }
      }
    }
  }, [poolDetails, poolId, router]);

  // Poll to check if betting period has ended while user is on page
  useEffect(() => {
    if (!pool || pool.isSettled) return;

    const checkBettingPeriod = () => {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (pool.bettingEndTime <= currentTime) {
        // If user is sponsor, redirect to settle page, otherwise result page
        if (connectedAddress && pool.sponsor.toLowerCase() === connectedAddress.toLowerCase()) {
          router.push(`/settle/${poolId}`);
        } else {
          router.push(`/result/${poolId}`);
        }
      }
    };

    // Check immediately
    checkBettingPeriod();

    // Check every 5 seconds
    const interval = setInterval(checkBettingPeriod, 5000);

    return () => clearInterval(interval);
  }, [pool, poolId, router, connectedAddress]);

  const handleJoinPool = async () => {
    if (!selectedOutcome || (selectedOutcome !== 1 && selectedOutcome !== 2)) {
      notification.error("Please select an outcome (Yes or No)");
      return;
    }

    if (!ticketFee) {
      notification.error("Ticket fee not available");
      return;
    }

    if (!poolId) {
      notification.error("Invalid pool ID");
      return;
    }

    try {
      await writeJoinPoolAsync({
        functionName: "joinPool",
        args: [BigInt(poolId), selectedOutcome] as [bigint, number],
        value: ticketFee,
      });
      notification.success("Successfully joined pool!");
      setSelectedOutcome(null);
      // Reload page after successful bet to update data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to join pool";
      // Extract user-friendly error message
      let friendlyMessage = errorMessage;
      if (errorMessage.includes("User already participated")) {
        friendlyMessage = "You have already placed a bet on this pool";
      } else if (errorMessage.includes("Must pay exactly")) {
        friendlyMessage = "Please pay the exact ticket fee amount";
      } else if (errorMessage.includes("Betting period has ended")) {
        friendlyMessage = "The betting period has ended";
      }
      notification.error(friendlyMessage);
    }
  };

  if (!pool || !poolId) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="fixed top-8 left-8 z-50">
          <Link
            href="/"
            className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
          >
            nomono.
          </Link>
        </div>
        <div className="px-8 py-8 pt-24">
          <div className="text-center">Loading pool details...</div>
        </div>
      </div>
    );
  }

  // If pool is settled or ended, redirect will happen in useEffect, but show loading in the meantime
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const isEnded = pool.bettingEndTime <= currentTime;
  if (pool.isSettled || isEnded) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="fixed top-8 left-8 z-50">
          <Link
            href="/"
            className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
          >
            nomono.
          </Link>
        </div>
        <div className="px-8 py-8 pt-24">
          <div className="text-center">Redirecting to results...</div>
        </div>
      </div>
    );
  }

  const timeRemaining = formatTimeRemaining(pool.bettingEndTime);
  const currentPrizePool = pool.totalPrincipal;
  const yesCount = yesCountData ? Number(yesCountData) : 0;
  const noCount = noCountData ? Number(noCountData) : 0;
  const ticketFeeAmount = ticketFee ? parseFloat(formatEther(ticketFee)) : 0.1;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Nomono Logo */}
      <div className="fixed top-8 left-8 z-50">
        <Link
          href="/"
          className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
        >
          nomono.
        </Link>
      </div>

      {/* Back Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <button
          onClick={() => router.back()}
          className="w-14 h-14 bg-[#0B0F19] rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <span className="text-white text-2xl font-bold">&lt;</span>
        </button>
      </div>

      {/* Create Pool Button */}
      <div className="fixed bottom-8 left-24 z-50">
        <Link
          href="/sponsor"
          className="w-14 h-14 bg-[#0B0F19] rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <span className="text-white text-2xl font-bold">+</span>
        </Link>
      </div>

      <div className="px-8 py-8 pt-24 flex">
        {/* Left Panel - Event Information */}
        <div className="flex-1 pr-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-success"></span>
              <span className="text-sm font-medium">{timeRemaining} left</span>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-base-content">{pool.question}</h1>
            <p className="text-base-content/70 mb-6">
              {pool.question.includes("15 people")
                ? "Will ATLEAST 15 people bet on this event before the end of the event timer?"
                : pool.question}
            </p>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-base-content">Current prize pool:</h2>
              <p className="text-2xl font-bold text-primary">
                {formatEther(currentPrizePool)} {targetNetwork.nativeCurrency?.symbol || "ETH"}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 text-base-content">Top bets on this event:</h2>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  <>
                    {participants
                      .slice(0, 6)
                      .map((participant: { address: string; outcome: number; deposit: bigint }, index: number) => (
                        <div key={`${participant.address}-${index}`} className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full ${participant.outcome === 1 ? "bg-primary" : "bg-warning"}`}
                          ></span>
                          <span className={index === 0 ? "font-bold text-base-content" : "text-base-content"}>
                            {index === 0 ? (
                              <Address address={participant.address as `0x${string}`} format="short" />
                            ) : (
                              "Anonymous User"
                            )}
                            : ${(ticketFeeAmount * 1000).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </>
                ) : (
                  <p className="text-base-content/60">No bets yet. Be the first!</p>
                )}
                {/* Always show outcome counts */}
                {(yesCount > 0 || noCount > 0) && (
                  <div className="text-sm text-base-content/50 mt-2 pt-2 border-t border-base-300">
                    <p>YES bets: {yesCount}</p>
                    <p>NO bets: {noCount}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Betting Card */}
        <div className="w-[508px]">
          <div className="relative">
            {/* Black background layer */}
            <div className="absolute w-[508px] h-[653px] bg-[#030712] rounded-[60px]"></div>
            {/* White card with border */}
            <div
              className="relative bg-white border-[6px] border-[#030712] rounded-[60px] p-8"
              style={{
                width: "507px",
                height: "653px",
              }}
            >
              {/* BUY text */}
              <div
                className="text-[48px] leading-[59px] font-medium text-[#90A1B9] mb-4"
                style={{ fontFamily: "'Clash Display Medium', sans-serif" }}
              >
                BUY
              </div>

              {/* Price */}
              <div
                className="text-[60px] leading-[145px] font-semibold text-[#030712] mb-8"
                style={{ fontFamily: "'Clash Display Semibold', sans-serif" }}
              >
                ${(ticketFeeAmount * 1000).toFixed(2)}
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <button
                  className={`h-[86px] rounded-lg font-medium text-[48px] leading-[59px] text-center text-[#030712] border-2 border-black ${
                    selectedOutcome === 1 ? "bg-[#05DF72]" : "bg-[#05DF72] hover:opacity-90"
                  }`}
                  onClick={() => setSelectedOutcome(1)}
                  style={{ width: "425px", fontFamily: "'Clash Display Medium', sans-serif" }}
                >
                  YES
                </button>

                <button
                  className={`h-[86px] rounded-lg font-medium text-[48px] leading-[59px] text-center text-[#030712] border-2 border-black ${
                    selectedOutcome === 2 ? "bg-[#FF6467]" : "bg-[#FF6467] hover:opacity-90"
                  }`}
                  onClick={() => setSelectedOutcome(2)}
                  style={{ width: "425px", fontFamily: "'Clash Display Medium', sans-serif" }}
                >
                  NO
                </button>
              </div>

              {connectedAddress && (
                <button
                  className="btn btn-primary w-full mt-6"
                  onClick={handleJoinPool}
                  disabled={isJoiningPool || !selectedOutcome}
                >
                  {isJoiningPool ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Joining...
                    </>
                  ) : (
                    `Place Bet (${ticketFee ? formatEther(ticketFee) : "0.1"} ${
                      targetNetwork.nativeCurrency?.symbol || "ETH"
                    })`
                  )}
                </button>
              )}

              {!connectedAddress && (
                <div className="mt-6 text-center text-sm text-base-content/60">Connect wallet to place bet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetPage;
