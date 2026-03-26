"use client";

import { useState, useEffect } from "react";
import { County, PlanType, ProductLine } from "@/types";
import ZipEntry from "@/components/ZipEntry";
import ProductLineSegmentedControl from "@/components/ProductLineSegmentedControl";
import MedigapResults from "@/components/MedigapResults";
import MAResults from "@/components/MAResults";
import PDPResults from "@/components/PDPResults";
import LifeInsuranceResults from "@/components/LifeInsuranceResults";

function AppLogo() {
  return (
    <div className="flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/GAM_Logo.svg.svg"
        alt="Golden Age Marketing"
        className="h-20 sm:h-28 md:h-32 lg:h-40 w-auto"
      />
    </div>
  );
}

type AppState =
  | { step: "zip" }
  | { step: "results"; zip: string; county: County; planType: PlanType };

export default function Home() {
  const [productLine, setProductLine] = useState<ProductLine>("medicare");
  const [state, setState] = useState<AppState>({ step: "zip" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastZip, setLastZip] = useState<string | undefined>();
  const [lastCounty, setLastCounty] = useState<County | undefined>();

  useEffect(() => {
    const ALLOWED_ORIGINS = /^https:\/\/([a-z0-9-]+\.)*(wixsite\.com|wix\.com|editorx\.io)$/;

    function handleMessage(event: MessageEvent) {
      if (!ALLOWED_ORIGINS.test(event.origin)) return;

      if (
        event.data &&
        event.data.type === "wix-user-role" &&
        typeof event.data.role === "string"
      ) {
        const role = event.data.role.toLowerCase();
        if (["collaborator", "owner", "admin"].includes(role)) {
          setIsAdmin(true);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleContinue(zip: string, county: County, planType: PlanType) {
    setLastZip(zip);
    setLastCounty(county);
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

      {/* Content — both product lines stay mounted so form/wizard state survives tab switches */}
      <div
        className={productLine === "medicare" ? undefined : "hidden"}
        aria-hidden={productLine !== "medicare"}
      >
        {state.step === "zip" && (
          <div className="flex flex-col items-center pt-0 px-4">
            <AppLogo />
            <div className="w-full max-w-lg mb-4">
              <ProductLineSegmentedControl
                productLine={productLine}
                onChange={setProductLine}
              />
            </div>
            <ZipEntry onContinue={handleContinue} initialZip={lastZip} initialCounty={lastCounty} />
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
              <div className="flex flex-col items-center bg-gray-50 px-4 pt-4 pb-2 border-b border-gray-200/80">
                <AppLogo />
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
      </div>

      <div
        className={productLine === "life" ? undefined : "hidden"}
        aria-hidden={productLine !== "life"}
      >
        <div className="flex flex-col items-center bg-gray-50 px-4 pt-0 pb-3">
          <AppLogo />
          <div className="w-full max-w-lg">
            <ProductLineSegmentedControl
              productLine={productLine}
              onChange={setProductLine}
            />
          </div>
        </div>
        <LifeInsuranceResults />
      </div>
    </div>
  );
}
