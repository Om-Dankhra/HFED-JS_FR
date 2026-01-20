// =============================================================================
// CANADIAN HIGH-FREQUENCY ELECTRICITY DATA (HFED) FRENCH
// =============================================================================

// ## API CONFIGURATION
// Base URL structure for CCEI SDMX REST API (CSV format)
const BASE_URL_PREFIX = "https://api.statcan.gc.ca/hfed-dehf/sdmx/rest/data/CCEI,";
const BASE_URL_SUFFIX = "&dimensionAtObservation=AllDimensions";

let pagedData = [];           // Current table data for pagination
let currentPage = 1;          // Active table page
const rowsPerPage = 10;       // Rows per table page

// ## PROVINCE MAPPINGS
// Dataflow IDs for each province (required for API queries)
const PROVINCE_DATAFLOWS = {
    "Terre-Neuve": "DF_HFED_NL",
    "Île-du-Prince-Édouard": "DF_HFED_PE",
    "Nouvelle-Écosse": "DF_HFED_NS",
    "Nouveau-Brunswick": "DF_HFED_NB",
    "Québec": "DF_HFED_QC",
    "Ontario": "DF_HFED_ON",
    "Alberta": "DF_HFED_AB",
    "Saskatchewan": "DF_HFED_SK",
    "Colombie-Britannique": "DF_HFED_BC",
    "Yukon": "DF_HFED_YK"
};

// Province codes for filtering (Same as REFERENCE_AREA column)
const PROVINCE_CODES = {
    "Terre-Neuve": "CA_NL",
    "Île-du-Prince-Édouard": "CA_PE",
    "Nouvelle-Écosse": "CA_NS",
    "Nouveau-Brunswick": "CA_NB",
    "Québec": "CA_QC",
    "Ontario": "CA_ON",
    "Alberta": "CA_AB",
    "Saskatchewan": "CA_SK",
    "Colombie-Britannique": "CA_BC",
    "Yukon": "CA_YK"
};

// ## ENERGY VARIABLES BY PROVINCE
// Province-specific available metrics with labels and categories (for Ontario/Québec grouping)
const ENERGY_VARS = {
  "Terre-Neuve": [
    { value: "DEMAND", label: "Demande" }
  ],

  "Île-du-Prince-Édouard": [
    { value: "IMPORT_CABLES", label: "Câbles d'importation" },
    { value: "ON_ISL_LOAD", label: "Charge sur l'île" },
    { value: "ON_ISL_WIND", label: "Production d'énergie éolienne sur l'île" },
    { value: "ON_ISL_FOSSIL", label: "Production totale d'énergie fossile sur l'île" },
    { value: "WIND_PERCENT", label: "Éolien en pourcentage de la charge totale" },
    { value: "WIND_EXPORT", label: "Énergie éolienne exportée hors de l'île" },
    { value: "WIND_LOCAL", label: "Énergie éolienne utilisée sur l'île" }
  ],

  "Nouvelle-Écosse": [
    { value: "LOAD", label: "Charge" },
    { value: "WIND", label: "Éolien" }
  ],

  "Nouveau-Brunswick": [
    { value: "DEMAND", label: "Demande" },
    { value: "LOAD", label: "Charge" },
    { value: "RM_10", label: "Marge de réserve de 10 minutes" },
    { value: "RM_30", label: "Marge de réserve de 30 minutes" },
    { value: "SRM_10", label: "Marge de réserve tournante de 10 minutes" },
    { value: "NSI", label: "Échanges programmés nets" }
  ],

  "Québec": [
    { value: "DEMAND", label: "Demande", category: "Demande" },

    { value: "AGRICOLE", label: "Agricole", category: "Consommation d’électricité par secteur d’activité" },
    { value: "COMMERCIAL", label: "Commercial", category: "Consommation d’électricité par secteur d’activité" },
    { value: "INDUSTRIEL", label: "Industriel", category: "Consommation d’électricité par secteur d’activité" },
    { value: "EINSTITUTIONNEL", label: "Institutionnel", category: "Consommation d’électricité par secteur d’activité" },
    { value: "RESIDENTIEL", label: "Résidentiel", category: "Consommation d’électricité par secteur d’activité" },

    { value: "EXPORT", label: "Exportations", category: "Importations et exportations d’électricité" },
    { value: "EXPORT_TOTAL", label: "Exportation totale", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_GAS", label: "Importation – Gaz", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_HYDRO", label: "Importation – Hydroélectricité", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_NUCLEAR", label: "Importation – Nucléaire", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_TOTAL", label: "Importation totale", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_UNKNOWN", label: "Importation – Source inconnue", category: "Importations et exportations d’électricité" },
    { value: "IMPORT_WIND", label: "Importation – Éolien", category: "Importations et exportations d’électricité" },

    { value: "HYDRO", label: "Hydroélectricité", category: "Sources de l’électricité produite" },
    { value: "SOLAR", label: "Solaire", category: "Sources de l’électricité produite" },
    { value: "THERMAL", label: "Thermique", category: "Sources de l’électricité produite" },
    { value: "WIND", label: "Éolien", category: "Sources de l’électricité produite" },
    { value: "TOTAL_PRODUCTION", label: "Production totale", category: "Sources de l’électricité produite" },
    { value: "OTHER", label: "Autres", category: "Sources de l’électricité produite" }
  ],

  "Ontario": [
    { value: "BIOFUEL_CAPABILITY", label: "Capacité de biocarburant", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "BIOFUEL_OUTPUT", label: "Production de biocarburant", category: "Rapport sur la capacité et la production des générateurs" },

    { value: "DIRECT_CONNECT", label: "Charge directement liée", category: "Rapport sur la charge industrielle par secteur" },
    { value: "ELEC_POWER", label: "Production, transport et distribution d’électricité (sans SDL)", category: "Rapport sur la charge industrielle par secteur" },

    { value: "EXPORT", label: "Exportations", category: "Rapport sur les flux d’énergie et les horaires d’interconnexions" },
    { value: "FLOW", label: "Flux d'énergie", category: "Rapport sur les flux d’énergie et les horaires d’interconnexions" },

    { value: "GAS_CAPABILITY", label: "Capacité de gaz naturel", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "GAS_OUTPUT", label: "Production de gaz naturel", category: "Rapport sur la capacité et la production des générateurs" },

    { value: "HOEP", label: "Prix horaire de l'énergie en Ontario", category: "Rapport sur les prix horaires de l’Ontario (PHÉO)" },

    { value: "HYDRO_CAPABILITY", label: "Capacité d’hydroélectricité", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "HYDRO_OUTPUT", label: "Production d’hydroélectricité", category: "Rapport sur la capacité et la production des générateurs" },

    { value: "RESIDENTIAL_RETAILER", label: "Fournisseur résidentiel", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "RESIDENTIAL_TIERED", label: "Tarification par paliers – résidentiel", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "RESIDENTIAL_TOU", label: "Tarification selon l’heure d’utilisation – résidentiel", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "RESIDENTIAL_ULO", label: "Tarif ultra bas de nuit – résidentiel", category: "Consommation horaire par région de tri d’acheminement" },

    { value: "SGS_50KW_RETAILER", label: "Fournisseur – petits services généraux (<50 kW)", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "SGS_50KW_TIERED", label: "Tarification par paliers – petits services généraux (<50 kW)", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "SGS_50KW_TOU", label: "Tarification selon l’heure d’utilisation – petits services généraux (<50 kW)", category: "Consommation horaire par région de tri d’acheminement" },
    { value: "SGS_50KW_ULO", label: "Tarif ultra bas de nuit – petits services généraux (<50 kW)", category: "Consommation horaire par région de tri d’acheminement" },

    { value: "IMPORT", label: "Importations", category: "Rapport sur les flux d’énergie et les horaires d’interconnexions" },

    { value: "IRON_STEEL", label: "Sidérurgie", category: "Rapport sur la charge industrielle par secteur" },
    { value: "LDC", label: "Sociétés de distributions locales (SDL)", category: "Rapport sur la charge industrielle par secteur" },
    { value: "MANU_FACTR", label: "Fabrication", category: "Rapport sur la charge industrielle par secteur" },

    { value: "MARKET_DEMAND", label: "Demande du marché", category: "Rapport sur la demande horaire" },
    { value: "ONTARIO_DEMAND", label: "Demande de l'Ontario", category: "Rapport sur la demande horaire" },

    { value: "METAL_ORE", label: "Extraction de minerais métalliques", category: "Rapport sur la charge industrielle par secteur" },
    { value: "MOTOR_VEHICLE", label: "Fabrication de véhicules automobiles", category: "Rapport sur la charge industrielle par secteur" },
    { value: "OTHER_INDSTR", label: "Autres consommateurs industriels", category: "Rapport sur la charge industrielle par secteur" },
    { value: "PETRO_COAL", label: "Produits du pétrole et du charbon", category: "Rapport sur la charge industrielle par secteur" },
    { value: "PULP_PAPER", label: "Usines de pâte à papier et de papier", category: "Rapport sur la charge industrielle par secteur" },

    { value: "SOLAR_AVAILABLE_CAPACITY", label: "Capacité solaire disponible", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "SOLAR_CAPABILITY", label: "Prévisions solaires", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "SOLAR_OUTPUT", label: "Production solaire", category: "Rapport sur la capacité et la production des générateurs" },

    { value: "WIND_AVAILABLE_CAPACITY", label: "Capacité éolienne disponible", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "WIND_CAPABILITY", label: "Prévisions éoliennes", category: "Rapport sur la capacité et la production des générateurs" },
    { value: "WIND_OUTPUT", label: "Production éolienne", category: "Rapport sur la capacité et la production des générateurs" }
  ],

  "Alberta": [
    { value: "POOL_PRICE", label: "Prix commun de l’Alberta" },
    { value: "COAL", label: "Charbon (discontinué)" },
    { value: "COGENERATION", label: "Cogénération" },
    { value: "COMBINED_CYCLE", label: "Cycle combiné" },
    { value: "DUAL_FUEL", label: "Bi-carburant (discontinué)" },
    { value: "GAS", label: "Gaz (discontinué)" },
    { value: "GAS_FIRED_STEAM", label: "Production de vapeur à partir du gaz naturel" },
    { value: "HYDRO", label: "Hydroélectricité" },
    { value: "INTERNAL_LOAD", label: "Charge interne" },
    { value: "NET_ACTUAL_INTERCHANGE", label: "Échanges réels nets" },
    { value: "NSI", label: "Échanges programmés nets" },
    { value: "OTHER", label: "Autres" },
    { value: "SIMPLE_CYCLE", label: "Cycle simple" },
    { value: "SOLAR", label: "Solaire" },
    { value: "SYSTEM_MARGINAL_PRICE", label: "Prix marginal du système" },
    { value: "TOTAL_NET_GENERATION", label: "Production totale nette" },
    { value: "WIND", label: "Éolien" }
  ],

  "Saskatchewan": [
    { value: "COAL", label: "Charbon" },
    { value: "HYDRO", label: "Hydroélectricité" },
    { value: "IMPORTS_EXPORTS", label: "Importations / exportations" },
    { value: "NATURAL_GAS", label: "Gaz naturel" },
    { value: "OTHER", label: "Autres" },
    { value: "POWER_GENERATED", label: "Électricité générée" },
    { value: "SOLAR", label: "Solaire" },
    { value: "SYSTEM_DEMAND", label: "Demande du système" },
    { value: "WIND", label: "Éolien" }
  ],

  "Colombie-Britannique": [
    { value: "LOAD", label: "Charge" },
    { value: "NSI", label: "Échanges programmés nets" }
  ],

  "Yukon": [
    { value: "HYDRO", label: "Hydroélectricité" },
    { value: "SOLAR", label: "Solaire" },
    { value: "THERMAL", label: "Thermique" },
    { value: "TOTAL", label: "Charge totale" },
    { value: "WIND", label: "Éolien" }
  ]
};


// ## APPLICATION STATE
let currentData = null;       // Filtered data currently displayed
let dataCache = {};           // Cache to avoid duplicate API calls

// ## DOM ELEMENTS (cached for performance)
const provinceSelect = document.getElementById('province-select');
const energyVarSelect = document.getElementById('energy-var-select');
const counterpartAreaGroup = document.getElementById('counterpart-area-group');
const counterpartAreaSelect = document.getElementById('counterpart-area-select');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const updateBtn = document.getElementById('update-btn');
const downloadBtn = document.getElementById('download-btn');
const chartContainer = document.getElementById('chart-container');
const tableContainer = document.getElementById('table-container');
const apiUrlsContainer = document.getElementById('api-urls');
const loadingSpinner = document.getElementById('loading-spinner');

let startDatePicker, endDatePicker;

// Init Flatpickr after DOM ready
function initDatePickers() {
    startDatePicker = flatpickr("#start-date", {
        locale: "fr",
        dateFormat: "Y-m-d",
        allowInput: false,
        onChange: function(selectedDates, dateStr) {
            startDateInput.value = dateStr;
        }
    });
    
    endDatePicker = flatpickr("#end-date", {
        locale: "fr",
        dateFormat: "Y-m-d",
        allowInput: false,
        onChange: function(selectedDates, dateStr) {
            endDateInput.value = dateStr;
        }
    });
}

// =============================================================================
// ## UTILITY/HELPER FUNCTIONS
// =============================================================================

// Determines data frequency (Hourly 'H' vs Minutely 'N') for API query
function getFrequency(province, energyVar) {
    if (province === "Québec" && ["HYDRO", "OTHER", "SOLAR", "THERMAL", "TOTAL_PRODUCTION", "WIND"].includes(energyVar)) {
        return "H";     // Hourly data
    }
    return "N";         // Minutely
}

// Formats date for API date parameters (YYYY-MM-DD)
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Returns default 90-day date range for initial load
function getPast90Days() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    return [startDate, endDate];
}

// Province-specific minimum available dates
function getMinStartDate(province, energyVar) {
    // 1) Province-level default
    let minStartDate;

    switch (province) {
        case "Terre-Neuve":
            minStartDate = new Date("2022-09-13");
            break;
        case "Île-du-Prince-Édouard":
            minStartDate = new Date("2012-11-13");
            break;
        case "Nouvelle-Écosse":
            minStartDate = new Date("2022-02-20");
            break;
        case "Nouveau-Brunswick":
            minStartDate = new Date("2016-01-01");
            break;
        case "Québec":
            minStartDate = new Date("2016-01-01");
            break;
        case "Ontario":
            minStartDate = new Date("2002-05-01");
            break;
        case "Alberta":
            minStartDate = new Date("2023-02-07");
            break;
        case "Saskatchewan":
            minStartDate = new Date("2024-09-29");
            break;
        case "Colombie-Britannique":
            minStartDate = new Date("2001-04-01");
            break;
        case "Yukon":
            minStartDate = new Date("2024-10-09");
            break;
        default:
            minStartDate = new Date("2001-01-01"); // fallback
    }

    // 2) Variable-specific overrides

    // Île-du-Prince-Édouard
    if (province === "Île-du-Prince-Édouard" && energyVar === "IMPORT_CABLES") {
        minStartDate = new Date("2018-10-30");
    }

    // Nouvelle-Écosse
    else if (province === "Nouvelle-Écosse" && energyVar === "WIND") {
        minStartDate = new Date("2022-12-07");
    }

    // Nouveau-Brunswick
    else if (province === "Nouveau-Brunswick") {
        if (["RM_10", "RM_30"].includes(energyVar)) {
            minStartDate = new Date("2021-03-25");
        } else if (energyVar === "SRM_10") {
            minStartDate = new Date("2024-08-19");
        }
    }

    // Québec
    else if (province === "Québec") {
        if (energyVar === "DEMAND") {
            minStartDate = new Date("2019-01-01");
        } else if (
            ["HYDRO", "OTHER", "SOLAR", "THERMAL", "TOTAL_PRODUCTION", "WIND"]
                .includes(energyVar)
        ) {
            minStartDate = new Date("2021-10-05");
        } else if (
            ["EXPORT", "EXPORT_TOTAL", "IMPORT_GAS", "IMPORT_HYDRO", "IMPORT_NUCLEAR", "IMPORT_TOTAL", "IMPORT_UNKNOWN", "IMPORT_WIND"]
                .includes(energyVar)
        ) {
            minStartDate = new Date("2025-04-01");
        }
    }

    // Ontario
    else if (province === "Ontario") {
        if (["RESIDENTIAL_RETAILER", "SGS_50KW_TOU"].includes(energyVar)) {
            minStartDate = new Date("2018-01-01");
        } else if (
            ["DIRECT_CONNECT", "ELEC_POWER", "IRON_STEEL", "LDC", "MANU_FACTR", "METAL_ORE", "MOTOR_VEHICLE", "OTHER_INDSTR", "PETRO_COAL", "PULP_PAPER"]
                .includes(energyVar)
        ) {
            minStartDate = new Date("2019-01-01");
        } else if (energyVar === "SGS_50KW_RETAILER") {
            minStartDate = new Date("2019-03-01");
        } else if (
            ["BIOFUEL_CAPABILITY", "BIOFUEL_OUTPUT","GAS_CAPABILITY", "GAS_OUTPUT","HYDRO_CAPABILITY", "HYDRO_OUTPUT","NUCLEAR_CAPABILITY", "NUCLEAR_OUTPUT", "SOLAR_AVAILABLE_CAPACITY",
             "SOLAR_CAPABILITY", "SOLAR_OUTPUT", "WIND_AVAILABLE_CAPACITY", "WIND_CAPABILITY", "WIND_OUTPUT"]
                .includes(energyVar)
        ) {
            minStartDate = new Date("2019-05-01");
        } else if (energyVar === "RESIDENTIAL_TIERED") {
            minStartDate = new Date("2020-11-01");
        } else if (energyVar === "RESIDENTIAL_TOU") {
            minStartDate = new Date("2023-09-22");
        } else if (energyVar === "SGS_50KW_TIERED") {
            minStartDate = new Date("2023-10-18");
        } else if (energyVar === "SGS_50KW_ULO") {
            minStartDate = new Date("2024-05-01");
        } else if (energyVar === "RESIDENTIAL_ULO") {
            minStartDate = new Date("2024-08-17");
        } else if (["EXPORT", "FLOW", "IMPORT"].includes(energyVar)) {
            minStartDate = new Date("2024-11-19");
        }
    }

    // Alberta
    else if (province === "Alberta") {
        if (energyVar === "SYSTEM_MARGINAL_PRICE") {
            minStartDate = new Date("2024-05-06");
        } else if (energyVar === "POOL_PRICE") {
            minStartDate = new Date("2024-05-07");
        } else if (
            ["COGENERATION", "COMBINED_CYCLE", "GAS_FIRED_STEAM", "SIMPLE_CYCLE"]
                .includes(energyVar)
        ) {
            minStartDate = new Date("2025-01-04");
        }
    }

    // Colombie-Britannique
    else if (province === "Colombie-Britannique" && energyVar === "NSI") {
        minStartDate = new Date("2007-01-01");
    }

    return minStartDate;
}

// Resizes Plotly chart when container changes size
function resizeChart() {
    const el = document.getElementById('chart-container');
    if (el && el.data && el.layout) {
        Plotly.Plots.resize(el);
    }
}

// =============================================================================
// ## API URL BUILDER
// Constructs complete SDMX REST API URL with parameters
// =============================================================================
function buildApiUrl(province, energyVar, startDate, endDate) {
    const dataflow = PROVINCE_DATAFLOWS[province];
    const freq = getFrequency(province, energyVar);
    
    // Full syntax: /CCEI,DF_HFED_XX,1.0/{FREQ}...{VARIABLE}
    if (startDate && endDate) {
        return `${BASE_URL_PREFIX}${dataflow},1.0/${freq}...${energyVar}?startPeriod=${formatDate(startDate)}&endPeriod=${formatDate(endDate)}${BASE_URL_SUFFIX}&format=csv`;
    }
    
    // No date range = full historical dataset
    return `${BASE_URL_PREFIX}${dataflow},1.0/${freq}...${energyVar}?${BASE_URL_SUFFIX}&format=csv`;
}

// =============================================================================
// ## DATA FETCHING & PROCESSING
// =============================================================================
// Fetches CSV data from CCEI API and applies province-specific post-processing
async function fetchData(province, energyVar, startDate, endDate) {
    const url = buildApiUrl(province, energyVar, startDate, endDate);
    
    try {
        showLoading(true);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        let data = parseCSV(csvText);

        // ## PROVINCE-SPECIFIC DATA CLEANING
        data = applyProvincePostProcessing(data, province, energyVar);

        // Cache raw data for reuse
        const cacheKey = `${province}-${energyVar}`;
        dataCache[cacheKey] = data;
        
        return data;
    } catch (error) {
        console.error('API fetch failed:', error);
        return null;
    } finally {
        showLoading(false);
    }
}

/**
 * Province-specific data cleaning and standardization
 * Handles quirks in real CCEI data responses
 */
function applyProvincePostProcessing(data, province, energyVar) {
    // 1. Saskatchewan: Sort by local datetime (API returns unsorted)
    if (province === "Saskatchewan") {
        data.sort((a, b) => {
            const da = new Date(a.DATETIME_LOCAL || a.TIME_PERIOD);
            const db = new Date(b.DATETIME_LOCAL || b.TIME_PERIOD);
            return da - db;
        });
    }

    // 2. Standardize COUNTERPART_AREA (replace _Z with N/A, ensure exists)
    data.forEach(row => {
        row.COUNTERPART_AREA = row.COUNTERPART_AREA === "_Z" ? "N/A" : 
                               (row.COUNTERPART_AREA || "");
    });

    // 3. Fix UNIT_MEASURE inconsistencies
    data.forEach(row => {
        // PEI: WIND_PERCENT should be % not MW
        if (province === "Île-du-Prince-Édouard" && energyVar === "WIND_PERCENT" && row.UNIT_MEASURE === "MW") {
            row.UNIT_MEASURE = "%";
        }
        // Nouveau-Brunswick: All values should be MWh despite API saying MW
        if (province === "Nouveau-Brunswick" && row.UNIT_MEASURE === "MW") {
            row.UNIT_MEASURE = "MWh";
        }
    });

    return data;
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
    });
    
    return data;
}

// =============================================================================
// ## UI STATE UPDATES
// =============================================================================

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    chartContainer.style.opacity = show ? '0.5' : '1';
}

// Updates energy variable dropdown with province-specific options
// Québec/Ontario: Uses <optgroup> by category. Others: Simple sorted list.
function updateEnergyVarSelect() {
    const province = provinceSelect.value;
    const vars = ENERGY_VARS[province] || [];

    if (province === "Québec" || province === "Ontario") {
        // group by category and sort
        const byCategory = {};
        vars.forEach(v => {
            const cat = v.category || 'Other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(v);
        });

        // sort categories and labels
        const sortedCategories = Object.keys(byCategory).sort((a, b) => a.localeCompare(b));
        sortedCategories.forEach(cat => {
            byCategory[cat].sort((a, b) => a.label.localeCompare(b.label));
        });

        // build optgroups HTML
        let html = '';
        sortedCategories.forEach(cat => {
            html += `<optgroup label="${cat}">`;
            byCategory[cat].forEach(v => {
                html += `<option value="${v.value}">${v.label}</option>`;
            });
            html += '</optgroup>';
        });
        energyVarSelect.innerHTML = html;
    } else {
        // Simple alphabetical list for other provinces
        const sorted = [...vars].sort((a, b) => a.label.localeCompare(b.label));
        energyVarSelect.innerHTML = sorted
            .map(v => `<option value="${v.value}">${v.label}</option>`)
            .join('');
    }

    updateCounterpartAreaSelect();
}

// Shows/hides counterpart area filter based on province + variable combination
function updateCounterpartAreaSelect() {
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;
    const labelElement = counterpartAreaGroup.querySelector('label');
    
    // Reset state
    counterpartAreaGroup.style.display = 'none';
    counterpartAreaSelect.innerHTML = '';
    labelElement.textContent = 'Zone de contrepartie'; // Default label
    
    let options = [];

    // Province-specific filtering logic
    // Nouvelle-Écosse Logic
    if (province === "Nouvelle-Écosse") {
        if (energyVar === "EXPORT") {
            options = ["CA_NS_SD", "CA_NS_CB", "CA_NS_HL", "CA_NS_EB", "CA_NS"];
        } else if (energyVar === "IMPORT") {
            options = ["CA_NS_W", "CA_NS_OL", "CA_NS_V", "CA_NS_ML"];
        } else if (energyVar === "NSI") {
            options = ["CA_NS_MT", "CA_NS_OLS"];
        }
    } 
    // Nouveau-Brunswick Logic
    else if (province === "Nouveau-Brunswick" && energyVar === "NSI") {
        options = ["CA_QC", "US_MPS", "CA_NS", "US_EMEC", "CA_PEI", "US_NE"];
    }
    // Alberta Logic
    else if (province === "Alberta" && energyVar === "NSI") {
        options = ["CA_SK", "US_MT", "CA_BC"];
    }
    // Colombie-Britannique Logic
    else if (province === "Colombie-Britannique" && energyVar === "NSI") {
        options = ["US", "CA_AB"];
    }
    // Québec Logic
    else if (province === "Québec") {
        if (["AGRICOLE", "COMMERCIAL", "INDUSTRIEL", "INSTITUTIONNEL", "RESIDENTIEL"]
            .includes(energyVar)) {
            options = ["CA_ABITIBI_TEMISCAMINGUE", "CA_BAS_SAINT_LAURENT", "CA_CAPITALE_NATIONALE", "CA_CENTRE_DU_QUEBEC", "CA_CHAUDIERE_APPALACHES", "CA_COTE_NORD", "CA_ESTRIE", 
                        "CA_GASPESIE_ILES_DE_LA_MADELEINE", "CA_LANAUDIERE", "CA_LAURENTIDES",  "CA_LAVAL", "CA_MAURICIE", "CA_MONTEREGIE", "CA_MONTREAL", "CA_NORD_DU_QUEBEC", 
                        "CA_OUTAOUAIS", "CA_SAGUENAY_LAC_SAINT_JEAN"];
        }
        else if (["EXPORT", "IMPORT_GAS", "IMPORT_HYDRO", "IMPORT_NUCLEAR", "IMPORT_TOTAL", "IMPORT_UNKNOWN", "IMPORT_WIND"]
            .includes(energyVar)) {
            options = ["CA_NEW_BRUNSWICK", "CA_NY", "CA_ON", "US_NE"];
        }
    }
    // Ontario Logic
    else if (province === "Ontario") {
        // Generator-specific variables (Label becomes "Generator")
        const generatorVars = [
            "BIOFUEL_CAPABILITY", "BIOFUEL_OUTPUT", 
            "GAS_CAPABILITY", "GAS_OUTPUT", 
            "HYDRO_CAPABILITY", "HYDRO_OUTPUT", 
            "NUCLEAR_CAPABILITY", "NUCLEAR_OUTPUT", 
            "SOLAR_AVAILABLE_CAPACITY", "SOLAR_CAPABILITY", "SOLAR_OUTPUT", 
            "WIND_AVAILABLE_CAPACITY", "WIND_CAPABILITY", "WIND_OUTPUT"
        ];

        if (generatorVars.includes(energyVar)) {
            labelElement.textContent = 'Generator';
            
            if (energyVar.includes("BIOFUEL")) {
                options = ["CA_ATIKOKAN_G1", "CA_CALSTOCKGS", "CA_TBAYBOWATER_CTS"];
            } else if (energyVar.includes("GAS")) {
                options = ["CA_BRIGHTON_BEACH", "CA_CARDINAL", "CA_COCHRANECGS", "CA_DESTEC", "CA_DOWCHEMICAL", "CA_DPNTMTLND", "CA_EAST_WINDSOR_G1", "CA_EAST_WINDSOR_G2",
                            "CA_GREENFIELD_ENERGY_CENTRE_G1", "CA_GREENFIELD_ENERGY_CENTRE_G2", "CA_GREENFIELD_ENERGY_CENTRE_G3", "CA_GREENFIELD_ENERGY_CENTRE_G4",
                            "CA_GREENFIELD_SOUTH_G1", "CA_GREENFIELD_SOUTH_G2", "CA_GTAA_G1", "CA_GTAA_G2", "CA_GTAA_G3", "CA_HALTONHILLS_LT_G1", "CA_HALTONHILLS_LT_G2", 
                            "CA_HALTONHILLS_LT_G3", "CA_KAPGS", "CA_LAKESUPERIOR", "CA_LENNOX_G1", "CA_LENNOX_G2", "CA_LENNOX_G3", "CA_LENNOX_G4", "CA_NAPANEE_G1", "CA_NAPANEE_G2", 
                            "CA_NAPANEE_G3", "CA_NIPIGONGS", "CA_NORTHBAYGS",  "CA_NPIROQFALLS", "CA_NPKIRKLAND_G1_G5", "CA_NPKIRKLAND_G6", "CA_PORTLANDS_G1", "CA_PORTLANDS_G2", 
                            "CA_PORTLANDS_G3", "CA_SITHE_GOREWAY_G11", "CA_SITHE_GOREWAY_G12", "CA_SITHE_GOREWAY_G13", "CA_SITHE_GOREWAY_G15", "CA_STCLAIRCGS", "CA_TAOHSC", 
                            "CA_TASARNIA", "CA_TAWINDSOR", "CA_THOROLDCGS", "CA_TUNISGS", "CA_WESTWINDSOR", "CA_WHITBYCGS", "CA_YORKCGS_G1", "CA_YORKCGS_G2"];
            } else if (energyVar.includes("HYDRO")) {
                options = ["CA_ABKENORA", "CA_AGUASABON", "CA_ALEXANDER", "CA_APIROQUOIS", "CA_ARNPRIOR", "CA_AUBREYFALLS", "CA_BARRETT", "CA_BECK1", "CA_BECK2", "CA_BECK2_PGS", 
                            "CA_CAMERONFALLS", "CA_CANYON", "CA_CARIBOUFALLS", "CA_CARMICHAEL", "CA_CHATSFALLS", "CA_CHENAUX", "CA_CLERGUE", "CA_DA_WATSON", "CA_DECEWFALLS", 
                            "CA_DECEWND1", "CA_DESJOACHIMS", "CA_EARFALLS", "CA_FORTFRANCSWC", "CA_GARTSHORE", "CA_HARMON", "CA_HARMON_2", "CA_HARRIS", "CA_HOLDEN", "CA_HOLINGSWTH", 
                            "CA_KAKABEKA", "CA_KIPLING", "CA_KIPLING_2", "CA_LITTLELONG", "CA_LITTLELONG_2", "CA_LONGSAULTE", "CA_LOWER_WHITE_RIVER", "CA_LOWERNOTCH", "CA_MACKAYGS", 
                            "CA_MANITOUFALLS", "CA_MISSION", "CA_MTNCHUTE", "CA_NAGAGAMI", "CA_OTTERRAPIDS", "CA_PETER_SUTHERLAND_SR", "CA_PINEPORTAGE", "CA_RAYNER", "CA_REDROCK",
                            "CA_SAUNDERS", "CA_SILVERFALLS", "CA_SMOKY_2", "CA_STEEPHILL", "CA_STEWARTVLE", "CA_UMBATAFALLS", "CA_UPPER_WHITE_RIVER", "CA_WELLS", "CA_WHITEDOG"];
            } else if (energyVar.includes("NUCLEAR")) {
                options = ["CA_BRUCEA_G1", "CA_BRUCEA_G2", "CA_BRUCEA_G3", "CA_BRUCEA_G4", "CA_BRUCEB_G5", "CA_BRUCEB_G6", "CA_BRUCEB_G7", "CA_BRUCEB_G8", "CA_DARLINGTON_G1", 
                            "CA_DARLINGTON_G2", "CA_DARLINGTON_G3", "CA_DARLINGTON_G4", "CA_PICKRINGA_G1", "CA_PICKERINGA_G4", "CA_PICKERINGB_G5", "CA_PICKERINGB_G6", "CA_PICKERINGB_G7",
                            "CA_PICKERINGB_G8"];
            } else if (energyVar.includes("SOLAR")) {
                options = ["CA_GRANDSF", "CA_KINGSTONSF", "CA_NANTICOKE_SOLAR", "CA_NORTHLAND_POWER_SOLAR_FACILITIES", "CA_SOUTHGATE_SF", "CA_STONE_MILLS_SF", "CA_WINDSOR_AIRPORT_SF"];
            } else if (energyVar.includes("WIND")) {
                options = ["CA_ADELAIDE", "CA_AMARANTH", "CA_AMHERST_ISLAND", "CA_ARMOW", "CA_BELLE_RIVER",  "CA_BLAKE", "CA_BORNISH", "CA_BOW_LAKE", "CA_BOW_LAKE_2", "CA_CEDAR_POINT_2",
                            "CA_COMBER", "CA_CRYSLER", "CA_DILLON", "CA_EAST_LAKE", "CA_ERIEAU", "CA_GOSFIELDWGS", "CA_GOSHEN", "CA_GOULAIS", "CA_GRAND_VALLEY_3", "CA_GRANDWF", 
                            "CA_GREENWICH", "CA_HENVEY_NORTH", "CA_HENVEY_SOUTH", "CA_JERICHO", "CA_K2WIND", "CA_KINGSBRIDGE", "CA_LANDON", "CA_MCLEANSMTNWF_LT_AG_T1", "CA_NORTH_KENT", 
                            "CA_PAROCHES", "CA_PORT_BURWELL", "CA_PORTALMA_T1", "CA_PORTALMA_T3", "CA_PRINCEFARM", "CA_RAILBEDWF_LT_AG_SR", "CA_RIPLEY_SOUTH", "CA_ROMNEY", 
                            "CA_SANDUSK_LT_AG_T1", "CA_SHANNON", "CA_SPENCE", "CA_SUMMERHAVEN", "CA_UNDERWOOD", "CA_WEST_LINCOLN_NRWF", "CA_WOLFE_ISLAND", "CA_ZURICH"];
            }
        } 
        else if (["IMPORT", "EXPORT", "FLOW"].includes(energyVar)) {
            options = ["CA_MAN", "CA_MAN_SK", "CA_MICH", "CA_MINN", "CA_NY", "PQ_AT", "PQ_B5D_B31L", "PQ_D4Z", "PQ_D5A", "PQ_H4A", "PQ_H9A", "PQ_P33C", "PQ_Q4C", "PQ_X2Y"];
        }
    }

    // If options exist, populate and show the dropdown
    if (options.length > 0) {
        counterpartAreaSelect.innerHTML = options.map(opt => 
            `<option value="${opt}">${opt}</option>`
        ).join('');
        counterpartAreaGroup.style.display = 'flex';
        
        // Trigger data load for the new default selection
        loadData();
    }
}

// Updates date inputs with province min date and 90-day default range
function updateDateInputs() {
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;
    const [startDate, endDate] = getPast90Days();

    const minDate = getMinStartDate(province, energyVar);
    const effectiveStart = startDate > minDate ? startDate : minDate;

    startDateInput.value = formatDate(effectiveStart);
    endDateInput.value = formatDate(endDate);
    startDateInput.min = formatDate(minDate);
    startDateInput.max = formatDate(new Date()); // max start date
    endDateInput.max = formatDate(new Date()); // max end date
}

function updateFlatpickrMinDate() {
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;
    const minDate = getMinStartDate(province, energyVar);
    const maxDate = new Date();  // Today
    
    const [start90, end90] = getPast90Days();
    const effectiveStart = start90 < minDate ? minDate : start90;
    
    // SET CONSTRAINTS FIRST
    if (startDatePicker) {
        startDatePicker.set('minDate', minDate);
        startDatePicker.set('maxDate', maxDate);
        startDatePicker.setDate(effectiveStart);  // Now works
    }
    
    if (endDatePicker) {
        endDatePicker.set('minDate', minDate);
        endDatePicker.set('maxDate', maxDate);
        endDatePicker.setDate(end90);
    }
    
    // Sync inputs
    startDateInput.value = formatDate(effectiveStart);
    endDateInput.value = formatDate(end90);
}

// =============================================================================
// ## VISUALIZATION RENDERING
// =============================================================================
// Renders interactive Plotly time series chart
function renderChart(data, province, energyVar) {
    // Clear container FIRST, no early message
    chartContainer.innerHTML = '';
    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<p>Aucune donnée disponible pour la période sélectionnée</p>';
        return;
    }
    
    const energyVarLabel = ENERGY_VARS[province].find(v => v.value === energyVar)?.label || energyVar;

    // Returns French preposition for "dans/en/au Québec" style phrasing
    function getProvincePreposition(province) {
    const prepositionMap = {
        "Terre-Neuve": "à",
        "Île-du-Prince-Édouard": "à",
        "Nouvelle-Écosse": "en",
        "Nouveau-Brunswick": "au",
        "Québec": "au",
        "Ontario": "en",
        "Alberta": "en",
        "Saskatchewan": "en",
        "Colombie-Britannique": "en",
        "Yukon": "au"
    };
    return prepositionMap[province] || "en";  // Default "en" if not found
    }
    
    const preposition = getProvincePreposition(province);
    
    // Prepare data for Plotly
    const xData = data.map(row => row.DATETIME_LOCAL || row.TIME_PERIOD);
    const yData = data.map(row => parseFloat(row.OBS_VALUE));
    
    const trace = {
    x: xData,
    y: yData,
    type: 'scatter',
    mode: 'lines',
    name: energyVarLabel,
    line: { color: '#036BDB', width: 2 },
    hoverlabel: {
        bgcolor: '#036BDB',   // same as line.color
        bordercolor: '#333',
        font: { color: '#ffffff' }
    },
    hovertemplate:
        '<b>%{fullData.name}</b><br>' +
        'Valeur observée : %{y}<br>' +
        'La date et l\'heure : %{x}' +
        '<extra></extra>'
    };
    
    const layout = {
        title: `${energyVarLabel} ${preposition} ${province}`,
        xaxis: {
            title: 'La date et l\'heure',
            tickformat: '%Y-%m-%d<br>%H:%M'
        },
        yaxis: {
            title: getYAxisLabel(province, energyVar)
        },
        margin: { t: 50, r: 40, l: 60, b: 80 },
        hovermode: 'closest'
    };
    
    const config = {
        responsive: true,
        displayModeBar: false,
    };
    
    Plotly.newPlot('chart-container', [trace], layout, config);
}

// Get Y-axis label
function getYAxisLabel(province, energyVar) {
    if (province === "Île-du-Prince-Édouard" && energyVar === "WIND_PERCENT") {
        return "Percent (%)";
    }
    if (province === "Nouveau-Brunswick") {
        return "MWh";
    }
    if (province === "Ontario" && energyVar === "HOEP") {
        return "Dollars canadiens";
    }
    if (province === "Alberta" && ["POOL_PRICE", "SYSTEM_MARGINAL_PRICE"].includes(energyVar)) {
        return "Dollars canadiens";
    }
    return "MW";
}

// Renders paginated data table with navigation
function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>Aucune donnée disponible pour la période sélectionnée</p>';
        return;
    }

    pagedData = data;        // store full dataset for paging
    currentPage = 1;         // reset to first page
    renderTablePage();
}

function renderTablePage() {
    if (!pagedData || pagedData.length === 0) {
        tableContainer.innerHTML = '<p>Aucune donnée disponible pour la période sélectionnée</p>';
        return;
    }

    const headers = Object.keys(pagedData[0]);

    const displayHeaders = [
        'DATAFLOW',
        'REF_AREA',
        'COUNTERPART_AREA',
        'ENERGY_FLOWS',
        'TIME_PERIOD',
        'OBS_VALUE',
        'DATETIME_LOCAL',
        'UNIT_MEASURE'
    ];

    const headerLabels = {
        DATAFLOW: 'Flux de données',
        REF_AREA: 'Géographie de référence',
        COUNTERPART_AREA: 'Zone de contrepartie',
        ENERGY_FLOWS: 'Flux d\'énergie',
        TIME_PERIOD: 'Période (UTC)',
        OBS_VALUE: 'Valeur observée',
        DATETIME_LOCAL: 'Période (locale)',
        UNIT_MEASURE: 'Unité de mesure'
    };

    const totalRows = pagedData.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    const pageRows = pagedData.slice(startIdx, endIdx);

    let html = '<table><thead><tr>';
    displayHeaders.forEach(header => {
        if (headers.includes(header)) {
            html += `<th>${headerLabels[header] || header}</th>`;
        }
    });
    html += '</tr></thead><tbody>';

    pageRows.forEach(row => {
        html += '<tr>';
        displayHeaders.forEach(header => {
            if (headers.includes(header)) {
                html += `<td>${row[header] ?? ''}</td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    // footer like DataTables: "Showing 1 to 10 of 2,863 entries  Prev 1 2 3 ... Next"
    html += `<div class="table-footer">
        <div class="table-info">
            Affichage de ${startIdx + 1} à ${endIdx} sur ${totalRows} entrées
        </div>
        <div class="table-pagination">
            <button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>Précédent</button>
            ${buildPageButtons(currentPage, totalPages)}
            <button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Suivant</button>
        </div>
    </div>`;

    tableContainer.innerHTML = html;

    // attach events for buttons
    tableContainer.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.page;
            if (target === 'prev' && currentPage > 1) currentPage--;
            else if (target === 'next' && currentPage < totalPages) currentPage++;
            else if (!isNaN(parseInt(target))) currentPage = parseInt(target);
            renderTablePage();
        });
    });
}

function buildPageButtons(current, total) {
    // simple: show first, last, current, neighbors with ellipsis
    const pages = [];
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - current) <= 1) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    return pages.map(p => {
        if (p === '...') {
            return `<span class="page-ellipsis">…</span>`;
        }
        const active = p === current ? 'active' : '';
        return `<button class="page-btn ${active}" data-page="${p}">${p}</button>`;
    }).join('');
}


// Update API URLs display
function updateApiUrls() {
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // Full dataset URLs
    const csvUrl = buildApiUrl(province, energyVar, null, null);
    const xmlUrl = csvUrl.replace('&format=csv', '');
    
    // Date-range example URL
    const csvUrlDate = buildApiUrl(province, energyVar, startDate, endDate)
        .replace(/startPeriod=[^&]+/, 'startPeriod=YYYY-MM-DD')
        .replace(/endPeriod=[^&]+/, 'endPeriod=YYYY-MM-DD');;
    
    const infoText = `Pour récupérer l’ensemble de la série historique, utilisez :
URL IPA (format CSV) : ${csvUrl}
URL IPA (format XML) : ${xmlUrl}

Pour réduire la durée de téléchargement, veuillez sélectionner une plage de dates personnalisée :
Remplacez YYYY-MM-DD par les dates souhaitées :
Exemple (format CSV) : ${csvUrlDate}`;

    apiUrlsContainer.textContent = infoText;
}



// Download data as CSV
// Build *download* dataset from live UI state, ignoring any stale currentData
async function downloadData() {
  const province  = provinceSelect.value;
  const energyVar = energyVarSelect.value;

  // Get fresh dates directly from inputs so "Update data" click is not required
  const startDate = new Date(startDateInput.value);
  const endDate   = new Date(endDateInput.value);

  // Sanity check
  if (!startDateInput.value || !endDateInput.value) {
    alert("Veuillez sélectionner une date de début et de fin valide avant de télécharger.");
    return;
  }

  // Frequency and URL consistent with the rest of the app
  const url = buildApiUrl(province, energyVar, startDate, endDate);

  try {
    showLoading(true);  // optional; you already have this helper

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Download request failed with status " + response.status);
    }

    let data = parseCSV(await response.text());  // same parser used elsewhere

    //  post-processing

    // 1) COUNTERPART_AREA: "_Z" -> "N/A"
    data.forEach(row => {
      if (row.COUNTERPART_AREA === "_Z") {
        row.COUNTERPART_AREA = "N/A";
      }
    });

    // 2) UNIT_MEASURE fixes:
    // PEI: WIND_PERCENT -> replace "MW" with "%"
    if (province === "Île-du-Prince-Édouard" && energyVar === "WINDPERCENT") {
      data.forEach(row => {
        if (row.UNIT_MEASURE) {
          row.UNIT_MEASURE = row.UNIT_MEASURE.replace(/MW/g, "%");
        }
      });
    }

    // Nouveau-Brunswick: all "MW" -> "MWh"
    if (province === "Nouveau-Brunswick") {
      data.forEach(row => {
        if (row.UNIT_MEASURE) {
          row.UNIT_MEASURE = row.UNIT_MEASURE.replace(/MW/g, "MWh");
        }
      });
    }

    // 3) Format numeric OBS_VALUE with thousands separator + right align
    //    - Convert to number, format with locale, then pad.
    const numericCol = "OBS_VALUE";

    // Convert to numbers where possible
    data.forEach(row => {
      if (row[numericCol] !== undefined && row[numericCol] !== null && row[numericCol] !== "") {
        const num = Number(row[numericCol]);
        if (!Number.isNaN(num)) {
          // Thousand separator
          row[numericCol] = num.toLocaleString("en-CA"); // e.g. "12,345.67"
        }
      }
    });

    // Right-align: pad all values to the max width (as text)
    let maxLen = 0;
    data.forEach(row => {
      if (row[numericCol] != null) {
        maxLen = Math.max(maxLen, String(row[numericCol]).length);
      }
    });

    data.forEach(row => {
      if (row[numericCol] != null) {
        const v = String(row[numericCol]);
        row[numericCol] = v.padStart(maxLen, " ");
      }
    });

    // 4) Rename columns
    const colNamesMapping = {
      "DATAFLOW":       "Flux de données",
      "REF_AREA":       "Géographie de référence",
      "COUNTERPART_AREA": "Zone de contrepartie",
      "ENERGY_FLOWS":   "Flux d'énergie",
      "TIME_PERIOD":    "Période (UTC)",
      "OBS_VALUE":      "Valeur observée",
      "DATETIME_LOCAL": "Période (locale)",
      "UNIT_MEASURE":   "Unité de mesure"
    };

    // Transform each row keys
    const renamedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        const newKey = colNamesMapping[key] || key;
        newRow[newKey] = row[key];
      });
      return newRow;
    });

    // 5) Reorder columns
    const orderedCols = [
      "Flux de données",          // 1
      "Zone de contrepartie",   // 3
      "Flux d'énergie",        // 4
      "Période (UTC)",  // 5
      "Valeur observée",  // 6
      "Période (locale)",// 7
      "Unité de mesure"        // 8
    ];

    const allKeys = Object.keys(renamedData[0] || {});
    // Take the "extra" column that is not in orderedCols but exists in data
    const extraKeys = allKeys.filter(k => !orderedCols.includes(k));
    if (extraKeys.length > 0) {
      // Use the first extra as the 9th exported column (mimics c(1,3:8,11))
      orderedCols.push(extraKeys[0]);
    }

    // Build CSV string
    const headers = orderedCols;
    let csv = headers.join(",") + "\n";

    renamedData.forEach(row => {
      const line = headers.map(h => {
        let value = row[h] != null ? String(row[h]) : "";

        // Basic CSV escaping
        if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
          value = "\"" + value.replace(/"/g, "\"\"") + "\"";
        }
        return value;
      }).join(",");
      csv += line + "\n";
    });

    // Trigger file download
    const fileName = `HFED_${province}_${energyVar}_data.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const urlObj = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = urlObj;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(urlObj);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Échec du téléchargement. Veuillez réessayer.");
  } finally {
    showLoading(false);
  }
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
        if (tabName === 'chart') {
        resizeChart();
    } else if (tabName === 'api') {
        updateApiUrls();
    }
}

// =============================================================================
// ## MAIN DATA LOADING WORKFLOW
// =============================================================================
let cachedFullData = [];  // Store full data for current province & energy var
let isRestricted = false;  // Track if current selection is restricted

// Main data loading function - handles caching, restrictions, filtering
async function loadData() {
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab

    // BLOCK LARGE ONTARIO SMARTMETER DATASETS
    // --- RESTRICTION CHECK ---
    const restrictedVars = [
        "RESIDENTIAL_RETAILER", "RESIDENTIAL_TIERED", 
        "RESIDENTIAL_TOU", "RESIDENTIAL_ULO",
        "SGS_50KW_RETAILER", "SGS_50KW_TIERED", 
        "SGS_50KW_TOU", "SGS_50KW_ULO"
    ];

    isRestricted = (province === 'Ontario' && restrictedVars.includes(energyVar));
    if (isRestricted && activeTab !== 'api') {
        
        const message = '<p style="padding: 20px; color: #666;">En raison de la taille importante du fichier, cette variable n’est pas disponible en aperçu. Veuillez télécharger le fichier ou accéder aux données par l’entremise de l’IPA (voir l\'onglet IPA pour obtenir plus de renseignements).</p>';
        
        chartContainer.innerHTML = message;
        tableContainer.innerHTML = message; // Hide table too
        return; // STOP execution here
    }
    // --- END RESTRICTION CHECK ---

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    // Check cache key
    const cacheKey = `${province}-${energyVar}-${formatDate(startDate)}-${formatDate(endDate)}`;

    if (!dataCache[cacheKey]) {
        // Fetch and cache full dataset only once per selection
        const fetchedData = await fetchData(province, energyVar, startDate, endDate);
        if (fetchedData) {
            dataCache[cacheKey] = fetchedData;
            cachedFullData = fetchedData;
        } else {
            cachedFullData = [];
        }
    } else {
        cachedFullData = dataCache[cacheKey];
    }

    filterAndRenderCurrentData();
}

// Filter cached data based on counterpart, render chart and table
function filterAndRenderCurrentData() {
    const counterpart = counterpartAreaGroup.style.display === 'none' ? null : counterpartAreaSelect.value;

    const filteredData = counterpart ? cachedFullData.filter(row =>
        row.REFERENCE_AREA === counterpart ||
        row.GENERATOR === counterpart ||
        row.COUNTERPART_AREA === counterpart
    ) : cachedFullData;

    currentData = filteredData;
    const province = provinceSelect.value;
    const energyVar = energyVarSelect.value;

    renderChart(filteredData, province, energyVar);
    renderTable(filteredData);
}

// When counterpart changes, just filter and render no fetch needed
counterpartAreaSelect.addEventListener('change', filterAndRenderCurrentData);

// Event listeners
provinceSelect.addEventListener('change', function() {
    updateEnergyVarSelect();
    updateDateInputs();
    updateCounterpartAreaSelect();
    updateFlatpickrMinDate();
    loadData();
});

energyVarSelect.addEventListener('change', function() {
    updateDateInputs();
    updateCounterpartAreaSelect();
    updateFlatpickrMinDate();
    loadData();
});


// Manual refresh + download
updateBtn.addEventListener('click', loadData);
counterpartAreaSelect.addEventListener('change', loadData);
downloadBtn.addEventListener('click', downloadData);

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateEnergyVarSelect();     // Selects first province/var
    updateDateInputs();          // Computes minDate
    initDatePickers();           // Creates pickers
    updateFlatpickrMinDate();    // Sets dates + constraints
    loadData();                  // Loads with dates
});

