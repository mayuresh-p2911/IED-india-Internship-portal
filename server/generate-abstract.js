/**
 * IED India Internship Management Portal — Detailed Project Abstract PDF Generator
 * Formatted strictly according to academic/project synopsis requirements:
 * 1. Title of Project
 * 2. Introduction of Project
 * 3. Module description
 * 4. Software and hardware requirements
 * 5. DFD diagram (Level 0 and Level 1)
 * 6. Client side validation code
 * 7. Conclusion
 * 8. Future
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT_LOCAL = path.join(__dirname, '..', 'IED_India_Internship_Portal_Project_Abstract.pdf');
const OUTPUT_DOWNLOADS = 'C:/Users/Mayuresh/Downloads/IED_India_Internship_Portal_Project_Abstract.pdf';

const C = {
  navyDark: '#0a1628',
  navyPrimary: '#1a237e',
  navyBlue: '#092d76',
  royalBlue: '#1565c0',
  lightBlue: '#2563eb',
  accentOrange: '#ff4f00',
  accentGold: '#d97706',
  accentGreen: '#166534',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  bgTint: '#f8fafc',
  bgCard: '#f1f5f9',
  borderLight: '#cbd5e1',
  borderDark: '#94a3b8',
  white: '#ffffff',
  codeBg: '#0f172a',
  codeText: '#38bdf8',
  codeComment: '#94a3b8',
  codeKeyword: '#f472b6',
  codeString: '#4ade80'
};

const W = 595.28; // A4 Width in points
const H = 841.89; // A4 Height in points
const ML = 45;    // Margin Left
const MR = 45;    // Margin Right
const MT = 48;    // Margin Top
const MB = 48;    // Margin Bottom
const CW = W - ML - MR; // Content Width (505.28)

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: MT, bottom: 0, left: ML, right: MR }, // bottom: 0 prevents auto-page spawn on footer
  autoFirstPage: false,
  bufferPages: true,
  info: {
    Title: 'Project Abstract - IED India Internship Management Portal',
    Author: 'Mayuresh Patil',
    Subject: 'Detailed Project Abstract & Technical Synopsis',
    Keywords: 'IED India, Internship Management, MERN Stack, DFD, Project Abstract'
  }
});

const streamLocal = fs.createWriteStream(OUTPUT_LOCAL);
doc.pipe(streamLocal);

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function drawHeaderFooter(pageNumber, totalPages) {
  if (pageNumber === 1) return; // Skip cover page running header

  doc.save();

  // Running Header
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.textMuted)
     .text('IED INDIA INTERNSHIP MANAGEMENT PORTAL', ML, 20, { width: CW / 2, align: 'left', lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.textMuted)
     .text('PROJECT ABSTRACT & TECHNICAL SYNOPSIS', ML + CW / 2, 20, { width: CW / 2, align: 'right', lineBreak: false });
  doc.moveTo(ML, 30).lineTo(ML + CW, 30).lineWidth(0.6).stroke(C.borderLight);

  // Running Footer
  doc.moveTo(ML, H - 28).lineTo(ML + CW, H - 28).lineWidth(0.6).stroke(C.borderLight);
  doc.fontSize(7.5).font('Helvetica').fillColor(C.textMuted)
     .text('International Entrepreneur Digital India Pvt. Ltd. | Confidential & Academic Evaluation', ML, H - 20, { width: CW - 80, lineBreak: false });
  doc.font('Helvetica-Bold').fillColor(C.navyBlue)
     .text(`Page ${pageNumber} of ${totalPages}`, ML + CW - 80, H - 20, { width: 80, align: 'right', lineBreak: false });

  doc.restore();
}

function drawSectionHeading(num, title, yPos) {
  const y = yPos !== undefined ? yPos : doc.y;
  doc.save();

  const badgeWidth = 22;
  const badgeHeight = 18;
  doc.roundedRect(ML, y, badgeWidth, badgeHeight, 3).fill(C.navyBlue);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.white)
     .text(String(num), ML, y + 3.5, { width: badgeWidth, align: 'center', lineBreak: false });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.navyDark)
     .text(title.toUpperCase(), ML + badgeWidth + 10, y + 2.5, { width: CW - badgeWidth - 10, lineBreak: false });

  const lineY = y + badgeHeight + 5;
  doc.moveTo(ML, lineY).lineTo(ML + 100, lineY).lineWidth(2).stroke(C.accentOrange);
  doc.moveTo(ML + 105, lineY).lineTo(ML + CW, lineY).lineWidth(0.5).stroke(C.borderLight);

  doc.restore();
  doc.y = lineY + 10;
}

function drawSubHeading(title, yPos) {
  if (yPos !== undefined) doc.y = yPos;
  doc.save();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.royalBlue)
     .text(title, ML, doc.y, { width: CW });
  doc.restore();
  doc.y += 3;
}

function drawParagraph(text, options = {}) {
  doc.save();
  doc.fontSize(options.fontSize || 8.8)
     .font(options.font || 'Helvetica')
     .fillColor(options.color || C.textPrimary)
     .text(text, ML, doc.y, {
       width: CW,
       align: options.align || 'justify',
       lineGap: options.lineGap || 2.8,
       ...options
     });
  doc.restore();
  doc.y += options.spacingAfter !== undefined ? options.spacingAfter : 6;
}

function drawBulletPoint(title, description, spacing = 4) {
  doc.save();
  const bulletX = ML + 6;
  const contentX = ML + 18;
  const contentW = CW - 18;

  doc.circle(bulletX, doc.y + 4.5, 2).fill(C.accentOrange);

  doc.fontSize(8.6).font('Helvetica-Bold').fillColor(C.navyDark)
     .text(`${title}: `, contentX, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(C.textSecondary)
     .text(description, { width: contentW, lineGap: 2, align: 'justify' });

  doc.restore();
  doc.y += spacing;
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1: TITLE OF PROJECT & INTRODUCTION
// ═══════════════════════════════════════════════════════════════
doc.addPage();

// Cover Header Banner
doc.save();
const bannerH = 96;
doc.rect(0, 0, W, bannerH).fill(C.navyDark);

// Decorative accent shapes
doc.polygon([W - 140, 0], [W, 0], [W, bannerH], [W - 80, bannerH]).fillOpacity(0.18).fill(C.accentOrange);
doc.polygon([W - 70, 0], [W, 0], [W, bannerH], [W - 20, bannerH]).fillOpacity(0.22).fill(C.royalBlue);

// Logo on Top-Left
const logoPath = path.join(__dirname, '..', 'client', 'public', 'img', 'bluelogo.png');
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, ML, 16, { height: 40 });
}

// Organization Titles
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.accentOrange)
   .text('INTERNATIONAL ENTREPRENEUR DIGITAL INDIA PVT. LTD.', ML + 75, 18, { width: CW - 75 });
doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8')
   .text('Skill Development | IT Development | E-Commerce | Smart Financial | E-Learning', ML + 75, 30, { width: CW - 75 });

// Big Document Title Banner
doc.fontSize(15).font('Helvetica-Bold').fillColor(C.white)
   .text('INTERNSHIP MANAGEMENT PORTAL (IED-IMS)', ML, 56, { width: CW });
doc.fontSize(8.5).font('Helvetica').fillColor('#cbd5e1')
   .text('Detailed Technical Abstract, System Architecture & Implementation Synopsis', ML, 76, { width: CW });

doc.restore();

doc.y = bannerH + 16;

// SECTION 1: TITLE OF PROJECT
drawSectionHeading(1, 'Title of Project');

// Metadata Card Grid
doc.save();
const metaY = doc.y;
const cardH = 82;
doc.roundedRect(ML, metaY, CW, cardH, 5).fill(C.bgTint);
doc.roundedRect(ML, metaY, CW, cardH, 5).lineWidth(0.8).stroke(C.borderLight);

const colW = (CW - 24) / 2;

// Left Column: Project Meta
doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.textMuted).text('PROJECT TITLE', ML + 12, metaY + 10);
doc.fontSize(10).font('Helvetica-Bold').fillColor(C.navyBlue).text('IED India Internship Management Portal', ML + 12, metaY + 21);

doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.textMuted).text('SYSTEM ACRONYM & CLASSIFICATION', ML + 12, metaY + 44);
doc.fontSize(8.8).font('Helvetica').fillColor(C.textPrimary).text('IED-IMS | Full-Stack Cloud ERP / HRM Web Platform', ML + 12, metaY + 55);

// Right Column: Student & Academic Meta
doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.textMuted).text('DEVELOPER & CANDIDATE DETAILS', ML + colW + 16, metaY + 10);
doc.fontSize(10).font('Helvetica-Bold').fillColor(C.navyBlue).text('Mayuresh Patil (Reg. No: 24C01019)', ML + colW + 16, metaY + 21);

doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.textMuted).text('INDUSTRY AFFILIATION & GUIDE', ML + colW + 16, metaY + 44);
doc.fontSize(8.8).font('Helvetica').fillColor(C.textPrimary).text('IED India Pvt. Ltd. | Guide: Dr. Jitha Janardhanan', ML + colW + 16, metaY + 55);

doc.restore();
doc.y = metaY + cardH + 14;

// SECTION 2: INTRODUCTION OF PROJECT
drawSectionHeading(2, 'Introduction of Project');

drawParagraph(
  'The IED India Internship Management Portal (IED-IMS) is a centralized, cloud-native enterprise web application engineered to automate and optimize the complete lifecycle of intern operations at International Entrepreneur Digital India Pvt. Ltd. Hosting candidates across software engineering, digital marketing, business analytics, and graphic design, the enterprise requires robust administrative oversight. Legacy operational workflows reliant on manual spreadsheets, fragmented email attachments, and paper timesheets proved prone to delays, human errors, and credential fraud.',
  { fontSize: 8.8, lineGap: 2.5 }
);

drawSubHeading('2.1 Core Problem Statement');
drawParagraph(
  'Conventional internship management in multi-departmental corporate setups encounters four acute operational hurdles:\n' +
  '1. Fragmented Onboarding & KYC: Manual collection of identity proofs (Aadhaar, resumes, college bonafide/NOC) leads to registration backlogs and unverified student profiles.\n' +
  '2. Inaccurate Attendance Tracking: Traditional punch-cards or manual registers lack geolocation and IP awareness, allowing attendance manipulation and false timesheets.\n' +
  '3. Opaque Task & Milestone Visibility: Supervisors lack unified dashboards to assign departmental tasks, track progress milestones, and monitor deadlines.\n' +
  '4. Unverifiable Physical Certification: Paper certificates without real-time cryptographic validation are susceptible to forgery and cannot be instantly authenticated by third-party recruiters.',
  { fontSize: 8.4, color: C.textSecondary, lineGap: 2.2 }
);

drawSubHeading('2.2 Project Scope & Objectives');
drawBulletPoint('Automated KYC & Onboarding', 'Digitized submission and admin verification of Aadhaar cards, resumes, and academic NOCs with MongoDB binary storage.');
drawBulletPoint('Geo/IP-Aware Timesheet Tracking', 'Real-time clock-in/out logging with dynamic calculation of attendance percentages, leaves, and daily work records.');
drawBulletPoint('Multi-Tier Role-Based Access Control', 'Segregated security boundaries for four roles: Interns, HR / Supervisors, Admins, and Super Admins.');
drawBulletPoint('Tamper-Proof Certificate Delivery', 'Dual delivery (JPG & PDF) reproducing the exact corporate template with Alex Brush calligraphy and QR verification.');

// ═══════════════════════════════════════════════════════════════
// PAGE 2: MODULE DESCRIPTION & REQUIREMENTS
// ═══════════════════════════════════════════════════════════════
doc.addPage();
doc.y = MT;

// SECTION 3: MODULE DESCRIPTION
drawSectionHeading(3, 'Module Description');

drawParagraph(
  'The IED-IMS architecture is decomposed into seven tightly coupled, modular subsystems that coordinate via a stateless RESTful API and responsive single-page application (SPA):',
  { fontSize: 8.6, lineGap: 2 }
);

const modules = [
  {
    name: '3.1 Authentication & Multi-Tier Role Management (RBAC)',
    desc: 'Stateless JWT session handling with bcryptjs encryption (10 salt rounds). Restricts endpoints across Intern, HR, Admin, and Super Admin roles with custom Express middleware.'
  },
  {
    name: '3.2 Intern Onboarding & KYC Document Verification Subsystem',
    desc: 'Handles multi-file uploads (Aadhaar Card, Resume, Student ID, College NOC) using Multer and database-backed Upload collections, enabling super admin inspection, approval, or rejection.'
  },
  {
    name: '3.3 Daily Attendance & Timesheet Engine',
    desc: 'Tracks daily intern check-ins and check-outs with IP address and geolocation logging. Dynamically aggregates monthly attendance percentages, leaves, and status tallies.'
  },
  {
    name: '3.4 Task Allocation & Milestone Delivery Module',
    desc: 'Empowers supervisors to assign tasks with priority tiers (Low, Medium, High) and deadlines. Interns submit deliverables with status transitions (Pending, In Progress, Submitted, Completed).'
  },
  {
    name: '3.5 Multi-Parameter Evaluation & Grading Module',
    desc: 'Standardized assessment rubric rating interns across technical skill, discipline, punctuality, communication, and project work, calculating final performance tiers (Excellent, Good, Average).'
  },
  {
    name: '3.6 Official Certificate Delivery & QR Verification Engine',
    desc: 'Generates pixel-perfect certificates matching the official IED India Pvt. Ltd. visual template with dynamic Alex Brush calligraphy, dual JPG/PDF download, and instant QR verification.'
  },
  {
    name: '3.7 Executive Dashboard & Operational Analytics Module',
    desc: 'Interactive Chart.js visual analytics rendering live metrics: active interns, task completion percentages, department distributions, and pending document verification queues.'
  }
];

modules.forEach(m => {
  drawBulletPoint(m.name, m.desc, 3.5);
});

doc.y += 4;

// SECTION 4: SOFTWARE AND HARDWARE REQUIREMENTS
drawSectionHeading(4, 'Software and Hardware Requirements');

drawSubHeading('4.1 Software Requirements Stack');

function drawReqTable(headers, rows, startY) {
  doc.save();
  let currentY = startY || doc.y;
  const rowH = 16;
  const colWidths = [115, 145, 245.28];

  // Header
  doc.rect(ML, currentY, CW, rowH).fill(C.navyDark);
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.white);
  doc.text(headers[0], ML + 6, currentY + 4.5, { width: colWidths[0] - 6, lineBreak: false });
  doc.text(headers[1], ML + colWidths[0] + 6, currentY + 4.5, { width: colWidths[1] - 6, lineBreak: false });
  doc.text(headers[2], ML + colWidths[0] + colWidths[1] + 6, currentY + 4.5, { width: colWidths[2] - 6, lineBreak: false });

  currentY += rowH;

  // Rows
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    doc.rect(ML, currentY, CW, rowH).fill(isEven ? C.white : C.bgTint);
    doc.rect(ML, currentY, CW, rowH).lineWidth(0.5).stroke(C.borderLight);

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.navyBlue)
       .text(r[0], ML + 6, currentY + 4.5, { width: colWidths[0] - 10, lineBreak: false });
    doc.font('Helvetica').fillColor(C.textPrimary)
       .text(r[1], ML + colWidths[0] + 6, currentY + 4.5, { width: colWidths[1] - 10, lineBreak: false });
    doc.font('Helvetica').fillColor(C.textSecondary)
       .text(r[2], ML + colWidths[0] + colWidths[1] + 6, currentY + 4.5, { width: colWidths[2] - 10, lineBreak: false });

    currentY += rowH;
  });

  doc.restore();
  doc.y = currentY + 6;
}

const swRows = [
  ['Frontend Framework', 'React 18.2 + Vite 5.1', 'Single-page client app with component routing & asset bundling'],
  ['Styling & UI Glyphs', 'Vanilla CSS + Lucide Icons', 'Curated warm cream/orange design tokens and lightweight SVGs'],
  ['Backend Runtime', 'Node.js (v20+ / v24.13)', 'Asynchronous event-driven JavaScript server environment'],
  ['Web API Framework', 'Express.js 4.19 + Helmet', 'RESTful routing, CORS handling, rate-limiting, and security headers'],
  ['Database & ODM', 'MongoDB Atlas 8.0 + Mongoose', 'Cloud document database with binary storage and model schemas'],
  ['Document Synthesis', 'PDFKit 0.15 + QRCode 1.5', 'In-memory vector PDF generation and dynamic QR image embedding'],
  ['Hosting & CI/CD', 'Vercel Serverless + Atlas', 'Automated edge Git deployment and cloud database cluster']
];
drawReqTable(['COMPONENT', 'SPECIFICATION', 'ROLE IN ARCHITECTURE'], swRows);

drawSubHeading('4.2 Hardware Requirements Stack');
const hwRows = [
  ['Client Machine', 'Dual-Core CPU, 2 GB RAM, 100 MB disk', 'Any device with a modern HTML5 browser (Chrome, Edge, Firefox)'],
  ['Development PC', 'Intel Core i5/i7 or AMD Ryzen 5, 8 GB RAM', 'Local compilation, Vite HMR, and MongoDB development server'],
  ['Cloud Server Host', '1 vCPU, 1 GB RAM, 10 GB SSD (Cloud)', 'Vercel serverless edge runtime + MongoDB Atlas cluster']
];
drawReqTable(['TIER', 'MINIMUM REQUIREMENTS', 'APPLICATION USAGE'], hwRows);

// ═══════════════════════════════════════════════════════════════
// PAGE 3: DFD DIAGRAMS (LEVEL 0 & LEVEL 1)
// ═══════════════════════════════════════════════════════════════
doc.addPage();
doc.y = MT;

// SECTION 5: DFD DIAGRAM
drawSectionHeading(5, 'Data Flow Diagram (DFD)');

drawParagraph(
  'The Data Flow Diagrams visually illustrate the logical movement, transformation, and storage of information across the IED India Internship Management Portal. Level 0 represents the system context, while Level 1 decomposes core sub-processes and data stores.',
  { fontSize: 8.6, lineGap: 2 }
);

drawSubHeading('5.1 Level 0 DFD — System Context Level Diagram');

// ─── LEVEL 0 VECTOR DIAGRAM ───
doc.save();
const dfd0Y = doc.y + 4;
const dfd0H = 175;

doc.roundedRect(ML, dfd0Y, CW, dfd0H, 5).fill(C.bgTint);
doc.roundedRect(ML, dfd0Y, CW, dfd0H, 5).lineWidth(0.8).stroke(C.borderLight);

// Central System Circle
const cX = ML + CW / 2;
const cY = dfd0Y + dfd0H / 2;
const rX = 72;
const rY = 38;

doc.ellipse(cX, cY, rX, rY).fill(C.white);
doc.ellipse(cX, cY, rX, rY).lineWidth(1.8).stroke(C.navyBlue);

doc.fontSize(8).font('Helvetica-Bold').fillColor(C.accentOrange)
   .text('0.0', cX - 50, cY - 22, { width: 100, align: 'center', lineBreak: false });
doc.fontSize(9).font('Helvetica-Bold').fillColor(C.navyDark)
   .text('IED INDIA IMS', cX - 50, cY - 9, { width: 100, align: 'center', lineBreak: false });
doc.fontSize(7).font('Helvetica').fillColor(C.textMuted)
   .text('CENTRAL SYSTEM', cX - 50, cY + 4, { width: 100, align: 'center', lineBreak: false });

function drawEntityBox(x, y, w, h, title, sub) {
  doc.rect(x, y, w, h).fill(C.navyDark);
  doc.rect(x, y, w, h).lineWidth(0.8).stroke(C.accentOrange);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white)
     .text(title, x, y + 5, { width: w, align: 'center', lineBreak: false });
  if (sub) {
    doc.fontSize(6.8).font('Helvetica').fillColor('#93c5fd')
       .text(sub, x, y + 16, { width: w, align: 'center', lineBreak: false });
  }
}

function drawVectorArrow(x1, y1, x2, y2, label, labelAbove = true) {
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(0.9).stroke(C.royalBlue);
  const headlen = 4.5;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  doc.moveTo(x2, y2).lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6)).stroke(C.royalBlue);
  doc.moveTo(x2, y2).lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6)).stroke(C.royalBlue);

  if (label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + (labelAbove ? -8 : 3);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor(C.navyBlue)
       .text(label, midX - 60, midY, { width: 120, align: 'center', lineBreak: false });
  }
}

// Entities
const entW = 90;
const entH = 30;
drawEntityBox(ML + 12, dfd0Y + 14, entW, entH, 'INTERN', 'Candidate / Student');
drawEntityBox(ML + 12, dfd0Y + dfd0H - 44, entW, entH, 'HR / SUPERVISOR', 'Department Lead');
drawEntityBox(ML + CW - 102, dfd0Y + 14, entW, entH, 'SUPER ADMIN', 'Executive Admin');
drawEntityBox(ML + CW - 102, dfd0Y + dfd0H - 44, entW, entH, 'VERIFIER', 'Public / Employer');

// Arrows
drawVectorArrow(ML + 102, dfd0Y + 22, cX - rX + 4, cY - 14, 'KYC Docs, Attendance, Tasks');
drawVectorArrow(cX - rX + 4, cY - 2, ML + 102, dfd0Y + 34, 'Assigned Work, Certificate', false);

drawVectorArrow(ML + 102, dfd0Y + dfd0H - 36, cX - rX + 4, cY + 14, 'Task Assign, Evaluations');
drawVectorArrow(cX - rX + 4, cY + 26, ML + 102, dfd0Y + dfd0H - 24, 'Submissions, Reports', false);

drawVectorArrow(ML + CW - 102, dfd0Y + 22, cX + rX - 4, cY - 14, 'System Config, Approvals');
drawVectorArrow(cX + rX - 4, cY - 2, ML + CW - 102, dfd0Y + 34, 'Audit Logs, Global KPIs', false);

drawVectorArrow(ML + CW - 102, dfd0Y + dfd0H - 36, cX + rX - 4, cY + 14, 'QR Scan / Cert No Query');
drawVectorArrow(cX + rX - 4, cY + 26, ML + CW - 102, dfd0Y + dfd0H - 24, 'Authenticity Status & Data', false);

doc.restore();

doc.y = dfd0Y + dfd0H + 12;

drawSubHeading('5.2 Level 1 DFD — Detailed Decomposition & Data Stores');

// ─── LEVEL 1 VECTOR DIAGRAM ───
doc.save();
const dfd1Y = doc.y + 4;
const dfd1H = 265;

doc.roundedRect(ML, dfd1Y, CW, dfd1H, 5).fill(C.bgTint);
doc.roundedRect(ML, dfd1Y, CW, dfd1H, 5).lineWidth(0.8).stroke(C.borderLight);

function drawProcessBubble(x, y, num, name) {
  const pr = 20;
  doc.circle(x, y, pr).fill(C.white);
  doc.circle(x, y, pr).lineWidth(1.2).stroke(C.royalBlue);
  doc.moveTo(x - pr, y - 5).lineTo(x + pr, y - 5).lineWidth(0.5).stroke(C.borderLight);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.accentOrange)
     .text(num, x - pr, y - 14, { width: pr * 2, align: 'center', lineBreak: false });
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor(C.navyDark)
     .text(name, x - pr + 2, y - 2, { width: pr * 2 - 4, align: 'center', lineGap: 1 });
}

function drawDataStore(x, y, w, h, id, name) {
  doc.rect(x, y, w, h).fill(C.white);
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(1.2).stroke(C.navyBlue);
  doc.moveTo(x, y + h).lineTo(x + w, y + h).lineWidth(1.2).stroke(C.navyBlue);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.accentOrange)
     .text(id, x + 4, y + 4, { width: 20, lineBreak: false });
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.navyDark)
     .text(name, x + 24, y + 4, { width: w - 28, lineBreak: false });
}

// Row 1: Top Sub-Processes
drawProcessBubble(ML + 50,  dfd1Y + 34, '1.0', 'User\nAuth');
drawProcessBubble(ML + 150, dfd1Y + 34, '2.0', 'KYC\nOnboarding');
drawProcessBubble(ML + 250, dfd1Y + 34, '3.0', 'Timesheet\nTracking');
drawProcessBubble(ML + 350, dfd1Y + 34, '4.0', 'Task\nManager');
drawProcessBubble(ML + 445, dfd1Y + 34, '5.0', 'Evaluation\n& Grading');

// Data Stores Section
const dsY1 = dfd1Y + 86;
drawDataStore(ML + 15,  dsY1, 135, 18, 'D1', 'Users & Roles DB');
drawDataStore(ML + 185, dsY1, 135, 18, 'D2', 'Uploads & Documents DB');
drawDataStore(ML + 355, dsY1, 135, 18, 'D3', 'Attendance Records DB');

const dsY2 = dfd1Y + 120;
drawDataStore(ML + 15,  dsY2, 135, 18, 'D4', 'Tasks & Submissions DB');
drawDataStore(ML + 185, dsY2, 135, 18, 'D5', 'Evaluations DB');
drawDataStore(ML + 355, dsY2, 135, 18, 'D6', 'Certificates Archive DB');

// Row 2: Bottom Sub-Processes
drawProcessBubble(ML + 115, dfd1Y + 188, '6.0', 'Certificate\nEngine');
drawProcessBubble(ML + 250, dfd1Y + 188, '7.0', 'QR\nVerification');
drawProcessBubble(ML + 385, dfd1Y + 188, '8.0', 'Executive\nAnalytics');

// Data Flow Annotations
doc.fontSize(6.8).font('Helvetica').fillColor(C.textSecondary);
doc.text('[1.0 Auth]  Credentials & JWT Tokens  ->  Stored in D1 (Users)', ML + 15, dfd1Y + 62, { lineBreak: false });
doc.text('[2.0 KYC]   Aadhaar, Resume, NOC binary  ->  Stored in D2 (Uploads)', ML + 15, dfd1Y + 72, { lineBreak: false });

doc.text('[3.0 Timesheet]  Daily Check-In & Geo/IP Logs  ->  Stored in D3 (Attendance)', ML + 15, dfd1Y + 146, { lineBreak: false });
doc.text('[4.0 Tasks]      Milestones & Deliverables  ->  Stored in D4 (Tasks)', ML + 15, dfd1Y + 156, { lineBreak: false });

doc.text('[5.0 Evaluation] + D1 (Intern Identity)  ->  Process 6.0 (Certificate Synthesis)', ML + 15, dfd1Y + 225, { lineBreak: false });
doc.text('[6.0 Certificate] Official Template + Alex Brush Font + QR  ->  D6 (Certificates)', ML + 15, dfd1Y + 236, { lineBreak: false });
doc.text('[7.0 QR Verify]   Live Query of Certificate No  <- ->  D6 (Instant Public Auth)', ML + 15, dfd1Y + 247, { lineBreak: false });

doc.restore();

// ═══════════════════════════════════════════════════════════════
// PAGE 4: VALIDATION CODE, CONCLUSION & FUTURE
// ═══════════════════════════════════════════════════════════════
doc.addPage();
doc.y = MT;

// SECTION 6: CLIENT SIDE VALIDATION CODE
drawSectionHeading(6, 'Client Side Validation Code');

drawParagraph(
  'Client-side validation is implemented across user inputs, file uploads, and dynamic certificate rendering to maximize interface responsiveness, sanitize payloads, and enforce data integrity before triggering backend requests:',
  { fontSize: 8.5, lineGap: 2 }
);

function drawCodeBox(title, codeLines, height) {
  doc.save();
  const boxY = doc.y;
  const boxH = height || 120;

  doc.roundedRect(ML, boxY, CW, boxH, 5).fill(C.codeBg);
  doc.roundedRect(ML, boxY, CW, boxH, 5).lineWidth(0.7).stroke(C.borderDark);

  // Title bar
  doc.rect(ML, boxY, CW, 16).fill('#1e293b');
  doc.circle(ML + 9, boxY + 8, 2.5).fill('#ef4444');
  doc.circle(ML + 16, boxY + 8, 2.5).fill('#eab308');
  doc.circle(ML + 23, boxY + 8, 2.5).fill('#22c55e');

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#94a3b8')
     .text(title, ML + 32, boxY + 4.5, { width: CW - 45, lineBreak: false });

  let textY = boxY + 21;
  doc.fontSize(6.8).font('Courier');

  codeLines.forEach((line) => {
    if (line.startsWith('//')) {
      doc.fillColor(C.codeComment).text(line, ML + 10, textY, { lineBreak: false });
    } else if (line.includes('const ') || line.includes('export ') || line.includes('return ') || line.includes('if ') || line.includes('throw ')) {
      doc.fillColor(C.codeKeyword).text(line, ML + 10, textY, { lineBreak: false });
    } else if (line.includes("'") || line.includes('"')) {
      doc.fillColor(C.codeString).text(line, ML + 10, textY, { lineBreak: false });
    } else {
      doc.fillColor(C.codeText).text(line, ML + 10, textY, { lineBreak: false });
    }
    textY += 9.5;
  });

  doc.restore();
  doc.y = boxY + boxH + 6;
}

const formValidationCode = [
  '// 1. Client-Side Input & Registration Validation (SignupPage.jsx)',
  'export const validateInternRegistration = ({ name, email, password, phone, department }) => {',
  '  const errors = {};',
  '  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;',
  '  const phoneRegex = /^[6-9]\\d{9}$/; // 10-digit Indian mobile format',
  '  if (!name || name.trim().length < 3) errors.name = "Full name must be at least 3 characters";',
  '  if (!email || !emailRegex.test(email.trim())) errors.email = "Please enter a valid email address";',
  '  if (!password || password.length < 6) errors.password = "Password must be at least 6 characters";',
  '  if (phone && !phoneRegex.test(phone.replace(/\\D/g, ""))) errors.phone = "Invalid 10-digit mobile number";',
  '  if (!department) errors.department = "Internship department must be selected";',
  '  return { isValid: Object.keys(errors).length === 0, errors };',
  '};'
];
drawCodeBox('client/src/utils/validation.js — User Registration & Form Validation', formValidationCode, 122);

const uploadValidationCode = [
  '// 2. Client-Side File Upload & KYC Document Pre-Inspection (Onboarding.jsx)',
  'export const validateKYCDocument = (file, allowedTypes = ["application/pdf", "image/jpeg", "image/png"]) => {',
  '  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB ceiling',
  '  if (!file) throw new Error("No document was selected for upload");',
  '  if (!allowedTypes.includes(file.type)) {',
  '    throw new Error("Invalid format. Only PDF, JPG, and PNG files are accepted for verification");',
  '  }',
  '  if (file.size > MAX_FILE_SIZE) {',
  '    throw new Error(`File exceeds limit (${(file.size / (1024*1024)).toFixed(1)}MB). Max 5MB allowed`);',
  '  }',
  '  return true; // Passed client validation',
  '};'
];
drawCodeBox('client/src/utils/fileValidation.js — KYC Document Pre-Upload Checks', uploadValidationCode, 122);

// SECTION 7: CONCLUSION
drawSectionHeading(7, 'Conclusion');

drawParagraph(
  'The IED India Internship Management Portal (IED-IMS) modernizes and digitizes internship operations at International Entrepreneur Digital India Pvt. Ltd. By centralizing registration, automating KYC document verification, enforcing IP/geo-aware attendance tracking, and synthesizing tamper-proof certificates with embedded cryptographic verification, the platform eliminates paperwork, mitigates credential forgery, and accelerates corporate productivity. The software delivers an enterprise-ready, scalable foundation for high-volume corporate internship programs.',
  { fontSize: 8.4, lineGap: 2 }
);

// SECTION 8: FUTURE
drawSectionHeading(8, 'Future (Future Scope & Enhancements)');

const futureItems = [
  {
    title: 'AI-Powered Resume Parsing & Matching',
    desc: 'Integrating NLP/LLM parsers to extract skills and match interns to project roles automatically.'
  },
  {
    title: 'Facial Biometric Attendance Verification',
    desc: 'Deploying browser camera-based facial recognition for touchless, fraud-proof daily attendance.'
  },
  {
    title: 'Blockchain Credential Anchoring',
    desc: 'Anchoring certificate verification hashes to public blockchain ledgers (Polygon / Ethereum) for trustless verification.'
  },
  {
    title: 'Native Mobile App (React Native)',
    desc: 'Publishing dedicated cross-platform mobile apps for intern task tracking and evaluation updates on iOS & Android.'
  },
  {
    title: 'Automated WhatsApp & SMS Gateway',
    desc: 'Sending automated alerts for task milestones, evaluation reports, and document status updates.'
  }
];

futureItems.forEach(f => {
  drawBulletPoint(f.title, f.desc, 3);
});

// Final Signoff Box
doc.y += 4;
doc.save();
const signY = doc.y;
doc.roundedRect(ML, signY, CW, 30, 4).fill(C.bgTint);
doc.roundedRect(ML, signY, CW, 30, 4).lineWidth(0.5).stroke(C.borderLight);
doc.fontSize(7.5).font('Helvetica-Bold').fillColor(C.navyDark)
   .text('PROJECT ABSTRACT APPROVED & CERTIFIED FOR ACADEMIC EVALUATION', ML + 10, signY + 6, { lineBreak: false });
doc.fontSize(7).font('Helvetica').fillColor(C.textMuted)
   .text('Candidate: Mayuresh Patil (Reg. No: 24C01019)  |  Industry Partner: IED India Pvt. Ltd.  |  Academic Year: 2025–2026', ML + 10, signY + 17, { lineBreak: false });
doc.restore();

// ═══════════════════════════════════════════════════════════════
// APPLY RUNNING HEADER & FOOTER TO ALL PAGES
// ═══════════════════════════════════════════════════════════════
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  drawHeaderFooter(i + 1, range.count);
}

doc.end();

streamLocal.on('finish', () => {
  console.log(`✅ Generated Abstract PDF successfully (${range.count} pages) at:`, OUTPUT_LOCAL);
  try {
    fs.copyFileSync(OUTPUT_LOCAL, OUTPUT_DOWNLOADS);
    console.log('✅ Copied to Downloads folder:', OUTPUT_DOWNLOADS);
  } catch (err) {
    console.warn('Could not copy to Downloads:', err.message);
  }
  process.exit(0);
});
