// Schlichte Linien-Symbole (24×24), Farbe über currentColor.

function Icon({ children, size = 24, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconStart = (p) => (
  <Icon {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Icon>
)
export const IconAusgaben = (p) => (
  <Icon {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
    <path d="M12 8v8M8.5 12.5 12 16l3.5-3.5" />
  </Icon>
)
export const IconEinnahmen = (p) => (
  <Icon {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
    <path d="M12 16V8M8.5 11.5 12 8l3.5 3.5" />
  </Icon>
)
export const IconAuswertung = (p) => (
  <Icon {...p}>
    <path d="M5 20V11M12 20V5M19 20v-6" />
  </Icon>
)
export const IconMehr = (p) => (
  <Icon {...p}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
)
export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const IconSchliessen = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
export const IconZurueck = (p) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)
export const IconWeiter = (p) => (
  <Icon {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
)
export const IconKamera = (p) => (
  <Icon {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </Icon>
)
export const IconBild = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m20.5 16-5-5-8.5 8.5" />
  </Icon>
)
export const IconPdf = (p) => (
  <Icon {...p}>
    <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
  </Icon>
)
export const IconBeleg = (p) => (
  <Icon {...p}>
    <path d="m19 11.5-7.4 7.4a4.2 4.2 0 0 1-6-6l7.8-7.7a2.8 2.8 0 0 1 4 4l-7.8 7.7a1.4 1.4 0 0 1-2-2l7-7" />
  </Icon>
)
export const IconSuche = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Icon>
)
export const IconStift = (p) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
  </Icon>
)
export const IconMuell = (p) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
  </Icon>
)
export const IconHaken = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)
export const IconSchild = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" />
  </Icon>
)
export const IconWiederholen = (p) => (
  <Icon {...p}>
    <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15M4.5 19.5V15H9" />
  </Icon>
)
export const IconExport = (p) => (
  <Icon {...p}>
    <path d="M12 15V4M8 8l4-4 4 4M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
  </Icon>
)
export const IconZahnrad = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4z" />
  </Icon>
)
export const IconEtikett = (p) => (
  <Icon {...p}>
    <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1a1 1 0 0 1 .7.3l7.2 7.2a1 1 0 0 1 0 1.4l-8.1 8.1a1 1 0 0 1-1.4 0l-7.2-7.2a1 1 0 0 1-.3-.7z" />
    <circle cx="8.5" cy="8.5" r="1.4" />
  </Icon>
)
export const IconInfo = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.6v.1" />
  </Icon>
)
