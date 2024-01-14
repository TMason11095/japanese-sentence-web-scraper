import * as helper from './js/helper.js';

import * as error from 'console';
import * as puppeteer from 'puppeteer';

const screenshotsDirPath = "screenshots/";
const cookiesDirPath = "cookies/";
const htmlDirPath = "htmls/";
const jsonDirPath =  "jsons/"

const mainExampleUrl = "https://www.kanshudo.com/example/46829"
const kanjiHiraKanjiExampleUrl = "https://www.kanshudo.com/example/18180";

//Set current url
const currentUrl = mainExampleUrl;

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
        await page.goto(currentUrl);
        //Inject jQuery
            //await helper.injectJquery(page);
        //Save cookies
            //await helper.saveCookiesToFile(page, cookiesDirPath + "kanshudo.json");
        //Save HTML
            //await helper.saveHtmlToFile(page, htmlDirPath + "kanshudo.html");
        //Get the Japanese example sentence breakdown
        const japSentence = await getJapSentence(page);
        //Get the English translation of the example sentence
        const engSentence = await getEngSentence(page);
        //Get the grammar ids
        const grammarIds = await getGrammarIds(page);
        //Get vocab ids
        const vocabIds = await getIds(page, '#main-content .bodyarea .jukugorow', 'id', '^(jukugo_)');
        //Get kanji ids



        
        


        
        //Merge the objects
        const mergedObjects = {
            japanese_sentence: japSentence,
            english_sentence: engSentence,
            grammar_ids: grammarIds,
            //inflection_ids: inflectionIds,
            vocab_ids: vocabIds
        };

        const mergedObjectsJson = JSON.stringify(mergedObjects, null, 4);
        
        //Save Sentence JSON to file
        await helper.saveDataToFile(mergedObjectsJson, jsonDirPath + "test6.json");

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

//Grammar is split up into 2 areas. Need to combine them here
async function getGrammarIds(page) {
    //Get the standard grammar ids
    const standardGrammarIds = await getIds(page, '#main-content .bodyarea div .gp_search .gp_icons .jlpt_container', 'id', '^(jlpt_)');
    //Get inflection ids
    const inflectionIds = await getIds(page, '#main-content .bodyarea div .gp_search a[href^="/grammar/id/"]', 'href', '^(https://www.kanshudo.com/grammar/id/)');
    //Merge the 2 id lists to get all grammar ids (might have duplicate entries)
    const dupGrammarIds = standardGrammarIds.concat(inflectionIds);
    //Remove duplicate entries by converting the array to a set and then back to an array
    const grammarIds = Array.from(new Set(dupGrammarIds));
    //Return
    return grammarIds;
}

async function getIds(page, entriesSelector, entryIdField, idPrefixRegExText) {
    //Get ids
    const ids = await page.evaluate((entriesSelector, entryIdField, idPrefixRegExText) => {
        //Get id entries
        const entries = document.querySelectorAll(entriesSelector);
        //Loop and grab ids
        let ids = [];
        for (const entry of entries) {
            //Get prefixed id
            const prefixedId = entry[entryIdField];
            //Remove prefix
            const id = prefixedId.replace(new RegExp(idPrefixRegExText), "");
            //Add to list
            ids.push(id);
        }
        //Return
        return ids;
    }, entriesSelector, entryIdField, idPrefixRegExText);
    //Return
    return ids;
}

async function getEngSentence(page) {
    //Grab the example sentence section
    const engSentenceElement = await page.$('#main-content .bodyarea .spaced .tatoeba .tat_eng .text');
    //Grab the text
    const engSentence = await page.evaluate((engSentenceElement) => engSentenceElement.textContent, engSentenceElement);
    //Return
    return engSentence;
}

async function getJapSentence(page) {
    //Get and process Japanese sentence
    const japSentence = await page.evaluate(() => {
        //Get sentence elements
        const sentenceElements = document.querySelectorAll('#main-content .bodyarea .spaced .tatoeba [class*="tatvoc"]');
        //Loop through and build the sentence
        let japSentenceBuilder = [];
        for (const element of sentenceElements) {
            switch (element.tagName) {
                case 'A'://Clickable (vocab)
                    //Track if kanji was found to put it in a kanji_vocab object
                    let hasKanji = false;
                    //Loop through children and build the vocab
                    let vocabBuilder = [];
                    for (const node of element.childNodes) {
                        //Check the node type
                        switch (node.nodeType) {
                            case Node.ELEMENT_NODE: //Kanji with furigana
                                //Set kanji bool
                                hasKanji = true;
                                //Add to vocab
                                vocabBuilder.push({
                                    kanji: node.querySelector('.f_kanji').textContent,
                                    furigana: node.querySelector('.furigana').textContent
                                });
                                break;
                            case Node.TEXT_NODE: //Hiragana
                                //Add to vocab
                                vocabBuilder.push(node.textContent);
                                break;
                        }
                    }
                    //Set vocab (overridable for kanji_vocab)
                    let vocab = vocabBuilder;
                    //Check if the entry was kanji_vocab
                    if (hasKanji) {
                        //Set vocab as an object
                        vocab = { kanji_vocab: vocabBuilder };
                    }
                    //Add the vocab to the sentence
                    japSentenceBuilder.push(vocab);
                    break;
                case 'SPAN'://Punctuation and joining characters
                    //Add to the sentence
                    japSentenceBuilder.push(element.textContent);
                    break;
            }
        }
        //Combine from sentence builder
        const japSentence = japSentenceBuilder.flat();
        //Merge any non kanji_vocab that are in a row
        let mergedJapSentence = [];
        let nonKanjiCount = 0;
        let mergedText = "";
        for (const entry of japSentence) {
            //Check if kanji_vocab
            if (entry.kanji_vocab) {
                //Check if there was a previous non kanji entry
                if (nonKanjiCount > 0) {
                    //Add the merged entries
                    mergedJapSentence.push(mergedText);
                    //Reset the count
                    nonKanjiCount = 0;
                    //Reset the merge text
                    mergedText = "";
                }
                //Add kanji_vocab
                mergedJapSentence.push(entry);
            }
            else {
                //Increment counter
                nonKanjiCount++;
                //Add text
                mergedText += entry;
            }
        }
        //Check if there was any non kanji entries at the end
        if (nonKanjiCount > 0) {
            //Add the merged entries
            mergedJapSentence.push(mergedText);
        }
        //Return the sentence
        return mergedJapSentence;
    });
    //Return the sentence
    return japSentence;
}