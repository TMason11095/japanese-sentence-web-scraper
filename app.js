import * as helper from './js/helper.js';
import * as exampleSentences from './js/example_sentences.js';
import * as grammars from './js/grammars.js';
import * as vocabs from './js/vocabs.js';
import * as kanjis from './js/kanjis.js';

import * as error from 'console';
import * as puppeteer from 'puppeteer';

const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";
const jsonDirPath =  "jsons/";

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

// const mainKanji = "買";
// const multiMeaningKanji = "外";
// const varPlusLessUsedSubKanji = "酒";
// const kanjiComponent = "录";
// const currentKanji = varPlusLessUsedSubKanji;
// const currentKanjis = [mainKanji, multiMeaningKanji, varPlusLessUsedSubKanji, kanjiComponent, "伸", "近", "差", "録"];

(async () => {
    //Launch puppeteer
    const browser = await puppeteer.launch({dumpio: true, headless: false});//{headless: false}
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
        //const kanjiObj = await kanjis.getKanjis(browser, currentKanjis, cookies);

        //Get kanji components
        //const kanjiCompObj = await kanjis.getAllKanjiComponents(browser, cookies);
        const kanjiCompObj = await kanjis.getAllKanjiComponents(browser, cookies);

        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        const jsonObj = JSON.stringify(kanjiCompObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(jsonObj, jsonDirPath + "test6.json");

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

