"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CopyIcon, CheckIcon, Globe, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalApiLinkProps {
  apiUrl: string
  fileName: string
  readKey: string // Changed to accept prop
}

export default function GlobalApiLink({ apiUrl, fileName, readKey }: GlobalApiLinkProps) {
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Construct URL correctly with the Read Key
  const urlWithKey = `${apiUrl}?apiKey=${readKey}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(urlWithKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testApi = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(urlWithKey)
      const text = await res.text()
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      setTestResult({
        status: res.status,
        data: data,
        success: res.ok,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: (error as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Global API Access</CardTitle>
        </div>
        <CardDescription>
          Your data from <span className="font-medium">{fileName}</span> is now accessible via this global API URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <Input
              value={urlWithKey}
              readOnly
              className="pr-10 font-mono text-sm bg-muted/50"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className={cn("transition-all", copied && "bg-green-50 text-green-600 border-green-200")}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
        <Button
          onClick={testApi}
          disabled={testing}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {testing ? "Testing..." : "Test API"}
        </Button>
        {testResult && (
          <div className="p-3 rounded-md border bg-muted/30">
            <p className="text-xs font-medium mb-2">
              {testResult.success ? (
                <span className="text-green-600">✓ Success ({testResult.status})</span>
              ) : (
                <span className="text-red-600">✗ Failed {testResult.status ? `(${testResult.status})` : ""}</span>
              )}
            </p>
            <pre className="text-xs overflow-auto max-h-32 p-2 bg-background rounded border">
              {JSON.stringify(testResult.data || testResult.error, null, 2)}
            </pre>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This URL includes your Read-Only API key for easy sharing.
        </p>
      </CardContent>
    </Card>
  )
}