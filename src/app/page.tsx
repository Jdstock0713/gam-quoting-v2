"use client";

import { useState, useEffect } from "react";
import { County, PlanType, ProductLine } from "@/types";
import ZipEntry from "@/components/ZipEntry";
import ProductLineSegmentedControl from "@/components/ProductLineSegmentedControl";
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
          <div className="flex items-center h-14">
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
          </div>
        </div>
      </div>

      {/* Content */}
      {productLine === "life" ? (
        <>
          <div className="flex justify-center bg-gray-50 px-4 pt-8 pb-3">
            <div className="w-full max-w-lg">
              <ProductLineSegmentedControl
                productLine={productLine}
                onChange={setProductLine}
              />
            </div>
          </div>
          <LifeInsuranceResults />
        </>
      ) : (
        <>
          {state.step === "zip" && (
            <div className="flex flex-col items-center pt-16 px-4">
              <div className="w-full max-w-lg mb-4">
                <ProductLineSegmentedControl
                  productLine={productLine}
                  onChange={setProductLine}
                />
              </div>
              <ZipEntry onContinue={handleContinue} />
            </div>
          )}
          {state.step === "results" && (() => {
            const { zip, county, planType } = state;
            const results =
              planType === "medigap" ? (
                <MedigapResults
                  zip={zip}
                  county={county}
                  onBack={handleBack}
                />
              ) : planType === "ma" ? (
                <MAResults
                  zip={zip}
                  county={county}
                  onBack={handleBack}
                />
              ) : (
                <PDPResults
                  zip={zip}
                  county={county}
                  onBack={handleBack}
                />
              );
            return (
              <>
                <div className="flex justify-center bg-gray-50 px-4 pt-4 pb-2 border-b border-gray-200/80">
                  <div className="w-full max-w-lg">
                    <ProductLineSegmentedControl
                      productLine={productLine}
                      onChange={setProductLine}
                    />
                  </div>
                </div>
                {results}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
