const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]));
  } else if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("NO DATA, BUT NO ERROR");
  }
})();
