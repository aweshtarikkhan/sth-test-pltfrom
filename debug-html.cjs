const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2' });
    const content = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log("HTML CONTENT:", content.substring(0, 500));
    await browser.close();
})();
