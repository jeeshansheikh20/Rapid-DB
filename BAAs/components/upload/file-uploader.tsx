"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  UploadCloud,
  X,
  AlertCircle,
  Server,
  CopyIcon,
  CheckIcon,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  FileSpreadsheet,
  Zap,
  Key,
  Globe,
  Play,
  FileText,
  TableIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import DataTableEditor from "@/components/upload/data-table-editor"
import type { ColumnSchema } from "@/lib/file-parser"

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

type Stage = "upload" | "preview" | "result"

interface PreviewData {
  fileName: string
  tableName: string
  columns: ColumnSchema[]
  rows: Record<string, any>[]
  totalRows: number
}

interface GeneratedApi {
  fileName: string
  tableName: string
  adminKey: string
  readKey: string
  globalApiUrl: string
  endpoints: { method: string; path: string; description: string }[]
  schema: any
}

/* ------------------------------------------------------------------ */
/* Step indicator                                                        */
/* ------------------------------------------------------------------ */

function Steps({ stage }: { stage: Stage }) {
  const steps = [
    { key: "upload", label: "Upload" },
    { key: "preview", label: "Preview & Edit" },
    { key: "result", label: "Your API" },
  ] as const

  const idx = { upload: 0, preview: 1, result: 2 }[stage]

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              i === idx
                ? "bg-primary text-primary-foreground shadow-sm"
                : i < idx
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                i < idx ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {i < idx ? "✓" : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Method badge colours                                                  */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: string }) {
  const color: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    POST: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    PUT: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    DELETE: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${color[method] ?? "bg-gray-100 text-gray-700"}`}>
      {method}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Format bytes                                                          */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ------------------------------------------------------------------ */
/* Main Component                                                        */
/* ------------------------------------------------------------------ */

export default function FileUploader() {
  const [stage, setStage] = useState<Stage>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [generatedApi, setGeneratedApi] = useState<GeneratedApi | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  /* ---- helpers ---- */
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const CopyBtn = ({ text, className = "" }: { text: string; className?: string }) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 shrink-0 ${className}`}
            onClick={() => copy(text)}
          >
            {copiedText === text ? (
              <CheckIcon className="h-3 w-3 text-emerald-500" />
            ) : (
              <CopyIcon className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top"><p>Copy</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  /* ---- dropzone ---- */
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  })

  /* ---- stage 1 → 2: preview ---- */
  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/preview", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setPreview(data)
      setStage("preview")
    } catch (e: any) {
      setError(e.message ?? "Failed to parse file")
    } finally {
      setLoading(false)
    }
  }

  /* ---- stage 2 → 3: generate ---- */
  const handleGenerate = async () => {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: preview.fileName,
          columns: preview.columns,
          rows: preview.rows,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setGeneratedApi(data.api)
      setStage("result")
    } catch (e: any) {
      setError(e.message ?? "Failed to generate API")
    } finally {
      setLoading(false)
    }
  }

  /* ---- test api ---- */
  const testApi = async () => {
    if (!generatedApi) return
    setTesting(true)
    setTestResult(null)
    const url = `${generatedApi.globalApiUrl}?apiKey=${generatedApi.readKey}`
    try {
      const res = await fetch(url)
      const text = await res.text()
      let json: any
      try { json = JSON.parse(text) } catch { json = text /* response is not JSON, use raw text */ }
      setTestResult({ status: res.status, data: json, ok: res.ok })
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message })
    } finally {
      setTesting(false)
    }
  }

  /* ---- reset ---- */
  const reset = () => {
    setStage("upload")
    setFile(null)
    setPreview(null)
    setGeneratedApi(null)
    setError(null)
    setTestResult(null)
  }

  /* ================================================================ */
  /* RENDER                                                             */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <Steps stage={stage} />

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ======================================================== */}
      {/* STAGE 1: UPLOAD                                           */}
      {/* ======================================================== */}
      {stage === "upload" && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
                : file
                ? "border-primary/60 bg-primary/3"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/20"
            }`}
            style={{ minHeight: "260px" }}
          >
            <input {...getInputProps()} />

            {/* Background gradient decoration */}
            <div className="absolute inset-0 pointer-events-none">
              {(isDragActive || file) && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            {file ? (
              <div className="relative flex flex-col items-center gap-3 py-10 px-6 text-center w-full">
                {/* File icon with type badge */}
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    {file.name.split(".").pop()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-base">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatBytes(file.size)} · Click to change file
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckIcon className="h-3 w-3" /> File ready to upload
                </div>
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
                <div className="relative">
                  <div className={`flex items-center justify-center h-16 w-16 rounded-2xl border-2 transition-all duration-200 ${
                    isDragActive ? "bg-primary/15 border-primary scale-110" : "bg-muted/60 border-muted-foreground/20"
                  }`}>
                    <UploadCloud className={`h-8 w-8 transition-colors duration-200 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  {/* Floating format badges */}
                  <div className="absolute -top-2 -right-8 flex flex-col gap-1">
                    <span className="text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md shadow-sm">.csv</span>
                    <span className="text-[10px] font-bold font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-md shadow-sm">.xlsx</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or <span className="text-primary font-medium">click to browse</span> your files
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> CSV files
                  </div>
                  <div className="h-3 w-px bg-border" />
                  <div className="flex items-center gap-1.5">
                    <TableIcon className="h-3.5 w-3.5" /> Excel spreadsheets
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Demo API Key:</span>
              <div className="flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 font-mono">
                <span>demo-api-key-123</span>
                <CopyBtn text="demo-api-key-123" />
              </div>
              <span className="hidden sm:inline">
                · use in <code className="bg-muted border rounded px-1">x-api-key</code> header ·{" "}
                <a href="/api/docs" target="_blank" className="underline underline-offset-4 hover:text-primary">
                  View docs
                </a>
              </span>
            </div>

            <Button
              size="default"
              onClick={handlePreview}
              disabled={!file || loading}
              className="gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  Preview Data
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 2: PREVIEW & EDIT                                   */}
      {/* ======================================================== */}
      {stage === "preview" && preview && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">{preview.fileName}</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review your data below. Click any cell to edit it before generating the API.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1.5 bg-primary"
              >
                {loading ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Generate API
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Editable table */}
          <DataTableEditor
            columns={preview.columns}
            rows={preview.rows}
            totalRows={preview.totalRows}
            onRowsChange={(rows) => setPreview({ ...preview, rows })}
          />

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Changes are local — edits will be saved when you generate the API.
            </p>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate API
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAGE 3: RESULT                                           */}
      {/* ======================================================== */}
      {stage === "result" && generatedApi && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">API generated successfully!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">{generatedApi.fileName} → {generatedApi.tableName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
              Upload Another
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="explorer" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="explorer" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> API Explorer</TabsTrigger>
              <TabsTrigger value="keys" className="gap-1.5"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
              <TabsTrigger value="endpoints" className="gap-1.5"><Server className="h-3.5 w-3.5" /> Endpoints</TabsTrigger>
              <TabsTrigger value="schema" className="gap-1.5">Schema</TabsTrigger>
            </TabsList>

            {/* --- Explorer tab --- */}
            <TabsContent value="explorer" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Live API Endpoint
                  </CardTitle>
                  <CardDescription>
                    Your data from <span className="font-medium">{generatedApi.fileName}</span> is live. Test it below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${generatedApi.globalApiUrl}?apiKey=${generatedApi.readKey}`}
                      className="font-mono text-xs bg-muted/50"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      onClick={() => copy(`${generatedApi.globalApiUrl}?apiKey=${generatedApi.readKey}`)}
                      className="shrink-0"
                    >
                      {copiedText === `${generatedApi.globalApiUrl}?apiKey=${generatedApi.readKey}` ? (
                        <><CheckIcon className="h-4 w-4 mr-1.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><CopyIcon className="h-4 w-4 mr-1.5" /> Copy</>
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={testApi}
                    disabled={testing}
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    {testing ? (
                      <><div className="h-4 w-4 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" /> Testing…</>
                    ) : (
                      <><Play className="h-4 w-4" /> Test API (GET /data)</>
                    )}
                  </Button>
                  {testResult && (
                    <div className="rounded-lg border bg-muted/30 overflow-hidden">
                      <div className={`px-3 py-2 text-xs font-semibold border-b ${testResult.ok ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400"}`}>
                        {testResult.ok ? `✓ ${testResult.status} OK` : `✗ ${testResult.status ?? "Error"}`}
                      </div>
                      <pre className="text-xs p-3 overflow-auto max-h-48 font-mono">
                        {JSON.stringify(testResult.data ?? testResult.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Keys tab --- */}
            <TabsContent value="keys" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4" /> Your API Keys
                  </CardTitle>
                  <CardDescription>
                    Keep your Admin Key secret. Use the Read Key for public-facing apps.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Admin Key</span>
                      <Badge variant="outline" className="text-[10px] border-red-200 text-red-600">Full Access</Badge>
                    </div>
                    <code className="block text-xs break-all text-red-600 dark:text-red-400 font-mono mb-2">{generatedApi.adminKey}</code>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 hover:bg-red-100 dark:hover:bg-red-950" onClick={() => copy(generatedApi.adminKey)}>
                      {copiedText === generatedApi.adminKey ? "Copied!" : "Copy Key"}
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Read Key</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600">Read Only</Badge>
                    </div>
                    <code className="block text-xs break-all text-emerald-600 dark:text-emerald-400 font-mono mb-2">{generatedApi.readKey}</code>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-950" onClick={() => copy(generatedApi.readKey)}>
                      {copiedText === generatedApi.readKey ? "Copied!" : "Copy Key"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Endpoints tab --- */}
            <TabsContent value="endpoints" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" /> REST Endpoints
                  </CardTitle>
                  <CardDescription>All CRUD operations are available for {generatedApi.fileName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedApi.endpoints.map((ep) => (
                      <div key={`${ep.method}-${ep.path}`} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
                        <MethodBadge method={ep.method} />
                        <div className="flex-1 min-w-0">
                          <code className="text-xs font-mono text-muted-foreground break-all">{ep.path}</code>
                          <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copy(ep.path)}
                        >
                          {copiedText === ep.path ? (
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <CopyIcon className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Schema tab --- */}
            <TabsContent value="schema" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schema Definition</CardTitle>
                  <CardDescription>Inferred from your uploaded file</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
                    {JSON.stringify(generatedApi.schema, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
