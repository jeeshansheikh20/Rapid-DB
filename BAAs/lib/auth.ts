import { NextRequest, NextResponse } from "next/server"

export function requireApiKey(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || new URL(req.url).searchParams.get("apiKey")

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key missing" },
      { status: 401 }
    )
  }

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 403 }
    )
  }

  return null
}