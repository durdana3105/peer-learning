/**
 * src/backend/utils/recommendation.js
 * 
 * Intelligent Peer Recommendation utility using TF-IDF and Cosine Similarity.
 */

/**
 * Calculates Term Frequency (TF) for a document.
 * @param {string[]} words
 * @returns {Record<string, number>}
 */
function computeTF(words) {
  const tf = {};
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
 * @param {string[][]} corpus - Array of tokenized documents
 * @returns {Record<string, number>}
 */
function computeIDF(corpus) {
  const idf = {};
  const totalDocs = corpus.length;
  if (totalDocs === 0) return idf;
  
  // Count documents containing each word
  for (const doc of corpus) {
    const uniqueWords = new Set(doc);
    for (const word of uniqueWords) {
      idf[word] = (idf[word] || 0) + 1;
    }
  }
  
  for (const word in idf) {
    // Math.log is natural log, adding 1 to avoid division by zero or negative idf
    idf[word] = Math.log(totalDocs / (idf[word] + 1)) + 1;
  }
  
  return idf;
}

/**
 * Computes TF-IDF vector for a document given its TF and the corpus IDF.
 * @param {Record<string, number>} tf
 * @param {Record<string, number>} idf
 * @param {Set<string>} vocab
 * @returns {number[]}
 */
function computeTFIDFVector(tf, idf, vocab) {
  const vector = [];
  for (const word of vocab) {
    const val = (tf[word] || 0) * (idf[word] || 0);
    vector.push(val);
  }
  return vector;
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  if (vecA.length !== vecB.length) return 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Recommends peers based on TF-IDF and Cosine Similarity of their metadata.
 * 
 * @param {string} targetUserId - The ID of the user to find recommendations for
 * @param {Array<{user_id: string, metadata_string: string, [key: string]: any}>} profilesData - The data from the user_recommendation_metadata view
 * @param {number} topK - Number of recommendations to return
 * @returns {Array<{user_id: string, similarity: number}>}
 */
function getRecommendations(targetUserId, profilesData, topK = 5) {
  // 1. Tokenize metadata for all users
  const tokenizedDocs = [];
  const userIds = [];
  let targetUserIndex = -1;
  
  for (let i = 0; i < profilesData.length; i++) {
    const profile = profilesData[i];
    userIds.push(profile.user_id);
    
    // Simple tokenization: lower case and split by non-word characters
    const text = (profile.metadata_string || "").toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 0);
    
    tokenizedDocs.push(words);
    
    if (profile.user_id === targetUserId) {
      targetUserIndex = i;
    }
  }
  
  if (targetUserIndex === -1) {
    throw new Error(`Target user with ID ${targetUserId} not found in profiles data.`);
  }
  
  // 2. Build vocabulary and compute IDF
  const vocab = new Set();
  for (const doc of tokenizedDocs) {
    for (const word of doc) {
      vocab.add(word);
    }
  }
  
  const idf = computeIDF(tokenizedDocs);
  
  // 3. Compute TF-IDF vectors for all documents
  const tfidfVectors = [];
  for (const doc of tokenizedDocs) {
    const tf = computeTF(doc);
    tfidfVectors.push(computeTFIDFVector(tf, idf, vocab));
  }
  
  // 4. Calculate similarities to the target user
  const targetVector = tfidfVectors[targetUserIndex];
  const similarities = [];
  
  for (let i = 0; i < tfidfVectors.length; i++) {
    if (i === targetUserIndex) continue; // Skip self
    
    const similarity = cosineSimilarity(targetVector, tfidfVectors[i]);
    similarities.push({
      ...profilesData[i], // Include original data for convenience
      user_id: userIds[i],
      similarity: similarity
    });
  }
  
  // 5. Sort by similarity descending and return top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, topK);
}

export {
  getRecommendations,
  cosineSimilarity,
  computeTFIDFVector,
  computeIDF,
  computeTF
};
