"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PoolDetails } from "../../_types/pool";
import { extractPoolDetails } from "../../_utils/poolHelpers";
import { EtherInput } from "@scaffold-ui/components";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const SettlePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const poolId = params?.poolId ? Number(params.poolId) : null;
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [winningOutcomeId, setWinningOutcomeId] = useState<number>(1);
  const [simulatedYield, setSimulatedYield] = useState("");

  const { data: poolDetails } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId !== null ? [BigInt(poolId)] : (undefined as any),
    query: {
      enabled: poolId !== null,
    },
  });

  const { writeContractAsync: writeSettlePoolAsync, isMining: isSettlingPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const [pool, setPool] = useState<PoolDetails | null>(null);

  useEffect(() => {
    if (poolDetails && poolId !== null) {
      const extracted = extractPoolDetails(poolDetails);
      setPool(extracted);

      // Redirect if pool is already settled
      if (extracted.isSettled) {
        router.push(`/result/${poolId}`);
        return;
      }

      // Redirect if user is not the sponsor
      if (connectedAddress && extracted.sponsor.toLowerCase() !== connectedAddress.toLowerCase()) {
        router.push(`/result/${poolId}`);
        return;
      }

      // Redirect if betting period hasn't ended
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (extracted.bettingEndTime > currentTime) {
        router.push(`/bet/${poolId}`);
        return;
      }
    }
  }, [poolDetails, poolId, router, connectedAddress]);

  const handleSettlePool = async () => {
    if (!winningOutcomeId || !simulatedYield || !poolId) {
      notification.error("Please fill in all fields");
      return;
    }

    if (winningOutcomeId !== 1 && winningOutcomeId !== 2) {
      notification.error("Winning outcome must be 1 (Yes) or 2 (No)");
      return;
    }

    try {
      await writeSettlePoolAsync({
        functionName: "settlePool",
        args: [BigInt(poolId), winningOutcomeId, parseEther(simulatedYield)] as [bigint, number, bigint],
      });
      notification.success("Pool settled successfully!");
      router.push(`/result/${poolId}`);
    } catch (error: any) {
      notification.error(error?.message || "Failed to settle pool");
    }
  };

  if (!pool || !poolId) {
    return (
      <div className="min-h-screen bg-white">
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

  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const isEnded = pool.bettingEndTime <= currentTime;
  const isSponsor = connectedAddress && pool.sponsor.toLowerCase() === connectedAddress.toLowerCase();

  if (!isEnded || pool.isSettled || !isSponsor) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-8 left-8 z-50">
          <Link
            href="/"
            className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
          >
            nomono.
          </Link>
        </div>
        <div className="px-8 py-8 pt-24">
          <div className="text-center">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      <div className="px-8 py-8 pt-24 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-[#030712]">Settle Pool</h1>
        <p className="text-base-content/70 mb-8">Select the winning outcome and set the yield amount.</p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2">
              <span className="text-base font-bold text-[#030712]">Pool Question:</span>
            </label>
            <p className="text-lg text-[#030712]">{pool.question}</p>
          </div>

          <div>
            <label className="block mb-2">
              <span className="text-base font-bold text-[#030712]">Winning Outcome:</span>
            </label>
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#030712] focus:outline-none focus:border-[#030712]"
              value={winningOutcomeId}
              onChange={e => setWinningOutcomeId(Number(e.target.value))}
            >
              <option value={1}>YES</option>
              <option value={2}>NO</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">
              <span className="text-base font-bold text-[#030712]">
                Simulated Yield ({targetNetwork.nativeCurrency?.symbol || "MON"}):
              </span>
            </label>
            <EtherInput
              defaultValue={simulatedYield}
              onValueChange={({ valueInEth }) => setSimulatedYield(valueInEth || "")}
              placeholder="0.0"
            />
            <p className="text-sm text-base-content/60 mt-2">
              Enter the yield amount generated during the betting period
            </p>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              className="px-8 py-4 bg-[#05DF72] rounded-lg text-white font-bold text-lg hover:bg-[#05DF72]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSettlePool}
              disabled={isSettlingPool || !simulatedYield}
            >
              {isSettlingPool ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Settling...
                </>
              ) : (
                "Settle Pool"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlePage;
