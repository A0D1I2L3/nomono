import React from "react";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-end items-center w-full z-10 p-4 bottom-0 right-0 pointer-events-none"></div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="text-center text-base-content/60">
              <p className="m-0">nomono. - No-Loss Prediction Pool</p>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
