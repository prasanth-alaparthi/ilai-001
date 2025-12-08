-- V26__seed_scientific_templates.sql
-- Seed 15 professional scientific journal templates

INSERT INTO templates (name, description, content) VALUES

-- 1. Research Article (IMRaD)
('Research Article (IMRaD)', 'Standard scientific research paper following Introduction, Methods, Results, and Discussion format. Ideal for peer-reviewed journal submissions.', 
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Research Article Title"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "Author Name¹, Co-Author Name²"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "¹ Department, Institution, City, Country"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Provide a concise summary (150-250 words) covering: Background, Objective, Methods, Results, and Conclusions."}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Keywords: "}, {"type": "text", "text": "keyword1, keyword2, keyword3, keyword4, keyword5"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• State the research problem and its significance\n• Review relevant literature\n• Identify gaps in existing knowledge\n• State the research objectives and hypotheses"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Materials and Methods"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.1 Study Design"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Describe the overall study design and approach."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.2 Participants/Samples"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Describe sample size, selection criteria, and characteristics."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.3 Data Collection"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detail instruments, procedures, and variables measured."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.4 Statistical Analysis"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Specify statistical methods and software used."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Results"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present findings objectively using text, tables, and figures. Report statistical values."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Interpret results in context of existing literature\n• Discuss implications and significance\n• Acknowledge limitations\n• Suggest future research directions"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize key findings and their practical implications."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Acknowledgments"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Acknowledge funding sources and contributors."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[1] Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), Pages. DOI"}]}
  ]
}'::jsonb),

-- 2. Literature Review
('Literature Review', 'Comprehensive analysis and synthesis of existing research on a topic. Perfect for graduate students and researchers.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Literature Review: [Topic Title]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize the scope, methodology, key themes, and conclusions of this review."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Define the topic and its importance\n• State the purpose of the review\n• Outline the scope and boundaries\n• Preview the organization of the review"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Methodology"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Search strategy and databases used\n• Inclusion/exclusion criteria\n• Time period covered\n• Analysis approach"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Thematic Analysis"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.1 Theme One: [Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Synthesize and critically analyze literature related to this theme."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.2 Theme Two: [Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Synthesize and critically analyze literature related to this theme."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.3 Theme Three: [Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Synthesize and critically analyze literature related to this theme."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Identify patterns and trends\n• Note contradictions and debates\n• Highlight research gaps\n• Discuss theoretical implications"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Conclusions and Future Directions"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize key insights and propose areas for future research."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[List all cited works in appropriate citation style]"}]}
  ]
}'::jsonb),

-- 3. Lab Report
('Lab Report', 'Scientific laboratory experiment documentation template. Ideal for undergraduate and graduate science students.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Lab Report: [Experiment Title]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Student: "}, {"type": "text", "text": "[Your Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Course: "}, {"type": "text", "text": "[Course Code and Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Date of Experiment]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Lab Partner(s): "}, {"type": "text", "text": "[Names]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Objective/Purpose"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "State the purpose of the experiment and what you aim to learn or verify."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Hypothesis"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "State your prediction about the outcome of the experiment."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Materials and Equipment"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 1"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 2"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 3"}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Procedure"}]},
    {"type": "orderedList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 1: Describe first step"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 2: Describe second step"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Step 3: Describe third step"}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Data and Observations"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Insert data tables, measurements, and qualitative observations here]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Calculations and Analysis"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Show all calculations with formulas and steps."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Results"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present final results clearly with appropriate units and significant figures."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "8. Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Interpret results\n• Compare with expected values\n• Explain sources of error\n• Suggest improvements"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "9. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize findings and whether the hypothesis was supported."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "10. References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[List any references used]"}]}
  ]
}'::jsonb),

-- 4. Case Study
('Case Study', 'In-depth analysis of a specific case for clinical, business, or social science research.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Case Study: [Title]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Executive Summary"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Brief overview of the case, key issues, and main recommendations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Background context\n• Purpose and scope of the study\n• Key questions to be addressed"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Background/Case Presentation"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Provide detailed description of the case including:\n• History and context\n• Key stakeholders\n• Relevant data and timeline\n• Current situation"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Problem Identification"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Clearly identify and articulate the core problems or challenges."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Analysis"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "4.1 Theoretical Framework"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Apply relevant theories or frameworks to analyze the case."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "4.2 SWOT Analysis"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Strengths:\nWeaknesses:\nOpportunities:\nThreats:"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Alternative Solutions"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present multiple potential solutions with pros and cons for each."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Recommendations"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Provide specific, actionable recommendations with justification."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Implementation Plan"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Timeline\n• Resources required\n• Key milestones\n• Success metrics"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "8. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize key learnings and implications."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[List all sources cited]"}]}
  ]
}'::jsonb),

-- 5. Thesis Chapter
('Thesis Chapter', 'Template for individual thesis or dissertation chapters. Suitable for Masters and PhD students.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Chapter [Number]: [Chapter Title]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Chapter Overview"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Briefly introduce what this chapter covers and how it connects to the overall thesis."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "[Section Number].1 [First Major Section]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Content for first major section."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "[Section Number].1.1 [Subsection]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detailed content for subsection."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "[Section Number].2 [Second Major Section]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Content for second major section."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "[Section Number].3 [Third Major Section]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Content for third major section."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Chapter Summary"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize key points covered in this chapter and transition to the next chapter."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Key Terms and Definitions"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "List important terminology introduced in this chapter."}]}
  ]
}'::jsonb),

-- 6. Conference Paper
('Conference Paper', 'Short academic paper format for conference presentations and proceedings.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "[Paper Title]"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Author Name¹, Co-Author Name²\n¹Affiliation, Email\n²Affiliation, Email"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Concise summary (100-200 words) of the paper including purpose, methods, results, and conclusions."}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Keywords: "}, {"type": "text", "text": "keyword1, keyword2, keyword3"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Motivation and background\n• Problem statement\n• Research contribution\n• Paper organization"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Related Work"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Review relevant prior work and position your contribution."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Proposed Approach/Methodology"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detail your method, algorithm, or theoretical framework."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Experimental Setup"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Describe datasets, evaluation metrics, and implementation details."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Results and Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present and analyze experimental results with tables and figures."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Conclusion and Future Work"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize contributions and outline future research directions."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Acknowledgments"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Thank funding agencies and collaborators."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[1] First reference\n[2] Second reference"}]}
  ]
}'::jsonb),

-- 7. Grant Proposal
('Grant Proposal', 'Research funding proposal template for grant applications.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Grant Proposal: [Project Title]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Project Information"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Principal Investigator: "}, {"type": "text", "text": "[Name, Title, Institution]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Funding Requested: "}, {"type": "text", "text": "$[Amount]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Project Duration: "}, {"type": "text", "text": "[Start] to [End]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Executive Summary"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "One-page overview of the proposed project covering significance, approach, and expected outcomes."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Statement of Need"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Describe the problem or opportunity\n• Present relevant data and statistics\n• Explain why this research is needed now"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Goals and Objectives"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Overall goal\n• Specific, measurable objectives\n• Expected outcomes and deliverables"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Research Plan/Methodology"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detailed description of research activities, methods, and timeline."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Evaluation Plan"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "How will success be measured? Include metrics and assessment methods."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Personnel and Qualifications"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Describe the research team and their relevant expertise."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Budget and Justification"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Personnel costs\n• Equipment and supplies\n• Travel\n• Other direct costs\n• Indirect costs"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "8. Dissemination Plan"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "How will results be shared with the scientific community and public?"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Cited literature supporting the proposal]"}]}
  ]
}'::jsonb),

-- 8. Technical Report
('Technical Report', 'Detailed technical documentation for engineering and technology projects.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Technical Report: [Title]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Report Number: "}, {"type": "text", "text": "[TR-XXXX]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Date]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Authors: "}, {"type": "text", "text": "[Names]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Organization: "}, {"type": "text", "text": "[Organization Name]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Executive Summary"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "High-level overview for non-technical stakeholders including key findings and recommendations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Background and context\n• Problem statement\n• Scope and objectives\n• Report organization"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Technical Background"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Relevant technical concepts, prior work, and foundational information."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. System/Solution Description"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.1 Architecture Overview"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "High-level system architecture with diagrams."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.2 Component Details"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detailed description of each system component."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Implementation"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Technical implementation details including algorithms, code, and configurations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Testing and Validation"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Test procedures, results, and performance metrics."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Conclusions and Recommendations"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summary of findings and actionable recommendations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Appendices"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "A. Detailed Data\nB. Code Listings\nC. Supplementary Materials"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Technical references and documentation]"}]}
  ]
}'::jsonb),

-- 9. Methodology Paper
('Methodology Paper', 'Paper focused on describing and validating a new research method or technique.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "[Method Name]: A Novel Approach for [Purpose]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize the new method, its advantages, and validation results."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Current research challenges\n• Limitations of existing methods\n• Contribution of this paper\n• Overview of the proposed method"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Theoretical Framework"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Theoretical foundations and assumptions underlying the method."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Method Description"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.1 Overview"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "High-level description of the methodology."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.2 Step-by-Step Procedure"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Detailed procedural steps for implementing the method."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.3 Requirements and Prerequisites"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Resources, expertise, and conditions needed."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Validation Study"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Validation approach\n• Comparison with existing methods\n• Statistical analysis\n• Results and interpretation"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Limitations and Considerations"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Discuss boundaries, limitations, and potential sources of error."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Application Guidelines"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Practical guidance for researchers applying this method."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summarize the method and its potential impact."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Cited works]"}]}
  ]
}'::jsonb),

-- 10. Meta-Analysis
('Meta-Analysis', 'Systematic statistical analysis combining results from multiple studies.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Meta-Analysis: [Topic]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Background, Objectives, Data Sources, Study Selection, Data Extraction, Results, Conclusions."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Rationale for meta-analysis\n• Research questions\n• PICO/PECO framework (if applicable)"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Methods"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.1 Search Strategy"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Databases searched, search terms, date range."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.2 Inclusion/Exclusion Criteria"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Study types, participants, interventions, outcomes."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.3 Data Extraction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Variables extracted, extraction process, quality assessment."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "2.4 Statistical Analysis"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Effect size calculation, heterogeneity assessment, publication bias."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Results"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.1 Study Selection (PRISMA Flow)"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Number of studies at each stage of selection."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.2 Study Characteristics"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summary table of included studies."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.3 Meta-Analysis Results"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Forest plots, effect sizes, confidence intervals."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.4 Subgroup and Sensitivity Analyses"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Results of additional analyses."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Interpretation, comparison with prior meta-analyses, implications."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Summary of evidence and recommendations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[All included and cited studies]"}]}
  ]
}'::jsonb),

-- 11. Systematic Review
('Systematic Review', 'Comprehensive review following rigorous methodology to synthesize research evidence.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Systematic Review: [Topic]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Abstract"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Structured abstract following PRISMA guidelines."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Background and rationale\n• Review objectives\n• Research questions"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Methods"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Protocol registration (PROSPERO)\n• Eligibility criteria\n• Information sources and search strategy\n• Study selection process\n• Data collection and risk of bias assessment\n• Synthesis methods"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Results"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Study selection (PRISMA flow diagram)\n• Study characteristics\n• Risk of bias\n• Synthesis results"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Discussion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Summary of evidence\n• Limitations\n• Implications for practice and research"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Key findings and recommendations."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Funding and Conflicts of Interest"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Declare funding sources and potential conflicts."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Complete reference list]"}]}
  ]
}'::jsonb),

-- 12. Position Paper
('Position Paper', 'Argumentative paper presenting a stance on a controversial topic or policy.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Position Paper: [Topic/Issue]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Executive Summary"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Brief statement of position and key arguments."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Issue background\n• Why this matters\n• Thesis statement (your position)"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Background and Context"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Provide objective information about the issue including history, stakeholders, and current status."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Statement of Position"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Clearly articulate your position or recommendation."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Supporting Arguments"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "4.1 Argument One"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present evidence and reasoning."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "4.2 Argument Two"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present evidence and reasoning."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "4.3 Argument Three"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present evidence and reasoning."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Counterarguments and Rebuttal"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Acknowledge opposing views and explain why your position is stronger."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Recommendations"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Specific actions or policies you recommend."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Restate position and call to action."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Supporting sources]"}]}
  ]
}'::jsonb),

-- 13. Book Review
('Book Review', 'Critical analysis and evaluation of an academic book or publication.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Book Review"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Title: "}, {"type": "text", "marks": [{"type": "italic"}], "text": "[Book Title]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Author(s): "}, {"type": "text", "text": "[Author Name(s)]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Publisher: "}, {"type": "text", "text": "[Publisher, Year]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Pages/ISBN: "}, {"type": "text", "text": "[Pages, ISBN]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Reviewer: "}, {"type": "text", "text": "[Your Name, Affiliation]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Brief introduction to the book and author\n• Context within the field\n• Main thesis or argument of the book"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Summary of Content"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Provide an objective summary of the book''s main arguments, organized by chapters or themes."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Critical Analysis"}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.1 Strengths"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What does the book do well? Original contributions, methodology, writing style."}]},
    {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": "3.2 Weaknesses"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What are the limitations? Gaps, questionable arguments, methodological issues."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Contribution to the Field"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "How does this book advance scholarship? Comparison with other works."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Recommendation"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Who should read this book? Overall assessment and recommendation."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Conclusion"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Final thoughts on the book''s significance."}]}
  ]
}'::jsonb),

-- 14. Project Proposal
('Project Proposal', 'Academic or research project proposal for course work or institutional submission.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Project Proposal: [Project Title]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Submitted by: "}, {"type": "text", "text": "[Name(s)]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Course/Program: "}, {"type": "text", "text": "[Course Code/Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Supervisor: "}, {"type": "text", "text": "[Name]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Date]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "1. Introduction and Background"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Context and motivation\n• Problem statement\n• Significance of the project"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "2. Literature Review"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Brief review of relevant prior work and theoretical framework."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "3. Objectives"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Primary objective\n• Specific objectives/research questions"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "4. Methodology"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Research design\n• Data collection methods\n• Analysis approach\n• Tools and technologies"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "5. Timeline and Milestones"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "| Phase | Task | Duration | Deadline |\n|-------|------|----------|----------|\n| 1 | Literature Review | 2 weeks | [Date] |\n| 2 | Data Collection | 4 weeks | [Date] |\n| 3 | Analysis | 3 weeks | [Date] |\n| 4 | Writing | 3 weeks | [Date] |"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "6. Expected Outcomes"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What will be delivered at the end of the project?"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "7. Resources Required"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Hardware/software\n• Access requirements\n• Budget (if applicable)"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "8. References"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "[Preliminary reference list]"}]}
  ]
}'::jsonb),

-- 15. Research Brief
('Research Brief', 'Concise summary of research findings for policymakers or non-specialist audiences.',
'{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Research Brief: [Topic]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[Date]"}]},
    {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Authors: "}, {"type": "text", "text": "[Names]"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Key Messages"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Finding 1: "}, {"type": "text", "text": "Brief statement"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Finding 2: "}, {"type": "text", "text": "Brief statement"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Finding 3: "}, {"type": "text", "text": "Brief statement"}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "The Issue"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "What is the problem or question this research addresses? Why does it matter?"}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What We Did"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Brief, accessible description of research methods."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What We Found"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Present key findings in plain language with supporting visuals."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "What This Means"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Implications for policy, practice, or future research."}]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Recommendations"}]},
    {"type": "orderedList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Specific recommendation 1"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Specific recommendation 2"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Specific recommendation 3"}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Learn More"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "• Full report: [Link]\n• Contact: [Email]\n• Related resources: [Links]"}]}
  ]
}'::jsonb);
