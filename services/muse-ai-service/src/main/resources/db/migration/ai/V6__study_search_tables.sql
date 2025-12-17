-- V6__study_search_tables.sql
-- Creates tables for dynamic Study Search sources and subject categories

-- ============== Subject Categories ==============

CREATE TABLE IF NOT EXISTS subject_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon_emoji VARCHAR(10),
    color VARCHAR(20),
    description VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed subject categories
INSERT INTO subject_categories (code, name, icon_emoji, color, display_order) VALUES
    ('cs', 'Computer Science', '💻', '#3B82F6', 1),
    ('math', 'Mathematics', '📐', '#8B5CF6', 2),
    ('physics', 'Physics', '⚛️', '#06B6D4', 3),
    ('medicine', 'Medicine & Health', '🏥', '#EF4444', 4),
    ('biology', 'Biology', '🧬', '#22C55E', 5),
    ('chemistry', 'Chemistry', '🧪', '#F59E0B', 6),
    ('engineering', 'Engineering', '⚙️', '#6366F1', 7),
    ('arts', 'Arts & Humanities', '🎨', '#EC4899', 8),
    ('business', 'Business & Economics', '📊', '#14B8A6', 9),
    ('general', 'General Knowledge', '📚', '#64748B', 10)
ON CONFLICT (code) DO NOTHING;

-- ============== Educational Sources ==============

CREATE TABLE IF NOT EXISTS educational_sources (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_emoji VARCHAR(10),
    color VARCHAR(20),
    description VARCHAR(500),
    
    -- API Configuration
    base_url VARCHAR(500) NOT NULL,
    search_endpoint VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) DEFAULT 'GET',
    api_key_header VARCHAR(100),
    api_key VARCHAR(500),
    request_headers TEXT,
    
    -- Response Mapping (JSON Path)
    results_path VARCHAR(200),
    title_path VARCHAR(200),
    snippet_path VARCHAR(200),
    url_path VARCHAR(200),
    authors_path VARCHAR(200),
    published_date_path VARCHAR(200),
    thumbnail_path VARCHAR(200),
    
    -- Subject Mapping
    subjects VARCHAR(500),  -- Comma-separated or "all"
    
    -- Display & Behavior
    display_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    rate_limit_per_minute INTEGER DEFAULT 60,
    cache_ttl_hours INTEGER DEFAULT 24,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== Seed Educational Sources (15 FREE APIs) ==============

-- 1. Wikipedia
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint, 
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('wikipedia', 'Wikipedia', 'general', '📖', '#000000',
     'https://en.wikipedia.org', '/w/api.php?action=query&list=search&format=json&srsearch={query}&srlimit={limit}',
     '$.query.search', '$.title', '$.snippet', 'https://en.wikipedia.org/wiki/__TITLE__', 'all', 1)
ON CONFLICT (code) DO NOTHING;

-- 2. DuckDuckGo
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('duckduckgo', 'DuckDuckGo', 'general', '🦆', '#DE5833',
     'https://api.duckduckgo.com', '/?q={query}&format=json&no_html=1',
     '$.RelatedTopics', '$.Text', '$.Text', '$.FirstURL', 'all', 2)
ON CONFLICT (code) DO NOTHING;

-- 3. arXiv
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order, description) VALUES
    ('arxiv', 'arXiv', 'academic', '📄', '#B31B1B',
     'https://export.arxiv.org', '/api/query?search_query=all:{query}&start=0&max_results={limit}',
     NULL, NULL, NULL, NULL, 'cs,math,physics', 3, 'Pre-print research papers')
ON CONFLICT (code) DO NOTHING;

-- 4. Semantic Scholar
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, authors_path, subjects, display_order) VALUES
    ('semantic_scholar', 'Semantic Scholar', 'academic', '🔬', '#1857B6',
     'https://api.semanticscholar.org', '/graph/v1/paper/search?query={query}&limit={limit}&fields=title,abstract,url,authors,year',
     '$.data', '$.title', '$.abstract', '$.url', '$.authors[*].name', 'cs,math,physics,biology', 4)
ON CONFLICT (code) DO NOTHING;

-- 5. OpenAlex
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('openalex', 'OpenAlex', 'academic', '📊', '#5C6BC0',
     'https://api.openalex.org', '/works?search={query}&per-page={limit}',
     '$.results', '$.title', '$.abstract', '$.doi', 'all', 5)
ON CONFLICT (code) DO NOTHING;

-- 6. CORE
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('core', 'CORE', 'academic', '🎓', '#FF6F00',
     'https://api.core.ac.uk/v3', '/search/works?q={query}&limit={limit}',
     '$.results', '$.title', '$.abstract', '$.downloadUrl', 'all', 6)
ON CONFLICT (code) DO NOTHING;

-- 7. PubMed
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('pubmed', 'PubMed', 'medical', '🏥', '#326599',
     'https://eutils.ncbi.nlm.nih.gov', '/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax={limit}&retmode=json',
     '$.esearchresult.idlist', NULL, NULL, 'https://pubmed.ncbi.nlm.nih.gov/', 'medicine,biology', 7)
ON CONFLICT (code) DO NOTHING;

-- 8. Europe PMC
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('europepmc', 'Europe PMC', 'medical', '🇪🇺', '#2E7D32',
     'https://www.ebi.ac.uk/europepmc', '/webservices/rest/search?query={query}&format=json&pageSize={limit}',
     '$.resultList.result', '$.title', '$.abstractText', 'https://europepmc.org/article/MED/__PMID__', 'medicine,biology', 8)
ON CONFLICT (code) DO NOTHING;

-- 9. DOAJ (Directory of Open Access Journals)
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('doaj', 'DOAJ', 'journals', '📰', '#F4A261',
     'https://doaj.org', '/api/search/articles/{query}?pageSize={limit}',
     '$.results', '$.bibjson.title', '$.bibjson.abstract', '$.bibjson.link[0].url', 'all', 9)
ON CONFLICT (code) DO NOTHING;

-- 10. OpenLibrary
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, authors_path, subjects, display_order) VALUES
    ('openlibrary', 'OpenLibrary', 'books', '📚', '#0A7B83',
     'https://openlibrary.org', '/search.json?q={query}&limit={limit}',
     '$.docs', '$.title', '$.first_sentence[0]', 'https://openlibrary.org__KEY__', '$.author_name', 'all', 10)
ON CONFLICT (code) DO NOTHING;

-- 11. Gutenberg
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, authors_path, subjects, display_order) VALUES
    ('gutenberg', 'Project Gutenberg', 'books', '📕', '#6B4226',
     'https://gutendex.com', '/books?search={query}',
     '$.results', '$.title', '$.subjects[0]', 'https://www.gutenberg.org/ebooks/__ID__', '$.authors[0].name', 'arts,general', 11)
ON CONFLICT (code) DO NOTHING;

-- 12. Crossref
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('crossref', 'Crossref', 'citations', '🔗', '#2B2D42',
     'https://api.crossref.org', '/works?query={query}&rows={limit}',
     '$.message.items', '$.title[0]', '$.abstract', '$.URL', 'all', 12)
ON CONFLICT (code) DO NOTHING;

-- 13. BASE (Bielefeld Academic Search Engine)
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('base', 'BASE', 'academic', '🏫', '#003366',
     'https://api.base-search.net', '/cgi-bin/BaseHttpSearchInterface.fcgi?func=PerformSearch&query={query}&format=json&hits={limit}',
     '$.response.docs', '$.dctitle', '$.dcsubject', '$.dclink', 'all', 13)
ON CONFLICT (code) DO NOTHING;

-- 14. NASA ADS
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    results_path, title_path, snippet_path, url_path, subjects, display_order) VALUES
    ('nasa_ads', 'NASA ADS', 'astronomy', '🚀', '#0B3D91',
     'https://api.adsabs.harvard.edu', '/v1/search/query?q={query}&rows={limit}&fl=title,abstract,bibcode',
     '$.response.docs', '$.title[0]', '$.abstract', 'https://ui.adsabs.harvard.edu/abs/__BIBCODE__', 'physics,astronomy', 14)
ON CONFLICT (code) DO NOTHING;

-- 15. YouTube (requires API key - disabled by default)
INSERT INTO educational_sources (code, name, category, icon_emoji, color, base_url, search_endpoint,
    api_key_header, results_path, title_path, snippet_path, url_path, thumbnail_path,
    subjects, display_order, enabled, description) VALUES
    ('youtube', 'YouTube', 'videos', '▶️', '#FF0000',
     'https://www.googleapis.com/youtube/v3', '/search?part=snippet&type=video&q={query}&maxResults={limit}&key={apiKey}',
     'X-API-Key', '$.items', '$.snippet.title', '$.snippet.description', 
     'https://www.youtube.com/watch?v=__VIDEO_ID__', '$.snippet.thumbnails.default.url',
     'all', 15, false, 'Requires API key - enable after configuring')
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON educational_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_sources_category ON educational_sources(category);
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON subject_categories(enabled);
