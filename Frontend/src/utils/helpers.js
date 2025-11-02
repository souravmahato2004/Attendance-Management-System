import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'readable':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    default:
      return `${year}-${month}-${day}`;
  }
};

export const generatePassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

export const downloadCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," + data;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- THIS IS THE UPDATED FUNCTION ---
export const downloadPDF = (data, filename) => {
  const pdf = new jsPDF();
  let yPosition = 0;

  // --- 1. Header ---
  pdf.setFillColor(44, 62, 80); // Dark blue/grey
  // Make the header taller to fit two lines
  pdf.rect(0, 0, 210, 38, 'F'); 
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text

  const title = data.title || 'Report';
  // Regex to find the main title and the (Subject)
  const titleRegex = /^(.*?)\s*\((.*?)\)$/;
  const match = title.match(titleRegex);

  if (match) {
    // Title with subject: "Student Report (Maths)"
    const mainTitle = match[1]; // "Student Report"
    const subjectTitle = match[2]; // "Maths"
    
    pdf.setFontSize(18); // Main title
    pdf.text(mainTitle, 14, 16);
    
    pdf.setFontSize(12); // Subject sub-title
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(200, 200, 200); // Light grey text
    pdf.text(subjectTitle, 14, 24); // <-- This is the new line

  } else {
    // Fallback for simple title
    pdf.setFontSize(18);
    pdf.text(title, 14, 20); // Vertically centered
  }

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 200, 200);
  // Pushed down to fit under the new subtitle
  pdf.text(`Generated on: ${data.generatedDate || formatDate(new Date(), 'readable')}`, 14, 32);
  
  // Start content below the taller header
  yPosition = 48; 

  // --- 2. Student Information ---
  if (data.studentInfo) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40); // Dark text
    pdf.text('Student Information', 14, yPosition);
    yPosition += 8;

    autoTable(pdf, {
      body: Object.entries(data.studentInfo),
      startY: yPosition,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' } // This will auto-wrap
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'head') {
          hookData.cell.styles.fillColor = [255, 255, 255];
          hookData.cell.styles.textColor = [255, 255, 255];
          hookData.cell.styles.lineWidth = 0; // No border for fake header
        }
      },
      didDrawPage: (hookData) => { yPosition = hookData.cursor.y; }
    });
    yPosition = pdf.lastAutoTable.finalY + 10;
  }

  // --- 3. Attendance Summary ---
  if (data.summary) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text('Attendance Summary', 14, yPosition);
    yPosition += 8;

    autoTable(pdf, {
      body: Object.entries(data.summary),
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, halign: 'center' },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
      },
      didParseCell: (hookData) => {
         if (hookData.section === 'head') {
          hookData.cell.styles.fillColor = [255, 255, 255];
          hookData.cell.styles.textColor = [255, 255, 255];
          hookData.cell.styles.lineWidth = 0;
        }
      },
      didDrawPage: (hookData) => { yPosition = hookData.cursor.y; }
    });
    yPosition = pdf.lastAutoTable.finalY + 10;
  }

  // --- 4. Daily Attendance Table ---
  if (data.tableData && data.tableData.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text('Daily Attendance', 14, yPosition);
    yPosition += 8;
    
    const tableBody = data.tableData.map(row => [row.date, row.day, row.status]);
    
    autoTable(pdf, {
      head: [['Date', 'Day', 'Status']],
      body: tableBody,
      startY: yPosition,
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { 
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const status = data.cell.text[0];
          let cellColor = [255, 255, 255];
          let textColor = [40, 40, 40];

          if (status.toLowerCase().includes('present')) {
            cellColor = [230, 245, 233];
            textColor = [39, 103, 50];
          } else if (status.toLowerCase().includes('absent')) {
            cellColor = [254, 235, 234];
            textColor = [192, 57, 43];
          } else if (status.toLowerCase().includes('late')) {
            cellColor = [255, 249, 230];
            textColor = [183, 134, 0];
          }

          pdf.setFillColor(cellColor[0], cellColor[1], cellColor[2]);
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.setFont(undefined, 'bold');
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          pdf.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
            halign: 'center',
            valign: 'middle'
          });
        }
      },
      didDrawPage: (hookData) => { yPosition = hookData.cursor.y; }
    });
  }

  // --- 5. Footer ---
  const pageCount = pdf.internal.getNumberOfPages();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(`Page ${i} of ${pageCount}`, 14, 287);
    pdf.text('Report generated by Attendease', 200, 287, { align: 'right' });
  }

  // Save the PDF
  pdf.save(filename);
};
// --- END OF UPDATED FUNCTION ---

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};