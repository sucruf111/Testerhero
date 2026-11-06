/** Link zur Sendungsverfolgung – falls der Versanddienstleister bekannt ist */
export function trackingUrl(carrier?: string | null, trackingNumber?: string | null) {
  if (!trackingNumber) return null;
  const n = encodeURIComponent(trackingNumber.replace(/\s+/g, ""));
  switch ((carrier ?? "").toLowerCase()) {
    case "dhl":
    case "deutsche post":
      return `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${n}`;
    case "hermes":
      return `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#${n}`;
    case "dpd":
      return `https://tracking.dpd.de/status/de_DE/parcel/${n}`;
    case "gls":
      return `https://gls-group.com/DE/de/paketverfolgung?match=${n}`;
    case "ups":
      return `https://www.ups.com/track?loc=de_DE&tracknum=${n}`;
    default:
      return null;
  }
}
