const puppeteer = require('puppeteer');

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch();
    //Open new page
    const page = await browser.newPage();
    //Navigate to the Kanshudo website
    await page.goto('https://www.kanshudo.com/example/46829');

    //Close puppeteer
    await browser.close();
})();