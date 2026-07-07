/**
 * Generates and triggers download of an .ics calendar file.
 *
 * @param title          Session title
 * @param description    Session description
 * @param startDate      Session start time (Date object)
 * @param durationMinutes Session duration in minutes (default 60)
 */
export const escapeICalText = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

export const generateICS = (
  title: string,
  description: string,
  startDate: Date,
  durationMinutes: number = 60
) => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Format date for iCal (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peer Learning Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${startDate.getTime()}@peerlearning.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeICalText(title)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
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
