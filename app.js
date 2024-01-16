import * as helper from './js/helper.js';
import * as exampleSentences from './js/example_sentences.js';
import * as grammars from './js/grammars.js';

import * as error from 'console';
import * as puppeteer from 'puppeteer';

const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";
const jsonDirPath =  "jsons/"

// const mainExampleId = "46829"
// const kanjiHiraKanjiExampleId = "18180";
// //Set current example id
// const currentExampleId = mainExampleId;
// const currentExampleIds = [mainExampleId, kanjiHiraKanjiExampleId];

const mainGrammar = "を";
const nextGrammar = "よう"
const noGrammar = "一段";
const currentGrammar = mainGrammar;
const currentGrammars = [mainGrammar, nextGrammar, noGrammar, 'dates', 'irregular_verbs'];

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch({dumpio: true});//{headless: false}
    //Do the rest of the operations within a try so the browser doesn't stay open on errors
    try {
        //Get cookies
        const cookies = await helper.getCookiesFromFile(cookiesDirPath + "kanshudo.json");

        //Timer
        const beforePageCallsTime = Date.now();

        //Get example sentences object
        //const exampleSentencesObj = await exampleSentences.getExampleSentences(browser, currentExampleIds, cookies);

        //Get grammar object
        const grammarObj = await grammars.getGrammars(browser, currentGrammars, cookies);

        //Get vocab object


        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        const grammarJson = JSON.stringify(grammarObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(grammarJson, jsonDirPath + "test1.json");

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

