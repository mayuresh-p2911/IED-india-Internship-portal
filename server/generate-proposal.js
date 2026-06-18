/**
 * IED India Internship Portal — Proposal PDF
 * 3 pages total: 1 Cover + 2 Content pages
 * 
 * FINAL FIX: Content is guaranteed to fit by reducing font size to 8.5
 * and keeping bottomMargin at 0. This absolutely prevents a 4th page.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'IED_India_Internship_Portal_Proposal.pdf');

const C = {
  navy: '#0a1628', darkBlue: '#1a237e', blue: '#1565c0',
  lightBlue: '#4f8ef7', accent: '#ffd700', white: '#ffffff',
  text: '#1e293b', textLight: '#475569', border: '#cbd5e1',
};

const W = 595.28, H = 841.89, ML = 60, MR = 60, CW = W - ML - MR;

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 0, left: ML, right: MR },
  autoFirstPage: false,
  info: { Title: 'Project Proposal - IED India Internship Management Portal', Author: 'Mayuresh P' },
});
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

// ═══════════════════════════════════════════════════════════
//  PAGE 1 — COVER (Redesigned & Catchy)
// ═══════════════════════════════════════════════════════════
doc.addPage();

// 1. Rich Gradient Background
let bgGrad = doc.linearGradient(0, 0, W, H);
bgGrad.stop(0, '#0f172a'); // Very dark blue/slate
bgGrad.stop(1, '#1e3a8a'); // Deep royal blue
doc.rect(0, 0, W, H).fill(bgGrad);

// 2. Modern Geometric Shapes (Top Right)
doc.save();
let poly1 = doc.linearGradient(W - 300, 0, W, 400);
poly1.stop(0, '#3b82f6').stop(1, '#1d4ed8');
doc.polygon([W, 0], [W - 250, 0], [W, 450]).fillOpacity(0.4).fill(poly1);

let poly2 = doc.linearGradient(W - 150, 0, W, 250);
poly2.stop(0, '#60a5fa').stop(1, '#2563eb');
doc.polygon([W, 0], [W - 150, 0], [W, 300]).fillOpacity(0.5).fill(poly2);

// 3. Modern Geometric Shapes (Bottom Left)
let poly3 = doc.linearGradient(0, H - 400, 400, H);
poly3.stop(0, '#fbbf24').stop(1, '#d97706');
doc.polygon([0, H], [350, H], [0, H - 300]).fillOpacity(0.15).fill(poly3);
doc.restore();

// 4. "Tech/Network" Floating Dots Matrix
doc.save();
for (let x = W - 150; x < W; x += 25) {
  for (let y = H - 200; y < H - 50; y += 25) {
    if (Math.random() > 0.4) {
      doc.circle(x, y, 1.2).fillOpacity(0.3).fill(C.white);
    }
  }
}
doc.restore();

// 5. Striking Typography & Titles
const startY = 160;

// Gold accent line
doc.moveTo(ML, startY).lineTo(ML + 80, startY).lineWidth(4).stroke(C.accent);

// Label
doc.fontSize(11).fillColor(C.accent).font('Helvetica-Bold')
   .text('PROJECT PROPOSAL', ML, startY + 20, { characterSpacing: 6 });

// Main Massive Title
doc.fontSize(42).fillColor(C.white).font('Helvetica-Bold')
   .text('INTERNSHIP', ML, startY + 60);
doc.fontSize(42).fillColor(C.white)
   .text('MANAGEMENT', ML, startY + 105);
doc.fontSize(42).fillColor(C.accent)
   .text('PORTAL', ML, startY + 150);

// Sleek Subtitle
doc.fontSize(15).fillColor('#93c5fd').font('Helvetica')
   .text('A Full-Stack Web Application for Digitizing', ML, startY + 230, { width: CW, lineGap: 3 });
doc.fontSize(15).fillColor('#93c5fd')
   .text('Internship Operations at IED India Pvt Ltd', ML, startY + 255, { width: CW, lineGap: 3 });

// 6. Company Logo Placement (Bottom Right or Bottom Left)
// Using bottom left to align with the text flow, above the gold bottom bar
const logoPath = path.join(__dirname, '..', 'client', 'img', 'logo.png');
if (fs.existsSync(logoPath)) {
  // Adding a subtle dark backdrop pill just in case the logo needs contrast
  doc.roundedRect(ML - 10, H - 150, 240, 80, 10).fillOpacity(0.2).fill('#000000');
  doc.image(logoPath, ML, H - 130, { width: 200 });
}

// 7. Accents
doc.rect(0, 0, W, 8).fill(C.accent);
doc.rect(0, H - 8, W, 8).fill(C.accent);


// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function pageTitle(text) {
  doc.moveTo(ML, 50).lineTo(ML + CW, 50).lineWidth(1).stroke(C.darkBlue);
  doc.fontSize(14).fillColor(C.darkBlue).font('Helvetica-Bold')
     .text(text, ML, 54, { width: CW });
  var uy = doc.y + 2;
  doc.moveTo(ML, uy).lineTo(ML + 65, uy).lineWidth(3).stroke(C.accent);
  doc.y = uy + 8;
}

function S(t) {
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor(C.blue).font('Helvetica-Bold').text(t, { width: CW });
  doc.moveDown(0.1);
}

function P(t) {
  // REDUCED TO 8.5
  doc.fontSize(8.5).fillColor(C.text).font('Helvetica').text(t, { width: CW, align: 'justify', lineGap: 1.2 });
  doc.moveDown(0.1);
}

function B(t) {
  // REDUCED TO 8.5
  doc.fontSize(8.5).fillColor(C.text).font('Helvetica').text('  \u2022  ' + t, { width: CW, lineGap: 1.0 });
  doc.moveDown(0.05);
}


// ═══════════════════════════════════════════════════════════
//  PAGE 2 — CONTENT (sections 1-3)
// ═══════════════════════════════════════════════════════════
doc.addPage();
pageTitle('Project Proposal \u2014 Internship Management Portal');

// 1. Name of the Company
S('1. Name of the Company');
P('IED India Pvt Ltd is a multifaceted organization headquartered in India, dedicated to empowering future leaders through structured internship and training programmes. The company operates across six core departments \u2014 Digital Marketing, HR & Recruitment, Business Development, Social Media, Entrepreneurship Training, and IT Support \u2014 and hosts a substantial number of interns throughout the year. Each department runs its own internship track, requiring coordinated management of applications, interviews, attendance, task assignments, performance evaluations, and certificate issuance across the organization.');

// 2. Objectives of the Internship Study
S('2. Objectives of the Internship Study');
P('The primary objectives of developing the Internship Management Portal are:');
B('To conduct a thorough analysis of the existing manual internship management processes at IED India Pvt Ltd and identify key operational inefficiencies, bottlenecks, and data inconsistencies.');
B('To design and develop a centralized, full-stack web application that automates the complete internship lifecycle \u2014 from the initial application submission through interview scheduling, candidate selection, onboarding, daily attendance tracking, task management, weekly performance evaluations, and final certificate generation.');
B('To implement a robust Role-Based Access Control (RBAC) system supporting four distinct user roles: Admin, HR, Mentor, and Intern, each with a tailored dashboard, navigation, and permission set ensuring both data security and operational efficiency.');
B('To integrate automated email notification capabilities for all critical events including application confirmations, interview scheduling with calendar details and meeting links, status updates, and welcome messages upon selection.');
B('To build a digital certificate generation system capable of producing professionally designed PDF certificates with embedded QR codes for instant online verification, eliminating the need for manual document preparation.');
B('To deploy the application on Vercel\u2019s serverless infrastructure with MongoDB Atlas as the cloud database, ensuring high availability, automatic scaling, zero-maintenance hosting, and continuous deployment from the GitHub repository.');

// 3. Scope of the Study
S('3. Scope of the Study');
P('The scope of this study encompasses the complete design, development, testing, and deployment of a production-grade web application comprising 11 functional modules:');
B('Application Management \u2014 A public-facing internship application form with document uploads (resume, photo), followed by an admin dashboard for filtering, reviewing, shortlisting, and processing applications through a six-stage status workflow (Applied, Shortlisted, Interview Scheduled, Selected, Rejected, On Hold).');
B('Interview Scheduling \u2014 Multi-mode interview management (Zoom, Google Meet, Offline, Phone) with automated email notifications containing meeting links, date/time details, and post-interview feedback with scoring.');
B('Onboarding \u2014 A structured checklist tracking offer letter dispatch, orientation scheduling, document verification (Aadhaar, college ID, resume, photo), agreement upload, and welcome email delivery.');
B('Attendance Tracking \u2014 Daily check-in/check-out with optional GPS geo-location capture, supporting Office, Work From Home, and Leave attendance types with monthly calendar views and statistics.');
B('Task Management \u2014 Assignment, tracking, and review of tasks with deadlines, priority levels, file attachments, submission workflows, mentor feedback, and completion scoring.');
B('Communication \u2014 Direct messaging between users with file attachments and read receipts, plus organization-wide announcements with role targeting and pin functionality.');
B('Performance Evaluation \u2014 Structured weekly evaluations rating interns across six dimensions (Communication, Teamwork, Leadership, Discipline, Technical Skills, Task Completion) with auto-calculated scores and recommendations.');
B('Leave Management, Certificate Generation, and Analytics Dashboard \u2014 Leave request workflows, PDF certificate generation with QR verification, and real-time analytics with Chart.js visualizations.');
P('The system serves all internal stakeholders \u2014 administrators, HR personnel, mentors, and interns \u2014 through a single, unified, responsive web interface accessible on both desktop and mobile devices.');

// ═══════════════════════════════════════════════════════════
//  PAGE 3 — CONTENT (sections 4-7)
// ═══════════════════════════════════════════════════════════
doc.addPage();
pageTitle('Project Proposal \u2014 Internship Management Portal');

// 4. Methodology
S('4. Methodology');
P('The project follows the Agile Software Development methodology, employing iterative development cycles with continuous testing and refinement. The system architecture adheres to the three-tier pattern with a clear separation between the Presentation Layer (client), the Application Layer (server), and the Data Layer (database).');
P('The backend is built using Node.js as the runtime environment and Express.js (v4.19) as the web framework, exposing a comprehensive RESTful API with over 50 endpoints across 13 route groups. MongoDB (v7.x) serves as the NoSQL database, accessed through the Mongoose ODM (v8.4) which provides schema-based modelling with built-in validation, indexing, and population (joins). Security is enforced through multiple layers: JSON Web Token (JWT) based stateless authentication with configurable expiry, bcryptjs password hashing with 12 salt rounds, Helmet.js for HTTP security headers (CSP, HSTS, X-Frame-Options), and role-based authorization middleware.');
P('The frontend is implemented as a Single Page Application (SPA) using vanilla HTML5, CSS3, and JavaScript (ES2020+), avoiding heavy framework dependencies. The UI features a modern dark-mode glassmorphic design with a custom CSS component library (25,500+ bytes) providing reusable status badges, modal dialogs, toast notifications, and responsive data tables. Lucide Icons provides the icon set, and Chart.js (v4.4) powers the interactive analytics visualizations. PDFKit (v0.15) handles server-side certificate PDF generation with in-memory buffers, while the QRCode library generates embedded verification QR codes.');

// 5. Data Collection
S('5. Data Collection');
P('The data collection methodology combines both primary and secondary research approaches:');
B('Primary Data: Requirements were gathered through direct discussions and interviews with IED India\u2019s management team, HR department, and mentors to understand the current manual workflows. Observation of the existing processes \u2014 which relied on spreadsheets, email threads, WhatsApp groups, and physical records \u2014 revealed critical pain points including data fragmentation, delayed status communication, inconsistent attendance records, and time-consuming certificate preparation.');
B('Secondary Data: Technical best practices and design patterns were sourced from the official documentation of Node.js, Express.js, MongoDB, Mongoose, Vercel, and JWT. Industry research on internship management systems, HR technology platforms, and SaaS application design informed the feature set and user experience decisions. Security standards from OWASP guidelines were referenced for implementing authentication, authorization, and input validation.');

// 6. Plan of Analysis
S('6. Plan of Analysis');
P('The analysis evaluates the effectiveness of the developed system across three critical dimensions:');
B('Operational Efficiency: Measuring the quantitative reduction in administrative time and effort for key processes \u2014 application processing (from manual email sorting to automated filtering and status workflows), interview scheduling (from back-and-forth emails to one-click scheduling with auto-notifications), attendance tracking (from manual spreadsheet entry to digital check-in/check-out with geo-verification), and certificate generation (from manual Word document creation to instant PDF generation).');
B('Data Integrity & Reliability: Verifying the consistency and accuracy of data across all 12 MongoDB collections through referential integrity checks (ObjectId references between Users, Applications, Tasks, Evaluations), compound unique indexing (Attendance: internId + date), schema-level validation (enum constraints, required fields, min/max values), and the custom toJSON transformation that excludes sensitive fields like passwords from API responses.');
B('User Experience & Accessibility: Assessing the usability and responsiveness of the interface through multi-role dashboard testing (Admin, HR, Mentor, Intern), cross-browser compatibility verification (Chrome, Firefox, Edge, Safari), responsive design validation across desktop (1920px), tablet (768px), and mobile (375px) viewports, and real-time notification delivery testing across 50+ API endpoints.');

// 7. Chapter Scheme
S('7. Chapter Scheme');
P('The project report is organized into the following seven chapters:');

var chapters = [
  ['Chapter 1: Introduction', 'Provides the background context, problem statement, project objectives, and an overview of the scope and significance of the study.'],
  ['Chapter 2: Industry & Company Profile', 'Presents a detailed profile of IED India Pvt Ltd, its organizational structure, departmental operations, internship programme history, and the specific challenges that motivated this project.'],
  ['Chapter 3: Literature Review', 'Reviews existing internship management systems, HR technology platforms, and relevant academic literature on web application development, SPA architecture, and NoSQL database design.'],
  ['Chapter 4: System Design', 'Documents the system architecture, technology stack selection rationale, database schema design (12 collections), API endpoint structure (50+ endpoints), and user interface wireframes.'],
  ['Chapter 5: Implementation', 'Details the development process including the MVC code structure, authentication flow, role-based access control logic, email service integration, certificate generation pipeline, and serverless deployment configuration.'],
  ['Chapter 6: Testing & Results', 'Presents the functional testing results, integration testing outcomes, cross-browser compatibility findings, and performance benchmarks demonstrating the system\u2019s effectiveness.'],
  ['Chapter 7: Conclusion & Future Scope', 'Summarizes the project achievements, lessons learned, and outlines planned enhancements including WebSocket notifications, mobile applications, AI-powered task grading, and custom domain email integration.'],
];

for (var j = 0; j < chapters.length; j++) {
  doc.fontSize(8.5).fillColor(C.darkBlue).font('Helvetica-Bold')
     .text('      ' + chapters[j][0], { width: CW, lineBreak: false });
  doc.fontSize(8.5).fillColor(C.text).font('Helvetica')
     .text('      ' + chapters[j][1], { width: CW, lineGap: 1.0 });
  doc.moveDown(0.05);
}

// ═══════════════════════════════════════════════════════════
doc.end();

stream.on('finish', function() {
  var stats = fs.statSync(OUTPUT);
  var buf = fs.readFileSync(OUTPUT, 'latin1');
  var pages = (buf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log('[OK] Proposal: ' + OUTPUT);
  console.log('     ' + (stats.size / 1024).toFixed(1) + ' KB, ' + pages + ' pages');
  if (pages === 3) console.log('     PERFECT - 1 cover + 2 content pages!');
  else console.log('     WARNING: expected 3 pages, got ' + pages);
});
