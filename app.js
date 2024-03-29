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

        //Get JLPT Kanjis
        //Get N2-N5
        // for (let level = 5; level >= 2; level--) {//N1 has too many entries to store into a single JSON
        //     //Set the N# text
        //     const nLevel = 'N' + level;
        //     //Get the kanjis for that N level
        //     const kanjiObj = await kanjis.getAllJlptKanjis(browser, cookies, nLevel);
        //     //Convert to JSON
        //     const jsonObj = JSON.stringify(kanjiObj, null, 4);
        //     //Save the JSON
        //     await helper.saveDataToFile(jsonObj, jsonDirPath + nLevel + ".json");
        // }

        // //Get N1 Kanjis (Goes from "N1 1-100" to "N1 1001-1136")
        // const nLevel = 'N1';
        // const n1KanjisObj = await kanjis.getAllJlptKanjis(browser, cookies, nLevel);
        // //Divide into 3 sections at a time
        // const chunkSize = 3;
        // const n1Sections = n1KanjisObj.sections;
        // const n1Split = [];
        // for (let i = 0; i < n1Sections.length; i += chunkSize) {
        //     n1Split.push(n1Sections.slice(i, i + chunkSize));
        // }
        // //Generate JSON for each sub section
        // for (let i = 0; i < n1Split.length; i++) {
        //     //Setup the object
        //     const n1Obj = {
        //         grouping_name: nLevel,
        //         sections: n1Split[i] 
        //     };
        //     //Convert to JSON
        //     const jsonObj = JSON.stringify(n1Obj, null, 4);
        //     //Save the JSON
        //     await helper.saveDataToFile(jsonObj, jsonDirPath + nLevel + "pt" + (i + 1) + ".json");
        // };

        //Get kanji with unredirected components from JSON file
        // const unredirectedKanjis = await helper.getJsonFileContents(jsonDirPath + "/input/kanji_with_unredirected_components.json");
        // const kanjiObj = await kanjis.getSpecificKanjiComponents(browser, cookies, unredirectedKanjis.kanjis);

        // //Get JLPT vocab
        // const nLevel = 'N1'
        // const nLevelVocabs = await vocabs.getAllJlptVocabs(browser, cookies, nLevel);
        // //Split into chunks to fit into JSON files
        // const nLevelVocabSectionsLength = nLevelVocabs.sections.length;
        // let vocabChunks = [];
        // const maxChunkSize = 3;
        // const chunkBonusOverrideSize = 1;//Number of elements remaining to just add to the current chunk instead of making a new chunk
        // let currentChunkIndex = 0;
        // for (let i = 0; i < nLevelVocabSectionsLength; i++) {
        //     //Check if the current chunk doesn't exist yet
        //     if ((vocabChunks.length - 1) < currentChunkIndex) {
        //         //Setup a new chunk
        //         vocabChunks.push({
        //             grouping_name: nLevelVocabs.grouping_name,
        //             sections: []
        //         });
        //     };
        //     //Add the current vocab section to the chunk
        //     vocabChunks[currentChunkIndex].sections.push(nLevelVocabs.sections[i]);
        //     //Check if the chunk size has reached the max
        //     if (vocabChunks[currentChunkIndex].sections.length >= maxChunkSize) {
        //         //Check if there's just enough remaining sections to put them all in this chunk
        //         if ((nLevelVocabSectionsLength - 1) - i <= chunkBonusOverrideSize) {
        //             //Skip the current loop since we don't need to update the chunk index
        //             continue;
        //         }
        //         //Increment the current chunk
        //         currentChunkIndex++;
        //     }
        // }
        // //Put each chunk into their own JSON file
        // for (let i = 0; i < vocabChunks.length; i++) {
        //     //Convert current index to JSON
        //     const jsonObj = JSON.stringify(vocabChunks[i], null, 4);
        //     //Save the JSON
        //     await helper.saveDataToFile(jsonObj, jsonDirPath + "vocab-" + nLevel + "-pt" + (i + 1) + ".json");
        // }

        //Get remaining vocab that don't have an N level
        const nonJlptVocab = await vocabs.getAllNonJlptVocabDetailFromBrowser(browser, cookies);
        //Grab the grouping name
        const grouping_name = nonJlptVocab.grouping_name;
        //Merge all the vocab into 1 array
        const mergedNonJlptVocab = nonJlptVocab.sections.map(section => section.vocabs).flat();
        //Split into chunks
        const vocabMaxChunkSize = 500;
        const numOfChunks = Math.ceil(mergedNonJlptVocab.length / vocabMaxChunkSize);
        const vocabChunks = [];
        for (let i = 0; i < numOfChunks; i++) {
            let chunkSize = vocabMaxChunkSize;
            //Get the remaining vocab
            const remainingVocab = mergedNonJlptVocab.slice((i * vocabMaxChunkSize));
            //Check if we have less than the max chunk size remaining
            if (remainingVocab.length < vocabMaxChunkSize) {
                //Set the chunk size to the remaining count
                chunkSize = remainingVocab.length;
            }
            //Setup the chunk
            vocabChunks.push({
                grouping_name: grouping_name,
                vocabs: remainingVocab.slice(0, chunkSize)
            });
        }
        //Put each chunk into their own JSON file
        for (let i = 0; i < vocabChunks.length; i++) {
            //Convert current index to JSON
            const jsonObj = JSON.stringify(vocabChunks[i], null, 4);
            //Save the JSON
            await helper.saveDataToFile(jsonObj, jsonDirPath + "vocab-N0" + "-pt" + (i + 1) + ".json");
        }
        //const test = await vocabs.getVocabDetailFromBrowser(browser, "https://www.kanshudo.com/collections/vocab_usefulness2021/UFN2021-1-1", cookies);

        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        //const jsonObj = JSON.stringify(kanjiObj, null, 4);
        //Save Sentence JSON to file
        //await helper.saveDataToFile(jsonObj, jsonDirPath + "unredirected_kanjis.json");

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

