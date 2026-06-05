const downloadFile = (content, fileName, _contentType) => {
  // IMPORTANT: Use 'application/octet-stream' as the Blob type.
  // Using text/plain, application/json, or text/csv causes browsers to open
  // the blob URL inline instead of triggering a real file download.
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName; // The file extension here (.txt, .json, .csv) ensures correct OS association
  a.style.display = 'none';
  document.body.appendChild(a);
  
  // Use a microtask delay to ensure the DOM link is fully mounted before clicking
  requestAnimationFrame(() => {
    a.click();
    
    // Clean up after a generous delay so the download manager can fully acquire the blob
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  });
};

export const exportToTxt = (note) => {
  const content = `Title: ${note.emoji ? note.emoji + ' ' : ''}${note.title || 'Untitled Note'}
Created: ${new Date(note.createdAt).toLocaleString()}
${note.updatedAt ? `Updated: ${new Date(note.updatedAt).toLocaleString()}\n` : ''}Tags: ${note.tags && note.tags.length > 0 ? note.tags.map(t => '#' + t).join(', ') : 'None'}
--------------------------------------------------
${note.content || ''}
`;
  const sanitizedTitle = (note.title || 'untitled-note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  downloadFile(content, `${sanitizedTitle}.txt`, 'text/plain;charset=utf-8');
};

export const exportAllToTxt = (notes) => {
  if (notes.length === 0) return;
  const content = notes.map((note, index) => {
    return `==================================================
NOTE #${index + 1}: ${note.emoji ? note.emoji + ' ' : ''}${note.title || 'Untitled Note'}
==================================================
Created: ${new Date(note.createdAt).toLocaleString()}
${note.updatedAt ? `Updated: ${new Date(note.updatedAt).toLocaleString()}` : ''}
Tags: ${note.tags && note.tags.length > 0 ? note.tags.map(t => '#' + t).join(', ') : 'None'}
Pinned: ${note.pinned ? 'Yes' : 'No'}
Color: ${note.color}
--------------------------------------------------
${note.content || ''}

`;
  }).join('\n');
  
  downloadFile(content, `all-sticky-notes.txt`, 'text/plain;charset=utf-8');
};

export const exportToJson = (notes) => {
  const content = JSON.stringify(notes, null, 2);
  downloadFile(content, 'sticky-notes-backup.json', 'application/json;charset=utf-8');
};

export const exportSingleJson = (note) => {
  const content = JSON.stringify(note, null, 2);
  const sanitizedTitle = (note.title || 'untitled-note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  downloadFile(content, `${sanitizedTitle}.json`, 'application/json;charset=utf-8');
};

export const exportToCsv = (notes) => {
  if (notes.length === 0) return;
  
  // CSV Headers
  const headers = ['ID', 'Title', 'Emoji', 'Content', 'Tags', 'Pinned', 'Color', 'CreatedAt', 'UpdatedAt'];
  
  // Format row cell helpers (escaping quotes and double quotes)
  const formatCell = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };
  
  const csvRows = [
    headers.join(','),
    ...notes.map(note => [
      formatCell(note.id),
      formatCell(note.title),
      formatCell(note.emoji),
      formatCell(note.content),
      formatCell(note.tags ? note.tags.join(';') : ''),
      formatCell(note.pinned),
      formatCell(note.color),
      formatCell(note.createdAt),
      formatCell(note.updatedAt)
    ].join(','))
  ];
  
  const content = csvRows.join('\n');
  downloadFile(content, 'sticky-notes.csv', 'text/csv;charset=utf-8');
};

export const printNotes = (notes) => {
  if (notes.length === 0) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to export notes to PDF/Print");
    return;
  }
  
  const notesHtml = notes.map((note, index) => `
    <div style="border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; border-radius: 12px; page-break-inside: avoid; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">
        <h2 style="margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; color: #1e293b;">
          ${note.emoji ? `<span style="font-size: 1.5rem;">${note.emoji}</span>` : ''}
          ${note.title || 'Untitled Note'}
        </h2>
        <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">${note.pinned ? '📌 PINNED' : ''}</span>
      </div>
      <div style="white-space: pre-wrap; font-size: 0.95rem; margin-bottom: 12px; color: #334155; line-height: 1.6;">${note.content || ''}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 0.75rem; color: #94a3b8;">
        <div>
          ${note.tags && note.tags.length > 0 ? `
            <span style="display: inline-flex; gap: 4px;">
              ${note.tags.map(t => `<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 500;">#${t}</span>`).join('')}
            </span>
          ` : ''}
        </div>
        <div>
          Created: ${new Date(note.createdAt).toLocaleString()} 
          ${note.updatedAt ? `| Updated: ${new Date(note.updatedAt).toLocaleString()}` : ''}
        </div>
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My Sticky Notes</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            padding: 40px 20px; 
            color: #1e293b; 
            background: #f8fafc;
            margin: 0;
          }
          h1 { 
            text-align: center; 
            margin-bottom: 40px; 
            font-size: 2rem; 
            color: #0f172a;
            font-weight: 800;
          }
          .notes-container { 
            max-width: 800px; 
            margin: 0 auto; 
          }
          @media print {
            body { background: white; padding: 0; }
            h1 { font-size: 1.8rem; margin-bottom: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>My Sticky Notes (${notes.length})</h1>
        <div class="notes-container">
          ${notesHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
