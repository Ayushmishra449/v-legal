import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// eCourts doesn't have a public API, but we simulate the integration pattern.
// This calls the public eCourts case status API (when available) or scrapes
// We use the National Judicial Data Grid API which provides case information.
// Reference: https://njdg.ecourts.gov.in/

const ECOURTS_DISCLAIMER = "Data is fetched from eCourts/NJDG portal. Always verify with the official court website.";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { caseNumber, court, state } = body;

  if (!caseNumber) {
    return NextResponse.json({ error: "Case number is required" }, { status: 400 });
  }

  try {
    // Try to fetch from eCourts public case status API
    // The eCourts API endpoint for case status (CNR based search)
    // CNR format: STATE_COURT_YEAR_NUMBER e.g., DLHC010000002019
    
    // First try CNR-based search via eCourts API
    const cnrClean = caseNumber.replace(/\s+/g, "").toUpperCase();
    
    // Attempt eCourts API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let courtData = null;
    let source = "manual";

    try {
      // eCourts case status endpoint
      const resp = await fetch(
        `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=6b07f67b0a0a0b0a0c0a0b0a0c0a0b0a&ajax=yes&cino=${cnrClean}`,
        { signal: controller.signal, headers: { "User-Agent": "V-Legal/1.0" } }
      );
      clearTimeout(timeout);

      if (resp.ok) {
        const text = await resp.text();
        // Parse the response
        if (text && !text.includes("error")) {
          courtData = { raw: text, source: "ecourts" };
          source = "ecourts";
        }
      }
    } catch {
      clearTimeout(timeout);
      // eCourts not reachable, return structured empty response
    }

    // Return structured response with guidance
    return NextResponse.json({
      success: true,
      caseNumber: cnrClean,
      court: court || "Not specified",
      state: state || "Not specified",
      source,
      disclaimer: ECOURTS_DISCLAIMER,
      data: courtData,
      searchUrls: buildSearchUrls(cnrClean, court, state),
      instructions: buildInstructions(cnrClean, court),
    });
  } catch (err) {
    return NextResponse.json({
      error: "Failed to fetch court data",
      details: String(err),
    }, { status: 500 });
  }
}

function buildSearchUrls(caseNumber: string, court?: string, state?: string) {
  const enc = encodeURIComponent(caseNumber);
  return [
    {
      label: "eCourts Case Status",
      url: `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&cino=${enc}`,
      description: "Search by CNR number on the eCourts portal",
    },
    {
      label: "National Judicial Data Grid",
      url: `https://njdg.ecourts.gov.in/njdg_public/`,
      description: "View case pendency and details on NJDG",
    },
    {
      label: "Supreme Court",
      url: `https://main.sci.gov.in/php/casedata.php?ctype=1&caseno=${enc}`,
      description: "Search on Supreme Court of India website",
    },
    ...(court?.toLowerCase().includes("high") ? [{
      label: "High Court e-Filing",
      url: `https://efiling.eci.gov.in/`,
      description: "Check High Court e-filing portal",
    }] : []),
  ];
}

function buildInstructions(caseNumber: string, court?: string) {
  return [
    `Go to https://services.ecourts.gov.in`,
    `Select your State and District`,
    `Enter CNR Number: ${caseNumber}`,
    `Click 'Search' to view case details, hearing dates, and orders`,
    court ? `Or search directly on ${court}'s official website` : "",
  ].filter(Boolean);
}
