import * as helper from './js/helper.js';

import * as error from 'console';
import * as puppeteer from 'puppeteer';

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
        await helper.loadCookiesFromFile(page, cookiesDirPath + "kanshudo.json");
        //Navigate to the Kanshudo website
        await page.goto(kanjiHiraKanjiExampleUrl);
        //Inject jQuery
            //await helper.injectJquery(page);
        //Save cookies
            //await helper.saveCookiesToFile(page, cookiesDirPath + "kanshudo.json");
        //Save HTML
            //await helper.saveHtmlToFile(page, htmlDirPath + "kanshudo.html");

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
        await helper.saveDataToFile(japSentenceJson, jsonDirPath + "jap_sentence");

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