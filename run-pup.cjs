const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log("Navigating to http://localhost:3000/login...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  // Fill login
  await page.type('input[type="email"]', 'charlie.davis@example.com');
  await page.type('input[type="password"]', 'password123');
  
  // Just click any button
  await page.click('button'); 
  
  // wait a bit
  await new Promise(r => setTimeout(r, 3000));
  console.log("URL after login:", page.url());
  
  const content = await page.content();
  if (content.includes("CRITICAL APP CRASH")) {
    console.log("CRASH DETECTED IN HTML!");
  } else {
    console.log("NO CRASH DETECTED. LENGTH:", content.length);
  }
  
  await browser.close();
})();
