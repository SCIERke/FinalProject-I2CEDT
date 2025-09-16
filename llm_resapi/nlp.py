import nltk
import re
import string
from collections import Counter
from nltk.corpus import stopwords
from textstat import flesch_reading_ease, syllable_count
nltk.download('punkt')
nltk.download('stopwords')

def normalize_text(text):
    # Remove punctuation
    return text.translate(str.maketrans('', '', string.punctuation))

def extract_features(text: str, stopword_list: set = None) -> dict:
    if stopword_list is None:
        stopword_list = set(stopwords.words('english'))

    # Sentence splitting
    sentences = nltk.sent_tokenize(text)
    sentence_count = len(sentences)

    # Tokenize
    clean_text = normalize_text(text)
    tokens = nltk.word_tokenize(clean_text)
    token_lower = [t.lower() for t in tokens if t.strip() != '']
    word_count = len(token_lower)

    # Character count (no space, no punctuation)
    char_count = len(re.sub(r'[\s{}]+'.format(re.escape(string.punctuation)), '', text))

    # Hapax count
    freq = Counter(token_lower)
    hapax_count = len([word for word, count in freq.items() if count == 1])

    # Stop word count
    stopword_count = sum(1 for word in token_lower if word in stopword_list)

    # Noun heuristic: word with uppercase in middle of sentence
    words = text.split()
    noun_count = 0
    for i in range(1, len(words)):
        if words[i][0].isupper() and not words[i].isupper():
            noun_count += 1

    # Syllable count (using textstat or syllables)
    total_syllables = sum([syllable_count(word) for word in tokens])

    # Readability (Flesch Reading Ease)
    reading_ease = flesch_reading_ease(text)

    return {
        "wordCount": word_count,
        "sentenceCount": sentence_count,
        "charCount": char_count,
        "hapaxCount": hapax_count,
        "stopWordCount": stopword_count,
        "nounCount": noun_count,
        "syllableCount": total_syllables,
        "readingEase": round(reading_ease, 2)
    }

text = "Some people believe that the best way to reduce crime is to give longer prison sentences. Others think that there are better ways to reduce crime. Discuss both views and give your opinion.\n\nCrime has been a persistent issue in society, and different people have various ideas about how to tackle it. While some argue that longer prison sentences are effective in deterring criminals, others believe alternative methods may yield better results. This essay will explore both views and present my own perspective.\n\nOn one hand, longer prison sentences may act as a deterrent for potential criminals. If people are aware that committing a crime could lead to many years behind bars, they might think twice before engaging in illegal activities. Moreover, keeping serious offenders away from society for extended periods can protect citizens and reduce repeat offenses.\n\nOn the other hand, relying solely on prison sentences may not address the root causes of crime. For example, lack of education, poverty, and unemployment often push individuals toward criminal behavior. Investing in social programs, education, and rehabilitation can help people make better life choices and reduce the likelihood of reoffending.\n\nIn my opinion, while longer sentences might be necessary for certain violent crimes, a more balanced approach is needed. Preventative measures and support systems are crucial in addressing the underlying issues that lead to crime.\n\nIn conclusion, both longer prison sentences and alternative methods have their merits. However, combining strict punishment with social reforms is likely the most effective strategy for reducing crime in the long term."

features = extract_features(text)
for key, value in features.items():
    print(f"{key}: {value}")