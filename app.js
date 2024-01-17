import * as helper from './js/helper.js';
import * as exampleSentences from './js/example_sentences.js';
import * as grammars from './js/grammars.js';
import * as vocabs from './js/vocabs.js';

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

// const mainGrammar = "を";
// const nextGrammar = "よう"
// const noGrammar = "一段";
// const currentGrammar = mainGrammar;
// const currentGrammars = [mainGrammar, nextGrammar, noGrammar, 'dates', 'irregular_verbs'];

// const mainVocab = "WPJLPT-N5-1";
// const currentVocab = mainVocab;

const mainKanji = "買";
const multiMeaningKanji = "外";
const currentKanji = mainKanji;

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
        //const grammarObj = await grammars.getGrammars(browser, currentGrammars, cookies);

        //Get vocab object
        //const vocabPageObj = await vocabs.getVocabPageFromBrowser(browser, currentVocab, cookies);
        
        //Get kanji object
        
        //Open new page
        const page = await browser.newPage();
        let kanjiObj;
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get kanji
            kanjiObj = await getKanjiDetail(page, currentKanji);
        } catch (error) {
            console.error('Error in main():', error);
            return false;
        } finally {
            page.close();
        }


        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        const kanjiJson = JSON.stringify(kanjiObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(kanjiJson, jsonDirPath + "test3.json");

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

async function getKanjiDetail(page, kanjiUrlSuffix) {
    //Base url
    const baseUrl = 'https://www.kanshudo.com/kanji/';
    //Full url
    const kanjiUrl = baseUrl + kanjiUrlSuffix;
    //Get kanji detail
    try {
        //Navigate to page
        await page.goto(kanjiUrl);
        //Get kanji components in parallel
        const [kanjiIds, kanjiDef, kanjiSubIds] = await Promise.all([
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level0 .kr_container .kanji', 'id', '^(k_kan_)'),
            getKanjiDetailDefinition(page),
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level1 .kr_container [class="kanji "]', 'id', '^(k_kan_)')
        ])
        //Grab the kanji id (only 1 id per page)
        const kanjiId = kanjiIds[0];
        //Return
        return {
            id: kanjiId,
            kanji: kanjiDef.kanji,
            meaning: kanjiDef.meaning,
            sub_kanji_ids: kanjiSubIds
        };
    } catch (error) {
        console.error('Error in getKanjiDetail():', error);
        return false;
    }
}

async function getKanjiDetailDefinition(page) {
    //Get the kanji definition sentence (includes kanji + filler text + definition)
    const defWithFiller = await page.evaluate(() => {
        return document.querySelector('#main-content .bodyarea h1').textContent;
    });
    //Split the definition by "mean" (kanji means 'def')
    const kanjiDefSplit = defWithFiller.split('means');
    //Get each component of the split
    const kanji = kanjiDefSplit[0].trim();
    const kanjiDef = kanjiDefSplit[1].trim().replaceAll("'", ''); //Remove surrounding ''
    //Return
    return {
        kanji: kanji,
        meaning: kanjiDef
    }
}