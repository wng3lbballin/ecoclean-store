const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, PageBreak,
  ShadingType,
} = require('docx');

const MONO = 'Consolas';
const BODY = 'Calibri';
const TITLE_FONT = 'Calibri Light';
const GREEN = '059669';
const DARK = '1E293B';
const GRAY = '64748B';
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F8FAFC';
const LIGHT_GREEN = 'D1FAE5';
const PURPLE = '7C3AED';
const DARK_BG = '1E293B';
const CODE_TEXT = 'E2E8F0';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const noBorder = { style: BorderStyle.NONE, size: 0 };

const pageMargin = { top: 1440, right: 1200, bottom: 1440, left: 1200 };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, font: TITLE_FONT, size: 36, bold: true, color: GREEN })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: TITLE_FONT, size: 28, bold: true, color: DARK })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: BODY, size: 24, bold: true, color: DARK })],
  });
}
function p(text, opts = {}) {
  if (!text) text = '';
  return new Paragraph({
    spacing: { before: opts.spaceBefore || 80, after: opts.spaceAfter || 80 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: BODY, size: 22, color: DARK })],
  });
}
function boldP(label, text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: label, font: BODY, size: 22, bold: true, color: DARK }),
      new TextRun({ text, font: BODY, size: 22, color: DARK }),
    ],
  });
}
function code(lines) {
  const result = [];
  result.push(new Paragraph({
    spacing: { before: 120, after: 0 },
    children: [],
    shading: { type: ShadingType.SOLID, color: DARK_BG, fill: DARK_BG },
    border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
  }));
  for (const line of lines) {
    result.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      indent: { left: 160 },
      children: [new TextRun({ text: line || ' ', font: MONO, size: 18, color: CODE_TEXT })],
      shading: { type: ShadingType.SOLID, color: DARK_BG, fill: DARK_BG },
    }));
  }
  result.push(new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [],
    shading: { type: ShadingType.SOLID, color: DARK_BG, fill: DARK_BG },
    border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
  }));
  return result;
}
function tip(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 160 },
    border: { top: thinBorder, bottom: thinBorder, left: { style: BorderStyle.SINGLE, size: 8, color: GREEN }, right: thinBorder },
    shading: { type: ShadingType.SOLID, color: LIGHT_GREEN, fill: LIGHT_GREEN },
    children: [new TextRun({ text, font: BODY, size: 22, color: DARK })],
  });
}
function table(headers, rows, headerColor = GREEN) {
  const hCells = headers.map(h => new TableCell({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: h, font: BODY, size: 20, bold: true, color: WHITE })] })],
    shading: { type: ShadingType.SOLID, color: headerColor, fill: headerColor },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
  }));
  const bRows = rows.map(r => {
    const cells = r.map((c, i) => new TableCell({
      children: [new Paragraph({ alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: String(c), font: BODY, size: 20, color: DARK })] })],
      borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      shading: i === 0 ? { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY } : undefined,
    }));
    return new TableRow({ children: cells });
  });
  return new Table({ rows: [new TableRow({ children: hCells }), ...bRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}
function hr() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' } }, children: [] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 480 + level * 360 },
    bullet: { level },
    children: [new TextRun({ text, font: BODY, size: 22, color: DARK })],
  });
}
function emptyLine() {
  return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
}

function readMd() {
  const mdPath = path.join(__dirname, '..', '..', '..', 'CURSO.md');
  return fs.readFileSync(mdPath, 'utf-8');
}

function splitSections(md) {
  const sections = [];
  const lines = md.split('\n');
  let currentSection = { title: '', content: [] };
  let inCodeBlock = false;
  let codeLines = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        currentSection.content.push({ type: 'code', lines: codeLines });
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const h1m = line.match(/^# (.+)/);
    const h2m = line.match(/^## (.+)/);
    const h3m = line.match(/^### (.+)/);

    if (h1m || h2m || h3m) {
      if (currentSection.title || currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      const level = h1m ? 1 : h2m ? 2 : 3;
      const title = (h1m || h2m || h3m)[1];
      currentSection = { title, level, content: [] };
      continue;
    }

    let trimmed = line.trim();
    if (trimmed.startsWith('> **')) {
      currentSection.content.push({ type: 'tip', text: trimmed.replace(/^>\s*\*\*(.+)\*\*:?\s*(.*)/, '$1: $2').trim() });
    } else if (trimmed.startsWith('- ')) {
      currentSection.content.push({ type: 'bullet', text: trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '$1') });
    } else if (trimmed.startsWith('|')) {
      currentSection.content.push({ type: 'table_row', text: trimmed });
    } else if (trimmed === '---') {
      currentSection.content.push({ type: 'hr' });
    } else if (trimmed.length > 0) {
      const clean = trimmed
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^[📦🔴🎯✅❌🍃📊📈📋]+/, '');
      if (clean.length > 0) {
        currentSection.content.push({ type: 'p', text: clean });
      }
    } else {
      currentSection.content.push({ type: 'empty' });
    }
  }
  if (currentSection.title || currentSection.content.length > 0) {
    sections.push(currentSection);
  }
  return sections;
}

async function generate() {
  const md = readMd();
  const sections = splitSections(md);
  const children = [];

  // Portada
  children.push(new Paragraph({ spacing: { before: 3000 }, children: [] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: '\uD83C\uDF43', size: 80 }) ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Construye tu propio ERP Web', font: TITLE_FONT, size: 52, bold: true, color: GREEN }) ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'De cero a producci\u00F3n', font: TITLE_FONT, size: 32, color: GRAY }) ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Node.js + PostgreSQL + React + Tailwind CSS', font: BODY, size: 24, color: GRAY }) ] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: 'Curso completo paso a paso \u2014 Junio 2026', font: BODY, size: 22, color: GRAY }) ] }));
  children.push(pageBreak());

  // Process sections
  const knownTables = new Map();

  let tableHeaders = [];
  let tableRows = [];
  let inTable = false;

  function flushTable() {
    if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
      children.push(table(tableHeaders, tableRows));
    }
    tableHeaders = [];
    tableRows = [];
    inTable = false;
  }

  for (const section of sections) {
    flushTable();

    if (section.level === 1) {
      children.push(h1(section.title));
    } else if (section.level === 2) {
      children.push(h2(section.title));
    } else if (section.level === 3) {
      children.push(h3(section.title));
    }

    for (const item of section.content) {
      if (item.type === 'code') {
        flushTable();
        children.push(...code(item.lines));
      } else if (item.type === 'p') {
        flushTable();
        if (item.text.includes(':') && item.text.length < 120 && !item.text.startsWith('//')) {
          const colonIdx = item.text.indexOf(':');
          const label = item.text.substring(0, colonIdx + 1);
          const rest = item.text.substring(colonIdx + 1).trim();
          if (label.length < 60 && rest.length > 0) {
            children.push(boldP(label + ' ', rest));
            continue;
          }
        }
        children.push(p(item.text));
      } else if (item.type === 'tip') {
        flushTable();
        children.push(tip(item.text));
      } else if (item.type === 'bullet') {
        flushTable();
        children.push(bullet(item.text));
      } else if (item.type === 'table_row') {
        const cells = item.text.split('|').filter(c => c.trim().length > 0).map(c => c.trim());
        if (item.text.includes('---')) continue;
        if (tableHeaders.length === 0) {
          tableHeaders = cells;
          inTable = true;
        } else if (inTable) {
          tableRows.push(cells);
        }
      } else if (item.type === 'hr') {
        flushTable();
        children.push(hr());
      } else if (item.type === 'empty') {
        flushTable();
        children.push(emptyLine());
      }
    }

    // Add page break after major sections
    const majorSections = [
      'Preparaci\u00F3n del entorno', 'Arquitectura del proyecto',
      'Base de datos', 'Backend: el servidor API',
      'Autenticaci\u00F3n con JWT', 'Middleware',
      'CRUD:', 'Transacciones y l\u00F3gica',
      'Frontend: React', 'Dashboard con gr\u00E1ficos',
      'Auditor\u00EDa y logs', 'Integraci\u00F3n de Inteligencia',
      'Despliegue en producci\u00F3n', 'Errores comunes',
      'Resumen:',
    ];
    if (section.level === 1 && majorSections.some(s => section.title.includes(s))) {
      children.push(pageBreak());
    }
  }

  flushTable();

  const doc = new Document({
    sections: [{ properties: { page: { margin: pageMargin } }, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', '..', '..', 'CURSO_EcoClean_Store.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Documento Word generado: CURSO_EcoClean_Store.docx');
  console.log('Tama\u00F1o:', (buffer.length / 1024).toFixed(1), 'KB');
}

generate().catch(err => { console.error('Error:', err); process.exit(1); });
