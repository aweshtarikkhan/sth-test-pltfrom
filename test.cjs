
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testCols() {
  const cols = ['avatar_url', 'profile_image', 'photo', 'image', 'avatar', 'profile_pic', 'picture'];
  for (let c of cols) {
    const res = await supabase.from('employees').select(c).limit(1);
    console.log(c, res.error ? res.error.message : 'Success');
  }
}
testCols();

