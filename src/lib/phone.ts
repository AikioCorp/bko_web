export interface PhoneCountryRule {
  code: string; // ISO alpha-2 e.g. "ML"
  dial: string; // e.g. "+223"
  name: string;
  flag: string;
  label: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  groups: number[]; // digit grouping sizes e.g. [2, 2, 2, 2]
}

export const PHONE_COUNTRIES: PhoneCountryRule[] = [
  {
    code: "ML",
    dial: "+223",
    name: "Mali",
    flag: "🇲🇱",
    label: "🇲🇱 Mali (+223)",
    placeholder: "66 00 00 00",
    minDigits: 8,
    maxDigits: 8,
    groups: [2, 2, 2, 2],
  },
  {
    code: "CI",
    dial: "+225",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    label: "🇨🇮 Côte d'Ivoire (+225)",
    placeholder: "07 00 00 00 00",
    minDigits: 10,
    maxDigits: 10,
    groups: [2, 2, 2, 2, 2],
  },
  {
    code: "SN",
    dial: "+221",
    name: "Sénégal",
    flag: "🇸🇳",
    label: "🇸🇳 Sénégal (+221)",
    placeholder: "77 123 45 67",
    minDigits: 9,
    maxDigits: 9,
    groups: [2, 3, 2, 2],
  },
  {
    code: "GN",
    dial: "+224",
    name: "Guinée",
    flag: "🇬🇳",
    label: "🇬🇳 Guinée (+224)",
    placeholder: "620 00 00 00",
    minDigits: 9,
    maxDigits: 9,
    groups: [3, 2, 2, 2],
  },
  {
    code: "BF",
    dial: "+226",
    name: "Burkina Faso",
    flag: "🇧🇫",
    label: "🇧🇫 Burkina Faso (+226)",
    placeholder: "70 00 00 00",
    minDigits: 8,
    maxDigits: 8,
    groups: [2, 2, 2, 2],
  },
  {
    code: "NE",
    dial: "+227",
    name: "Niger",
    flag: "🇳🇪",
    label: "🇳🇪 Niger (+227)",
    placeholder: "90 00 00 00",
    minDigits: 8,
    maxDigits: 8,
    groups: [2, 2, 2, 2],
  },
  {
    code: "TG",
    dial: "+228",
    name: "Togo",
    flag: "🇹🇬",
    label: "🇹🇬 Togo (+228)",
    placeholder: "90 00 00 00",
    minDigits: 8,
    maxDigits: 8,
    groups: [2, 2, 2, 2],
  },
  {
    code: "BJ",
    dial: "+229",
    name: "Bénin",
    flag: "🇧🇯",
    label: "🇧🇯 Bénin (+229)",
    placeholder: "01 90 00 00 00",
    minDigits: 8,
    maxDigits: 10,
    groups: [2, 2, 2, 2, 2],
  },
  {
    code: "CM",
    dial: "+237",
    name: "Cameroun",
    flag: "🇨🇲",
    label: "🇨🇲 Cameroun (+237)",
    placeholder: "6 70 00 00 00",
    minDigits: 9,
    maxDigits: 9,
    groups: [1, 2, 2, 2, 2],
  },
  {
    code: "GH",
    dial: "+233",
    name: "Ghana",
    flag: "🇬🇭",
    label: "🇬🇭 Ghana (+233)",
    placeholder: "050 706 6762",
    minDigits: 9,
    maxDigits: 10,
    groups: [3, 3, 4],
  },
  {
    code: "FR",
    dial: "+33",
    name: "France",
    flag: "🇫🇷",
    label: "🇫🇷 France (+33)",
    placeholder: "06 12 34 56 78",
    minDigits: 9,
    maxDigits: 10,
    groups: [2, 2, 2, 2, 2],
  },
  {
    code: "BE",
    dial: "+32",
    name: "Belgique",
    flag: "🇧🇪",
    label: "🇧🇪 Belgique (+32)",
    placeholder: "0470 12 34 56",
    minDigits: 9,
    maxDigits: 10,
    groups: [4, 2, 2, 2],
  },
  {
    code: "CH",
    dial: "+41",
    name: "Suisse",
    flag: "🇨🇭",
    label: "🇨🇭 Suisse (+41)",
    placeholder: "079 123 45 67",
    minDigits: 9,
    maxDigits: 10,
    groups: [3, 3, 2, 2],
  },
  {
    code: "GB",
    dial: "+44",
    name: "Royaume-Uni",
    flag: "🇬🇧",
    label: "🇬🇧 Royaume-Uni (+44)",
    placeholder: "07700 900077",
    minDigits: 10,
    maxDigits: 11,
    groups: [5, 6],
  },
  {
    code: "US",
    dial: "+1",
    name: "USA / Canada",
    flag: "🇺🇸",
    label: "🇺🇸/🇨🇦 USA / Canada (+1)",
    placeholder: "555 123 4567",
    minDigits: 10,
    maxDigits: 10,
    groups: [3, 3, 4],
  },
];

export function getCountryRule(codeOrDial: string): PhoneCountryRule {
  return (
    PHONE_COUNTRIES.find((c) => c.dial === codeOrDial || c.code === codeOrDial) ||
    PHONE_COUNTRIES[0]
  );
}

export function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formats and strictly caps a phone number according to the selected country's digit limit & spacing.
 */
export function formatPhoneForCountry(value: string, codeOrDial: string): string {
  const rule = getCountryRule(codeOrDial);
  const digits = extractDigits(value).slice(0, rule.maxDigits);
  if (!digits) return "";

  const parts: string[] = [];
  let cursor = 0;
  for (const size of rule.groups) {
    if (cursor >= digits.length) break;
    parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }
  if (cursor < digits.length) {
    parts.push(digits.slice(cursor));
  }
  return parts.join(" ");
}

export function isPhoneValidForCountry(value: string, codeOrDial: string): boolean {
  const rule = getCountryRule(codeOrDial);
  const digits = extractDigits(value);
  return digits.length >= rule.minDigits && digits.length <= rule.maxDigits;
}
