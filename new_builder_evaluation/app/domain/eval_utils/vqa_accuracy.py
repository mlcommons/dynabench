# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# coding=utf-8
# This code is based on:
# (https://github.com/Cloud-CV/VQA-Challenge/blob/master/PythonEvaluationTools/
# vqaEvaluation/vqaEval.py), which is based on:

# This code is based on the code written by Tsung-Yi Lin for MSCOCO Python API
# available at the following link:
# (https://github.com/tylin/coco-caption/blob/master/pycocoevalcap/eval.py).

__author__ = "aagrawal"

import re
from abc import ABC


contractions = {
    "aint": "ain't",
    "arent": "aren't",
    "cant": "can't",
    "couldve": "could've",
    "couldnt": "couldn't",
    "couldn'tve": "couldn't've",
    "couldnt've": "couldn't've",
    "didnt": "didn't",
    "doesnt": "doesn't",
    "dont": "don't",
    "hadnt": "hadn't",
    "hadnt've": "hadn't've",
    "hadn'tve": "hadn't've",
    "hasnt": "hasn't",
    "havent": "haven't",
    "hed": "he'd",
    "hed've": "he'd've",
    "he'dve": "he'd've",
    "hes": "he's",
    "howd": "how'd",
    "howll": "how'll",
    "hows": "how's",
    "Id've": "I'd've",
    "I'dve": "I'd've",
    "Im": "I'm",
    "Ive": "I've",
    "isnt": "isn't",
    "itd": "it'd",
    "itd've": "it'd've",
    "it'dve": "it'd've",
    "itll": "it'll",
    "let's": "let's",
    "maam": "ma'am",
    "mightnt": "mightn't",
    "mightnt've": "mightn't've",
    "mightn'tve": "mightn't've",
    "mightve": "might've",
    "mustnt": "mustn't",
    "mustve": "must've",
    "neednt": "needn't",
    "notve": "not've",
    "oclock": "o'clock",
    "oughtnt": "oughtn't",
    "ow's'at": "'ow's'at",
    "'ows'at": "'ow's'at",
    "'ow'sat": "'ow's'at",
    "shant": "shan't",
    "shed've": "she'd've",
    "she'dve": "she'd've",
    "she's": "she's",
    "shouldve": "should've",
    "shouldnt": "shouldn't",
    "shouldnt've": "shouldn't've",
    "shouldn'tve": "shouldn't've",
    "somebody'd": "somebodyd",
    "somebodyd've": "somebody'd've",
    "somebody'dve": "somebody'd've",
    "somebodyll": "somebody'll",
    "somebodys": "somebody's",
    "someoned": "someone'd",
    "someoned've": "someone'd've",
    "someone'dve": "someone'd've",
    "someonell": "someone'll",
    "someones": "someone's",
    "somethingd": "something'd",
    "somethingd've": "something'd've",
    "something'dve": "something'd've",
    "somethingll": "something'll",
    "thats": "that's",
    "thered": "there'd",
    "thered've": "there'd've",
    "there'dve": "there'd've",
    "therere": "there're",
    "theres": "there's",
    "theyd": "they'd",
    "theyd've": "they'd've",
    "they'dve": "they'd've",
    "theyll": "they'll",
    "theyre": "they're",
    "theyve": "they've",
    "twas": "'twas",
    "wasnt": "wasn't",
    "wed've": "we'd've",
    "we'dve": "we'd've",
    "weve": "we've",
    "werent": "weren't",
    "whatll": "what'll",
    "whatre": "what're",
    "whats": "what's",
    "whatve": "what've",
    "whens": "when's",
    "whered": "where'd",
    "wheres": "where's",
    "whereve": "where've",
    "whod": "who'd",
    "whod've": "who'd've",
    "who'dve": "who'd've",
    "wholl": "who'll",
    "whos": "who's",
    "whove": "who've",
    "whyll": "why'll",
    "whyre": "why're",
    "whys": "why's",
    "wont": "won't",
    "wouldve": "would've",
    "wouldnt": "wouldn't",
    "wouldnt've": "wouldn't've",
    "wouldn'tve": "wouldn't've",
    "yall": "y'all",
    "yall'll": "y'all'll",
    "y'allll": "y'all'll",
    "yall'd've": "y'all'd've",
    "y'alld've": "y'all'd've",
    "y'all'dve": "y'all'd've",
    "youd": "you'd",
    "youd've": "you'd've",
    "you'dve": "you'd've",
    "youll": "you'll",
    "youre": "you're",
    "youve": "you've",
}

manualMap = {
    "none": "0",
    "zero": "0",
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "ten": "10",
}
articles = ["a", "an", "the"]
periodStrip = re.compile(r"(?!<=\d)(\.)(?!\d)")
commaStrip = re.compile(r"(?<=\d)(\,)+(?=\d)")
puncStrip = re.compile(
    r"(?<=[ \\;/\"`\[\](){}<>@=+_\-,?!])([\\;/\"`\[\](){}<>@=+_\-,?!])|([\\;/\"`"
    + r"\[\](){}<>@=+_\-,?!])(?=[ \\;/\"`\[\](){}<>@=+_\-,?!])"
)
puncStrip2 = re.compile(r"(?<=[a-zA-Z])([\\;/\"`\[\](){}<>@=+_\-,?!])(?=[a-zA-Z])")
puncStripBegin = re.compile(r"\A([ \\;/\"`\[\](){}<>@=+_\-,?!]+)(?=[a-zA-Z0-9 ])")
puncStripEnd = re.compile(r"(?<=[a-zA-Z0-9 ])([ \\;/\"`\[\](){}<>@=+_\-,?!]+)\Z")
spaceCleanup = re.compile(r"([ ]+)")
punct = [
    ";",
    r"/",
    "[",
    "]",
    '"',
    "{",
    "}",
    "(",
    ")",
    "=",
    "+",
    "\\",
    "_",
    "-",
    ">",
    "<",
    "@",
    "`",
    ",",
    "?",
    "!",
]


class VQAEval(ABC):
    def __init__(self, n=2, answer_type="overall"):
        self.n = n
        self.answer_type = answer_type

    def __call__(self, gt: list, res: str):
        resAns = res
        resAns = resAns.replace("\n", " ")
        resAns = resAns.replace("\t", " ")
        resAns = resAns.strip()
        resAns = self.processPunctuation(resAns)
        resAns = self.processDigitArticle(resAns)
        processed_gt = []
        for ans in gt:
            ans = self.processPunctuation(ans)
            ans = self.processDigitArticle(ans)
            processed_gt.append(ans)
        gtAcc = []
        #######################################################
        for idx, gtAnsDatum in enumerate(processed_gt):
            otherGTAns = [
                item for item_idx, item in enumerate(processed_gt) if item_idx != idx
            ]
            matchingAns = [item for item in otherGTAns if item == resAns]
            acc = min(1, float(len(matchingAns)) / 3)
            gtAcc.append(acc)
        #######################################################
        avgGTAcc = float(sum(gtAcc)) / len(gtAcc)
        return avgGTAcc

    def processPunctuation(self, inText):
        outText = puncStripBegin.sub("", inText)
        outText = puncStripEnd.sub("", outText)
        outText = commaStrip.sub("", outText)
        outText = puncStrip.sub(" ", outText)
        outText = spaceCleanup.sub(" ", outText)
        outText = puncStrip2.sub(" ", outText)
        outText = puncStrip2.sub("", outText)
        outText = periodStrip.sub("", outText, re.UNICODE)
        return outText

    def processDigitArticle(self, inText):
        outText = []
        tempText = inText.lower().split()
        for word in tempText:
            word = manualMap.setdefault(word, word)
            if word not in articles:
                outText.append(word)
            else:
                pass
        for wordId, word in enumerate(outText):
            if word in contractions:
                outText[wordId] = contractions[word]
        outText = " ".join(outText)
        return outText
