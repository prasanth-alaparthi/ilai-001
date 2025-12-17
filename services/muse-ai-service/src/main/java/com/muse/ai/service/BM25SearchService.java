package com.muse.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * BM25 Search Service - Industry-standard keyword search ranking
 * Used for FREE MODE search (no AI/embedding costs)
 * 
 * BM25 Formula:
 * score(D,Q) = Σ IDF(qi) × (f(qi,D) × (k1 + 1)) / (f(qi,D) + k1 × (1 - b + b ×
 * |D|/avgdl))
 * 
 * Where:
 * - f(qi,D) = term frequency of qi in document D
 * - |D| = document length
 * - avgdl = average document length in collection
 * - k1 = term frequency saturation parameter (typically 1.2-2.0)
 * - b = document length normalization (typically 0.75)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BM25SearchService {

    // BM25 parameters (tuned for note-length documents)
    private static final double K1 = 1.5; // Term frequency saturation
    private static final double B = 0.75; // Length normalization

    /**
     * Search documents using BM25 ranking
     */
    public List<SearchResult> search(String query, List<Document> documents) {
        if (documents.isEmpty()) {
            return List.of();
        }

        List<String> queryTerms = tokenize(query);
        if (queryTerms.isEmpty()) {
            return List.of();
        }

        // Calculate corpus statistics
        double avgDocLength = documents.stream()
                .mapToInt(d -> tokenize(d.getContent()).size())
                .average()
                .orElse(1.0);

        int corpusSize = documents.size();

        // Calculate IDF for each query term
        Map<String, Double> idfScores = new HashMap<>();
        for (String term : queryTerms) {
            int docsWithTerm = countDocsWithTerm(term, documents);
            double idf = calculateIDF(corpusSize, docsWithTerm);
            idfScores.put(term, idf);
        }

        // Score each document
        List<SearchResult> results = new ArrayList<>();
        for (Document doc : documents) {
            double score = calculateBM25Score(doc, queryTerms, idfScores, avgDocLength);
            if (score > 0) {
                results.add(new SearchResult(doc.getId(), doc.getTitle(), score, doc.getSnippet(query)));
            }
        }

        // Sort by score descending
        results.sort(Comparator.comparing(SearchResult::getScore).reversed());

        log.debug("BM25 search for '{}' returned {} results", query, results.size());
        return results;
    }

    /**
     * Calculate BM25 score for a single document
     */
    private double calculateBM25Score(Document doc, List<String> queryTerms,
            Map<String, Double> idfScores, double avgDocLength) {
        List<String> docTokens = tokenize(doc.getContent());
        int docLength = docTokens.size();

        // Count term frequencies in document
        Map<String, Long> termFreqs = docTokens.stream()
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));

        double score = 0.0;

        for (String term : queryTerms) {
            double idf = idfScores.getOrDefault(term, 0.0);

            // Get term frequency with fuzzy matching
            long tf = countTermFrequencyFuzzy(docTokens, term.toLowerCase());

            if (tf > 0) {
                // BM25 term score
                double numerator = tf * (K1 + 1);
                double denominator = tf + K1 * (1 - B + B * (docLength / avgDocLength));
                score += idf * (numerator / denominator);
            }
        }

        // Boost for title matches
        String titleLower = doc.getTitle().toLowerCase();
        for (String term : queryTerms) {
            if (titleLower.contains(term.toLowerCase())) {
                score *= 1.5; // 50% boost for title match
            }
        }

        return score;
    }

    /**
     * Calculate Inverse Document Frequency
     * IDF = log((N - n + 0.5) / (n + 0.5) + 1)
     */
    private double calculateIDF(int corpusSize, int docsWithTerm) {
        return Math.log((corpusSize - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
    }

    /**
     * Count documents containing a term (with fuzzy matching)
     */
    private int countDocsWithTerm(String term, List<Document> documents) {
        String termLower = term.toLowerCase();
        return (int) documents.stream()
                .filter(d -> containsTermFuzzy(d.getContent().toLowerCase(), termLower))
                .count();
    }

    /**
     * Count term frequency in document tokens with fuzzy matching
     */
    private long countTermFrequencyFuzzy(List<String> docTokens, String term) {
        long count = 0;
        for (String token : docTokens) {
            // Exact match
            if (token.equals(term)) {
                count++;
            }
            // Fuzzy match (slightly lower weight)
            else if (fuzzyMatch(token, term, 2)) {
                count++; // Could use fractional weight like 0.8 for fuzzy matches
            }
        }
        return count;
    }

    /**
     * Check if text contains term (exact or fuzzy match)
     */
    private boolean containsTermFuzzy(String text, String term) {
        // Exact match first
        if (text.contains(term)) {
            return true;
        }

        // Fuzzy match - check each word in text
        String[] words = text.split("\\s+");
        for (String word : words) {
            // Clean word
            word = word.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            if (word.length() < 3)
                continue;

            // Check fuzzy match with Levenshtein distance <= 2
            if (fuzzyMatch(word, term, 2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Fuzzy match using Levenshtein distance
     * 
     * @param word        The word from document
     * @param term        The search term
     * @param maxDistance Maximum allowed edit distance
     * @return true if words are within maxDistance edits
     */
    private boolean fuzzyMatch(String word, String term, int maxDistance) {
        // Quick length check - if lengths differ too much, can't match
        if (Math.abs(word.length() - term.length()) > maxDistance) {
            return false;
        }

        // Exact match
        if (word.equals(term)) {
            return true;
        }

        // Calculate Levenshtein distance
        int distance = levenshteinDistance(word, term);
        return distance <= maxDistance;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * Using optimized space O(min(m,n)) implementation
     */
    private int levenshteinDistance(String s1, String s2) {
        if (s1.equals(s2))
            return 0;
        if (s1.isEmpty())
            return s2.length();
        if (s2.isEmpty())
            return s1.length();

        // Ensure s1 is the shorter string for space optimization
        if (s1.length() > s2.length()) {
            String temp = s1;
            s1 = s2;
            s2 = temp;
        }

        int[] prevRow = new int[s1.length() + 1];
        int[] currRow = new int[s1.length() + 1];

        // Initialize first row
        for (int i = 0; i <= s1.length(); i++) {
            prevRow[i] = i;
        }

        // Fill in the rest of the matrix
        for (int j = 1; j <= s2.length(); j++) {
            currRow[0] = j;

            for (int i = 1; i <= s1.length(); i++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;

                currRow[i] = Math.min(
                        Math.min(
                                prevRow[i] + 1, // deletion
                                currRow[i - 1] + 1 // insertion
                        ),
                        prevRow[i - 1] + cost // substitution
                );
            }

            // Swap rows
            int[] temp = prevRow;
            prevRow = currRow;
            currRow = temp;
        }

        return prevRow[s1.length()];
    }

    /**
     * Tokenize text into terms
     */
    private List<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        return Arrays.stream(text.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .split("\\s+"))
                .filter(t -> t.length() > 2) // Skip very short words
                .filter(t -> !STOP_WORDS.contains(t))
                .collect(Collectors.toList());
    }

    // Common English stop words
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "must", "shall",
            "can", "need", "dare", "ought", "used", "to", "of", "in", "for",
            "on", "with", "at", "by", "from", "as", "into", "through", "during",
            "before", "after", "above", "below", "between", "under", "again",
            "further", "then", "once", "here", "there", "when", "where", "why",
            "how", "all", "each", "few", "more", "most", "other", "some", "such",
            "no", "nor", "not", "only", "own", "same", "so", "than", "too",
            "very", "just", "also", "now", "this", "that", "these", "those");

    // ============== Data Classes ==============

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class Document {
        private String id;
        private String title;
        private String content;

        public String getSnippet(String query) {
            if (content == null || content.length() < 200) {
                return content;
            }

            // Try to find query in content and return surrounding text
            String queryLower = query.toLowerCase();
            int idx = content.toLowerCase().indexOf(queryLower);

            if (idx >= 0) {
                int start = Math.max(0, idx - 50);
                int end = Math.min(content.length(), idx + query.length() + 150);
                return (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length() ? "..." : "");
            }

            return content.substring(0, Math.min(200, content.length())) + "...";
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SearchResult {
        private String id;
        private String title;
        private double score;
        private String snippet;
    }
}
