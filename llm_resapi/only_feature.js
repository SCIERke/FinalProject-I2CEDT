function extractFeatures(text) {
  // Stopwords (สามารถเพิ่มเติมได้)
  const stopwords = new Set([
  "a", "about", "above", "across", "after", "again", "against", "all",
  "almost", "alone", "along", "already", "also", "although", "always", "among",
  "an", "and", "another", "any", "anybody", "anyone", "anything", "anywhere",
  "are", "area", "areas", "around", "as", "ask", "asked", "asking", "asks", "at",
  "away", "back", "backed", "backing", "backs", "be", "became", "because",
  "become", "becomes", "been", "before", "began", "behind", "being", "beings",
  "best", "better", "between", "big", "both", "but", "by", "came", "can", "cannot",
  "case", "cases", "certain", "certainly", "clear", "clearly", "come", "could",
  "did", "differ", "different", "differently", "do", "does", "done", "down",
  "downed", "downing", "downs", "during", "each", "early", "either", "end",
  "ended", "ending", "ends", "enough", "even", "evenly", "ever", "every",
  "everybody", "everyone", "everything", "everywhere", "face", "faces", "fact",
  "facts", "far", "felt", "few", "find", "finds", "first", "for", "four", "from",
  "full", "fully", "further", "furthered", "furthering", "furthers", "gave",
  "general", "generally", "get", "gets", "give", "given", "gives", "go", "going",
  "good", "goods", "got", "great", "greater", "greatest", "group", "grouped",
  "grouping", "groups", "had", "has", "have", "having", "he", "her", "here",
  "herself", "high", "higher", "highest", "him", "himself", "his", "how",
  "however", "i", "if", "important", "in", "interest", "interested", "interesting",
  "interests", "into", "is", "it", "its", "itself", "just", "keep", "keeps",
  "kind", "knew", "know", "known", "knows", "large", "largely", "last", "later",
  "latest", "least", "less", "let", "lets", "like", "likely", "long", "longer",
  "longest", "made", "make", "making", "man", "many", "may", "me", "member",
  "members", "men", "might", "more", "most", "mostly", "mr", "mrs", "much",
  "must", "my", "myself", "necessary", "need", "needed", "needing", "needs",
  "never", "new", "newer", "newest", "next", "no", "nobody", "non", "noone",
  "not", "nothing", "now", "nowhere", "number", "numbers", "of", "off", "often",
  "old", "older", "oldest", "on", "once", "one", "only", "open", "opened",
  "opening", "opens", "or", "order", "ordered", "ordering", "orders", "other",
  "others", "our", "out", "over", "part", "parted", "parting", "parts", "per",
  "perhaps", "place", "places", "point", "pointed", "pointing", "points",
  "possible", "present", "presented", "presenting", "presents", "problem",
  "problems", "put", "puts", "quite", "rather", "really", "right", "room",
  "rooms", "said", "same", "saw", "say", "says", "second", "seconds", "see",
  "seem", "seemed", "seeming", "seems", "sees", "several", "shall", "she",
  "should", "show", "showed", "showing", "shows", "side", "sides", "since",
  "small", "smaller", "smallest", "so", "some", "somebody", "someone",
  "something", "somewhere", "state", "states", "still", "such", "sure", "take",
  "taken", "than", "that", "the", "their", "them", "then", "there", "therefore",
  "these", "they", "thing", "things", "think", "thinks", "this", "those",
  "though", "thought", "thoughts", "three", "through", "thus", "to", "today",
  "together", "too", "took", "toward", "turn", "turned", "turning", "turns",
  "two", "under", "until", "up", "upon", "us", "use", "used", "uses", "very",
  "want", "wanted", "wanting", "wants", "was", "way", "ways", "we", "well",
  "wells", "went", "were", "what", "when", "where", "whether", "which", "while",
  "who", "whole", "whose", "why", "will", "with", "within", "without", "work",
  "worked", "working", "works", "would", "year", "years", "yet", "you", "young",
  "younger", "youngest", "your", "yours"
]);



  // ลบ punctuation เพื่อ tokenize คำ
  const cleanText = text.replace(/[.,!?;:"()\-]/g, '');
  const tokens = cleanText.split(/\s+/).filter(Boolean); // ลบคำว่าง
  const tokenLower = tokens.map(word => word.toLowerCase());

  // 1. Word Count
  const wordCount = tokens.length;

  // 2. Sentence Count (แบ่งจาก ., !, ?)
  const sentenceCount = text.split(/[.!?]/).filter(s => s.trim().length > 0).length;

  // 3. Character count (ไม่รวมช่องว่างและ punctuation)
  const charCount = text.replace(/[\s.,!?;:"()\-]/g, '').length;

  // 4. Hapax (คำที่เจอแค่ครั้งเดียว)
  const freq = {};
  tokenLower.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });
  const hapaxCount = Object.values(freq).filter(count => count === 1).length;

  // 5. Stopword Count
  const stopWordCount = tokenLower.filter(word => stopwords.has(word)).length;

  // 6. Noun Count (heuristic: คำที่ขึ้นต้นด้วยตัวใหญ่และไม่ใช่คำแรกของประโยค)
  const words = text.split(/\s+/);
  let nounCount = 0;
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (/^[A-Z]/.test(w) && !/^[A-Z]{2,}$/.test(w)) {
      nounCount++;
    }
  }

  // 7. Reading Ease Score (Simplified Flesch)
  const syllableCount = estimateSyllables(tokens);
  const readingEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

  return {
    wordCount,
    sentenceCount,
    charCount,
    hapaxCount,
    stopWordCount,
    nounCount,
    syllableCount,
    readingEase: readingEase.toFixed(2)
  };
}

// ฟังก์ชันช่วย: ประมาณจำนวนพยางค์แบบง่าย
function estimateSyllables(words) {
  let total = 0;
  for (let word of words) {
    word = word.toLowerCase();
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    total += syllables ? syllables.length : 1;
  }
  return total;
}
const sampleText = "Some people believe that the best way to reduce crime is to give longer prison sentences. Others think that there are better ways to reduce crime. Discuss both views and give your opinion.\n\nCrime has been a persistent issue in society, and different people have various ideas about how to tackle it. While some argue that longer prison sentences are effective in deterring criminals, others believe alternative methods may yield better results. This essay will explore both views and present my own perspective.\n\nOn one hand, longer prison sentences may act as a deterrent for potential criminals. If people are aware that committing a crime could lead to many years behind bars, they might think twice before engaging in illegal activities. Moreover, keeping serious offenders away from society for extended periods can protect citizens and reduce repeat offenses.\n\nOn the other hand, relying solely on prison sentences may not address the root causes of crime. For example, lack of education, poverty, and unemployment often push individuals toward criminal behavior. Investing in social programs, education, and rehabilitation can help people make better life choices and reduce the likelihood of reoffending.\n\nIn my opinion, while longer sentences might be necessary for certain violent crimes, a more balanced approach is needed. Preventative measures and support systems are crucial in addressing the underlying issues that lead to crime.\n\nIn conclusion, both longer prison sentences and alternative methods have their merits. However, combining strict punishment with social reforms is likely the most effective strategy for reducing crime in the long term.";
