import * as helper from './js/helper.js';
import * as exampleSentences from './js/example_sentences.js';

import * as error from 'console';
import * as puppeteer from 'puppeteer';

const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";
const jsonDirPath =  "jsons/"

const mainExampleId = "46829"
const kanjiHiraKanjiExampleId = "18180";

//Set current example id
const currentExampleId = mainExampleId;
const currentExampleIds = [mainExampleId, kanjiHiraKanjiExampleId];

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch({dumpio: true});//{headless: false}
    //Do the rest of the operations within a try so the browser doesn't stay open on errors
    try {
        //Open new page
        const page = await browser.newPage();
        //Load cookies
        await helper.loadCookiesFromFile(page, cookiesDirPath + "kanshudo.json");
        //Get example sentences object
        const exampleSentencesObj = await exampleSentences.getExampleSentences(page, currentExampleIds)
        //const exampleSentence = await exampleSentences.getExampleSentence(page, currentExampleId);



        //Convert example sentence to JSON
        const exampleSentencesJson = JSON.stringify(exampleSentencesObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(exampleSentencesJson, jsonDirPath + "test9.json");

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