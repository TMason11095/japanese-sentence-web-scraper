import * as cluster from 'cluster';
import * as helper from './helper.js';

export async function getExampleSentences(browser, exampleIds, cookies) {
     
    //Map the ids to getExampleSentence Promises
    const examplePromises = exampleIds.map(async (exampleId) => {
        //Open new page
        const page = await browser.newPage();
        //Get example sentence
        try {
            //Load cookies
            await page.setCookie(...cookies);
            //Get the example sentence
            return await getExampleSentence(page, exampleId)
        } finally {
            //Close the page when done
            await page.close();
        }
    });
    //Process results
    try {
        const exampleSentences = await Promise.all(examplePromises);
        //Add list to object
        const exampleSentencesObj = { example_sentences: exampleSentences };
        //Return list object
        return exampleSentencesObj;
    } catch (error) {
        console.error('Error in getExampleSentences():', error);
        return false;
    }
}

export async function getExampleSentence(page, exampleId) {
    try {
        //Example sentence base url
        const baseUrl = 'https://www.kanshudo.com/example/';
        //Built the full example sentence url
        const exampleUrl = baseUrl + exampleId;
        //Navigate to the Kanshudo website
        await page.goto(exampleUrl);
        //Save cookies
            //await helper.saveCookiesToFile(page, cookiesDirPath + "kanshudo.json");
        //Save HTML
            //await helper.saveHtmlToFile(page, htmlDirPath + "kanshudo.html");

        //Get all sentence components in parallel
        const [japSentence, engSentence, grammarIds, vocabIds, kanjiIds] = await Promise.all([
            getJapSentence(page),
            getEngSentence(page),
            getGrammarIds(page),
            getIds(page, '#main-content .bodyarea .jukugorow', 'id', '^(jukugo_)'),
            getIds(page, '#main-content .bodyarea div .kanjirow.level0 .kr_container .kanji', 'id', '^(k_kan_)')
        ]);

        //Merge the objects
        const mergedObjects = {
            id: exampleId,
            japanese_sentence: japSentence,
            english_sentence: engSentence,
            grammar_ids: grammarIds,
            vocab_ids: vocabIds,
            kanji_ids: kanjiIds
        };

        //Return
        return mergedObjects;
    } catch (error) {
        console.error('Error in getExampleSentence():', error);
        return false;
    }
}

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