export const generateICS = (
  title: string,
  description: string,
  startDate: Date,
  durationHours: number = 1
) => {
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

  // Format date for iCal (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peer Learning Platform//EN",
    "BEGIN:VEVENT",
    `UID:${startDate.getTime()}@peerlearning.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
