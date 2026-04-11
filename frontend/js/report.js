/**
 * report.js — Report display and PDF export
 */

// Auth check
if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

const SESSION_ID = localStorage.getItem('sessionId');

// Load report on page load
document.addEventListener('DOMContentLoaded', loadReport);

/**
 * Fetch and display the interview report
 */
async function loadReport() {
    if (!SESSION_ID) {
        document.getElementById('reportLoading').innerHTML =
            '<p style="color: var(--accent-pink);">No session found. Please complete an interview first.</p>';
        return;
    }

    try {
        const report = await apiGet(`/api/report/${SESSION_ID}`);
        displayReport(report);
    } catch (err) {
        document.getElementById('reportLoading').innerHTML =
            `<p style="color: var(--accent-pink);">Error loading report: ${err.message}</p>`;
    }
}

/**
 * Display report data on the page
 */
function displayReport(report) {
    // Hide loading, show report
    document.getElementById('reportLoading').classList.add('hidden');
    document.getElementById('reportData').classList.remove('hidden');

    // Role name
    const roleNames = {
        'JAVA_DEVELOPER': '☕ Java Developer Interview',
        'FRONTEND_DEVELOPER': '🎨 Frontend Developer Interview',
        'BACKEND_DEVELOPER': '⚙️ Backend Developer Interview',
        'MERN_STACK_DEVELOPER': '🚀 MERN Stack Interview',
        'HR': '💼 HR / Behavioral Interview'
    };
    document.getElementById('reportRole').textContent = roleNames[report.roleCategory] || report.roleCategory;

    // Overall score
    const overallEl = document.getElementById('overallScore');
    overallEl.textContent = report.overallScore;

    // Animate score cards
    animateScore('techScore', 'techBar', report.technicalScore);
    animateScore('commScore', 'commBar', report.communicationScore);
    animateScore('confScore', 'confBar', report.confidenceScore);
    animateScore('intScore', 'intBar', report.integrityScore);

    // Summary stats
    document.getElementById('totalQs').textContent = report.totalQuestions;
    document.getElementById('correctAns').textContent = report.correctAnswers;
    document.getElementById('duration').textContent = report.durationMinutes + ' min';

    // Strengths
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = '';
    (report.strengths || []).forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="color: var(--accent-cyan);">✅</span> ${s}`;
        strengthsList.appendChild(li);
    });

    // Weaknesses
    const weaknessesList = document.getElementById('weaknessesList');
    weaknessesList.innerHTML = '';
    (report.weaknesses || []).forEach(w => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="color: var(--accent-pink);">📌</span> ${w}`;
        weaknessesList.appendChild(li);
    });

    // Proctoring summary
    const proctorGrid = document.getElementById('proctorGrid');
    proctorGrid.innerHTML = '';

    const proctorData = report.proctoringSummary || {};
    const proctorItems = [
        { label: 'Total Warnings', value: proctorData.totalWarnings || 0, icon: '⚠️' },
        { label: 'Tab Switches', value: proctorData.tabSwitches || 0, icon: '🔄' },
        { label: 'No Face', value: proctorData.noFaceCount || 0, icon: '👤' },
        { label: 'Multiple Faces', value: proctorData.multipleFaces || 0, icon: '👥' },
        { label: 'Looking Away', value: proctorData.lookingAway || 0, icon: '👀' }
    ];

    proctorItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'proctor-stat';
        div.innerHTML = `
            <div>${item.icon}</div>
            <div class="stat-value" style="color: ${item.value > 0 ? 'var(--accent-pink)' : 'var(--accent-cyan)'}">
                ${item.value}
            </div>
            <div class="stat-label">${item.label}</div>
        `;
        proctorGrid.appendChild(div);
    });
}

/**
 * Animate a score value and bar
 */
function animateScore(valueId, barId, targetValue) {
    const valueEl = document.getElementById(valueId);
    const barEl = document.getElementById(barId);

    let current = 0;
    const duration = 1500; // ms
    const interval = 20;
    const step = targetValue / (duration / interval);

    const timer = setInterval(() => {
        current += step;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
        }
        valueEl.textContent = Math.round(current);
        barEl.style.width = Math.round(current) + '%';
    }, interval);
}

/**
 * Export report as PDF using jsPDF
 */
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const SESSION = localStorage.getItem('sessionId');
    const roleNames = {
        'JAVA_DEVELOPER': 'Java Developer',
        'FRONTEND_DEVELOPER': 'Frontend Developer',
        'BACKEND_DEVELOPER': 'Backend Developer',
        'MERN_STACK_DEVELOPER': 'MERN Stack Developer',
        'HR': 'HR / Behavioral'
    };
    const role = localStorage.getItem('currentRole') || '';
    const fullName = localStorage.getItem('fullName') || 'Candidate';

    // Header
    doc.setFillColor(10, 10, 26);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Interview Simulator', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Interview Performance Report', 105, 28, { align: 'center' });

    // Candidate info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    let y = 50;
    doc.text(`Candidate: ${fullName}`, 14, y);
    doc.text(`Role: ${roleNames[role] || role}`, 14, y + 7);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, y + 14);

    // Scores section
    y = 80;
    doc.setFillColor(240, 240, 255);
    doc.rect(14, y - 5, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Performance Scores', 14, y + 2);

    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const overall = document.getElementById('overallScore')?.textContent || '0';
    const tech = document.getElementById('techScore')?.textContent || '0';
    const comm = document.getElementById('commScore')?.textContent || '0';
    const conf = document.getElementById('confScore')?.textContent || '0';
    const integ = document.getElementById('intScore')?.textContent || '0';

    doc.text(`Overall Score:        ${overall}/100`, 14, y); y += 8;
    doc.text(`Technical Score:      ${tech}/100`, 14, y); y += 8;
    doc.text(`Communication Score:  ${comm}/100`, 14, y); y += 8;
    doc.text(`Confidence Score:     ${conf}/100`, 14, y); y += 8;
    doc.text(`Integrity Score:      ${integ}/100`, 14, y); y += 8;

    // Stats
    y += 5;
    const totalQ = document.getElementById('totalQs')?.textContent || '0';
    const correct = document.getElementById('correctAns')?.textContent || '0';
    const dur = document.getElementById('duration')?.textContent || '0';
    doc.text(`Total Questions: ${totalQ}    Correct: ${correct}    Duration: ${dur}`, 14, y);

    // Strengths
    y += 15;
    doc.setFillColor(240, 255, 240);
    doc.rect(14, y - 5, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Strengths', 14, y + 2);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const strengths = document.getElementById('strengthsList')?.children || [];
    for (let i = 0; i < strengths.length; i++) {
        doc.text('✓ ' + strengths[i].textContent.trim(), 18, y);
        y += 7;
    }

    // Weaknesses
    y += 5;
    doc.setFillColor(255, 240, 240);
    doc.rect(14, y - 5, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Areas to Improve', 14, y + 2);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const weaknesses = document.getElementById('weaknessesList')?.children || [];
    for (let i = 0; i < weaknesses.length; i++) {
        doc.text('• ' + weaknesses[i].textContent.trim(), 18, y);
        y += 7;
    }

    // Proctoring
    y += 10;
    doc.setFillColor(255, 255, 240);
    doc.rect(14, y - 5, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Proctoring Summary', 14, y + 2);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const stats = document.querySelectorAll('.proctor-stat');
    stats.forEach(stat => {
        const val = stat.querySelector('.stat-value')?.textContent || '0';
        const label = stat.querySelector('.stat-label')?.textContent || '';
        doc.text(`${label}: ${val}`, 18, y);
        y += 7;
    });

    // Footer
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by AI Interview Simulator — ' + new Date().toLocaleString(), 105, y, { align: 'center' });

    // Save
    doc.save(`interview_report_${fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    showToast('📄 PDF report downloaded!', 'success');
}
