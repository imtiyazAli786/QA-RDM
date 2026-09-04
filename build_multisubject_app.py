import json
import re

with open('qa_interview_tracker.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Load English modules
with open('english_data.json', 'r', encoding='utf-8') as f:
    english_modules = json.load(f)

# Extract QA data
match = re.search(r'const DATA = (\[[\s\S]*?\]);\s*const STORAGE_KEY', html)
if not match:
    raise ValueError("Could not find DATA in HTML")

import subprocess
node_script = """
const fs = require('fs');
const content = fs.readFileSync('qa_interview_tracker.html', 'utf8');
const match = content.match(/const DATA = ([\\s\\S]*?);\\s*const STORAGE_KEY/);
if (match) {
    const data = eval(match[1]);
    fs.writeFileSync('qa_data_dump.json', JSON.stringify(data, null, 2));
}
"""
with open('dump_qa.js', 'w') as f:
    f.write(node_script)

subprocess.run(["node", "dump_qa.js"], check=True)

with open('qa_data_dump.json', 'r', encoding='utf-8') as f:
    qa_tiers = json.load(f)

print(f"Loaded {len(qa_tiers)} QA tiers and {len(english_modules)} English modules.")

# Construct SUBJECTS JS string
subjects_structure = f"""
const SUBJECTS = {{
  "qa": {{
    id: "qa",
    name: "QA Engineering",
    shortName: "QA",
    icon: "🛠️",
    tagline: "Manual, Automation, API, SQL & Leadership Mastery (7 Tiers · 76 Qs)",
    storageKey: "qa-interview-tracker-v4",
    customKey: "qa-custom-questions-v1",
    roadmap: [
      {{ tier: "Tier 0", title: "Must-Know Vocabulary", why: "Instant red flag if shaky — nail these before anything else.", items: [
        "Testing levels (Unit, Integration, System, Acceptance)",
        "Black-box, White-box, Gray-box testing",
        "7 Principles of Software Testing",
        "Anatomy of a good test case",
        "Browser DevTools for defect isolation",
        "Log reading & stack trace debugging",
        "Shift-Left testing principles",
        "Entry & Exit criteria"
      ]}},
      {{ tier: "Tier 1", title: "Core Fundamentals & Judgment", why: "Almost guaranteed — get these rock solid first.", items: [
        "STLC (Software Testing Life Cycle) end-to-end",
        "Bug / Defect Life Cycle & state transitions",
        "Severity vs Priority conflicts with real examples",
        "Retesting vs Regression testing boundaries",
        "Regression suite pruning under time limits",
        "Equivalence Partitioning & Boundary Value Analysis (BVA)",
        "Verification vs Validation differences",
        "Anatomy of a bulletproof bug report",
        "Critical bugs found just before release",
        "QA vs QC vs Testing conceptual boundaries",
        "Testing with unclear or incomplete requirements",
        "Defect triage process and priority assignment"
      ]}},
      {{ tier: "Tier 2", title: "Applied Senior Skills", why: "Shows you can act on fundamentals under real constraints.", items: [
        "Writing a Test Strategy from scratch",
        "Risk-Based Testing (RBT) matrix",
        "Test effort estimation techniques",
        "Exploratory Testing vs Scripted Testing",
        "Validating data migrations after system upgrade",
        "Login page test design (positive + negative + security)",
        "Intermittent checkout bug investigation",
        "Manual API testing (Postman, payloads, codes)",
        "Backend SQL validation queries",
        "Requirement Traceability Matrix (RTM)",
        "Resolving developer pushbacks gracefully",
        "Reporting test progress & risks to stakeholders",
        "Root Cause Analysis (RCA) 5 Whys",
        "Microservices testing strategy & trace IDs",
        "Tracking Test Metrics (Defect Density, DRE)",
        "Testing under tight deadlines & reduced scope",
        "Uncovering subtle bugs others missed",
        "Reconciling conflicting UAT feedback"
      ]}},
      {{ tier: "Tier 3", title: "Senior-Level Leadership", why: "This is where 5+ years actually gets tested — ownership, mentoring, process.", items: [
        "Mentoring & onboarding junior QA testers",
        "Introducing QA process improvements",
        "Automation candidate selection strategy",
        "Test data management across environments",
        "Fintech transaction testing & ACID integrity",
        "Handling bugs found by business users",
        "Managing mid-sprint scope creep",
        "Release readiness validation checklist",
        "Prioritizing parallel releases/sprints",
        "Learning from estimation mistakes"
      ]}},
      {{ tier: "Tier 4", title: "Specialized / Advanced", why: "Differentiators — fewer interviewers ask these, but they signal you're current for 2026.", items: [
        "JIRA / Sahara workflow & traceability discipline",
        "Performance testing awareness for manual QA",
        "Usability & UX evaluation heuristics",
        "Compatibility vs cross-browser testing",
        "Reliability & recoverability testing",
        "AI tools in testing & non-deterministic features",
        "Testing AI / LLM applications & guardrails",
        "Agentic QA & autonomous test runners",
        "Accessibility testing & WCAG compliance",
        "Security testing basics (OWASP Top 10)",
        "CI/CD pipeline manual QA touchpoints",
        "Cross-browser & cross-platform strategy",
        "Session, cookie & concurrent cart bugs",
        "Domain compliance (PCI-DSS, HIPAA, GDPR)",
        "Contrarian QA opinions with strong defense"
      ]}},
      {{ tier: "Tier 5", title: "Practical & Live Rounds", why: "Live testing challenges, on-the-spot SQL queries, live bug writing, and tool ecosystem mastery.", items: [
        "Live exercise: Writing test cases for a login form on the spot",
        "Live exercise: Basic SQL query on the spot (WHERE, JOIN, GROUP BY)",
        "Live exercise: Live bug writing and severity/priority reasoning",
        "TestRail vs Zephyr vs Xray vs JIRA / Sahara workflow ecosystems",
        "Live exercise: 5-minute exploratory testing challenge",
        "Basic automation awareness for manual testers (Selenium/Playwright concepts)"
      ]}},
      {{ tier: "Tier 6", title: "HR & Behavioral Mastery", why: "Career narrative, salary negotiations, self-awareness, and cultural fit for 5+ years QA experience.", items: [
        "'Tell me about yourself' — 3-part structured pitch",
        "'Why are you leaving?' — Forward-looking framing",
        "Strengths with proof & Weakness with active improvement plan",
        "Salary negotiation — Market-anchored research range",
        "5-Year Vision — Long-term growth path",
        "Mistake learned from — Concrete process fix",
        "Strategic questions to ask the interviewer"
      ]}}
    ],
    tiers: {json.dumps(qa_tiers, indent=2, ensure_ascii=False)}
  }},
  "english": {{
    id: "english",
    name: "English Fluency",
    shortName: "English",
    icon: "🗣️",
    tagline: "English Language Roadmap — From Foundation to Fluency (Step 1: Parts of Speech)",
    storageKey: "english-fluency-tracker-v1",
    customKey: "english-custom-questions-v1",
    roadmap: [
      {{
        tier: "Step 1",
        title: "Parts of Speech (Foundations)",
        why: "The building blocks of the entire English language — master these 9 parts of speech before moving to tenses and fluent sentence construction.",
        items: [
          "1. Noun — Person, place, thing, animal, or abstract idea",
          "2. Pronoun — Replaces a noun to avoid repetition",
          "3. Verb — Shows action or state of being (the sentence engine)",
          "4. Adjective — Describes color, size, quality of nouns",
          "5. Adverb — Modifies verbs, adjectives, or adverbs (how/when/where)",
          "6. Preposition — Shows place, time, and direction relationships",
          "7. Conjunction — Connects ideas for smooth, fluent speech",
          "8. Interjection — Sudden emotions and spontaneous feelings",
          "Bonus. Article — A, An, The (General vs Specific pointers)"
        ]
      }}
    ],
    tiers: [
      {{
        tier: "Step 1",
        title: "Parts of Speech",
        why: "Mastering the 9 parts of speech is like learning the alphabet before writing words. Once you can label any word in a sentence instantly, your grammar and speaking confidence skyrocket.",
        apply: "Take any 3 sentences from today's work email or news and label every single word's part of speech without pausing.",
        questions: {json.dumps(english_modules, indent=2, ensure_ascii=False)}
      }}
    ]
  }}
}};
"""

# Replace DATA and ROADMAP_DATA with SUBJECTS architecture
pattern = r'const ROADMAP_DATA = \[[\s\S]*?\];\s*const DATA = \[[\s\S]*?\];\s*const STORAGE_KEY = "qa-interview-tracker-v4";'

replacement = subjects_structure.strip() + """

let currentSubjectId = localStorage.getItem("qa_active_subject") || "qa";
if (!SUBJECTS[currentSubjectId]) currentSubjectId = "qa";

function getActiveSubject() {
  return SUBJECTS[currentSubjectId] || SUBJECTS.qa;
}

let DATA = getActiveSubject().tiers;
let STORAGE_KEY = getActiveSubject().storageKey;
let CUSTOM_KEY = getActiveSubject().customKey;
"""

if re.search(pattern, html):
    html = re.sub(pattern, lambda m: replacement, html)
    print("Replaced data layer with SUBJECTS catalog!")
else:
    print("WARNING: Pattern for DATA & ROADMAP_DATA not found")

with open('qa_interview_tracker.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Saved HTML files with multi-subject data structure!")
