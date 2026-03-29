import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  Upload, 
  ShieldAlert, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Download,
  RefreshCw,
  LayoutDashboard,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { calculateBiasMetrics } from './lib/biasEngine';
import { generateBiasReport } from './services/geminiService';
import { AuditResult, DatasetRow } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [data, setData] = useState<DatasetRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [protectedAttr, setProtectedAttr] = useState('');
  const [targetAttr, setTargetAttr] = useState('');
  const [predictionAttr, setPredictionAttr] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data as DatasetRow[];
        setData(rows);
        if (results.meta.fields) {
          const fields = results.meta.fields;
          setHeaders(fields);
          
          // Auto-detect protected attributes
          const sensitiveKeywords = ['gender', 'sex', 'race', 'ethnicity', 'age', 'religion', 'disability', 'nationality'];
          const detectedProtected = fields.find(f => sensitiveKeywords.some(k => f.toLowerCase().includes(k)));
          if (detectedProtected) setProtectedAttr(detectedProtected);

          // Auto-detect target/prediction (common names)
          const targetKeywords = ['target', 'label', 'outcome', 'approved', 'hired', 'actual'];
          const predictionKeywords = ['prediction', 'pred', 'score', 'output', 'model'];
          
          const detectedTarget = fields.find(f => targetKeywords.some(k => f.toLowerCase().includes(k)));
          if (detectedTarget) setTargetAttr(detectedTarget);

          const detectedPred = fields.find(f => predictionKeywords.some(k => f.toLowerCase().includes(k)));
          if (detectedPred) setPredictionAttr(detectedPred);
        }
      },
    });
  };

  const runAudit = async () => {
    if (!protectedAttr || !targetAttr || !predictionAttr) return;
    
    setIsAnalyzing(true);
    // Simulate a bit of processing time for UX
    await new Promise(r => setTimeout(r, 800));
    
    const metrics = calculateBiasMetrics(data, protectedAttr, targetAttr, predictionAttr);
    const auditResult: AuditResult = {
      metrics,
      protectedAttribute: protectedAttr,
      targetAttribute: targetAttr,
      predictionAttribute: predictionAttr,
    };
    
    setResult(auditResult);
    setIsAnalyzing(false);
    
    // Auto-generate AI report
    setIsGeneratingReport(true);
    const aiReport = await generateBiasReport(auditResult);
    setResult(prev => prev ? { ...prev, ...aiReport } : null);
    setIsGeneratingReport(false);
  };

  const reset = () => {
    setData([]);
    setHeaders([]);
    setResult(null);
    setProtectedAttr('');
    setTargetAttr('');
    setPredictionAttr('');
  };

  const chartData = result ? Object.keys(result.metrics.demographicParity).map(group => ({
    group,
    selectionRate: (result.metrics.demographicParity[group] * 100).toFixed(1),
    disparateImpact: result.metrics.disparateImpact[group].toFixed(2),
    equalizedOdds: (result.metrics.equalizedOdds[group] * 100).toFixed(1),
  })) : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FairAudit AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <button 
              onClick={() => setShowDocs(false)} 
              className={cn("transition-colors", !showDocs ? "text-indigo-600" : "hover:text-gray-900")}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setShowDocs(true)} 
              className={cn("transition-colors", showDocs ? "text-indigo-600" : "hover:text-gray-900")}
            >
              Documentation
            </button>
          </nav>
          <div className="flex items-center gap-3">
            {/* Removed Sign In and Get Started */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showDocs ? (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-200 p-10 shadow-sm">
              <h2 className="text-4xl font-extrabold mb-8 tracking-tight">Documentation</h2>
              
              <section className="mb-10">
                <h3 className="text-2xl font-bold mb-4 text-indigo-600">Overview</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  FairAudit AI is a specialized tool designed to detect and analyze bias in machine learning datasets and model predictions. 
                  It focuses on key fairness metrics used in legal and ethical AI audits.
                </p>
              </section>

              <section className="mb-10">
                <h3 className="text-2xl font-bold mb-4 text-indigo-600">Key Metrics Explained</h3>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold mb-2">Demographic Parity</h4>
                    <p className="text-sm text-gray-600">
                      Ensures that the probability of a positive outcome is the same for all groups. 
                      Formula: P(Prediction=1 | Group=A) = P(Prediction=1 | Group=B).
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold mb-2">Disparate Impact (80% Rule)</h4>
                    <p className="text-sm text-gray-600">
                      A ratio comparing the selection rate of a group against the selection rate of the highest-performing group. 
                      If the ratio is below 0.8 (80%), it may indicate adverse impact under US employment law.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold mb-2">Equalized Odds</h4>
                    <p className="text-sm text-gray-600">
                      Requires that the model has the same True Positive Rate (TPR) across all groups. 
                      This ensures that qualified individuals have an equal chance of being correctly identified regardless of their group.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h3 className="text-2xl font-bold mb-4 text-indigo-600">How to Use</h3>
                <ol className="list-decimal list-inside space-y-4 text-gray-600">
                  <li><span className="font-bold text-gray-900">Upload Data:</span> Provide a CSV or JSON file containing your model's predictions and ground truth.</li>
                  <li><span className="font-bold text-gray-900">Configure:</span> Select the protected attribute (e.g., Gender), the target variable (Actual), and the prediction variable (Model Output).</li>
                  <li><span className="font-bold text-gray-900">Analyze:</span> Run the audit to see statistical breakdowns and AI-generated summaries.</li>
                  <li><span className="font-bold text-gray-900">Mitigate:</span> Follow the Gemini-powered recommendations to improve your model's fairness.</li>
                </ol>
              </section>

              <div className="pt-8 border-t border-gray-100 flex justify-center">
                <button 
                  onClick={() => setShowDocs(false)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : !data.length ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Audit your AI for Bias.</h2>
              <p className="text-lg text-gray-600">
                Upload your dataset to detect discrimination, understand legal risks, and get Gemini-powered fix suggestions.
              </p>
            </div>
            
            <label className="group relative block w-full border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center hover:border-indigo-400 transition-all cursor-pointer bg-white shadow-sm">
              <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-indigo-600 w-8 h-8" />
                </div>
                <span className="text-lg font-semibold mb-1">Drop your CSV or JSON here</span>
                <span className="text-sm text-gray-500">Max file size: 50MB</span>
              </div>
            </label>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Database, title: "Data Ingestion", desc: "Auto-detects sensitive columns like race, gender, and age." },
                { icon: BarChart3, title: "Bias Metrics", desc: "Demographic Parity, Disparate Impact, and Equalized Odds." },
                { icon: FileText, title: "AI Reports", desc: "Plain English summaries and actionable fix suggestions." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <item.icon className="w-6 h-6 text-indigo-600 mb-3" />
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Configuration Section */}
            {!result && (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <LayoutDashboard className="text-indigo-600 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Configure Audit</h2>
                    <p className="text-gray-500 text-sm">Map your dataset columns to fairness attributes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Protected Attribute <Info className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={protectedAttr}
                      onChange={(e) => setProtectedAttr(e.target.value)}
                    >
                      <option value="">Select column (e.g. Gender)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 italic">The group you want to check for bias.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Target Variable <Info className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={targetAttr}
                      onChange={(e) => setTargetAttr(e.target.value)}
                    >
                      <option value="">Select column (Ground Truth)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 italic">The actual outcome (e.g. Loan_Approved).</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Prediction Variable <Info className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={predictionAttr}
                      onChange={(e) => setPredictionAttr(e.target.value)}
                    >
                      <option value="">Select column (Model Output)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 italic">What your AI model predicted.</p>
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-between pt-8 border-t border-gray-100">
                  <button 
                    onClick={reset}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Cancel and Reset
                  </button>
                  <button 
                    onClick={runAudit}
                    disabled={!protectedAttr || !targetAttr || !predictionAttr || isAnalyzing}
                    className={cn(
                      "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                      (!protectedAttr || !targetAttr || !predictionAttr || isAnalyzing)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing Dataset...
                      </>
                    ) : (
                      <>
                        Run Bias Audit
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results Dashboard */}
            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Audit Report</h2>
                    <p className="text-gray-500">Analyzing bias for <span className="font-bold text-indigo-600">{protectedAttr}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={reset}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> New Audit
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                  </div>
                </div>

                {/* AI Summary Card */}
                <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-indigo-500/30 p-1.5 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                      </div>
                      <span className="text-sm font-bold tracking-widest uppercase opacity-80">AI Analysis Summary</span>
                    </div>
                    
                    {isGeneratingReport ? (
                      <div className="flex flex-col gap-4">
                        <div className="h-6 bg-indigo-800/50 rounded-lg animate-pulse w-3/4"></div>
                        <div className="h-6 bg-indigo-800/50 rounded-lg animate-pulse w-1/2"></div>
                        <p className="text-indigo-200 text-sm italic">Gemini is generating your fairness report...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6">
                            {result.summary || "Analysis complete. Review the metrics below for detailed insights."}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {(Object.values(result.metrics.disparateImpact) as number[]).some(v => v < 0.8) ? (
                              <div className="bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-100 uppercase">High Risk Detected</span>
                              </div>
                            ) : (
                              <div className="bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-100 uppercase">Low Risk Profile</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Actionable Fixes
                          </h4>
                          <ul className="space-y-3">
                            {result.recommendations?.slice(0, 3).map((rec, i) => (
                              <li key={i} className="text-sm text-indigo-100 flex gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Chart 1: Selection Rate */}
                  <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-bold">Demographic Parity</h3>
                        <p className="text-sm text-gray-500">Selection rate (positive outcomes) by group.</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                          <XAxis 
                            dataKey="group" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                            unit="%"
                          />
                          <Tooltip 
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="selectionRate" name="Selection Rate" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#818CF8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Disparate Impact */}
                  <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-bold">Disparate Impact Ratio</h3>
                        <p className="text-sm text-gray-500">Relative to privileged group (80% rule).</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F1F1" />
                          <XAxis type="number" domain={[0, 1.2]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                          <YAxis dataKey="group" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 600 }} />
                          <Tooltip 
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="disparateImpact" name="Impact Ratio" radius={[0, 6, 6, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={Number(entry.disparateImpact) < 0.8 ? '#EF4444' : '#10B981'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Below 0.8 (Potential Legal Violation)</span>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full ml-4"></div>
                      <span>Compliant</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold">Group-wise Metrics Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-4">Group</th>
                          <th className="px-6 py-4">Sample Size</th>
                          <th className="px-6 py-4">Selection Rate</th>
                          <th className="px-6 py-4">True Positive Rate</th>
                          <th className="px-6 py-4">Impact Ratio</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {chartData.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold">{row.group}</td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-sm">{result.metrics.sampleSizes[row.group]}</td>
                            <td className="px-6 py-4">{row.selectionRate}%</td>
                            <td className="px-6 py-4">{row.equalizedOdds}%</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "font-bold",
                                Number(row.disparateImpact) < 0.8 ? "text-red-600" : "text-emerald-600"
                              )}>
                                {row.disparateImpact}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {Number(row.disparateImpact) < 0.8 ? (
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-bold uppercase">Risk</span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold uppercase">Safe</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="text-indigo-600 w-6 h-6" />
                <span className="text-xl font-bold tracking-tight">FairAudit AI</span>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Empowering organizations to build ethical AI through automated bias detection and Gemini-powered insights.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600">Fairness Definitions</a></li>
                <li><a href="#" className="hover:text-indigo-600">Legal Compliance</a></li>
                <li><a href="#" className="hover:text-indigo-600">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-indigo-600">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
            © 2026 FairAudit AI. All rights reserved. Built with Gemini 2.5 Flash.
          </div>
        </div>
      </footer>
    </div>
  );
}
