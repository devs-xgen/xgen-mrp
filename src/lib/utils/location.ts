'use client';

/**
 * Interface for location data used in postal code generation
 */
interface LocationData {
  city?: string;
  state?: string;
  country?: string;
  barangay?: string;
  postalCode?: string;
}

// Store for previously generated postal codes
type PostalCodeStore = {
  [country: string]: {
    [state: string]: {
      [city: string]: {
        postalCode: string;
        barangay?: string;
      }
    }
  }
};

// Initialize the postal code store
let postalCodeStore: PostalCodeStore = {};

/**
 * Generates a postal code based on location information
 * Provides special handling for Philippines, particularly Quezon City
 */
export async function generatePostalCode({
    city,
    state,
    country,
    barangay
}: LocationData): Promise<string> {
    try {
        console.log("generatePostalCode called with:", { city, state, country, barangay });
        if (!city || !country) {
            return "Need city and country";
        }

        // Check if we already have this location's postal code in our store
        if (country && country !== "Philippines" && state && city && 
            postalCodeStore[country]?.[state]?.[city]?.postalCode) {
            return postalCodeStore[country][state][city].postalCode;
        }

        // Special handling for Philippines
        if (country === "Philippines" || "PHILIPPINES") {
            const normalizedCity = city.toLowerCase().trim();
            // Specific handling for Quezon City
            if (normalizedCity === "quezon city" && barangay) {
              try {
                // Mapping for Quezon City barangays and their postal codes
                const quezonCityPostalCodes: Record<string, string> = {
                  "Alicia": "1105",
                  "Amihan": "1102",
                  "Apolonio Samson": "1106",
                  "Baesa": "1106",
                  "Bagbag": "1116",
                  "Bagong Buhay": "1109",
                  "Bagong Lipunan": "1111",
                  "Bagong Pag-asa": "1105",
                  "Bagong Silangan": "1119",
                  "Bagong bayan": "1110",
                  "Bahay Toro": "1106",
                  "Balingasa": "1115",
                  "Balintawak": "1106",
                  "Balumbato": "1106",
                  "Batasan Hills": "1126",
                  "Bayanihan": "1109",
                  "BF Homes": "1120",
                  "Blue Ridge": "1109",
                  "Botocan": "1101",
                  "Bungad": "1105",
                  "Camp Aguinaldo": "1110",
                  "Capitol Hills/Park": "1126",
                  "Capri": "1117",
                  "Central": "1100",
                  "Claro": "1102",
                  "Commonwealth": "1121",
                  "Crame": "1111",
                  "Cubao": "1109",
                  "Culiat": "1128",
                  "Damar": "1115",
                  "Damayan": "1104",
                  "Damayan Lagi": "1112",
                  "Damong Maliit": "1123",
                  "Del Monte": "1105",
                  "Diliman": "1101",
                  "Dioquino Zobel": "1109",
                  "Don Manuel": "1113",
                  "Dona Aurora": "1113",
                  "Dona Faustina Subd.": "1125",
                  "Doña Imelda": "1113",
                  "Dona Josefa": "1113",
                  "Duyan-Duyan": "1102",
                  "E. Rodriguez": "1102",
                  "Escopa": "1109",
                  "Fairview": "1118",
                  "Fairview North": "1121",
                  "Fairview South": "1122",
                  "Gintong Silahis": "1114",
                  "Gulod": "1117",
                  "Holy Spirit": "1127",
                  "Horseshoe": "1112",
                  "Immaculate Conception": "1111",
                  "Kaligayahan": "1124",
                  "Kalusugan": "1112",
                  "Kamias": "1102",
                  "Kamuning": "1103",
                  "Katipunan": "1105",
                  "Kaunlaran": "1111",
                  "Kristong Hari": "1112",
                  "Krus na Ligas": "1101",
                  "Laging Handa": "1103",
                  "La Loma": "1114",
                  "Libis": "1110",
                  "Lourdes": "1114",
                  "Loyola Heights": "1108",
                  "Maharlica": "1114",
                  "Malaya": "1101",
                  "Mangga": "1109",
                  "Manresa": "1115",
                  "Mariana": "1112",
                  "Mariblo": "1104",
                  "Marilag": "1109",
                  "Masagana": "1109",
                  "Masambong": "1105",
                  "Matalahib": "1114",
                  "Matandang Balara": "1119",
                  "Milagrosa": "1109",
                  "Nagkaisang Nayaon": "1125",
                  "Nayon Kaunlaran": "1104",
                  "New Era": "1107",
                  "Novaliches Town Proper": "1123",
                  "Obrero": "1103",
                  "Old Capitol Site": "1101",
                  "Parang Bundok": "1114",
                  "Pag-Ibig sa Nayon": "1115",
                  "Paligsahan": "1103",
                  "Paltok": "1105",
                  "Pansol": "1108",
                  "Paraiso": "1104",
                  "Pasong Putik": "1118",
                  "Pasong Tamo": "1107",
                  "Payatas": "1119",
                  "Phil-Am / Philam": "1104",
                  "Pinagkaisahan": "1111",
                  "Piñahan": "1100",
                  "Project 4": "1109",
                  "Project 6": "1100",
                  "Project 7": "1105",
                  "Project 8": "1106",
                  "Quirino District/Project 2 & 3": "1102",
                  "Quezon City CPO": "1100",
                  "Ramon Magsaysay": "1105",
                  "Roxas District": "1103",
                  "Sacred Heart": "1103",
                  "St. Ignatius": "1110",
                  "St. Peter": "1114",
                  "Salvacion": "1114",
                  "San Agustin": "1117",
                  "San Antonio": "1105",
                  "San Bartolome": "1116",
                  "Sangandaan": "1116",
                  "San Isidro": "1113",
                  "San Isidro Labrador": "1114",
                  "San Jose": "1115",
                  "San Roque": "1109",
                  "San Vicente": "1101",
                  "Santa Cruz": "1104",
                  "Santa Lucia": "1117",
                  "Santa Monica": "1117",
                  "Santa Teresita": "1114",
                  "Santol": "1113",
                  "Sto. Cristo": "1105",
                  "Santo Nino": "1113",
                  "Sauyo": "1116",
                  "Sienna": "1114",
                  "Sikatuna Village": "1101",
                  "Silangan": "1102",
                  "Socorro": "1109",
                  "South Triangle": "1103",
                  "Tagumpay": "1109",
                  "Talampas": "1110",
                  "Talayan": "1104",
                  "Talipapa": "1116",
                  "Tandang Sora": "1116",
                  "Tatalon": "1113",
                  "Teachers Village": "1101",
                  "Ugong Norte": "1110",
                  "Unang Sigaw": "1106",
                  "University of the Philippines": "1101",
                  "UP Village": "1101",
                  "Valencia": "1112",
                  "Vasra": "1128",
                  "Veterans Village": "1105",
                  "Villa Maria Clara": "1109",
                  "Violago Homes": "1120",
                  "West Triangle": "1104",
                  "White Plains": "1110"
                };
                
                let postalCode = "1100";

                const barangayNormalized = barangay.toLowerCase().trim();
    
                // If we get here, no exact match was found, try partial match
                for (const [name, code] of Object.entries(quezonCityPostalCodes)) {
                    if (name.toLowerCase().includes(barangayNormalized) || 
                        barangayNormalized.includes(name.toLowerCase())) {
                        postalCode = code;
                        console.log(`Partial match found: ${name} -> ${code}`);
                        // Store and return immediately
                        updateLocationData({ city, state, country, barangay, postalCode });
                        return postalCode;
                    }
                }
                
                // Store the postal code
                updateLocationData({
                    city,
                    state,
                    country,
                    barangay,
                    postalCode
                });
                console.log(`Final postal code being returned: ${postalCode}`);
                return postalCode;
              } catch (error) {
                console.error("Error in Quezon City barangay lookup:", error);
                return "Error in barangay lookup";
            }
        }
            
            // General Philippines postal codes for other cities
            const philippinePostalCodes: Record<string, Record<string, string>> = {
                "Metro Manila": {
                    "Manila": "1000",
                    "Quezon City": "1100", // General Quezon City code
                    "Makati": "1200",
                    "Pasig": "1600",
                    "Taguig": "1630",
                    "Parañaque": "1700"
                },
                "Cebu": {
                    "Cebu City": "6000",
                    "Mandaue": "6014",
                    "Lapu-Lapu": "6015"
                },
                "Davao": {
                    "Davao City": "8000"
                },
                "Pampanga": {
                    "Angeles": "2009",
                    "San Fernando": "2000"
                }
            };
            
            let postalCode: string;
            
            // Check for city/state match
            if (state && philippinePostalCodes[state] && philippinePostalCodes[state][city]) {
              postalCode = philippinePostalCodes[state][city];
            } else {
              // Generate a plausible 4-digit postal code for Philippine addresses
              const hashInput = city + (state || ''); // Use empty string if state is undefined
              const hash = Array.from(hashInput)
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
              postalCode = (hash % 9000 + 1000).toString();
            }
                        
            // Store the postal code
            updateLocationData({
                city,
                state,
                country,
                barangay,
                postalCode
            });
            
            return postalCode;
        }

        // For other countries, generate a code based on location
        const cityCode = city.substring(0, 3).toUpperCase();
        const stateCode = state ? state.substring(0, 2).toUpperCase() : 'XX';
        const countryCode = country.substring(0, 2).toUpperCase();

        const hash = Array.from(city + state + country)
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const numberPart = (hash % 9000 + 1000).toString();
        
        const postalCode = `${cityCode}${stateCode}-${numberPart}`;
        
        // Store the postal code
        updateLocationData({
            city,
            state,
            country,
            postalCode
        });
        
        return postalCode;
    } catch (error) {
        console.error('Failed to generate postal code:', error);
        return "Error generating code";
    }
}

/**
 * Updates location data in the store including postal code
 */
export function updateLocationData(data: LocationData): void {
    try {
        if (!data.country || !data.state || !data.city || !data.postalCode) {
            console.warn('Incomplete location data for storage', data);
            return;
        }
        
        // Initialize country object if it doesn't exist
        if (!postalCodeStore[data.country]) {
            postalCodeStore[data.country] = {};
        }
        
        // Initialize state object if it doesn't exist
        if (!postalCodeStore[data.country][data.state]) {
            postalCodeStore[data.country][data.state] = {};
        }
        
        // Store the postal code and optionally barangay
        postalCodeStore[data.country][data.state][data.city] = {
            postalCode: data.postalCode,
            ...(data.barangay ? { barangay: data.barangay } : {})
        };
        
        console.log(`Stored postal code ${data.postalCode} for ${data.city}, ${data.state}, ${data.country}`);
        
        // You could also persist this to localStorage if needed
        // localStorage.setItem('postalCodeStore', JSON.stringify(postalCodeStore));
    } catch (error) {
        console.error('Error updating location data:', error);
    }
}

/**
 * Retrieves postal code for a location if available
 */
export function getStoredPostalCode(
    country: string, 
    state: string, 
    city: string
): string | null {
    try {
        if (postalCodeStore[country]?.[state]?.[city]?.postalCode) {
            return postalCodeStore[country][state][city].postalCode;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving postal code:', error);
        return null;
    }
}

/**
 * Validates a postal code format
 * @param postalCode The postal code to validate
 * @param country The country for country-specific validation rules
 */
export function isValidPostalCode(postalCode: string, country?: string): boolean {
    if (!postalCode) return false;
    
    // Country-specific validation
    if (country === "Philippines") {
        // Philippines uses 4-digit postal codes
        return /^\d{4}$/.test(postalCode);
    }
    
    if (country === "United States") {
        // US uses 5-digit or 5+4 digit ZIP codes
        return /^\d{5}(-\d{4})?$/.test(postalCode);
    }
    
    // Generic validation - allow alphanumeric with optional dashes
    return /^[A-Z0-9]{2,10}(-[A-Z0-9]{2,10})?$/i.test(postalCode);
}

/**
 * Gets a list of countries for dropdown selection
 */
export function getCountries(): { value: string; label: string }[] {
    return [
        { value: "Philippines", label: "Philippines" },
        { value: "United States", label: "United States" },
        { value: "Canada", label: "Canada" },
        { value: "United Kingdom", label: "United Kingdom" },
        { value: "Australia", label: "Australia" },
        { value: "Japan", label: "Japan" },
        { value: "China", label: "China" },
        { value: "Singapore", label: "Singapore" },
        { value: "Malaysia", label: "Malaysia" },
        { value: "Indonesia", label: "Indonesia" },
        // Add more countries as needed
    ];
}

// Initialize from localStorage if available
try {
    const storedData = typeof window !== 'undefined' ? localStorage.getItem('postalCodeStore') : null;
    if (storedData) {
        postalCodeStore = JSON.parse(storedData);
    }
} catch (error) {
    console.error('Failed to load stored postal code data:', error);
}