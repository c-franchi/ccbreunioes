interface EventData {
  meeting_name: string;
  meeting_date: string;
  cidade?: string;
}

interface AttendanceData {
  musician: {
    name: string;
    instrument: string;
    cargo_ministerio?: string;
    localidade?: string;
  };
}

export const generateEventCSV = (eventData: EventData, attendances: AttendanceData[]) => {
  // CSV Headers
  const headers = ['Nome', 'Instrumento', 'Cargo/Ministério', 'Localidade'];
  
  // CSV Rows
  const rows = attendances.map(att => [
    att.musician.name,
    att.musician.instrument,
    att.musician.cargo_ministerio || '',
    att.musician.localidade || ''
  ]);
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Presencas_${eventData.meeting_name.replace(/[^a-z0-9]/gi, '_')}_${eventData.meeting_date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
