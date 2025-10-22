# User Profile

Sections (MVP)
- Identity (optional): name, email.
- Location: country, region/state, city/locality, postal code, radius km.
- Demographics (optional): age bracket, citizenship/immigration, veteran, disability, justice-involved, household size, income bracket.
- Education & Skills: degrees, certifications, skills (map to ESCO/O*NET later).
- Employment: status, industry, employer type.
- Business (if applicable): type, size, NAICS, founding date.
- Languages.
- Interests/Goals: find grants, start/scale business, upskill, job search, education, housing, legal aid, transportation, healthcare, childcare, credit repair.
- Constraints: work mode, schedule, accessibility needs.
- Preferences: notifications, language, data-sharing consent.

Example JSON (illustrative)
{
  "persona": "individual",
  "location": {"country": "US", "region": "CA", "locality": "Oakland", "postalCode": "94612", "radiusKm": 50},
  "demographics": {"ageBracket": "25-34", "citizenshipStatus": "permanent_resident", "householdSize": 3, "annualIncomeUSD": 48000},
  "skills": ["customer service", "excel", "bookkeeping"],
  "education": ["HS Diploma"],
  "certifications": [],
  "languages": ["en", "es"],
  "employment": {"status": "unemployed"},
  "interests": ["find_grants", "upskill"],
  "preferences": {"notifications": "weekly", "language": "en", "dataSharingConsent": false}
}

