"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PoolDetails } from "./_types/pool";
import { extractPoolDetails, isValidPool } from "./_utils/poolHelpers";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: React.FC = () => {
  const { address: connectedAddress } = useAccount();

  // Fetch nextPoolId
  const { data: nextPoolId } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "nextPoolId",
  });

  const [activePools, setActivePools] = useState<Array<{ id: number; details: PoolDetails | null }>>([]);

  // Select last 3 pools
  const poolId1 = nextPoolId && Number(nextPoolId) > 0 ? Number(nextPoolId) - 1 : null;
  const poolId2 = nextPoolId && Number(nextPoolId) > 1 ? Number(nextPoolId) - 2 : null;
  const poolId3 = nextPoolId && Number(nextPoolId) > 2 ? Number(nextPoolId) - 3 : null;

  const { data: pool1Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId1 !== null ? [BigInt(poolId1)] : (undefined as any),
    query: { enabled: poolId1 !== null },
  });

  const { data: pool2Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId2 !== null ? [BigInt(poolId2)] : (undefined as any),
    query: { enabled: poolId2 !== null },
  });

  const { data: pool3Details } = useScaffoldReadContract({
    contractName: "NoLossPredictionPool",
    functionName: "getPoolDetails",
    args: poolId3 !== null ? [BigInt(poolId3)] : (undefined as any),
    query: { enabled: poolId3 !== null },
  });

  // Build active pools
  useEffect(() => {
    const pools: Array<{ id: number; details: PoolDetails | null }> = [];

    if (pool1Details && poolId1 !== null && isValidPool(pool1Details, poolId1)) {
      pools.push({ id: poolId1, details: extractPoolDetails(pool1Details) });
    }
    if (pool2Details && poolId2 !== null && isValidPool(pool2Details, poolId2)) {
      pools.push({ id: poolId2, details: extractPoolDetails(pool2Details) });
    }
    if (pool3Details && poolId3 !== null && isValidPool(pool3Details, poolId3)) {
      pools.push({ id: poolId3, details: extractPoolDetails(pool3Details) });
    }

    setActivePools(pools.filter(p => p.details));
  }, [pool1Details, pool2Details, pool3Details, poolId1, poolId2, poolId3]);

  return (
    <div className="min-h-screen bg-base-200 relative">
      {/* LEFT-BOTTOM DEPTH SHADOW */}

      {/* Logo */}
      <div className="fixed top-8 left-8 z-50">
        <Link
          href="/"
          className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
        >
          nomono.
        </Link>
      </div>

      {/* Create Pool Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Link
          href="/sponsor"
          className="w-14 h-14 bg-[#0B0F19] rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <span className="text-white text-2xl font-bold">+</span>
        </Link>
      </div>

      <div className="px-8 py-8 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePools.map(pool => {
            if (!pool.details) return null;

            const isEnded = pool.details.bettingEndTime <= BigInt(Math.floor(Date.now() / 1000));
            const isSettled = pool.details.isSettled;
            const isSponsor = connectedAddress && pool.details.sponsor.toLowerCase() === connectedAddress.toLowerCase();

            // Routing rules
            let linkHref = `/bet/${pool.id}`;
            if (isSettled) {
              linkHref = `/result/${pool.id}`;
            } else if (isEnded && isSponsor) {
              linkHref = `/settle/${pool.id}`;
            } else if (isEnded) {
              linkHref = `/result/${pool.id}`;
            }

            return (
              <Link key={pool.id} href={linkHref}>
                <div className="relative cursor-pointer w-full h-[330px] md:h-[390px]">
                  {/* BACK DEPTH BORDER */}
                  <div
                    className="absolute inset-0 rounded-[50px] bg-black"
                    style={{ transform: "translate(6px, 10px)" }}
                  ></div>

                  {/* FRONT CARD */}
                  <div
                    className="absolute inset-0 bg-white rounded-[50px] px-8 py-8 border-4 border-black"
                    style={{
                      borderBottomWidth: "10px",
                      borderRightWidth: "8px",
                    }}
                  >
                    {/* QUESTION */}
                    <h3
                      className="text-[26px] font-semibold mb-3 line-clamp-2"
                      style={{ fontFamily: "'Clash Display Medium', sans-serif" }}
                    >
                      {pool.details.question}
                    </h3>

                    {/* AUTO DESCRIPTION (fallback based on pool fields) */}
                    <p
                      className="text-[18px] text-gray-600 mb-10 line-clamp-3"
                      style={{ fontFamily: "'Clash Display Light', sans-serif" }}
                    >
                      {`Sponsored by ${pool.details.sponsor.slice(0, 6)}...${pool.details.sponsor.slice(-4)} · ${pool.details.participantCount} participants`}
                    </p>

                    {/* STATUS */}
                    <div className="absolute bottom-5 left-8 flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#05DF72] rounded-full"></div>
                      <div
                        className="text-[16px] font-semibold"
                        style={{ fontFamily: "'Clash Display Semibold', sans-serif" }}
                      >
                        {isSettled ? "Prize pool paid out!" : isEnded ? "Betting period over" : "Currently live!"}
                      </div>
                    </div>

                    {/* PURPLE DIAGONAL ARROW */}
                    <div className="absolute bottom-5 right-10 text-[36px] text-[#A684FF] font-bold rotate-45">↗</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
