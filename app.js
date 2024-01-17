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

// const mainGrammar = "を";
// const nextGrammar = "よう"
// const noGrammar = "一段";
// const currentGrammar = mainGrammar;
// const currentGrammars = [mainGrammar, nextGrammar, noGrammar, 'dates', 'irregular_verbs'];

const mainVocab = "WPJLPT-N5-1";
const currentVocab = mainVocab;

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
        const page = await browser.newPage();
        let vocabPageObj;
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get the example sentence
            vocabPageObj = await getVocabPage(page, currentVocab);

        } catch {
            console.error('Error in main:', error);
            return false;
        }
        



        //Display run time (ms)
        console.log(Date.now() - beforePageCallsTime);

        //Convert example sentence to JSON
        const vocabPageJson = JSON.stringify(vocabPageObj, null, 4);
        //Save Sentence JSON to file
        await helper.saveDataToFile(vocabPageJson, jsonDirPath + "test2.json");

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

async function loadEvaluateLocalFunctions(page) {
    await page.evaluate(() => {
    //getVocabFront(vocabContainer)
        window.getVocabFront = (vocabContainer) => {
            //Get the front container
            const frontContainer = vocabContainer.querySelector('div .jukugo a');
            //Loop through the front nodes (can have kanji components that need to be grouped) and build the vocab front entry
            let vocabFront = [];
            for (const frontNode of frontContainer.childNodes) {
                //Check the node type
                switch (frontNode.nodeType) {
                    case Node.ELEMENT_NODE: //Kanji with furigana
                        //Set kanji bool
                        hasKanji = true;
                        //Add to vocab
                        vocabFront.push({
                            kanji: frontNode.querySelector('.f_kanji').textContent,
                            furigana: frontNode.querySelector('.furigana').textContent
                        });
                        break;
                    case Node.TEXT_NODE: //Hiragana
                        //Add to vocab
                        vocabFront.push(frontNode.textContent);
                        break;
                }
            }
            //Return
            return vocabFront;
        }

    //getVocabBack(vocabContainer)
        window.getVocabBack = (vocabContainer) => {
            //Get the back container
            const backContainer = vocabContainer.querySelector('.jukugo_reading div');
            //Grab the vocab type
            const vocabType = backContainer.querySelector('.vm div span').textContent.trim();
            //Grab the vocab definition containers
            const vocabDefContainers = backContainer.querySelectorAll('.vm ');
            //Grab the definitions from each container
            const vocabDefinitions = [];
            for (const vocabDefContainer of vocabDefContainers) {
                //Grab the definition from the text child node
                for (const node of vocabDefContainer.childNodes) {
                    //Skip if not a text node
                    if (node.nodeType != Node.TEXT_NODE) { continue; }
                    //Grab the definition
                    vocabDefinitions.push(node.textContent.trim());
                }

            }
        
            //Return
            return {
                type: vocabType,
                definitions: vocabDefinitions
            };
        }
    });
}

async function getVocabPage(page, vocabUrlSuffix) {
    //Base url
    const baseUrl = 'https://www.kanshudo.com/collections/wikipedia_jlpt/';
    //Build the url
    const vocabUrl = baseUrl + vocabUrlSuffix;
    //Get vocab
    try {
        //Navigate to vocab list page
        await page.goto(vocabUrl);
        //Load local functions to use withing page.evaluate()
        await loadEvaluateLocalFunctions(page);
        //Get vocab page components
        const [vocabPageTitle, vocabContainers] = await Promise.all([getVocabPageTitle(page), getVocabContainers(page)]);
        //Get vocab
        const vocabs = await getVocabs(page, vocabContainers);
        //const vocabs = await Promise.all()

        //Return
        return {
            title: vocabPageTitle,
            vocabs: vocabs
        };
    } catch (error) {
        console.error('Error in getVocabPage():', error);
        return false;
    }
}

async function getVocab(page, vocabContainer) {

}

async function getVocabs(page, vocabContainers) {
    //Map the containers to getVocab() promises
    const vocabPromises = vocabContainers.map(async (vocabContainer) => {
        //Get the vocab
        const vocab = await page.evaluate((vocabContainer) => {
            //Get vocab id
            const id = vocabContainer.id.replace(/^(jr_inner_)/, '');
            //Get the japanese vocab (front)
            const vocabFront = getVocabFront(vocabContainer);
            //Get the english translation (back)
            const vocabBack = getVocabBack(vocabContainer);
            //Return
            return {
                id: id,
                type: vocabBack.type,
                front: vocabFront,
                back: vocabBack.definitions
            };
        }, vocabContainer);
        //Return
        return vocab;
    });
    //Process the results
    try {
        const vocabs = await Promise.all(vocabPromises);
        //Add list to object
        //const vocabsObj = { vocabs: vocabs };
        //Return
        return vocabs;
    } catch (error) {
        console.error('Error in getVocabs():', error);
        return false;
    }
}

async function getVocabContainers(page) {
    //Return vocab containers
    return await page.$$('#main-content .bodyarea .bodysection .spaced .jukugorow .jr_inner');
}

async function getVocabPageTitle(page) {
    //Return the title
    return await page.evaluate(() => { return document.querySelector('#main-content .bodyarea .bodysection h4').textContent.trim(); })
}
