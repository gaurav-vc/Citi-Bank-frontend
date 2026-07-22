export const allCountries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon",
  "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Finland",
  "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Maldives",
  "Malta", "Mexico", "Moldova", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Oman", "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa",
  "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Tunisia", "Turkey",
  "UAE", "Ukraine", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Zimbabwe",
];

export interface RegionTree {
  [region: string]: {
    [state: string]: {
      [city: string]: string[];
    };
  };
}

export const locationTree: Record<string, RegionTree> = {
  India: {
    North: {
      "Uttar Pradesh": { Lucknow: ["Hazratganj Zone", "Gomti Nagar Zone"], Noida: ["Sector 18 Zone", "Sector 62 Zone"] },
      Delhi: { "New Delhi": ["Central Delhi Zone", "South Delhi Zone"] },
    },
    West: {
      Maharashtra: { Mumbai: ["Western Zone", "Harbour Zone"], Pune: ["Shivajinagar Zone", "Hinjewadi Zone"] },
      Gujarat: { Ahmedabad: ["SG Highway Zone", "Sabarmati Zone"], Surat: ["Adajan Zone", "Vesu Zone"] },
    },
    South: {
      Karnataka: { Bengaluru: ["Whitefield Zone", "Electronic City Zone"] },
      "Tamil Nadu": { Chennai: ["T Nagar Zone", "OMR Zone"] },
    },
  },
  USA: {
    North: {
      Illinois: { Chicago: ["Downtown Zone", "North Shore Zone"] },
      Michigan: { Detroit: ["Midtown Zone", "Rivertown Zone"] },
    },
    West: {
      California: {
        "San Francisco": ["West Coast", "Bay Area Zone"],
        "Los Angeles": ["Hollywood Zone", "Santa Monica Zone"],
      },
      Washington: { Seattle: ["Downtown Seattle Zone", "Capitol Hill Zone"] },
    },
  },
  Canada: {
    East: {
      Ontario: { Toronto: ["East Canada", "North York Zone"], Ottawa: ["Central Ottawa Zone", "Kanata Zone"] },
      Quebec: { Montreal: ["Old Port Zone", "Downtown Montreal Zone"] },
    },
    West: {
      Alberta: { Calgary: ["Beltline Zone", "Downtown Calgary Zone"] },
      "British Columbia": { Vancouver: ["Gastown Zone", "Richmond Zone"] },
    },
  },
};
