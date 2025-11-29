"use client";

import React from "react";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Minimal header with only connect wallet button
 */
export const Header = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <RainbowKitCustomConnectButton />
    </div>
  );
};
