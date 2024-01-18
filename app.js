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
const varPlusLessUsedSubKanji = "酒";
const kanjiComponent = "录";
const currentKanji = varPlusLessUsedSubKanji;
const currentKanjis = [mainKanji, multiMeaningKanji, varPlusLessUsedSubKanji, kanjiComponent, "伸", "近", "差", "録"];

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
        const kanjiObj = await getKanjis(browser, currentKanjis, cookies);


        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        const kanjiJson = JSON.stringify(kanjiObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(kanjiJson, jsonDirPath + "test5.json");

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

async function getKanjis(browser, kanjiUrlSuffixes, cookies) {
    //Map url suffixes to getKanjiDetail() Promises
    let pages = [];//To close later
    const kanjiPromises = kanjiUrlSuffixes.map(async (kanjiUrlSuffix) => {
        //Open new page
        const page = await browser.newPage();
        //Store page to close later
        pages.push(page);
        //Get kanji
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get kanji
            const kanjiObj = await getKanjiDetail(page, kanjiUrlSuffix);
            //Return
            return kanjiObj;
        } catch (error) {
            console.error('Error in getKanjis():', error);
            return false;
        }
    });
    //Process results
    try {
        const kanjis = await Promise.all(kanjiPromises);
        //Add list to object
        const kanjisObj = { kanjis: kanjis };
        //Return
        return kanjisObj;
    } catch(error) {
        console.error('Error in getKanjis():', error);
        return false;
    } finally {
        //Close all pages
        await Promise.all(pages.map(page => page.close()));
    }
}

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
        const [kanjiIds, kanjiDef, kanjiType, componentIds] = await Promise.all([
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level0 .kr_container .kanji', 'id', '^(k_kan_)'),
            getKanjiDetailDefinition(page),
            getKanjiType(page),
            helper.getIds(page, '#main-content .bodyarea .kanjirow.level1 .kr_container .kanji', 'id', '^(k_kan_)')
        ])
        //Grab the kanji id (only 1 id per page)
        const kanjiId = kanjiIds[0];
        //Return
        return {
            id: kanjiId,
            kanji: kanjiDef.kanji,
            meaning: kanjiDef.meaning,
            type: kanjiType,
            component_ids: componentIds
        };
    } catch (error) {
        console.error('Error in getKanjiDetail():', error);
        return false;
    }
}

async function getKanjiType(page) {
    return await page.evaluate(() => {
        return document.querySelector('#main-content .bodyarea .kdetailsrow .kdetails2 div .typemessage').textContent;
    });
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