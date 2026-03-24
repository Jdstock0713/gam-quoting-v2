"use client";

import { useState, useEffect } from "react";
import { County, PlanType, ProductLine } from "@/types";
import ZipEntry from "@/components/ZipEntry";
import MedigapResults from "@/components/MedigapResults";
import MAResults from "@/components/MAResults";
import PDPResults from "@/components/PDPResults";
import LifeInsuranceResults from "@/components/LifeInsuranceResults";

type AppState =
  | { step: "zip" }
  | { step: "results"; zip: string; county: County; planType: PlanType };

export default function Home() {
  const [productLine, setProductLine] = useState<ProductLine>("medicare");
  const [state, setState] = useState<AppState>({ step: "zip" });
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen for Wix postMessage with user role info
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Accept messages from any Wix origin (covers preview & live domains)
      if (
        event.data &&
        event.data.type === "wix-user-role" &&
        typeof event.data.role === "string"
      ) {
        const role = event.data.role.toLowerCase();
        // Show admin button for collaborators, owners, or admins
        if (["collaborator", "owner", "admin"].includes(role)) {
          setIsAdmin(true);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleContinue(zip: string, county: County, planType: PlanType) {
    setState({ step: "results", zip, county, planType });
  }

  function handleBack() {
    setState({ step: "zip" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-800">
                Golden Age Quoting
              </h1>
              {isAdmin && (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Admin Settings"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Admin
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  productLine === "medicare" ? "text-blue-700" : "text-gray-400"
                }`}
              >
                Medicare
              </span>
              <button
                onClick={() =>
                  setProductLine((p) =>
                    p === "medicare" ? "life" : "medicare"
                  )
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  productLine === "life"
                    ? "bg-emerald-500 focus:ring-emerald-500"
                    : "bg-blue-500 focus:ring-blue-500"
                }`}
                role="switch"
                aria-checked={productLine === "life"}
                aria-label="Toggle between Medicare and Life Insurance"
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    productLine === "life" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  productLine === "life"
                    ? "text-emerald-700"
                    : "text-gray-400"
                }`}
              >
                Life Insurance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {productLine === "life" ? (
        <LifeInsuranceResults />
      ) : (
        <>
          {state.step === "zip" && (
            <ZipEntry onContinue={handleContinue} />
          )}
          {state.step === "results" && (() => {
            const { zip, county, planType } = state;
            switch (planType) {
              case "medigap":
                return (
                  <MedigapResults
                    zip={zip}
                    county={county}
                    onBack={handleBack}
                  />
                );
              case "ma":
                return (
                  <MAResults
                    zip={zip}
                    county={county}
                    onBack={handleBack}
                  />
                );
              case "pdp":
                return (
                  <PDPResults
                    zip={zip}
                    county={county}
                    onBack={handleBack}
                  />
                );
            }
          })()}
        </>
      )}
    </div>
  );
}
