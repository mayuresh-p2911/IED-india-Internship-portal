/**
 * Generate Synopsis DOCX for IED India Internship Portal
 * This script copies the original synopsis.docx structure and replaces 
 * content with IED India Internship Portal project information.
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const INPUT_PATH = 'C:/Users/Mayuresh/Downloads/synopsis.docx';
const OUTPUT_PATH = 'C:/Users/Mayuresh/Downloads/IED_India_Internship_Portal_Synopsis.docx';

// Helper to build a styled run (w:r element) with same formatting as original
function makeRun(text, fontSize = '24', fontName = 'Times New Roman', bold = false, color = '000000') {
  const boldTags = bold ? '<w:b/><w:bCs/>' : '';
  return `<w:r><w:rPr><w:rFonts w:ascii="${fontName}" w:eastAsia="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>${boldTags}<w:color w:val="${color}"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

function makeBulletPara(text, fontSize = '28') {
  return `<w:p w14:paraId="AA000001" w14:textId="77777777" w:rsidR="00367384" w:rsidRPr="00367384" w:rsidRDefault="00367384" w:rsidP="00367384"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr></w:pPr><w:r w:rsidRPr="00367384"><w:rPr><w:rFonts w:ascii="Helvetica" w:eastAsia="Times New Roman" w:hAnsi="Helvetica" w:cs="Times New Roman"/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t>•</w:t></w:r><w:r w:rsidRPr="00367384"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t xml:space="preserve"> ${escXml(text)}</w:t></w:r></w:p>`;
}

function makeTextPara(text, fontSize = '24', fontName = 'Arial', bold = false) {
  const boldTags = bold ? '<w:b/><w:bCs/>' : '';
  return `<w:p w14:paraId="BB000001" w14:textId="77777777" w:rsidR="00367384" w:rsidRPr="00367384" w:rsidRDefault="00367384" w:rsidP="00367384"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="${fontName}" w:eastAsia="Times New Roman" w:hAnsi="${fontName}" w:cs="${fontName}"/>${boldTags}<w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr></w:pPr><w:r w:rsidRPr="00367384"><w:rPr><w:rFonts w:ascii="${fontName}" w:eastAsia="Times New Roman" w:hAnsi="${fontName}" w:cs="${fontName}"/>${boldTags}<w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
}

function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Read the original docx
const zip = new AdmZip(INPUT_PATH);
let docXml = zip.readAsText('word/document.xml');

// =========================================================
// STRATEGY: Find the specific content sections and replace 
// the text within <w:t> tags while keeping all XML structure
// =========================================================

// 1. Replace project title
docXml = docXml.replace(
  /<w:t>MOCKIT INTERVIEW PLATFORM<\/w:t>/,
  '<w:t>IED INDIA INTERNSHIP MANAGEMENT PORTAL</w:t>'
);

// 2. Replace student name section
// Original: "Harsh kumar gupta" followed by "5"
// We need to replace these in the table cell for STUDENT NAME & SECTION
docXml = docXml.replace(
  /<w:t xml:space="preserve">Harsh kumar gupta <\/w:t>/,
  '<w:t xml:space="preserve">Mayuresh Patle </w:t>'
);
docXml = docXml.replace(
  /<w:t>5<\/w:t>/,
  '<w:t>B</w:t>'
);

// 3. Replace registration number
docXml = docXml.replace(
  /<w:t>24C01081<\/w:t>/,
  '<w:t>24C01019</w:t>'
);

// 4. Replace guide name
docXml = docXml.replace(
  /<w:t xml:space="preserve">Dr Jitha <\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r[^>]*><w:rPr>[^<]*<w:rFonts[^>]*\/>[^<]*<w:sz[^>]*\/>[^<]*<w:szCs[^>]*\/>[^<]*<\/w:rPr><w:t>janardhanan<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/>/,
  '<w:t xml:space="preserve">Dr. Jitha Janardhanan</w:t></w:r>'
);

// Now we need to replace the body content (Abstract, Introduction, Review of Literature, etc.)
// We'll find the body content between the page break and the end of the document

// The strategy: Find the abstract section onwards and replace it entirely.
// The abstract section starts after the page break `<w:br w:type="page"/>`

const pageBreakEnd = docXml.indexOf('<w:br w:type="page"/>');
const bodyStart = docXml.indexOf('</w:p>', pageBreakEnd) + 6;
const sectPrStart = docXml.lastIndexOf('<w:sectPr');

// Build new body content for IED India Internship Portal
const newBodyContent = buildNewBodyContent();

// Replace body content
docXml = docXml.substring(0, bodyStart) + newBodyContent + docXml.substring(sectPrStart);

// Write the modified XML back to zip and save
zip.updateFile('word/document.xml', Buffer.from(docXml, 'utf8'));
zip.writeZip(OUTPUT_PATH);

console.log('✅ Synopsis generated successfully at:', OUTPUT_PATH);

function buildNewBodyContent() {
  const p = (content) => content; // passthrough helper
  
  // Empty paragraph helper
  const emptyP = (fontSize = '24') => `<w:p w14:paraId="CC000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr></w:pPr></w:p>`;

  // Section heading helper (like "Abstract:", "Introduction:", etc.)
  const sectionHeading = (text, fontSize = '28') => `<w:p w14:paraId="DD000001" w14:textId="77777777" w:rsidR="00FC557C" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;

  // Sub-heading in bold
  const subHeading = (text, fontSize = '24') => `<w:p w14:paraId="EE000001" w14:textId="77777777" w:rsidR="00367384" w:rsidRPr="00367384" w:rsidRDefault="00367384" w:rsidP="00367384"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr></w:pPr><w:r w:rsidRPr="00367384"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t>${escXml(text)}</w:t></w:r></w:p>`;

  // Intro heading helper (like "Review of Literature")
  const introHeading = (text) => `<w:p w14:paraId="FF000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="36"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="36"/></w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;

  // Gantt chart table row
  const ganttRow = (activity, w1, w2, w3, w4, w5, w6, w7, w8) => {
    const cell = (txt, width = '1100') => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">${escXml(txt)}</w:t></w:r></w:p></w:tc>`;
    return `<w:tr><w:trPr><w:trHeight w:val="400"/></w:trPr>${cell(activity, '2800')}${cell(w1)}${cell(w2)}${cell(w3)}${cell(w4)}${cell(w5)}${cell(w6)}${cell(w7)}${cell(w8)}</w:tr>`;
  };

  const ganttTable = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9630" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="2800"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1100"/><w:gridCol w:w="1030"/></w:tblGrid>
${ganttRow('Activity', 'Week 1-2', 'Week 3-4', 'Week 5-6', 'Week 7-8', 'Week 9-10', 'Week 11-12', 'Week 13-14', 'Week 15-16')}
${ganttRow('Requirement Gathering & Analysis', '✓', '✓', '', '', '', '', '', '')}
${ganttRow('System Design (UI, Database & Architecture)', '', '', '✓', '✓', '', '', '', '')}
${ganttRow('Backend Development & Database Setup', '', '', '', '✓', '✓', '✓', '', '')}
${ganttRow('Frontend Development (Vanilla JS SPA)', '', '', '', '', '✓', '✓', '✓', '')}
${ganttRow('Module Integration & Feature Development', '', '', '', '', '', '✓', '✓', '')}
${ganttRow('Testing & Bug Fixing', '', '', '', '', '', '', '✓', '✓')}
${ganttRow('Deployment & Documentation', '', '', '', '', '', '', '', '✓')}
${ganttRow('Final Review & Project Submission', '', '', '', '', '', '', '', '✓')}
</w:tbl>`;

  // Technology table
  const techTable = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9630" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/></w:tblGrid>
<w:tr><w:trPr><w:trHeight w:val="500"/></w:trPr>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>HARDWARE</w:t></w:r></w:p></w:tc>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Component</w:t></w:r></w:p></w:tc>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Specification</w:t></w:r></w:p></w:tc>
</w:tr>
<w:tr><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>PROCESSOR</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Any modern processor</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>RAM</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>4 GB minimum</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Hard Disk</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>256 GB</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>`;

  // Software requirements table
  const softwareTable = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9630" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/></w:tblGrid>
<w:tr><w:trPr><w:trHeight w:val="500"/></w:trPr>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>SOFTWARE</w:t></w:r></w:p></w:tc>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Component</w:t></w:r></w:p></w:tc>
<w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Details</w:t></w:r></w:p></w:tc>
</w:tr>
${swRow('Operating System', 'Any')}
${swRow('Front End', 'HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript')}
${swRow('Back End', 'Node.js, Express.js')}
${swRow('Database', 'MongoDB, Mongoose ODM')}
${swRow('Authentication', 'JWT (JSON Web Token), bcrypt')}
${swRow('Libraries & Tools', 'PDFKit, Nodemailer, QRCode, Multer, Chart.js, Lucide Icons')}
${swRow('Browser', 'Chrome, Firefox, Edge or any modern browser')}
</w:tbl>`;

  // Signatures table (same as original)
  const signaturesTable = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9630" w:type="dxa"/><w:tblBorders><w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="4815"/><w:gridCol w:w="4815"/></w:tblGrid>
<w:tr><w:tc><w:tcPr><w:tcW w:w="4815" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Guide Signature</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4815" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Student Signature</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>`;

  // Requirement specification table (original structure)
  const reqSpecTable = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9630" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/><w:gridCol w:w="3210"/></w:tblGrid>
${reqRow('SRS/SRA')}${reqRow('System Design')}${reqRow('Coding')}${reqRow('Testing')}${reqRow('Deployment and Report')}
</w:tbl>`;

  return [
    // ---- ABSTRACT ----
    emptyP('24'),
    sectionHeading('Abstract:'),
    makeTextPara(
      'The IED India Internship Management Portal is a full-stack web application designed to streamline the end-to-end lifecycle of internship programs for IED India Pvt Ltd. ' +
      'The platform provides a centralized system to manage internship applications, candidate interviews, onboarding, task assignment, attendance tracking, performance evaluation, leave management, and certificate generation. ' +
      'It features a multi-role architecture supporting Super Admin, HR Manager, Mentor, and Intern roles — each with tailored dashboards and access controls. ' +
      'The system eliminates manual paperwork, reduces administrative overhead, and empowers organizations to efficiently manage, track, and evaluate interns in real time.', '24', 'Arial'
    ),
    emptyP('24'),

    // ---- INTRODUCTION ----
    introHeading('Introduction: '),
    makeBulletPara('To provide a centralized platform for managing the complete internship lifecycle — from application to certificate generation.', '28'),
    makeBulletPara('To support multiple roles (Super Admin, HR Manager, Mentor, Intern) with role-based access control and personalized dashboards.', '28'),
    makeBulletPara('To automate repetitive HR tasks such as attendance tracking, leave approval, task assignment, and evaluation.', '28'),
    makeBulletPara('To generate performance evaluations and issue digitally verifiable PDF certificates with QR codes to deserving interns.', '28'),
    makeBulletPara('To provide real-time analytics and reporting for informed decision-making by administrators and HR teams.', '28'),
    emptyP('28'),

    // ---- REVIEW OF LITERATURE ----
    introHeading('Review of Literature  '),
    makeTextPara(
      'Traditional internship management relies on manual spreadsheets, email chains, and physical documents for tracking applications, attendance, and evaluations. ' +
      'These methods are time-consuming, error-prone, and lack centralization. Existing HR management platforms often serve large enterprises and are too expensive or complex for mid-sized organizations like IED India. ' +
      'They also do not cater specifically to the internship lifecycle, which has unique requirements such as project-based evaluation, mentor-intern communication, and certificate issuance.',
      '24', 'Arial'
    ),
    emptyP('24'),
    subHeading('LIMITATIONS OF EXISTING APPROACHES:'),
    makeBulletPara('No centralized platform to manage the full internship lifecycle from application to certificate generation.', '24'),
    makeBulletPara('Manual tracking of attendance, leave, and tasks leads to data inconsistencies and administrative burden.', '24'),
    makeBulletPara('Lack of role-based access control tailored to internship workflows (Admin, HR, Mentor, Intern).', '24'),
    makeBulletPara('No integrated communication module between mentors and interns within the same system.', '24'),
    makeBulletPara('Absence of automated, verifiable certificate generation linked to intern performance records.', '24'),
    makeBulletPara('No real-time analytics dashboard for tracking intern performance, attendance rates, and task completion.', '24'),
    makeBulletPara('Expensive enterprise HR solutions that are not tailored to the internship management use case.', '24'),
    makeBulletPara('No support for document upload, onboarding workflows, or geo-tagged attendance verification.', '24'),
    emptyP('24'),

    // ---- PROPOSED SYSTEM ----
    `<w:p w14:paraId="A1000001" w14:textId="77777777" w:rsidR="00367384" w:rsidRPr="00367384" w:rsidRDefault="00367384" w:rsidP="00367384"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr></w:pPr><w:r w:rsidRPr="00367384"><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:color w:val="000000"/><w:kern w:val="0"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:eastAsia="en-GB"/><w14:ligatures w14:val="none"/></w:rPr><w:t>3. PROPOSED SYSTEM AND ITS ADVANTAGES</w:t></w:r></w:p>`,
    makeTextPara(
      'The proposed system, IED India Internship Management Portal, is a comprehensive web-based application that digitizes the complete internship management process for IED India Pvt Ltd. ' +
      'The platform is built using Node.js, Express.js, MongoDB, and Vanilla JavaScript with a Glassmorphism-inspired design. ' +
      'It supports four distinct user roles — Super Admin, HR Manager, Mentor, and Intern — each with dedicated dashboards, modules, and permissions. ' +
      'The system enables HR teams to publish positions, review applications, schedule interviews, manage onboarding documents, assign tasks, track attendance, conduct evaluations, approve leaves, and generate QR-verified PDF certificates — all from a single platform.',
      '24', 'Times New Roman'
    ),
    emptyP('24'),
    subHeading('HOW THIS PROJECT IS DIFFERENT'),
    makeBulletPara('Covers the entire internship lifecycle: Applications → Interviews → Onboarding → Tasks → Attendance → Evaluations → Certificates.', '24'),
    makeBulletPara('Multi-role system with granular role-based access control (Super Admin, HR Manager, Mentor, Intern).', '24'),
    makeBulletPara('Automated PDF certificate generation with embedded QR codes for digital verification.', '24'),
    makeBulletPara('Real-time analytics dashboard with Chart.js visualizations for performance and attendance insights.', '24'),
    makeBulletPara('Geo-tagged attendance marking and leave request workflows with approval notifications.', '24'),
    makeBulletPara('Integrated communication module for announcements and direct messaging between roles.', '24'),
    makeBulletPara('Secure JWT-based authentication with bcrypt password hashing and Helmet.js security headers.', '24'),
    makeBulletPara('Email notification system (via Nodemailer) for application updates, interview schedules, and task assignments.', '24'),
    emptyP('24'),

    // ---- TECHNOLOGY USED ----
    `<w:p w14:paraId="A2000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>Technology used</w:t></w:r></w:p>`,
    `<w:p w14:paraId="A3000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>hardware</w:t></w:r></w:p>`,
    techTable,
    emptyP('24'),
    `<w:p w14:paraId="A4000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>SOFTWARE REQUIREMENTS</w:t></w:r></w:p>`,
    softwareTable,
    emptyP('24'),

    // ---- GANTT CHART ----
    `<w:p w14:paraId="A5000001" w14:textId="77777777" w:rsidR="001E75C1" w:rsidRDefault="001E75C1" w:rsidP="00FC557C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Gantt Chart:</w:t></w:r></w:p>`,
    ganttTable,
    emptyP('24'),

    // ---- REQUIREMENT SPECIFICATION ----
    reqSpecTable,
    emptyP('24'),

    // ---- SIGNATURES ----
    signaturesTable,
    emptyP('24'),

  ].join('\n');
}

function swRow(label, value) {
  return `<w:tr><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escXml(label)}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escXml(value)}</w:t></w:r></w:p></w:tc></w:tr>`;
}

function reqRow(label) {
  return `<w:tr><w:trPr><w:trHeight w:val="600"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escXml(label)}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3210" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p></w:tc></w:tr>`;
}

function escXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
