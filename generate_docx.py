import re
import json
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def parse_answer(raw):
    if not raw:
        return {"key": [], "example": None, "mistake": None, "why": None, "eli5": None}
    
    parts = raw.split("\n\n")
    eli5 = ""
    main_raw = raw
    if len(parts) > 1 and re.match(r'^ELI5:\s*', parts[-1].strip(), re.IGNORECASE):
        eli5 = re.sub(r'^ELI5:\s*', '', parts[-1].strip(), flags=re.IGNORECASE)
        main_raw = "\n\n".join(parts[:-1])
    
    lines = [l.strip() for l in main_raw.split("\n") if l.strip()]
    out = {"key": [], "example": None, "mistake": None, "why": None, "eli5": eli5}
    
    for line in lines:
        if re.match(r'^Example:\s*', line, re.IGNORECASE):
            out["example"] = re.sub(r'^Example:\s*', '', line, flags=re.IGNORECASE)
        elif re.match(r'^Common mistake:\s*', line, re.IGNORECASE):
            out["mistake"] = re.sub(r'^Common mistake:\s*', '', line, flags=re.IGNORECASE)
        elif re.match(r'^Why it\'?s asked:\s*', line, re.IGNORECASE):
            out["why"] = re.sub(r'^Why it\'?s asked:\s*', '', line, flags=re.IGNORECASE)
        elif re.match(r'^Why it matters:\s*', line, re.IGNORECASE):
            out["why"] = re.sub(r'^Why it matters:\s*', '', line, flags=re.IGNORECASE)
        elif re.match(r'^Why:\s*', line, re.IGNORECASE):
            out["why"] = re.sub(r'^Why:\s*', '', line, flags=re.IGNORECASE)
        else:
            out["key"].append(line)
            
    return out

import subprocess
node_script = """
const fs = require('fs');
const content = fs.readFileSync('qa_interview_tracker.html', 'utf8');
const match = content.match(/const DATA = ([\s\S]*?);\s*const STORAGE_KEY/);
if (match) {
    const data = eval(match[1]);
    fs.writeFileSync('full_76_data.json', JSON.stringify(data, null, 2));
}
"""
with open('ext_data.js', 'w') as f:
    f.write(node_script)
subprocess.run(["node", "ext_data.js"], check=True)
with open("full_76_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Build Document
doc = docx.Document()

# Page Setup
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Color Palette Constants
COLOR_NAVY = RGBColor(15, 23, 42)      # #0F172A
COLOR_TEAL = RGBColor(13, 148, 136)    # #0D9488
COLOR_EMERALD = RGBColor(5, 150, 105)  # #059669
COLOR_AMBER = RGBColor(180, 83, 9)     # #B45309
COLOR_MUTED = RGBColor(71, 85, 105)    # #475569
COLOR_DARK = RGBColor(30, 41, 59)      # #1E293B

# Title Page / Header Banner
p_title = doc.add_paragraph()
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_before = Pt(10)
p_title.paragraph_format.space_after = Pt(4)
run_title = p_title.add_run("QA Manual & Automation Engineering")
run_title.font.name = "Segoe UI"
run_title.font.size = Pt(24)
run_title.font.bold = True
run_title.font.color.rgb = COLOR_NAVY

p_sub = doc.add_paragraph()
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_sub.paragraph_format.space_after = Pt(6)
run_sub = p_sub.add_run("Roadmap & Progress Tracker — Complete Interview Master Guide")
run_sub.font.name = "Segoe UI"
run_sub.font.size = Pt(14)
run_sub.font.bold = True
run_sub.font.color.rgb = COLOR_EMERALD

p_meta = doc.add_paragraph()
p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_meta.paragraph_format.space_after = Pt(20)
run_meta = p_meta.add_run("76 Comprehensive Questions • 7 Tiers • English & Hinglish Dual Explanations • Examples • Traps • ELI5 Analogies")
run_meta.font.name = "Segoe UI"
run_meta.font.size = Pt(10)
run_meta.font.italic = True
run_meta.font.color.rgb = COLOR_MUTED

# Summary Table
table = doc.add_table(rows=1, cols=3)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.autofit = False

hdr_cells = table.rows[0].cells
hdr_cells[0].text = "Tier / Track"
hdr_cells[1].text = "Focus Area & Depth"
hdr_cells[2].text = "Questions"

for cell in hdr_cells:
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
    for p in cell.paragraphs:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Segoe UI"
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)

tier_rows = [
    ("Tier 0", "Must-Know Vocabulary & Core Terminology", "8 Questions (TC-001 to TC-008)"),
    ("Tier 1", "Fundamentals + Judgment & Bug Life Cycle", "12 Questions (TC-009 to TC-020)"),
    ("Tier 2", "Applied Senior Skills (SQL, API, Risk Testing)", "18 Questions (TC-021 to TC-038)"),
    ("Tier 3", "Senior & Leadership (Strategy, RCAs, Conflicts)", "10 Questions (TC-039 to TC-048)"),
    ("Tier 4", "Specialized & 2026 Focus (JIRA, Security, Async)", "15 Questions (TC-049 to TC-063)"),
    ("Tier 5", "Practical / Live Round Prep (Live Cases, SQL, Tooling)", "6 Questions (TC-064 to TC-066, TC-071, TC-072, TC-076)"),
    ("Tier 6", "HR & Behavioral Mastery (Career Story, Salary, Growth)", "7 Questions (TC-067 to TC-070, TC-073 to TC-075)"),
]

for idx, (t, f_area, q_count) in enumerate(tier_rows):
    row_cells = table.add_row().cells
    row_cells[0].text = t
    row_cells[1].text = f_area
    row_cells[2].text = q_count
    bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
    for cell in row_cells:
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.name = "Segoe UI"
                run.font.size = Pt(9)
                run.font.color.rgb = COLOR_DARK

doc.add_paragraph().paragraph_format.space_after = Pt(14)

# Global Question Counter
q_num = 1

for tier_idx, tier in enumerate(data):
    # Tier Header Box
    p_tier = doc.add_paragraph()
    p_tier.paragraph_format.space_before = Pt(22)
    p_tier.paragraph_format.space_after = Pt(4)
    run_t = p_tier.add_run(f"■ {tier['tier'].upper()}: {tier['title'].upper()}")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(15)
    run_t.font.bold = True
    run_t.font.color.rgb = COLOR_NAVY
    
    if tier.get('why'):
        p_twhy = doc.add_paragraph()
        p_twhy.paragraph_format.space_after = Pt(6)
        r_tw = p_twhy.add_run(f"Context / Why It Matters: {tier['why']}")
        r_tw.font.name = "Segoe UI"
        r_tw.font.size = Pt(10)
        r_tw.font.italic = True
        r_tw.font.color.rgb = COLOR_MUTED
        
    if tier.get('apply'):
        p_tapp = doc.add_paragraph()
        p_tapp.paragraph_format.space_after = Pt(12)
        r_ta = p_tapp.add_run(f"💡 Practical Action Tip: {tier['apply']}")
        r_ta.font.name = "Segoe UI"
        r_ta.font.size = Pt(9.5)
        r_ta.font.bold = True
        r_ta.font.color.rgb = COLOR_EMERALD

    # Questions in this tier
    for q in tier['questions']:
        tc_id = f"TC-{str(q_num).zfill(3)}"
        
        # Question Title
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(14)
        p_q.paragraph_format.space_after = Pt(4)
        
        r_id = p_q.add_run(f"[{tc_id}] ")
        r_id.font.name = "Segoe UI"
        r_id.font.size = Pt(12)
        r_id.font.bold = True
        r_id.font.color.rgb = COLOR_EMERALD
        
        r_qt = p_q.add_run(q['text'])
        r_qt.font.name = "Segoe UI"
        r_qt.font.size = Pt(12)
        r_qt.font.bold = True
        r_qt.font.color.rgb = COLOR_NAVY
        
        parsed_en = parse_answer(q.get('answer', ''))
        parsed_hi = parse_answer(q.get('hinglish', ''))
        
        # SECTION: ENGLISH ANSWER
        p_en_hdr = doc.add_paragraph()
        p_en_hdr.paragraph_format.left_indent = Inches(0.15)
        p_en_hdr.paragraph_format.space_before = Pt(4)
        p_en_hdr.paragraph_format.space_after = Pt(2)
        r_enh = p_en_hdr.add_run("🇬🇧 English Technical Pitch:")
        r_enh.font.name = "Segoe UI"
        r_enh.font.size = Pt(10.5)
        r_enh.font.bold = True
        r_enh.font.color.rgb = COLOR_NAVY
        
        if parsed_en['key']:
            p_key = doc.add_paragraph()
            p_key.paragraph_format.left_indent = Inches(0.25)
            p_key.paragraph_format.space_after = Pt(3)
            r_kl = p_key.add_run("📌 Key Idea: ")
            r_kl.font.name = "Segoe UI"
            r_kl.font.size = Pt(9.5)
            r_kl.font.bold = True
            r_kl.font.color.rgb = COLOR_EMERALD
            
            r_kt = p_key.add_run("\n".join(parsed_en['key']))
            r_kt.font.name = "Segoe UI"
            r_kt.font.size = Pt(9.5)
            r_kt.font.color.rgb = COLOR_DARK
            
        if parsed_en['example']:
            p_ex = doc.add_paragraph()
            p_ex.paragraph_format.left_indent = Inches(0.25)
            p_ex.paragraph_format.space_after = Pt(3)
            r_el = p_ex.add_run("💬 Example: ")
            r_el.font.name = "Segoe UI"
            r_el.font.size = Pt(9.5)
            r_el.font.bold = True
            r_el.font.color.rgb = COLOR_NAVY
            
            r_et = p_ex.add_run(parsed_en['example'])
            r_et.font.name = "Segoe UI"
            r_et.font.size = Pt(9.5)
            r_et.font.color.rgb = COLOR_DARK

        if parsed_en['mistake']:
            p_mis = doc.add_paragraph()
            p_mis.paragraph_format.left_indent = Inches(0.25)
            p_mis.paragraph_format.space_after = Pt(3)
            r_ml = p_mis.add_run("⚠️ Common Mistake: ")
            r_ml.font.name = "Segoe UI"
            r_ml.font.size = Pt(9.5)
            r_ml.font.bold = True
            r_ml.font.color.rgb = RGBColor(225, 29, 72)
            
            r_mt = p_mis.add_run(parsed_en['mistake'])
            r_mt.font.name = "Segoe UI"
            r_mt.font.size = Pt(9.5)
            r_mt.font.color.rgb = COLOR_DARK

        if parsed_en['why']:
            p_why = doc.add_paragraph()
            p_why.paragraph_format.left_indent = Inches(0.25)
            p_why.paragraph_format.space_after = Pt(3)
            r_wl = p_why.add_run("🎯 Why It's Asked: ")
            r_wl.font.name = "Segoe UI"
            r_wl.font.size = Pt(9.5)
            r_wl.font.bold = True
            r_wl.font.color.rgb = COLOR_AMBER
            
            r_wt = p_why.add_run(parsed_en['why'])
            r_wt.font.name = "Segoe UI"
            r_wt.font.size = Pt(9.5)
            r_wt.font.color.rgb = COLOR_DARK

        # SECTION: HINGLISH EXPLANATION
        if parsed_hi and parsed_hi['key']:
            p_hi_hdr = doc.add_paragraph()
            p_hi_hdr.paragraph_format.left_indent = Inches(0.15)
            p_hi_hdr.paragraph_format.space_before = Pt(4)
            p_hi_hdr.paragraph_format.space_after = Pt(2)
            r_hih = p_hi_hdr.add_run("🇮🇳 Hinglish Explanation & Intuition:")
            r_hih.font.name = "Segoe UI"
            r_hih.font.size = Pt(10)
            r_hih.font.bold = True
            r_hih.font.color.rgb = COLOR_AMBER
            
            p_hikey = doc.add_paragraph()
            p_hikey.paragraph_format.left_indent = Inches(0.25)
            p_hikey.paragraph_format.space_after = Pt(3)
            r_hkt = p_hikey.add_run("\n".join(parsed_hi['key']))
            r_hkt.font.name = "Segoe UI"
            r_hkt.font.size = Pt(9.5)
            r_hkt.font.color.rgb = COLOR_DARK
            
            if parsed_hi['example']:
                p_hex = doc.add_paragraph()
                p_hex.paragraph_format.left_indent = Inches(0.25)
                p_hex.paragraph_format.space_after = Pt(3)
                r_hel = p_hex.add_run("💬 Hinglish Example: ")
                r_hel.font.name = "Segoe UI"
                r_hel.font.size = Pt(9.5)
                r_hel.font.bold = True
                r_hel.font.color.rgb = COLOR_NAVY
                r_het = p_hex.add_run(parsed_hi['example'])
                r_het.font.name = "Segoe UI"
                r_het.font.size = Pt(9.5)
                r_het.font.color.rgb = COLOR_DARK

        # 5. ELI5 Box
        eli5_text = parsed_hi.get('eli5') or parsed_en.get('eli5')
        if eli5_text:
            p_eli = doc.add_paragraph()
            p_eli.paragraph_format.left_indent = Inches(0.25)
            p_eli.paragraph_format.space_after = Pt(8)
            r_ell = p_eli.add_run("🧒 ELI5 Everyday Analogy: ")
            r_ell.font.name = "Segoe UI"
            r_ell.font.size = Pt(9.5)
            r_ell.font.bold = True
            r_ell.font.color.rgb = COLOR_AMBER
            
            r_elt = p_eli.add_run(eli5_text)
            r_elt.font.name = "Segoe UI"
            r_elt.font.size = Pt(9.5)
            r_elt.font.italic = True
            r_elt.font.color.rgb = COLOR_DARK

        # Divider between questions
        p_div = doc.add_paragraph()
        p_div.paragraph_format.space_after = Pt(6)
        r_div = p_div.add_run("―" * 45)
        r_div.font.size = Pt(8)
        r_div.font.color.rgb = RGBColor(226, 232, 240)

        q_num += 1

output_filename = "QA_Interview_Questions_and_Answers_Master_Guide.docx"
doc.save(output_filename)
print(f"Successfully generated updated {output_filename} with English & Hinglish for all {q_num - 1} questions!")
