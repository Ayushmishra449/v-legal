"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, Card, Button, LoadingSpinner } from "@/components/ui/index";
import {
  Search, RefreshCw, ExternalLink, Scale, AlertCircle, CheckCircle2,
  Info, Globe, Copy, ChevronRight, Calendar, FileText, Hash
} from "lucide-react";
import { toast } from "sonner";

interface CourtResult {
  success: boolean;
  caseNumber: string;
  court: string;
  state: string;
  source: string;
  disclaimer: string;
  data: any;
  searchUrls: { label: string; url: string; description: string }[];
  instructions: string[];
}

export default function CourtFetchPage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery<CourtResult>({
    queryKey: ["court-fetch", caseNumber, court, state, fetchKey],
    queryFn: () =>
      fetch("/api/court-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseNumber, court, state }),
      }).then((r) => r.json()),
    enabled: submitted && !!caseNumber,
    staleTime: 0,
  });

  const handleSearch = useCallback(() => {
    if (!caseNumber.trim()) {
      toast.error("Please enter a case/CNR number");
      return;
    }
    setSubmitted(true);
    setFetchKey((k) => k + 1);
  }, [caseNumber]);

  const handleRefresh = useCallback(() => {
    toast.info("Refreshing court data...");
    setFetchKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const inp = "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all";

  return (
    <div>
      <PageHeader
        title="Court Case Fetch"
        subtitle="Fetch hearing details and case status from eCourts / NJDG portal"
      />

      {/* Search Panel */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Scale className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Enter Case Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Hash className="w-3 h-3 inline mr-1" />
                CNR / Case Number *
              </label>
              <input
                id="case-number-input"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={inp}
                placeholder="e.g. DLHC010012342019 or WP/1234/2024"
              />
              <p className="text-xs text-slate-400 mt-1">Enter CNR number or case number</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Scale className="w-3 h-3 inline mr-1" />
                Court Name
              </label>
              <input
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className={inp}
                placeholder="e.g. Delhi High Court"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Globe className="w-3 h-3 inline mr-1" />
                State
              </label>
              <select value={state} onChange={(e) => setState(e.target.value)} className={inp}>
                <option value="">Select State</option>
                {["Andhra Pradesh", "Delhi", "Gujarat", "Haryana", "Karnataka", "Maharashtra",
                  "Punjab", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal",
                  "Madhya Pradesh", "Bihar", "Odisha", "Telangana"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              id="court-fetch-btn"
              variant="primary"
              onClick={handleSearch}
              loading={isLoading || isFetching}
            >
              <Search className="w-4 h-4" />
              Fetch Case Details
            </Button>
            {submitted && data && (
              <Button
                variant="secondary"
                onClick={handleRefresh}
                loading={isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh from Court
              </Button>
            )}
          </div>

          {/* Info banner */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              This tool searches the eCourts portal (ecourts.gov.in) using the CNR or case number.
              The CNR format is typically: <span className="font-mono font-semibold">STATECOURT+CASENUMBER+YEAR</span>.
              If the portal is unavailable, direct links to the court website will be provided.
            </p>
          </div>
        </div>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div className="py-12 flex flex-col items-center gap-3">
                <LoadingSpinner className="py-0" />
                <p className="text-sm text-slate-500 mt-2">Contacting eCourts portal...</p>
                <p className="text-xs text-slate-400">This may take a few seconds</p>
              </div>
            </Card>
          </motion.div>
        )}

        {!isLoading && data && submitted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header result card */}
            <Card>
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F3F7" }}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    data.source === "ecourts" ? "bg-green-50" : "bg-amber-50"
                  }`}>
                    {data.source === "ecourts"
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <AlertCircle className="w-5 h-5 text-amber-500" />
                    }
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">
                      Case: {data.caseNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      {data.source === "ecourts"
                        ? "Data fetched from eCourts portal"
                        : "eCourts portal not reachable — direct links provided below"
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(data.caseNumber)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1.5 rounded-lg transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy CNR
                </button>
              </div>
              <div className="px-5 py-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Court</p>
                  <p className="text-sm font-medium text-slate-700">{data.court || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">State</p>
                  <p className="text-sm font-medium text-slate-700">{data.state || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Data Source</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    data.source === "ecourts"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {data.source === "ecourts" ? "Live eCourts" : "Manual Search"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Direct Search Links */}
            <Card title="Search on Official Court Portals" action={<Globe className="w-4 h-4 text-slate-400" />}>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.searchUrls?.map((link: any, i: number) => (
                  <motion.a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-red-700">{link.label}</p>
                      <p className="text-xs text-slate-400 truncate">{link.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 flex-shrink-0" />
                  </motion.a>
                ))}
              </div>
            </Card>

            {/* Step-by-Step Instructions */}
            <Card title="How to Search on eCourts" action={<FileText className="w-4 h-4 text-slate-400" />}>
              <div className="p-4">
                <div className="space-y-3">
                  {data.instructions?.filter(Boolean).map((step: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: "#D92228" }}>
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700 font-mono bg-slate-50 px-3 py-1.5 rounded-lg flex-1 border border-slate-100">
                        {step}
                      </p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 pt-4 flex items-start gap-2" style={{ borderTop: "1px solid #F1F3F7" }}>
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">{data.disclaimer}</p>
                </div>
              </div>
            </Card>

            {/* Upcoming Hearings (from our DB for this matter) */}
            <MatchedMatterPanel caseNumber={data.caseNumber} court={data.court} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Shows hearings from the local DB that match this case number
function MatchedMatterPanel({ caseNumber, court }: { caseNumber: string; court: string }) {
  const { data: mattersData } = useQuery({
    queryKey: ["matters-by-case", caseNumber],
    queryFn: () =>
      fetch(`/api/matters?search=${encodeURIComponent(caseNumber)}&limit=5`).then((r) => r.json()),
    enabled: !!caseNumber,
  });

  const matters = mattersData?.matters ?? [];
  if (!matters.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card title="Matching Matters in V-Legal" action={<CheckCircle2 className="w-4 h-4 text-green-500" />}>
        <div className="divide-y divide-slate-50">
          {matters.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{m.matterId}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === "ONGOING" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>{m.status}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{m.name}</p>
                <p className="text-xs text-slate-400">{m.court}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Next Hearing</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <p className="text-xs font-medium text-slate-700">
                    {m.nextHearing ? new Date(m.nextHearing).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
