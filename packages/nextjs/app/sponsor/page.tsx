"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EtherInput } from "@scaffold-ui/components";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Simple spinner
const Spinner = ({ size = "sm", className = "" }) => (
  <svg
    className={`animate-spin ${size === "sm" ? "h-5 w-5" : "h-6 w-6"} ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const SponsorPage: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [durationSecs, setDurationSecs] = useState("");
  const [sponsorDeposit, setSponsorDeposit] = useState("");

  const { writeContractAsync: writeNoLossPoolAsync, isMining: isCreatingPool } = useScaffoldWriteContract({
    contractName: "NoLossPredictionPool",
  });

  const handleCreatePool = async () => {
    if (!question) {
      notification.error("Please enter a bet question");
      return;
    }

    const finalDuration = durationSecs || "604800"; // default: 7 days
    const depositValue = sponsorDeposit || "0.1";
    const depositAmount = parseFloat(depositValue);

    if (depositAmount < 0.1) {
      notification.error("Sponsor deposit must be at least 0.1 MON");
      return;
    }

    try {
      await writeNoLossPoolAsync({
        functionName: "createPool",
        args: [question, BigInt(finalDuration)],
        value: parseEther(depositValue),
      });

      notification.success("Pool created successfully!");
      setQuestion("");
      setDurationInput("");
      setDurationSecs("");
      setSponsorDeposit("");
      router.push("/");
    } catch (error: any) {
      notification.error(error?.message || "Failed to create pool");
    }
  };

  // Fixed 40% → 1.40x
  const returnPercentage = "1.40x";

  return (
    <div className="min-h-screen bg-white">
      {/* Logo */}
      <div className="fixed top-8 left-8 z-50">
        <Link
          href="/"
          className="text-xl font-bold text-[#64748B] tracking-tight hover:text-[#475569] transition-colors"
        >
          nomono.
        </Link>
      </div>

      <div className="px-8 py-8 md:px-16 max-w-4xl relative min-h-screen flex flex-col pt-24">
        {/* Title */}
        <div className="mb-12 mt-20">
          <h1 className="text-3xl font-bold mb-2 text-black tracking-tight">Set up a bet.</h1>
          <p className="text-base text-gray-500 font-light">
            Create a pool and ensure constant returns on your investments.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8 flex-1">
          {/* Question */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-bold text-black">Bet question:</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-black
                         focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200
                         transition-all placeholder:text-gray-300"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          {/* Duration with seconds/minutes/hours/days */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-bold text-black">Betting duration:</span>
            </label>

            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                placeholder="Enter value"
                className="w-40 px-4 py-4 bg-white border border-gray-300 rounded-xl text-black focus:outline-none"
                value={durationInput}
                onChange={e => {
                  setDurationInput(e.target.value);
                  setDurationSecs(""); // will be recalculated upon unit selection
                }}
              />

              <select
                className="px-3 py-4 bg-white border border-gray-300 rounded-xl text-black focus:outline-none"
                onChange={e => {
                  const n = Number(durationInput);
                  if (!n || n <= 0) {
                    setDurationSecs("");
                    return;
                  }
                  const multiplier = Number(e.target.value);
                  setDurationSecs(String(n * multiplier));
                }}
              >
                <option value="1">Seconds</option>
                <option value="60">Minutes</option>
                <option value="3600">Hours</option>
                <option value="86400">Days</option>
              </select>
            </div>
          </div>

          {/* Sponsor stake */}
          <div>
            <label className="block">
              <span className="text-lg font-bold text-black">Stake Amount:</span>
            </label>
            <p className="text-sm text-gray-400 mb-2 font-normal">*optional</p>
            <div className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl">
              <EtherInput
                defaultValue={sponsorDeposit}
                onValueChange={({ valueInEth }) => setSponsorDeposit(valueInEth || "")}
              />
            </div>
          </div>

          {/* Fixed 40% return */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-bold text-black">Return percentage:</span>
            </label>
            <input
              type="text"
              className="w-48 px-4 py-4 bg-white border border-gray-300 rounded-xl text-[#94A3B8]
                         font-bold text-2xl cursor-default focus:outline-none"
              value={returnPercentage}
              readOnly
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end px-8 pb-8 z-50">
          {/* Back */}
          <div>
            <button
              onClick={() => router.back()}
              className="w-14 h-14 bg-[#0B0F19] rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <span className="text-white text-2xl font-bold mb-1">&lt;</span>
            </button>
          </div>

          {/* Confirm */}
          <div className="flex flex-col items-end gap-2 pr-4">
            <p className="text-sm text-gray-500 font-light">Confirm creation of pool?</p>
            <button
              className="px-10 py-4 min-w-[140px] bg-[#05DF72] rounded-lg text-black font-bold text-2xl
                         hover:bg-[#04c764] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center shadow-sm"
              onClick={handleCreatePool}
              disabled={isCreatingPool || !connectedAddress || !question || !durationSecs}
            >
              {isCreatingPool ? <Spinner size="sm" className="text-black" /> : "YES"}
            </button>
          </div>
        </div>

        {/* Wallet Warning */}
        {!connectedAddress && (
          <div className="absolute bottom-32 left-8 md:left-16 z-20">
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
              <span>Please connect your wallet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorPage;
