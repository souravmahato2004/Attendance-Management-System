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

import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

export const downloadPDF = (data, filename) => {
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text(data.title || 'Report', 20, 20);
  
  // Add generation date
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated on: ${data.generatedDate || formatDate(new Date(), 'readable')}`, 20, 30);
  
  let yPosition = 40;
  
  // Add student information section
  if (data.studentInfo) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Student Information:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    Object.entries(data.studentInfo).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }
  
  // Add summary section
  if (data.summary) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Attendance Summary:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    Object.entries(data.summary).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }
  
  // Add attendance table
  if (data.tableData && data.tableData.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Daily Attendance:', 20, yPosition);
    yPosition += 10;
    
    // Prepare table data
    const tableData = data.tableData.map(row => [row.date, row.day, row.status]);
    
    pdf.autoTable({
      head: [['Date', 'Day', 'Status']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  }
  
  // Save the PDF
  pdf.save(filename);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
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
