import cosineSimilarity from 'compute-cosine-similarity';

/**
 * Calculates Term Frequency (TF) for a document.
 */
function computeTF(words: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  const totalWords = words.length;
  if (totalWords === 0) return tf;

  for (const word of words) {
    tf[word] = (tf[word] || 0) + 1;
  }
  for (const word in tf) {
    tf[word] = tf[word] / totalWords;
  }
  return tf;
}

/**
 * Calculates Inverse Document Frequency (IDF) for a corpus.
 */
function computeIDF(corpus: string[][]): Record<string, number> {
  const idf: Record<string, number> = {};
  const totalDocs = corpus.length;
  if (totalDocs === 0) return idf;

  for (const doc of corpus) {
    const uniqueWords = new Set(doc);
    for (const word of uniqueWords) {
      idf[word] = (idf[word] || 0) + 1;
    }
  }

  for (const word in idf) {
    idf[word] = Math.log(totalDocs / (idf[word] + 1)) + 1;
  }
  return idf;
}

/**
 * Computes TF-IDF vector for a document given its TF and the corpus IDF.
 */
function computeTFIDFVector(
  tf: Record<string, number>,
  idf: Record<string, number>,
  vocab: Set<string>
): number[] {
  const vector: number[] = [];
  for (const word of vocab) {
    const val = (tf[word] || 0) * (idf[word] || 0);
    vector.push(val);
  }
  return vector;
}

export interface ProfileData {
  user_id: string;
  metadata_string: string;
  [key: string]: any;
}

export function getRecommendations(
  targetUserId: string,
  profilesData: ProfileData[],
  topN: number = 5
): Array<ProfileData & { similarityScore: number }> {
  if (!profilesData || profilesData.length === 0) return [];

  const tokenizedDocs: string[][] = [];
  const userIds: string[] = [];
  let targetUserIndex = -1;

  // 1. Tokenize metadata for all users
  for (let i = 0; i < profilesData.length; i++) {
    const profile = profilesData[i];
    userIds.push(profile.user_id);

    const text = (profile.metadata_string || "").toLowerCase();
    const words = text.split(/\W+/).filter((w) => w.length > 0);
    tokenizedDocs.push(words);

    if (profile.user_id === targetUserId) {
      targetUserIndex = i;
    }
  }

  if (targetUserIndex === -1) {
    console.warn(`Target user ID ${targetUserId} not found in profiles data.`);
    return [];
  }

  // 2. Build vocabulary and compute IDF
  const vocab = new Set<string>();
  for (const doc of tokenizedDocs) {
    for (const word of doc) {
      vocab.add(word);
    }
  }

  const idf = computeIDF(tokenizedDocs);

  // 3. Compute TF-IDF vectors for all documents
  const tfidfVectors: number[][] = [];
  for (const doc of tokenizedDocs) {
    const tf = computeTF(doc);
    tfidfVectors.push(computeTFIDFVector(tf, idf, vocab));
  }

  // 4. Calculate similarities to the target user using 'compute-cosine-similarity' npm package
  const targetVector = tfidfVectors[targetUserIndex];
  const similarities: Array<ProfileData & { similarityScore: number }> = [];

  for (let i = 0; i < tfidfVectors.length; i++) {
    if (i === targetUserIndex) continue; // Skip self

    // cosineSimilarity returns null if vectors are empty or zero-magnitude
    const similarity = cosineSimilarity(targetVector, tfidfVectors[i]) || 0;
    
    similarities.push({
      ...profilesData[i],
      similarityScore: similarity
    });
  }

  // 5. Sort by similarity descending and return top N
  similarities.sort((a, b) => b.similarityScore - a.similarityScore);
  return similarities.slice(0, topN);
}
