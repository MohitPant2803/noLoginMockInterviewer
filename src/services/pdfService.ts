import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PerformanceReport } from '@/types';

export function generateReportPdf(report: PerformanceReport): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addPageIfNeeded = (neededSpace: number) => {
    if (y + neededSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = margin;
    }
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // ── Title ──
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Mock Interview Report', margin, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Position: ${report.jobRole}`, margin, 28);
  doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}  |  Duration: ${report.durationMinutes} min  |  Score: ${report.overallScore}/100`, margin, 35);
  y = 55;

  // ── Summary ──
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const summaryLines = wrapText(report.summary, contentWidth, 10);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 4;
  doc.text(`Main Questions: ${report.mainQuestionsCount}  |  Follow-ups: ${report.followUpQuestionsCount}`, margin, y);
  y += 10;

  // ── Category Scores ──
  addPageIfNeeded(30);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Skill Breakdown', margin, y);
  y += 3;

  if (report.categoryScores.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Score', 'Assessment']],
      body: report.categoryScores.map((cs) => [
        cs.category,
        `${cs.score}/100`,
        cs.feedback,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      columnStyles: { 2: { cellWidth: contentWidth * 0.55 } },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Strengths & Improvements ──
  addPageIfNeeded(40);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Key Strengths', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  for (const s of report.strengths) {
    addPageIfNeeded(8);
    const lines = wrapText(`• ${s}`, contentWidth, 9);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 1;
  }
  y += 5;

  addPageIfNeeded(20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Areas for Improvement', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  for (const a of report.areasForImprovement) {
    addPageIfNeeded(8);
    const lines = wrapText(`• ${a}`, contentWidth, 9);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 1;
  }
  y += 5;

  // ── Recommendations ──
  if (report.recommendations.length > 0) {
    addPageIfNeeded(20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Recommendations', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    for (const r of report.recommendations) {
      addPageIfNeeded(8);
      const lines = wrapText(`→ ${r}`, contentWidth, 9);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 1;
    }
    y += 5;
  }

  // ── Question-by-Question Breakdown ──
  for (let i = 0; i < report.questionBreakdowns.length; i++) {
    const qb = report.questionBreakdowns[i];

    addPageIfNeeded(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const qLabel = qb.isFollowUp ? `Follow-up Question` : `Question ${i + 1}`;
    doc.text(`${qLabel}  (${qb.category}, Score: ${qb.score}/100)`, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(79, 70, 229);
    const qLines = wrapText(qb.questionText, contentWidth, 9);
    doc.text(qLines, margin, y);
    y += qLines.length * 4.5 + 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8.5);

    if (qb.candidateAnswer) {
      const truncatedAnswer = qb.candidateAnswer.length > 400
        ? qb.candidateAnswer.slice(0, 400) + '...'
        : qb.candidateAnswer;
      const aLines = wrapText(`Your Answer: ${truncatedAnswer}`, contentWidth, 8.5);
      addPageIfNeeded(aLines.length * 4);
      doc.text(aLines, margin, y);
      y += aLines.length * 4 + 3;
    }

    const fbLines = wrapText(`Feedback: ${qb.feedback}`, contentWidth, 8.5);
    addPageIfNeeded(fbLines.length * 4);
    doc.text(fbLines, margin, y);
    y += fbLines.length * 4 + 2;

    if (qb.suggestedAnswer) {
      const truncatedSuggested = qb.suggestedAnswer.length > 400
        ? qb.suggestedAnswer.slice(0, 400) + '...'
        : qb.suggestedAnswer;
      const saLines = wrapText(`Model Answer: ${truncatedSuggested}`, contentWidth, 8.5);
      addPageIfNeeded(saLines.length * 4);
      doc.setTextColor(16, 120, 80);
      doc.text(saLines, margin, y);
      doc.setTextColor(60, 60, 60);
      y += saLines.length * 4 + 2;
    }

    y += 6;
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `AI Mock Interviewer — Page ${p}/${pageCount} — Generated in-browser, not stored remotely`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`interview-report-${report.jobRole.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
}
