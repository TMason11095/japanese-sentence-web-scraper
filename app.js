const { error } = require('console');
const puppeteer = require('puppeteer');

const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";
const jsonDirPath =  "jsons/"

const mainExampleUrl = "https://www.kanshudo.com/example/46829"
const kanjiHiraKanjiExampleUrl = "https://www.kanshudo.com/example/18180";

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch({dumpio: true});//{headless: false}
    //Do the rest of the operations within a try so the browser doesn't stay open on errors
    try {
        //Open new page
        const page = await browser.newPage();
        //Load cookies
        await loadCookiesFromFile(page, cookiesDirPath + "kanshudo.json");
        //Navigate to the Kanshudo website
        await page.goto(kanjiHiraKanjiExampleUrl);
        //Inject jQuery
            //await injectJquery(page);
        //Save cookies
            //await saveCookiesToFile(page, cookiesDirPath + "kanshudo.json");
        //Save HTML
            //await saveHtmlToFile(page, htmlDirPath + "kanshudo.html");

        //Grab the example sentence section
        const sentenceSect = await page.$('#main-content .bodyarea .spaced .tatoeba');
        //Process the Japanese sentence
        const japSentenceJson = await page.evaluate((sentenceSect) => {
            //Grab the start of the Japanese section (Only need it as the starting point for the following siblings)
            const start = sentenceSect.querySelector('.tat-tf');
            //Start looping through the siblings until we hit <br>. Build the sentence as we go
            let japSentenceBuilder = [];
            let currentElement = start.nextElementSibling;
            while (currentElement && currentElement.tagName != 'BR') {
                switch (currentElement.tagName) {
                    case 'A'://Clickable (vocab)
                        //Build the vocab
                        let vocabBuilder = [];
                        //Loop through children
                        for (const node of currentElement.childNodes) {
                            //Check the node type
                            switch (node.nodeType) {
                                case Node.ELEMENT_NODE: //Kanji with furigana
                                    //Add to vocab
                                    vocabBuilder.push({
                                        kanji: node.querySelector('.f_kanji').textContent,
                                        furigana: node.querySelector('.furigana').textContent
                                    });
                                    break;
                                case Node.TEXT_NODE: //Hiragana
                                    //Add to vocab
                                    vocabBuilder.push(node.textContent);
                            }
                        }
                        //Add the vocab to the sentence
                        japSentenceBuilder.push(vocabBuilder);
                        break;
                    case 'SPAN'://Punctuation and joining characters
                        //Add to Japanese sentence array
                        japSentenceBuilder.push(currentElement.textContent);
                        break;
                }
                //Get the next sibling
                currentElement = currentElement.nextElementSibling;
            }
            //Convert the sentence to JSON
            const japSentenceJson = JSON.stringify(value = japSentenceBuilder, replacer = null, space = 4);
            //Return the JSON
            return japSentenceJson;
        }, sentenceSect);
        //Save Sentence JSON to file
        await saveDataToFile(japSentenceJson, jsonDirPath + "jap_sentence");

        //Take a screenshot of the current page
            //await page.screenshot({path: screenshotsDirPath + "page.png", fullPage: true});

        const breakpoint = "";
    }
    catch (error) {
        //Error in Puppeteer
        console.error('Error in Puppeteer: ', error);
        //Puppeteer didn't finish
        return false;
    }
    finally {
        //Close puppeteer
        await browser.close();
    }
    
})();

async function saveDataToFile(data, filePath) {
    try {
        //Grab file system
        const fs = require('fs');
        //Write data to file
        fs.writeFileSync(filePath, data);
        //Data saved
        return true;
    }
    catch (error) {
        //Error saving data to file
        console.error('Error saving date to file: ', error);
        //data not saved
        return false;
    }
}

// async function injectJquery(page) {
//     try {
//         await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.7.1.min.js'});
//     }
//     catch {
//         //Error injecting jQuery
//         console.error('Error injecting jQuery: ', error);
//         //jQuery not injected
//         return false;
//     }
// }

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