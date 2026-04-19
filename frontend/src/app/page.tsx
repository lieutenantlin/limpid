"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getStoredToken } from "@/lib/auth";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="bg-background text-on-surface font-body antialiased">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#f6fafb]/80 backdrop-blur-xl border-b border-[#f0f4f5]">
        <div className="flex justify-between items-center px-12 py-4 max-w-[1440px] mx-auto">
          <div className="text-xl font-bold tracking-tight text-[#006383] uppercase font-headline">AQUASCAN_AI.v1.0</div>
          <div className="hidden md:flex gap-8 items-center font-label text-xs">
            <a className="text-[#006383] border-b border-[#006383] pb-1" href="#">PLATFORM</a>
            <a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#how-it-works">HOW_IT_WORKS</a>
            <a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#data-map">DATA_MAP</a>
            <a className="text-[#5c6264] hover:text-[#006383] transition-colors cursor-pointer" href="#">API_DOCS</a>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-[10px] font-label font-bold uppercase tracking-widest text-primary border border-primary/20 px-4 py-2 rounded transition-colors hover:bg-primary/5">Login</Link>
            <Link href="/login" className="text-[10px] font-label font-bold uppercase tracking-widest bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary-container transition-all shadow-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24">

        {/* HERO */}
        <section className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-16 flex items-center overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full relative z-10">

            {/* Left copy */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded mb-8">
                <span className="material-symbols-outlined text-[14px] text-primary">terminal</span>
                <span className="font-label text-[10px] font-bold tracking-widest text-primary uppercase">EDGE_AI: MICROPLASTIC_DETECTION</span>
              </div>
              <h1 className="font-headline text-4xl md:text-5xl leading-[1.1] font-bold mb-6 text-on-surface">
                Real-Time <span className="gradient-text">Microplastic Detection</span> from Field to Dashboard.
              </h1>
              <p className="font-body text-base text-on-surface-variant mb-10 max-w-lg leading-relaxed">
                An end-to-end system combining iPhone microscopy, Arduino edge AI, and live web dashboards to map synthetic polymer contamination in water sources globally.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 rounded border border-primary shadow-lg hover:bg-primary-container transition-all text-center">Explore Dashboard</Link>
                <button className="bg-surface-container-highest text-on-surface font-label text-xs font-bold uppercase tracking-widest px-8 py-4 rounded border border-outline-variant/30 hover:bg-surface-variant transition-colors cursor-pointer">View API Docs</button>
              </div>
            </div>

            {/* Right placeholder */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-xl overflow-hidden bg-surface-container border border-outline-variant/50 clinical-shadow aspect-[4/3] flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 blueprint-bg pointer-events-none"></div>
                <div className="relative z-10 text-center p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-primary">schema</span>
                  </div>
                  <p className="font-label text-[11px] text-outline font-bold uppercase tracking-widest">[ Replace with platform workflow diagram ]</p>
                  <p className="font-body text-xs text-on-surface-variant mt-2">End-to-end system overview: iPhone → Arduino → Cloud → Dashboard</p>
                </div>
                <div className="absolute top-3 left-3 font-label text-[9px] text-outline font-bold bg-white/80 px-2 py-1 border border-outline-variant/30">WORKFLOW_OVERVIEW</div>
                <div className="absolute bottom-4 right-4 glass-panel px-4 py-2 rounded border border-primary/20">
                  <span className="block font-label text-[9px] text-primary font-bold">DETECTION_STATUS</span>
                  <span className="block font-headline text-lg font-bold text-on-surface">NOMINAL_±0.2μm</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-surface-container-low py-24 px-6 md:px-12 border-y border-outline-variant/20">
          <div className="max-w-[1440px] mx-auto">
            <div className="mb-16">
              <h2 className="font-headline text-3xl font-bold mb-4 text-on-surface">The AquaScan Pipeline</h2>
              <p className="font-body text-on-surface-variant max-w-2xl">Four integrated layers transform a field water sample into actionable environmental contamination data.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Step 01: Field Capture */}
              <div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
                <h3 className="font-headline text-lg font-bold mb-3 text-on-surface">01. Field Capture</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">iPhone app captures 400x magnified microscope images of water samples. GPS coordinates and timestamp are recorded automatically at the point of collection.</p>
                <div className="relative rounded overflow-hidden bg-surface-container border border-outline-variant/30 aspect-[16/9] flex items-center justify-center mb-6 cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="absolute inset-0 blueprint-bg pointer-events-none"></div>
                  <div className="relative z-10 text-center px-4">
                    <span className="material-symbols-outlined text-2xl text-outline mb-2 block">smartphone</span>
                    <p className="font-label text-[10px] text-outline font-bold uppercase tracking-widest">[ iPhone + microscope attachment photo ]</p>
                  </div>
                  <div className="absolute top-2 left-2 font-label text-[9px] text-outline font-bold bg-white/80 px-2 py-1 border border-outline-variant/30">PLACEHOLDER_IMG</div>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] font-bold text-primary uppercase">iOS App / CoreML</span>
                  <span className="font-label text-[10px] text-outline-variant">LAYER_01</span>
                </div>
              </div>

              {/* Step 02: Edge Inference */}
              <div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined">memory</span>
                </div>
                <h3 className="font-headline text-lg font-bold mb-3 text-on-surface">02. Edge Inference</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">Arduino UNO Q runs a quantized TFLite model on-device. Outputs a microplastic particle estimate and confidence score in under 2 seconds — no cloud compute required.</p>
                <div className="code-snippet rounded p-4 text-[11px] mb-6 border border-on-surface/10 overflow-x-auto">
                  <pre className="leading-tight"><code>{`// AquaScan Edge Inference v1
void run_inference(uint8_t* frame) {
  model.setInput(frame, FRAME_SIZE);
  TfLiteStatus s = interpreter.Invoke();
  if (s == kTfLiteOk) {
    float est  = output->data.f[0];
    float conf = output->data.f[1];
    upload_result(est, conf, gps_fix);
  }
}`}</code></pre>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] font-bold text-primary uppercase">Arduino UNO Q / TFLite Micro</span>
                  <span className="font-label text-[10px] text-outline-variant">LAYER_02</span>
                </div>
              </div>

              {/* Step 03: Cloud Ingest */}
              <div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <h3 className="font-headline text-lg font-bold mb-3 text-on-surface">03. Cloud Ingest</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">Results POST to the REST API with sample metadata, image object key, and device ID. Idempotent upsert by sampleId ensures reliable delivery even on flaky field connections.</p>
                <div className="relative rounded overflow-hidden bg-surface-container border border-outline-variant/30 aspect-[16/9] flex items-center justify-center mb-6 cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="absolute inset-0 blueprint-bg pointer-events-none"></div>
                  <div className="relative z-10 text-center px-4">
                    <span className="material-symbols-outlined text-2xl text-outline mb-2 block">api</span>
                    <p className="font-label text-[10px] text-outline font-bold uppercase tracking-widest">[ API architecture / data flow diagram ]</p>
                  </div>
                  <div className="absolute top-2 left-2 font-label text-[9px] text-outline font-bold bg-white/80 px-2 py-1 border border-outline-variant/30">PLACEHOLDER_IMG</div>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] font-bold text-primary uppercase">Fastify + PostgreSQL</span>
                  <span className="font-label text-[10px] text-outline-variant">LAYER_03</span>
                </div>
              </div>

              {/* Step 04: Dashboard & Map */}
              <div className="bg-surface-container-lowest p-6 rounded border border-outline-variant/30 flex flex-col">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined">map</span>
                </div>
                <h3 className="font-headline text-lg font-bold mb-3 text-on-surface">04. Dashboard &amp; Map</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">Researchers view contamination heatmaps, filter by date/device/confidence, and export data. Role-based access for admin, researcher, and viewer accounts.</p>
                <div className="relative rounded overflow-hidden bg-surface-container border border-outline-variant/30 aspect-[16/9] flex items-center justify-center mb-6 cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="absolute inset-0 blueprint-bg pointer-events-none"></div>
                  <div className="relative z-10 text-center px-4">
                    <span className="material-symbols-outlined text-2xl text-outline mb-2 block">dashboard</span>
                    <p className="font-label text-[10px] text-outline font-bold uppercase tracking-widest">[ Dashboard / map screenshot placeholder ]</p>
                  </div>
                  <div className="absolute top-2 left-2 font-label text-[9px] text-outline font-bold bg-white/80 px-2 py-1 border border-outline-variant/30">PLACEHOLDER_IMG</div>
                </div>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] font-bold text-primary uppercase">Next.js / Leaflet</span>
                  <span className="font-label text-[10px] text-outline-variant">LAYER_04</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="bg-inverse-surface py-16 px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="font-headline text-4xl font-bold text-primary-fixed-dim mb-2">&lt; 2s</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-outline-variant">Edge Inference Latency</div>
            </div>
            <div>
              <div className="font-headline text-4xl font-bold text-primary-fixed-dim mb-2">±0.2μm</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-outline-variant">Detection Resolution</div>
            </div>
            <div>
              <div className="font-headline text-4xl font-bold text-primary-fixed-dim mb-2">99.9%</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-outline-variant">API Uptime SLA</div>
            </div>
            <div>
              <div className="font-headline text-4xl font-bold text-primary-fixed-dim mb-2">OSS</div>
              <div className="font-label text-[10px] uppercase tracking-widest text-outline-variant">Open Source Hardware</div>
            </div>
          </div>
        </section>

        {/* DATA MAP PREVIEW */}
        <section id="data-map" className="py-24 px-6 md:px-12 bg-background">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Map placeholder with HUD overlay */}
            <div className="order-2 lg:order-1 relative rounded-lg border border-outline-variant/40 overflow-hidden clinical-shadow h-[500px] bg-surface-container-highest">
              <div className="absolute inset-0 blueprint-bg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center z-10">
                  <span className="material-symbols-outlined text-4xl text-outline mb-3 block">travel_explore</span>
                  <p className="font-label text-[11px] text-outline font-bold uppercase tracking-widest">[ Interactive Leaflet map screenshot ]</p>
                  <p className="font-body text-xs text-on-surface-variant mt-2">Replace with live map or dashboard screenshot</p>
                </div>
              </div>
              <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                <div className="flex justify-between items-start">
                  <div className="glass-panel px-3 py-1 border border-outline-variant/30 text-[9px] font-label font-bold text-on-surface">SYSTEM_HEALTH: ACTIVE</div>
                  <div className="flex gap-2">
                    <div className="bg-primary/90 text-on-primary px-2 py-1 rounded text-[9px] font-label font-bold">LAT: 32.6819° N</div>
                    <div className="bg-primary/90 text-on-primary px-2 py-1 rounded text-[9px] font-label font-bold">LON: 117.1835° W</div>
                  </div>
                </div>
                <div className="glass-panel w-64 rounded p-4 border border-outline-variant/30 shadow-sm">
                  <div className="flex justify-between mb-3">
                    <span className="font-label text-[9px] font-bold text-primary uppercase">Node_Register_SD1A</span>
                    <span className="material-symbols-outlined text-xs">settings</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                      <span className="font-body text-[10px] text-on-surface-variant">Packet Count</span>
                      <span className="font-label font-bold text-[10px]">2,847</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                      <span className="font-body text-[10px] text-on-surface-variant">Signal Strength</span>
                      <span className="font-label font-bold text-[10px] text-primary">-61 dBm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <h2 className="font-headline text-3xl font-bold mb-6 text-on-surface leading-tight">Global Contamination Mapping. Live.</h2>
              <p className="font-body text-on-surface-variant text-base mb-8 leading-relaxed">
                Every field scan is geotagged and uploaded in real time. The dashboard aggregates readings from all active devices into a live contamination map — enabling researchers to spot pollution hotspots and track remediation progress.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary">my_location</span>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface uppercase mb-1">Clustered Markers</h4>
                    <p className="font-body text-xs text-on-surface-variant">Interactive popup with sample metadata, estimate, confidence, and device ID on click.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary">filter_list</span>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface uppercase mb-1">Filter Controls</h4>
                    <p className="font-body text-xs text-on-surface-variant">Date range, device, minimum confidence threshold, and estimate range filters update the map instantly.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary">data_array</span>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface uppercase mb-1">Raw Data Export</h4>
                    <p className="font-body text-xs text-on-surface-variant">Download filtered sample datasets as JSON or CSV for independent analysis and model training.</p>
                  </div>
                </li>
              </ul>
              <Link href="/login" className="bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 rounded border border-primary shadow-md hover:bg-primary-container transition-all inline-flex items-center gap-2">
                <span>VIEW_LIVE_MAP</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

          </div>
        </section>

        {/* CTA BANNER */}
        <section className="bg-surface-container-low border-y border-outline-variant/20 py-24 px-6 md:px-12">
          <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded mb-6">
                <span className="material-symbols-outlined text-[14px] text-primary">science</span>
                <span className="font-label text-[10px] font-bold tracking-widest text-primary uppercase">OPEN_SOURCE // COMMUNITY_DRIVEN</span>
              </div>
              <h2 className="font-headline text-3xl font-bold mb-4 text-on-surface leading-tight">Start Monitoring Your Water Source.</h2>
              <p className="font-body text-on-surface-variant max-w-lg leading-relaxed">Deploy an AquaScan node with off-the-shelf hardware. Connect to the dashboard. Contribute to a global open dataset of microplastic contamination.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Link href="/login" className="bg-primary text-on-primary font-label text-xs font-bold uppercase tracking-widest px-8 py-4 rounded border border-primary shadow-lg hover:bg-primary-container transition-all text-center">Deploy a Node</Link>
              <button className="bg-surface-container-lowest text-on-surface font-label text-xs font-bold uppercase tracking-widest px-8 py-4 rounded border border-outline-variant/40 hover:bg-surface-variant transition-colors cursor-pointer">Browse Dataset</button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-on-surface text-white w-full py-12 px-12 border-t border-outline/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-[1440px] mx-auto">
          <div>
            <div className="text-lg font-bold text-primary-fixed mb-4 font-headline uppercase tracking-tighter">AquaScan_Platform_Lab</div>
            <p className="font-body text-xs text-secondary-fixed-dim max-w-sm mb-6">Open-source tools for planetary-scale microplastic detection and remediation monitoring. Built at DataHacks 2026.</p>
            <div className="font-label text-[10px] tracking-widest uppercase text-outline-variant">
              © 2026 AQUASCAN_AI // BUILD: 0xB3E1
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 font-label text-[10px] tracking-widest uppercase">
            <div className="flex flex-col gap-4">
              <span className="text-primary-fixed-dim">PLATFORM</span>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">API_DOCS</a>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">SCHEMATICS</a>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">DATASET</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-primary-fixed-dim">LEGAL</span>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">LICENSE_MIT</a>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">PRIVACY_DATA</a>
              <a className="text-outline-variant hover:text-white transition-colors cursor-pointer" href="#">SUPPORT_TICKETS</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
