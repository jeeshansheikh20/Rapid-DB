const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function keepAlive() {
  console.log("Running Supabase keep-alive ping...")
  
  const { data, error } = await supabase
    .from("_api_metadata")
    .select("id")
    .limit(1)

  if (error) {
    console.error("Error pinging Supabase:", error.message)
    process.exit(1)
  }

  console.log("Successfully pinged Supabase. Project is active.")
}

keepAlive()
