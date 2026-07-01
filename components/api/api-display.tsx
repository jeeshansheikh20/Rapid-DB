"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyIcon, CheckIcon, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import GlobalApiLink from "@/components/api/global-api-link"

// Type definition matching the response from your new secure backend
type GeneratedApi = {
  fileName: string
  tableName: string
  adminKey: string
  readKey: string
  globalApiUrl: string
  endpoints: {
    method: string
    path: string
    description: string
  }[]
  schema: any
}

interface ApiDisplayProps {
  apis: GeneratedApi[]
}

export default function ApiDisplay({ apis }: ApiDisplayProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800 border-green-200"
      case "POST": return "bg-blue-100 text-blue-800 border-blue-200"
      case "PUT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "DELETE": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Tabs defaultValue={apis[0]?.fileName} className="w-full">
      <TabsList className="mb-4 w-full justify-start overflow-x-auto">
        {apis.map((api) => (
          <TabsTrigger key={api.fileName} value={api.fileName}>
            {api.fileName}
          </TabsTrigger>
        ))}
      </TabsList>

      {apis.map((api) => (
        <TabsContent key={api.fileName} value={api.fileName} className="space-y-6">
          
          {/* 1. Global Link Component */}
          <GlobalApiLink 
            apiUrl={api.globalApiUrl.split('?')[0]} // Clean URL for display
            fileName={api.fileName} 
            readKey={api.readKey} 
          />

          {/* 2. API Keys Display (Secure & Styled) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" /> Your API Keys
              </CardTitle>
              <CardDescription>
                Keep your Admin Key secret. Use the Read Key for public apps.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <div className="text-xs font-bold text-red-800 mb-1">ADMIN KEY (Full Access)</div>
                <code className="text-xs break-all text-red-600 font-mono">{api.adminKey}</code>
                <div className="mt-2 text-right">
                    <Button variant="link" size="sm" className="h-auto p-0 text-red-800" onClick={() => copyToClipboard(api.adminKey)}>
                        {copiedText === api.adminKey ? "Copied" : "Copy Key"}
                    </Button>
                </div>
              </div>
              <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                <div className="text-xs font-bold text-green-800 mb-1">READ KEY (Read Only)</div>
                <code className="text-xs break-all text-green-600 font-mono">{api.readKey}</code>
                <div className="mt-2 text-right">
                    <Button variant="link" size="sm" className="h-auto p-0 text-green-800" onClick={() => copyToClipboard(api.readKey)}>
                         {copiedText === api.readKey ? "Copied" : "Copy Key"}
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Endpoints List */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                REST endpoints generated for {api.fileName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {api.endpoints.map((ep) => (
                  <div key={`${ep.method}-${ep.path}`} className="p-4 border rounded-md bg-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <div className="flex items-center space-x-2 overflow-hidden w-full">
                        <Badge className={`${getMethodColor(ep.method)} font-mono shrink-0`}>
                          {ep.method}
                        </Badge>
                        <code className="text-xs sm:text-sm bg-muted p-1.5 rounded truncate block w-full font-mono text-muted-foreground">
                          {ep.path}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ep.path)}
                        className="shrink-0 h-8 w-8 p-0"
                      >
                        {copiedText === ep.path ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground ml-1">{ep.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Schema View (RESTORED!) */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Definition</CardTitle>
              <CardDescription>The following schema has been inferred from your data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono text-muted-foreground">
                {JSON.stringify(api.schema, null, 2)}
              </pre>
            </CardContent>
          </Card>

        </TabsContent>
      ))}
    </Tabs>
  )
}