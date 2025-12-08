-- V27__seed_personal_journal_templates.sql
-- Seed 5 personal journal templates for daily journaling

INSERT INTO templates (name, description, content) VALUES

-- 1. Morning Pages
('Morning Pages', 'Stream-of-consciousness journaling to clear your mind and boost creativity. Write 3 pages first thing in the morning without filtering.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Morning Pages"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Today''s Date]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "\"Morning Pages are three pages of longhand, stream of consciousness writing, done first thing in the morning.\" - Julia Cameron"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "How I feel right now..."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Just write. Don''t think, don''t edit, don''t filter. Let your thoughts flow freely onto the page. There are no rules except to keep the pen moving (or fingers typing)."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Start here: "}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What''s on my mind..."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Continue writing whatever comes to mind. Worries, dreams, random thoughts, to-dos, feelings - it all belongs here."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Before I start my day..."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Any final thoughts before transitioning into your day? Intentions, hopes, or things you want to let go of?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]}
  ]
}'::jsonb),

-- 2. Gratitude Journal
('Gratitude Journal', 'Daily practice of recognizing and appreciating the good things in your life. Boosts happiness and positive mindset.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "🙏 Gratitude Journal"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Today''s Date]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Three Things I''m Grateful For Today"}]},
    {"type": "orderedList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "A Person I''m Thankful For"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Who made a positive impact on my life recently? Why am I grateful for them?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "A Small Win Today"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What small accomplishment can I celebrate? (No matter how tiny!)"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Something That Made Me Smile"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "A moment, interaction, or thing that brought me joy today:"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Affirmation for Tomorrow"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "I am grateful and I look forward to..."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]}
  ]
}'::jsonb),

-- 3. Daily Reflection
('Daily Reflection', 'End-of-day reflection journal to process your experiences, emotions, and lessons learned.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "📝 Daily Reflection"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Today''s Date]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Today''s Mood: "}, {"type": "text", "text": "😊 / 😐 / 😔 / 😤 / 😴"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "How was my day overall?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Rate: ⭐ ⭐ ⭐ ⭐ ⭐ (1-5 stars)"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summary of my day:"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What went well today?"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What could have gone better?"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What did I learn today?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "How am I feeling right now?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Emotionally, physically, mentally:"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Intention for tomorrow"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "One thing I want to focus on or accomplish:"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]}
  ]
}'::jsonb),

-- 4. Self-Discovery Journal
('Self-Discovery Journal', 'Deep self-exploration prompts to understand yourself better, discover your values, and grow as a person.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "🔍 Self-Discovery Journal"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Today''s Date]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "Take your time with these prompts. There are no right or wrong answers - only your truth."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What do I really want in life?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Not what family, friends, or society think I should want... what do I truly want for myself?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What are my core values?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "List 3-5 values that are most important to you (e.g., freedom, creativity, family, growth, honesty):"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What am I most proud of?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "An accomplishment, quality, or moment that makes me feel proud:"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What fear is holding me back?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What would I do if I wasn''t afraid?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What do I need more of in my life?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Rest? Adventure? Connection? Creativity? What am I craving?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Letter to my future self"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Dear future me, I hope that you..."}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]}
  ]
}'::jsonb),

-- 5. Weekly Review
('Weekly Review', 'End-of-week reflection to review progress, celebrate wins, and plan for the week ahead.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "📅 Weekly Review"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Week of: "}, {"type": "text", "text": "[Start Date] - [End Date]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Overall Week Rating"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "How would I rate this week? ⭐⭐⭐⭐⭐ (1-5)"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "One word to describe this week:"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "🎉 Wins & Accomplishments"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What did I accomplish this week? Big or small, it counts!"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "🎓 Lessons Learned"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What did I learn this week? Any insights or realizations?"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "😓 Challenges Faced"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What was difficult? How did I handle it?"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "💖 Self-Care Check"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "How did I take care of myself this week?"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Sleep: "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Exercise: "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Social: "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Fun: "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "🎯 Goals for Next Week"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Top 3 priorities for the coming week:"}]},
    {"type": "orderedList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": " "}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "One Thing I''m Looking Forward To"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": ""}]}
  ]
}'::jsonb);
