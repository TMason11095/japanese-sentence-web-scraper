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
        const japSentence = await getJapSentenceExample(page);
        //Get the English translation of the example sentence
        const engSentence = await getEngSentenceExample(page);
        //Get the grammar ids
        const grammarIds = await getSectionIds(page, 'Grammar and points of interest', '.gp_icons .jlpt_container', 'id', '^(jlpt_)');
        //Get inflection ids
        const inflectionIds = await getInflectionIds(page);



        
        //Merge the objects
        const mergedObjects = {
            japanese_sentence: japSentence,
            english_sentence: engSentence,
            grammar_ids: grammarIds,
            inflection_ids: inflectionIds
        };

        const mergedObjectsJson = JSON.stringify(mergedObjects, null, 4);
        
        //Save Sentence JSON to file
        await helper.saveDataToFile(mergedObjectsJson, jsonDirPath + "test4.json");

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

async function getInflectionIds(page) {
    //Get inflection ids with possible duplicates
    const dupInflectionIds = await getSectionIds(page, 'Conjugations and inflections', "a[href^='/grammar/id/']", 'href', '^(https://www.kanshudo.com/grammar/id/)');
    //Convert the array to a set and back to remove any duplicates
    const inflectionIds = Array.from(new Set(dupInflectionIds));
    //Return
    return inflectionIds;
}

async function getSectionIds(page, sectionHeaderText, idContainerSelector, idField, idPrefixRegExText) {
    //Grab section header (sections don't have classes so we need to next sibling into it)
    const sectionHeader = await page.$(`#main-content .bodyarea .shead::-p-text(${sectionHeaderText})`);
    //Grab all ids
    const ids = await page.evaluate((sectionHeader, idContainerSelector, idField, idPrefixRegExText) => {
        //Grab the next sibling for the grammar section
        const section = sectionHeader.nextElementSibling;
        //Grab all entries
        const entries = section.querySelectorAll('.gp_search');
        //Loop through each entry to get the id
        let ids = [];
        for (const entry of entries) {
            //Get id container
            const idContainer = entry.querySelector(idContainerSelector);
            //Grab the idField with the prefixed id
            const prefixedId = idContainer[idField];
            //Grab the id by removing the prefix
            const id = prefixedId.replace(new RegExp(idPrefixRegExText), "");
            //Add to ids
            ids.push(id);
        }
        //Return ids
        return ids;
    }, sectionHeader, idContainerSelector, idField, idPrefixRegExText);
    //Return
    return ids;
}

async function getEngSentenceExample(page) {
    //Grab the example sentence section
    const engSentenceElement = await page.$('#main-content .bodyarea .spaced .tatoeba .tat_eng .text');
    //Grab the text
    const engSentence = await page.evaluate((engSentenceElement) => engSentenceElement.textContent, engSentenceElement);
    //Return
    return engSentence;
}

async function getJapSentenceExample(page) {
    //Grab the example sentence section
    const sentenceSect = await page.$('#main-content .bodyarea .spaced .tatoeba');
    //Process the Japanese sentence
    const japSentence = await page.evaluate((sentenceSect) => {
        //Grab the start of the Japanese section (Only need it as the starting point for the following siblings)
        const start = sentenceSect.querySelector('.tat-tf');
        //Start looping through the siblings until we hit <br>. Build the sentence as we go
        let japSentenceBuilder = [];
        let currentElement = start.nextElementSibling;
        while (currentElement && currentElement.tagName != 'BR') {
            switch (currentElement.tagName) {
                case 'A'://Clickable (vocab)
                    //Track if kanji was found to put it in a kanji_vocab object
                    let hasKanji = false;
                    //Build the vocab
                    let vocabBuilder = [];
                    //Loop through children
                    for (const node of currentElement.childNodes) {
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
                    japSentenceBuilder.push(currentElement.textContent);
                    break;
            }
            //Get the next sibling
            currentElement = currentElement.nextElementSibling;
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
    }, sentenceSect);

    //Return the sentence
    return japSentence;
}