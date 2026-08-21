const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log("Navigating to http://localhost:3000/chat ...");
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if the page is blank by seeing if there's any content inside #root
    const rootContent = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    if (!rootContent || rootContent.trim() === '') {
      console.log("PAGE IS BLANK");
    } else {
      console.log("PAGE HAS CONTENT, LENGTH:", rootContent.length);
    }
    
    await browser.close();
  } catch (err) {
    console.error("SCRIPT ERROR:", err.message);
  }
})();
