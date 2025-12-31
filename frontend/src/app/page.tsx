"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Briefcase, Map, CheckCircle, AlertCircle, Loader2, ThumbsUp, ThumbsDown, Sparkles, X, ExternalLink, BrainCircuit, ArrowRight, User, Mail, Phone } from "lucide-react"

const API_URL = "http://127.0.0.1:8000/api/v1"

interface Profile {
  profile_id: string;
  data: {
    name: string;
    email: string;
    phone: string;
    hard_skills: string[];
    raw_text_summary: string;
  };
}

interface Job {
  job_id: string;
  title: string;
  company: string;
  score: number;
  skills: string;
  url: string;
  description?: string;
  applicants?: number;
  days_left?: number;
  salary?: string;
  job_type?: string;
  experience?: string;
  posted_date?: string;
}

interface RoadmapNode {
  id: string;
  label: string;
  status: string;
  week: string;
  phase?: string;
  description?: string;
}

interface Roadmap {
  nodes: RoadmapNode[];
  edges: { source: string; target: string }[];
}





export default function Home() {
  const [filePath, setFilePath] = useState("")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<Job[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState("")

  const [postMortemData, setPostMortemData] = useState<any>(null)
  const [auditResult, setAuditResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview");

  const handleUpload = async (file: File) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await axios.post(`${API_URL}/profile/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000 // 1 minute timeout
      })
      setProfile(res.data)

      // Auto-fetch matches
      const matchesRes = await axios.get(`${API_URL}/matches/${res.data.profile_id}`)
      setMatches(matchesRes.data.matches)
    } catch (error) {
      console.error(error)
      alert("Error uploading resume. Ensure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateRoadmap = async (job: Job) => {
    if (!profile) return
    try {
      setLoading(true)
      // Send as JSON body now
      const res = await axios.post(`${API_URL}/roadmap`, {
        profile_skills: profile.data.hard_skills,
        job_skills: job.skills,
        job_title: job.title
      }, {
        timeout: 300000 // 5 minutes timeout for slow Local LLM
      })

      // Fix: Handle nested roadmap_json from Agentic backend
      const roadmapData = res.data.roadmap_json || res.data;
      setRoadmap(roadmapData)

      // Scroll to roadmap
      setTimeout(() => {
        document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error(error)
      alert("Error generating roadmap. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (jobId: string, outcome: string) => {
    if (!profile) return
    try {
      await axios.post(`${API_URL}/feedback`, null, {
        params: {
          profile_id: profile.profile_id,
          job_id: jobId,
          outcome: outcome,
          reason: "User clicked reject"
        }
      })
      setFeedbackStatus(`Feedback logged: ${outcome}`)
      setTimeout(() => setFeedbackStatus(""), 3000)
    } catch (error) {
      console.error(error)
    }
  }

  const handlePostMortem = async (job: Job) => {
    if (!profile) return
    try {
      setLoading(true)
      const res = await axios.post(`${API_URL}/post-mortem`, null, {
        params: {
          job_title: job.title,
          job_description: job.description || "No description",
          user_skills: profile.data.hard_skills.join(','),
          rejection_reason: "User dismissed this job as not a fit."
        }
      })
      setPostMortemData(res.data)
    } catch (error) {
      console.error(error)
      alert("Error analyzing rejection.")
      setLoading(false)
    }
  }

  const handleAuditResume = async () => {
    console.log("Audit button clicked")
    if (!profile) {
      console.error("Profile is null")
      alert("Profile not found. Please upload a resume first.")
      return
    }

    try {
      console.log("Sending audit request...")
      setLoading(true)
      // We send the raw text summary as a proxy for the full resume text for now, 
      // or ideally we'd have the full text stored. 
      // For this hackathon, we'll use the summary + skills as the "resume text".
      const resumeText = `
        Name: ${profile.data.name}
        Email: ${profile.data.email}
        Phone: ${profile.data.phone}
        Skills: ${profile.data.hard_skills.join(", ")}
        Summary: ${profile.data.raw_text_summary}
      `

      const res = await axios.post(`${API_URL}/audit`, {
        resume_text: resumeText,
        job_description: "General Software Engineering Role" // Default for now
      })
      console.log("Audit response received:", res.data)
      setAuditResult(res.data)
    } catch (error: any) {
      console.error("Audit error:", error)
      alert(`Error analyzing resume: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground relative">
      {/* Fixed Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* Header: Hero (Landing) vs Navbar (Dashboard) */}
      <header className={`relative border-b border-border/40 bg-background/80 backdrop-blur-md z-50 transition-all duration-500 ${profile ? 'py-4 sticky top-0' : 'py-24'}`}>
        <div className={`container mx-auto px-4 ${profile ? 'flex items-center justify-between' : 'text-center'}`}>

          {/* Logo Section */}
          <div className={`flex items-center gap-3 ${profile ? '' : 'flex-col justify-center'}`}>
            {!profile && (
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground border border-border/50 shadow-sm backdrop-blur-sm mb-8">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>AI-Powered Career Orchestration</span>
              </div>
            )}

            <h1 className={`font-extrabold tracking-tight text-primary drop-shadow-sm transition-all duration-500 ${profile ? 'text-2xl flex items-center gap-2' : 'text-5xl md:text-7xl mb-6'}`}>
              {profile && <Sparkles className="h-5 w-5 text-primary" />}
              CareerOS
            </h1>

            {!profile && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Your autonomous agent for career growth. Analyze, Plan, and Execute your next big move.
              </p>
            )}
          </div>

          {/* Navbar Actions (Dashboard Only) */}
          {profile && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProfile(null);
                  setMatches([]);
                  setFilePath("");
                }}
                className="hidden md:flex items-center gap-2 border-border/50 hover:bg-secondary/50"
              >
                <Upload className="h-4 w-4" />
                New Upload
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20 ring-2 ring-background">
                RS
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pb-20 space-y-12 max-w-6xl">
        {/* 1. Input Section (Hidden if Profile Exists) */}
        {!profile && (
          <section className="relative group animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <Card className="relative bg-slate-900/50 border-slate-700 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="mb-6 p-4 bg-blue-500/10 rounded-full ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Upload className="h-10 w-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Upload your Resume</h2>
                <p className="text-slate-400 max-w-md mb-8">
                  Drag and drop your PDF here, or click to browse. We'll analyze your skills and match you with the best opportunities.
                </p>

                <div className="relative group/btn w-full max-w-sm">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    disabled={loading}
                  />
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all group-hover/btn:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing Profile...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Select Resume (PDF) <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-slate-500">Supported format: PDF only</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 2. Dashboard Grid */}
        {profile && (
          <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
            {/* Profile Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    Detected Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
                    <div className="flex flex-wrap gap-2 pb-4">
                      {profile.data.hard_skills.map((skill: string) => (
                        <span
                          key={skill}
                          title={skill}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md text-xs border border-blue-500/20 font-medium transition-all cursor-default max-w-[100%] truncate shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      Candidate Profile
                    </h4>

                    <div className="space-y-3">
                      {/* Name */}
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                        <div className="mt-0.5 p-1.5 bg-primary/10 rounded-full text-primary">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Name</p>
                          <p className="text-sm font-semibold text-foreground">{profile.data.name || "Candidate"}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                        <div className="mt-0.5 p-1.5 bg-blue-500/10 rounded-full text-blue-500">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Email</p>
                          <p className="text-sm font-medium text-foreground truncate" title={profile.data.email}>{profile.data.email || "Not found"}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                        <div className="mt-0.5 p-1.5 bg-green-500/10 rounded-full text-green-500">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Phone</p>
                          <p className="text-sm font-medium text-foreground">{profile.data.phone || "Not found"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Tailoring (New) */}
              <Card className="shadow-sm border-border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Tailoring Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition-colors">
                      <h5 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1 uppercase tracking-wide">Impact Verbs</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">Consider using stronger action verbs like <span className="text-foreground font-medium">&quot;Architected&quot;</span> or <span className="text-foreground font-medium">&quot;Spearheaded&quot;</span>.</p>
                    </div>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                      <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">Quantifiable Metrics</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">Add more numbers! E.g., <span className="text-foreground font-medium">&quot;Reduced latency by 40%&quot;</span>.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      onClick={handleAuditResume}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Run ATS Check
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                <Briefcase className="h-6 w-6 text-primary" />
                Market Opportunities
              </h3>

              <div className="grid gap-4">
                {matches.map((job, index) => (
                  <div
                    key={job.job_id}
                    className="group relative bg-card/50 hover:bg-card/80 border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/20 glow-hover backdrop-blur-sm"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Title & Company */}
                        <div className="mb-1">
                          <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{job.title}</h4>
                          <p className="text-muted-foreground font-medium text-sm flex items-center gap-2 mt-1">
                            {job.company}
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground border border-border/50 uppercase tracking-wider font-bold">
                              Remote
                            </span>
                          </p>
                        </div>

                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/50 text-secondary-foreground border border-border/50">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            {job.job_type || "Full Time"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            <span className="font-bold">₹</span>
                            {job.salary || "Best in Industry"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {job.applicants || 40} Applied
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Logo & Score */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border shadow-sm text-xl font-bold text-slate-700 dark:text-slate-300">
                          {job.company.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-lg border border-border/50">
                          <span className={`text-sm font-bold ${job.score > 70 ? 'text-green-600 dark:text-green-400' : job.score > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                            {job.score}%
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePostMortem(job)}
                          className="h-8 px-2 text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                          title="Why this match?"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFeedback(job.job_id, "Rejected")}
                          className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Dismiss"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedJob(job)}
                          className="h-9 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateRoadmap(job)}
                          disabled={loading}
                          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-70 px-6 font-medium"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Working...
                            </span>
                          ) : (
                            "Generate Roadmap"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* 3. Roadmap Section (DAG Visualization) */}
        {roadmap && (
          <section id="roadmap-section" className="animate-in fade-in slide-in-from-bottom-12 duration-1000 py-10">
            <div className="relative">
              <Card className="relative bg-card border-border overflow-hidden shadow-lg">
                <CardHeader className="bg-secondary/30 border-b border-border pb-8 pt-8">
                  <CardTitle className="flex flex-col items-center justify-center gap-3 text-3xl">
                    <div className="p-3 bg-primary/10 rounded-full ring-1 ring-primary/20">
                      <Map className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-foreground font-extrabold tracking-tight">
                      Strategic Execution Plan
                    </span>
                    <p className="text-sm text-muted-foreground font-normal">AI-Generated Dependency Graph</p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-12">
                  <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

                    <div className="space-y-16">
                      {["Basics", "Intermediate", "Advanced"].map((phase, phaseIdx) => {
                        // Filter nodes for this phase. Fallback to 'Basics' if no phase specified.
                        const phaseNodes = roadmap.nodes?.filter((n: any) => (n.phase === phase) || (!n.phase && phase === "Basics")) || [];

                        if (phaseNodes.length === 0) return null;

                        return (
                          <div key={phase} className="relative">
                            {/* Phase Header */}
                            <div className="flex items-center gap-4 mb-8 pl-2">
                              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10 shadow-lg ring-4 ring-card">
                                {phaseIdx + 1}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-foreground">{phase}</h3>
                                <p className="text-muted-foreground text-sm">
                                  {phase === "Basics" ? "Foundations & Core Concepts" :
                                    phase === "Intermediate" ? "Building Competency" : "Mastery & Optimization"}
                                </p>
                              </div>
                            </div>

                            {/* Nodes */}
                            <div className="space-y-8">
                              {phaseNodes.map((node: any, i: number) => (
                                <div key={node.id} className="relative pl-24 group">
                                  {/* Connector Line (Vertical) */}
                                  <div className="absolute left-[33px] -top-8 bottom-0 w-0.5 bg-border group-hover:bg-primary transition-colors duration-500"></div>

                                  {/* Node Dot */}
                                  <div className="absolute left-6 top-8 w-5 h-5 rounded-full bg-card border-4 border-primary z-10 group-hover:scale-125 transition-all duration-300"></div>

                                  {/* Week Label (Absolute) */}
                                  <div className="absolute left-0 top-8 -translate-y-1/2 -translate-x-full pr-8 hidden md:block text-right">
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">{node.week}</span>
                                  </div>

                                  {/* Content Card */}
                                  <div className="bg-card border border-border p-6 rounded-xl hover:shadow-md transition-all duration-300 group-hover:translate-x-2">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="md:hidden text-xs font-bold text-primary uppercase tracking-widest mb-1">{node.week}</h4>
                                        <h4 className="text-foreground font-bold text-lg">{node.label}</h4>
                                      </div>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                        {node.status || "Pending"}
                                      </span>
                                    </div>
                                    {node.description && (
                                      <p className="text-muted-foreground text-sm leading-relaxed">{node.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {feedbackStatus && (
          <div className="fixed bottom-8 right-8 bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            {feedbackStatus}
          </div>
        )}
        {/* Job Details Modal */}
        {/* Job Details Modal - Unstop Style */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-950">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedJob.company.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedJob.title}</h3>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{selectedJob.company}</span>
                      <span>•</span>
                      <span className="text-sm">{selectedJob.posted_date || "Posted recently"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Left Column: Details */}
                  <div className="md:col-span-2 space-y-6">

                    {/* Key Highlights */}
                    <div className="flex flex-wrap gap-3">
                      <div className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {selectedJob.job_type || "Full Time"}
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        Remote / Hybrid
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {selectedJob.experience || "Experience Required"}
                      </div>
                    </div>

                    {/* Eligibility */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        Eligibility
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {["Undergraduate", "Postgraduate", "Engineering Students", "Working Professionals"].map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Job Description */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Job Description
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description || "No description available. Click apply to view full details on the carrier's website."}
                      </p>
                    </div>

                    {/* Skills */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-blue-500" />
                        Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.split(',').map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-md border border-slate-200 dark:border-slate-700">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Quick Apply Card */}
                  <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg sticky top-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                          👋
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hi Welcome!</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Please register below.</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => window.open(selectedJob.url, '_blank')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl mb-4 text-lg shadow-blue-500/20 shadow-lg transition-all hover:scale-[1.02]"
                      >
                        Apply Now <ExternalLink className="ml-2 h-5 w-5" />
                      </Button>

                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{selectedJob.applicants || 42} Applied</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>{selectedJob.days_left || 5} Days Left</span>
                        </div>
                      </div>

                      <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <h5 className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" /> AI Match Score
                        </h5>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selectedJob.score}%</span>
                          <span className="text-sm text-blue-600/70 dark:text-blue-400/70 mb-1">match</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Alert */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                If an employer asks you to pay any kind of fee, please notify us immediately.
              </div>

            </div>
          </div>
        )}

        {/* Post-Mortem Modal */}
        {postMortemData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Post-Mortem Analysis</h3>
                    <p className="text-slate-400 text-sm">Understanding the gap</p>
                  </div>
                </div>
                <button
                  onClick={() => setPostMortemData(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">Root Cause</h4>
                  <p className="text-slate-300 leading-relaxed">{postMortemData.root_cause}</p>
                </div>

                <div className="bg-green-950/20 p-4 rounded-xl border border-green-900/30">
                  <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-2">Corrective Action</h4>
                  <p className="text-slate-300 leading-relaxed">{postMortemData.corrective_action}</p>
                </div>

                {postMortemData.resources && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended Resources</h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {postMortemData.resources.map((res: string, i: number) => (
                        <li key={i}>{res}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex justify-end">
                <Button
                  onClick={() => setPostMortemData(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Close Analysis
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
