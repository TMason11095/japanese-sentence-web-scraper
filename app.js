const { error } = require('console');
const puppeteer = require('puppeteer');
const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch();//{headless: false}
    //Open new page
    const page = await browser.newPage();
    //Load cookies
    await loadCookiesFromFile(page, cookiesDirPath + "kanshudo.json");
    //Navigate to the Kanshudo website
    await page.goto('https://www.kanshudo.com/example/46829');

    //Save cookies
    //await saveCookiesToFile(page, cookiesDirPath + "kanshudo.json");

    //Save HTML
    //await saveHtmlToFile(page, htmlDirPath + "kanshudo.html");




    //Take a screenshot of the current page
    //await page.screenshot({path: screenshotsDirPath + "page.png", fullPage: true});

    //Close puppeteer
    await browser.close();
})();

async function saveHtmlToFile(page, filePath) {
    try {
        //Grab the page's HTML
        const html = await page.content();
        //Grab file system
        const fs = require('fs');
        //Write HTML to file
        fs.writeFileSync(filePath, html);
    }
    catch (error) {
        //Error saving HTML
        console.error('Error saving HTML: ', error);
        //HTML not saved
        return false;
    }
}

async function saveCookiesToFile(page, filePath) {
    try {
        //Grab the cookies from the page
        const cookies = await page.cookies();
        //Grab file system
        const fs = require('fs');
        //Write cookies to file as JSON
        fs.writeFileSync(filePath, JSON.stringify(value = cookies, replacer = null, space = 2));
        //Cookies saved
        return true;
    }
    catch (error) {
        //Error saving cookies
        console.error('Error saving cookies: ', error);
        //Cookies not saved
        return false;
    }
}

async function loadCookiesFromFile(page, filePath) {
    try {
        //Grab file system
        const fs = require('fs');
        //Grab the cookies JSON
        const cookiesJson = fs.readFileSync(filePath);
        //Convert to cookies
        const cookies = JSON.parse(cookiesJson);
        //Set the cookies on the page
        await page.setCookie(...cookies);
        //Cookies set
        return true;
    }
    catch (error) {
        //Error loading cookies
        console.error('Error loading cookies: ', error);
        //Cookies not loaded
        return false;
    }
}