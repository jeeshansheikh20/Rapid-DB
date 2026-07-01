"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Zap,
  ChevronRight,
  Lock,
  Eye,
  BookOpen,
  Server,
  Shield,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import "swagger-ui-react/swagger-ui.css"
import "@/styles/swagger-ui-custom.css"

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })

const METHOD_BADGE_STYLES: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  PUT: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
}

export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/swagger")
      .then((r) => r.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalEndpoints = spec?.paths
    ? Object.values(spec.paths as Record<string, any>).reduce(
        (acc: number, p: any) => acc + Object.keys(p).length,
        0
      )
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Sticky header ---- */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold tracking-tight hidden sm:inline">API Generator</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">API Reference</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {spec && (
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                v{spec.info?.version}
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading API documentation…</p>
          </div>
        ) : spec ? (
          <div className="space-y-8">
            {/* ---- Hero card ---- */}
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-8 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                    {spec.info?.title}
                  </h1>
                  <p
                    className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: (spec.info?.description ?? "")
                        .replace(/\n/g, "<br/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                    OpenAPI {spec.openapi}
                  </Badge>
                  <Badge variant="outline">REST</Badge>
                  <Badge variant="outline">JSON</Badge>
                </div>
              </div>

              {/* Base URL */}
              {spec.servers?.[0] && (
                <div className="flex items-center gap-2 text-sm">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Base URL:</span>
                  <code className="font-mono text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs border">
                    {typeof window !== "undefined"
                      ? spec.servers[0].url === "/"
                        ? window.location.origin
                        : spec.servers[0].url
                      : spec.servers[0].url}
                  </code>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-8 pt-1 flex-wrap">
                <div>
                  <p className="text-2xl font-extrabold text-primary">
                    {spec.paths ? Object.keys(spec.paths).length : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Paths</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-primary">{totalEndpoints}</p>
                  <p className="text-xs text-muted-foreground">Endpoints</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-primary">2</p>
                  <p className="text-xs text-muted-foreground">Auth Keys</p>
                </div>
              </div>
            </div>

            {/* ---- Auth info ---- */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Authentication</h2>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                {/* Admin key */}
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">
                      Admin Key
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] ml-auto border-amber-300 text-amber-700 dark:text-amber-400"
                    >
                      Full Access
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required for <strong>POST</strong>, <strong>PUT</strong>, and{" "}
                    <strong>DELETE</strong> operations. Keep this key secret.
                  </p>
                  <div className="rounded bg-muted/60 border px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    ?apiKey=
                    <span className="text-amber-600 dark:text-amber-400">your-admin-key</span>
                  </div>
                </div>
                {/* Read key */}
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                      Read Key
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] ml-auto border-emerald-300 text-emerald-700 dark:text-emerald-400"
                    >
                      Read Only
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use for <strong>GET</strong> requests. Safe to use in public-facing
                    applications and frontends.
                  </p>
                  <div className="rounded bg-muted/60 border px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    ?apiKey=
                    <span className="text-emerald-600 dark:text-emerald-400">your-read-key</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Swagger UI (restyled) ---- */}
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Endpoints</h2>
                <div className="flex items-center gap-1.5 ml-auto">
                  {(Object.keys(METHOD_BADGE_STYLES) as string[]).map((m) => (
                    <span
                      key={m}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${METHOD_BADGE_STYLES[m]}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-4 py-4">
                <SwaggerUI
                  url="/api/swagger"
                  docExpansion="list"
                  defaultModelsExpandDepth={-1}
                  persistAuthorization={true}
                />
              </div>
            </div>

            {/* ---- Back to app ---- */}
            <div className="flex justify-center pt-2 pb-8">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Back to API Generator
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <p className="text-muted-foreground">Failed to load API specification.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
