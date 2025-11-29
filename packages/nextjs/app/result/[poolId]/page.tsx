"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PoolDetails } from "../../_types/pool";
import { extractPoolDetails } from "../../_utils/poolHelpers";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const ResultPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const poolId = params?.poolId ? Number(params.poolId) : null;
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const { data: poolDetails } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId !== null ? [BigInt(poolId)] : (undefined as any),
    query: {
      enabled: poolId !== null,
    },
  });

  const { writeContractAsync: writeClaimFundsAsync, isMining: isClaimingFunds } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const [pool, setPool] = useState<PoolDetails | null>(null);

  useEffect(() => {
    if (poolDetails && poolId !== null) {
      const extracted = extractPoolDetails(poolDetails);
      setPool(extracted);

      if (!extracted.isSettled && connectedAddress) {
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const isEnded = extracted.bettingEndTime <= currentTime;
        const isSponsor = extracted.sponsor.toLowerCase() === connectedAddress.toLowerCase();

        if (isEnded && isSponsor) {
          router.push(`/settle/${poolId}`);
        }
      }
    }
  }, [poolDetails, poolId, connectedAddress, router]);

  const handleClaimFunds = async () => {
    if (!poolId) {
      notification.error("Invalid pool ID");
      return;
    }

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

  const winningOutcome = Number(pool.winningOutcomeId) === 1 ? "YES" : "NO";
  const isYes = Number(pool.winningOutcomeId) === 1;
  const participantCount = Number(pool.participantCount);

  const totalYieldAmount = Number(pool.totalYield);
  const totalPrincipalAmount = Number(pool.totalPrincipal);
  const yieldForWinners = totalYieldAmount * 0.6;
  const multiplier =
    totalPrincipalAmount > 0 ? ((totalPrincipalAmount + yieldForWinners) / totalPrincipalAmount).toFixed(2) : "1.00";

  return (
    <div className="min-h-screen bg-base-200 relative">
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

      {/* ALIGNMENT FIX → ONLY CHANGE */}
      <div className="px-8 py-8 pt-24 relative z-10 ml-[80px]">
        <div className="max-w-4xl">
          {/* Event Question */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 text-base-content">{pool.question}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 rounded-full bg-error"></span>
              <span className="text-sm font-medium text-base-content">Betting period over</span>
            </div>
          </div>

          {/* Results Section */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-6 text-base-content">AND THE RESULTS SAY:</h2>
            <div className={`text-8xl font-bold mb-4 ${isYes ? "text-success" : "text-error"}`}>{winningOutcome}!</div>
            <p className="text-xl text-base-content/70">{participantCount} people did bet on this event.</p>
          </div>

          {/* Prize Distribution */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-base-content">The prizes have been split up as:</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-primary"></span>
                <p className="text-lg text-base-content">
                  {multiplier}x of original bet for those who voted {winningOutcome}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-warning"></span>
                <p className="text-lg text-base-content">
                  A return of their investment for those who didn&apos;t make it. There&apos;s always next time for you
                  guys!
                </p>
              </div>
            </div>
          </div>

          {/* Claim Button */}
          {connectedAddress && pool.isSettled && (
            <div className="text-center mb-8">
              <button className="btn btn-primary btn-lg" onClick={handleClaimFunds} disabled={isClaimingFunds}>
                {isClaimingFunds ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Claiming...
                  </>
                ) : (
                  "Claim Principal & Winnings"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Background "CREATE" text */}
      <div className="absolute bottom-0 left-0 right-0 text-center pointer-events-none z-0">
        <div className="text-[200px] font-bold text-base-content/5 select-none">CREATE</div>
      </div>
    </div>
  );
};

export default ResultPage;
