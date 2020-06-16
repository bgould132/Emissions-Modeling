/* 
 * Builds the models required for the CCFC Web Model
 */

var fs = require('fs');
var d3 = require('d3');
var $ = require('jquery');

// Constants
var TOTAL_YEARS = 0;

// Value holders
var writeFile, spacing, sum, reached, i;

// Object index counters
// For looping through objects with the object keys
var county, city;
    
// Objects
var allCities, allCounties;

allCities = {};
allCounties = {};

// Keys to object (database) structure
var countyList, cityList, headersList;

// Constructors
var CtyObj;


// End Variable Declarations
//***************************************************************************//


// Constructors
//***************************************************************************//


// End Constructor Declaration
//***************************************************************************//


// Functions
//***************************************************************************//

varsInit(); // initialize variables below to save space

function writePrivate (dat, name) {
    writeFile = './data/' + name + '.json';
    spacing = 4;

    fs.writeFile(writeFile, JSON.stringify(dat, null, spacing), function (err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Full-length JSON saved to " + writeFile);
        }
    });
}

function writePublic (dat, name) {
    writeFile = './data/' + name + '-min.json';
    spacing = 0;

    fs.writeFile(writeFile, JSON.stringify(dat, null, spacing), function (err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Concise JSON saved to " + writeFile);
        }
    });
}

function writeAll (dat, name) {
    writePrivate(dat, name);
    writePublic(dat, name);
}



// End Helper Functions
//***************************************************************************//


// Program Core
//***************************************************************************//

// Load saved data files
var BGDATA = d3.csvParse((fs.readFileSync("./data/BGDATA.csv")).toString());

// Handle imported data
//=============================================================================


function allCountyCalc () {

    for (county = 0; county < countyList.length; county++) {
        reached = 0;
        cty = 0;
        cty = new CtyObj();
        for (i = 0; i < BGDATA.length; i++) {
            if (BGDATA[i].COUNTY === countyList[county]) {
                reached = 1;
                cty.CTY = countyList[county];
                cty.COUNTY = 1;
                cty.LANDAREA += BGDATA[i].LANDAREA;
                cty.PEOPLE += BGDATA[i].PEOPLE;
                cty.WORKERS += BGDATA[i].WORKERS;
                cty.HOUSEHOLDS += BGDATA[i].HOUSEHOLDS;

                cty.NumPubTrans += BGDATA[i].NumPubTrans;
                cty["Public Transit Commuters"] += BGDATA[i]["Public Transit Commuters"];
                cty["Bus Commuters"] += BGDATA[i]["Bus Commuters"];
                cty["Subway Commuters"] += BGDATA[i]["Subway Commuters"];
                cty["Railroad Commuters"] += BGDATA[i]["Railroad Commuters"];


                cty.AGE += BGDATA[i].AGE * BGDATA[i].HOUSEHOLDS;
                cty.WHITE += BGDATA[i].WHITE * BGDATA[i].HOUSEHOLDS;
                cty.BLACK += BGDATA[i].BLACK * BGDATA[i].HOUSEHOLDS;
                cty.ASIAN += BGDATA[i].ASIAN * BGDATA[i].HOUSEHOLDS;
                cty.OTHERACE += BGDATA[i].OTHERACE * BGDATA[i].HOUSEHOLDS;
                cty.CDD += BGDATA[i].CDD * BGDATA[i].HOUSEHOLDS;
                cty.HDD += BGDATA[i].HDD * BGDATA[i].HOUSEHOLDS;
                cty.WORKCNT += BGDATA[i].WORKCNT * BGDATA[i].HOUSEHOLDS;
                cty.URBAN += BGDATA[i].URBAN * BGDATA[i].HOUSEHOLDS;
                cty.HHSIZE += BGDATA[i].HHSIZE * BGDATA[i].HOUSEHOLDS;
                cty.SIZEOWN += BGDATA[i].SIZEOWN * BGDATA[i].HOUSEHOLDS;
                cty.SIZERENT += BGDATA[i].SIZERENT * BGDATA[i].HOUSEHOLDS;
                cty.GRAD += BGDATA[i].GRAD * BGDATA[i].HOUSEHOLDS; 
                cty.INCOME2013 += BGDATA[i].INCOME2013 * BGDATA[i].HOUSEHOLDS;
                cty.INCOME2007 += BGDATA[i].INCOME2007 * BGDATA[i].HOUSEHOLDS;
                cty.VEHICLES += BGDATA[i].VEHICLES * BGDATA[i].HOUSEHOLDS;
                cty.CARCOMMUTE += BGDATA[i].CARCOMMUTE * BGDATA[i].HOUSEHOLDS;
                cty.TIMETOWORK += BGDATA[i].TIMETOWORK * BGDATA[i].HOUSEHOLDS;
                cty.OWN += BGDATA[i].OWN * BGDATA[i].HOUSEHOLDS;
                cty.ROOMS += BGDATA[i].ROOMS * BGDATA[i].HOUSEHOLDS;
                cty.GAS += BGDATA[i].GAS * BGDATA[i].HOUSEHOLDS;
                cty.ELECTRIC += BGDATA[i].ELECTRIC * BGDATA[i].HOUSEHOLDS;
                cty.OIL += BGDATA[i].OIL * BGDATA[i].HOUSEHOLDS;
                cty.NOFUEL += BGDATA[i].NOFUEL * BGDATA[i].HOUSEHOLDS;
                cty.OTHERFUEL += BGDATA[i].OTHERFUEL * BGDATA[i].HOUSEHOLDS;
                cty.YEARBUILT += BGDATA[i].YEARBUILT * BGDATA[i].HOUSEHOLDS;
                cty.SINGDET += BGDATA[i].SINGDET * BGDATA[i].HOUSEHOLDS;
                cty.SQFT += BGDATA[i].SQFT * BGDATA[i].HOUSEHOLDS;
                cty.Children += BGDATA[i].Children * BGDATA[i].HOUSEHOLDS;
                cty.Adults += BGDATA[i].Adults * BGDATA[i].HOUSEHOLDS;
            }
        }
        cty.DENSITY = cty.PEOPLE / (cty.LANDAREA * 3.861 * Math.pow(10, -7));
        cty.EMPDEN = cty.WORKERS / (cty.LANDAREA * 3.861 * Math.pow(10, -7));

        cty.AGE = cty.AGE / cty.HOUSEHOLDS;
        cty.WHITE = cty.WHITE / cty.HOUSEHOLDS;
        cty.BLACK = cty.BLACK / cty.HOUSEHOLDS;
        cty.ASIAN = cty.ASIAN / cty.HOUSEHOLDS;
        cty.OTHERACE = cty.OTHERACE / cty.HOUSEHOLDS;
        cty.CDD = cty.CDD / cty.HOUSEHOLDS;
        cty.HDD = cty.HDD / cty.HOUSEHOLDS;
        cty.WORKCNT = cty.WORKCNT / cty.HOUSEHOLDS;
        cty.URBAN = cty.URBAN / cty.HOUSEHOLDS;
        cty.HHSIZE = cty.HHSIZE / cty.HOUSEHOLDS;
        cty.SIZEOWN = cty.SIZEOWN / cty.HOUSEHOLDS;
        cty.SIZERENT = cty.SIZERENT / cty.HOUSEHOLDS;
        cty.GRAD = cty.GRAD / cty.HOUSEHOLDS; 
        cty.INCOME2013 = cty.INCOME2013 / cty.HOUSEHOLDS;
        cty.INCOME2007 = cty.INCOME2007 / cty.HOUSEHOLDS;
        cty.VEHICLES = cty.VEHICLES / cty.HOUSEHOLDS;
        cty.CARCOMMUTE = cty.CARCOMMUTE / cty.HOUSEHOLDS;
        cty.TIMETOWORK = cty.TIMETOWORK / cty.HOUSEHOLDS;
        cty.OWN = cty.OWN / cty.HOUSEHOLDS;
        cty.ROOMS = cty.ROOMS / cty.HOUSEHOLDS;
        cty.GAS = cty.GAS / cty.HOUSEHOLDS;
        cty.ELECTRIC = cty.ELECTRIC / cty.HOUSEHOLDS;
        cty.OIL = cty.OIL / cty.HOUSEHOLDS;
        cty.NOFUEL = cty.NOFUEL / cty.HOUSEHOLDS;
        cty.OTHERFUEL = cty.OTHERFUEL / cty.HOUSEHOLDS;
        cty.YEARBUILT = cty.YEARBUILT / cty.HOUSEHOLDS;
        cty.SINGDET = cty.SINGDET / cty.HOUSEHOLDS;
        cty.SQFT = cty.SQFT / cty.HOUSEHOLDS;
        cty.Children = cty.Children / cty.HOUSEHOLDS;
        cty.Adults = cty.Adults / cty.HOUSEHOLDS;
        
        allCounties[countyList[county]] = {};
        allCounties[countyList[county]] = JSON.parse(JSON.stringify(cty));
    }
    writeAll(allCounties, 'county/allCounties');
}

// Create manual objects
//=============================================================================


// Calculate demographics
//=============================================================================
allCityCalc();


// Initiate vars to save space above
function varsInit() {
    
    // Keys to lists
    //***************************************************************************//
    countyList = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "#N/A", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino Count", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"];

    cityList = ["ACAMPO", "ACTON", "ADELANTO", "ADIN", "AGOURA HILLS", "AGUANGA", "AHWAHNEE", "ALAMEDA", "ALAMO", "ALBANY", "ALBION", "ALDERPOINT", "ALHAMBRA", "ALISO VIEJO", "ALPAUGH", "ALPINE", "ALTA", "ALTADENA", "ALTURAS", "AMADOR CITY", "AMERICAN CANYON", "ANAHEIM", "ANDERSON", "ANGELS CAMP", "ANGELUS OAKS", "ANGWIN", "ANTELOPE", "ANTIOCH", "APPLE VALLEY", "APPLEGATE", "APTOS", "ARBUCKLE", "ARCADIA", "ARCATA", "ARMONA", "ARNOLD", "AROMAS", "ARROYO GRANDE", "ARTESIA", "ARVIN", "ATASCADERO", "ATHERTON", "ATWATER", "AUBERRY", "AUBURN", "AVALON", "AVENAL", "AZUSA", "BAKERSFIELD", "BALDWIN PARK", "BALLICO", "BANNING", "BARD", "BARSTOW", "BASS LAKE", "BEALE AFB", "BEAUMONT", "BELDEN", "BELL", "BELLFLOWER", "BELMONT", "BELVEDERE TIBURON", "BEN LOMOND", "BENICIA", "BERKELEY", "BERRY CREEK", "BETHEL ISLAND", "BEVERLY HILLS", "BIG BEAR CITY", "BIG BEAR LAKE", "BIG OAK FLAT", "BIG PINE", "BIG SUR", "BIGGS", "BIOLA", "BIRDS LANDING", "BISHOP", "BLAIRSDEN-GRAEAGLE", "BLOCKSBURG", "BLOOMINGTON", "BLUE LAKE", "BLYTHE", "BODEGA", "BODEGA BAY", "BODFISH", "BOLINAS", "BONITA", "BONSALL", "BOONVILLE", "BORON", "BORREGO SPRINGS", "BOULDER CREEK", "BRADLEY", "BRANSCOMB", "BRAWLEY", "BREA", "BRENTWOOD", "BRIDGEPORT", "BRISBANE", "BROOKS", "BUELLTON", "BUENA PARK", "BURBANK", "BURLINGAME", "BURNEY", "BURNT RANCH", "BURSON", "BUTTE CITY", "BUTTONWILLOW", "CALABASAS", "CALEXICO", "CALIENTE", "CALIFORNIA CITY", "CALIFORNIA HOT SPRINGS", "CALIMESA", "CALISTOGA", "CALLAHAN", "CAMARILLO", "CAMBRIA", "CAMINO", "CAMPBELL", "CANOGA PARK", "CANTUA CREEK", "CANYON", "CANYON COUNTRY", "CANYON DAM", "CAPISTRANO BEACH", "CAPITOLA", "CARDIFF BY THE SEA", "CARLSBAD", "CARMEL", "CARMEL BY THE SEA", "CARMEL VALLEY", "CARMICHAEL", "CARNELIAN BAY", "CARPINTERIA", "CARSON", "CARUTHERS", "CASMALIA", "CASPAR", "CASTAIC", "CASTELLA", "CASTRO VALLEY", "CASTROVILLE", "CATHEDRAL CITY", "CAYUCOS", "CAZADERO", "CEDAR GLEN", "CEDARPINES PARK", "CEDARVILLE", "CERES", "CERRITOS", "CHATSWORTH", "CHESTER", "CHICO", "CHILCOOT", "CHINO", "CHINO HILLS", "CHOWCHILLA", "CHULA VISTA", "CITRUS HEIGHTS", "CLAREMONT", "CLARKSBURG", "CLAYTON", "CLEARLAKE", "CLEARLAKE OAKS", "CLOVERDALE", "CLOVIS", "COACHELLA", "COALINGA", "COARSEGOLD", "COBB", "COLFAX", "COLTON", "COLUSA", "COMPTON", "CONCORD", "COOL", "CORCORAN", "CORONA", "CORONA DEL MAR", "CORONADO", "CORTE MADERA", "COSTA MESA", "COTATI", "COTTONWOOD", "COULTERVILLE", "COURTLAND", "COVELO", "COVINA", "COYOTE", "CRESCENT CITY", "CRESTLINE", "CRESTON", "CROCKETT", "CROWS LANDING", "CULVER CITY", "CUPERTINO", "CUTLER", "CYPRESS", "DALY CITY", "DANA POINT", "DANVILLE", "DARDANELLE", "DAVIS", "DEL MAR", "DEL REY", "DELANO", "DELHI", "DENAIR", "DESCANSO", "DESERT HOT SPRINGS", "DIAMOND BAR", "DIAMOND SPRINGS", "DILLON BEACH", "DINUBA", "DISCOVERY BAY", "DIXON", "DORRIS", "DOS PALOS", "DOUGLAS CITY", "DOWNEY", "DUARTE", "DUBLIN", "DUCOR", "DUNLAP", "DUNSMUIR", "EARLIMART", "EARP", "ECHO LAKE", "EDISON", "EL CAJON", "EL CENTRO", "EL CERRITO", "EL DORADO", "EL DORADO HILLS", "EL MONTE", "EL SEGUNDO", "EL SOBRANTE", "ELK", "ELK CREEK", "ELK GROVE", "ELVERTA", "EMERYVILLE", "EMIGRANT GAP", "EMPIRE", "ENCINITAS", "ENCINO", "ESCALON", "ESCONDIDO", "ESPARTO", "EUREKA", "EXETER", "FAIR OAKS", "FAIRFAX", "FAIRFIELD", "FALLBROOK", "FARMERSVILLE", "FARMINGTON", "FELLOWS", "FELTON", "FERNDALE", "FILLMORE", "FINLEY", "FIREBAUGH", "FISH CAMP", "FOLSOM", "FONTANA", "FOOTHILL RANCH", "FOREST KNOLLS", "FOREST RANCH", "FORESTHILL", "FORESTVILLE", "FORT BRAGG", "FORT IRWIN", "FORT JONES", "FORTUNA", "FOUNTAIN VALLEY", "FOWLER", "FRAZIER PARK", "FREEDOM", "FREMONT", "FRENCH CAMP", "FRESNO", "FULLERTON", "GALT", "GARBERVILLE", "GARDEN GROVE", "GARDEN VALLEY", "GARDENA", "GAZELLE", "GERBER", "GEYSERVILLE", "GILROY", "GLEN ELLEN", "GLENCOE", "GLENDALE", "GLENDORA", "GLENN", "GLENNVILLE", "GOLETA", "GRANADA HILLS", "GRAND TERRACE", "GRANITE BAY", "GRASS VALLEY", "GRATON", "GREENBRAE", "GREENFIELD", "GRIDLEY", "GROVER BEACH", "GUERNEVILLE", "HACIENDA HEIGHTS", "HALF MOON BAY", "HANFORD", "HARBOR CITY", "HAWAIIAN GARDENS", "HAWTHORNE", "HAYWARD", "HEALDSBURG", "HEMET", "HERCULES", "HERMOSA BEACH", "HESPERIA", "HIGHLAND", "HOLLISTER", "HOLTVILLE", "HOMELAND", "HOMEWOOD", "HOOPA", "HORNBROOK", "HORNITOS", "HUGHSON", "HUNTINGTON BEACH", "HUNTINGTON PARK", "IMPERIAL BEACH", "INDIAN WELLS", "INDIO", "INGLEWOOD", "INYOKERN", "IONE", "IRVINE", "IVANHOE", "JACKSON", "JACUMBA", "JAMESTOWN", "JAMUL", "JANESVILLE", "JOSHUA TREE", "JULIAN", "KEENE", "KELSEYVILLE", "KERMAN", "KING CITY", "KINGS BEACH", "KINGSBURG", "KIRKWOOD", "KLAMATH", "KNIGHTS LANDING", "KNIGHTSEN", "KYBURZ", "LA CANADA FLINTRIDGE", "LA CRESCENTA", "LA HABRA", "LA JOLLA", "LA MESA", "LA MIRADA", "LA PALMA", "LA PUENTE", "LA QUINTA", "LA VERNE", "LADERA RANCH", "LAFAYETTE", "LAGUNA BEACH", "LAGUNA HILLS", "LAGUNA NIGUEL", "LAGUNA WOODS", "LAKE ARROWHEAD", "LAKE ELSINORE", "LAKE FOREST", "LAKE HUGHES", "LAKEPORT", "LAKESIDE", "LAKEWOOD", "LAMONT", "LANCASTER", "LATHROP", "LATON", "LAWNDALE", "LE GRAND", "LEBEC", "LEMON GROVE", "LEMOORE", "LEWISTON", "LINCOLN", "LINDSAY", "LITTLEROCK", "LIVE OAK", "LIVERMORE", "LIVINGSTON", "LLANO", "LOCKEFORD", "LODI", "LOMA LINDA", "LOMITA", "LOMPOC", "LONG BEACH", "LOOMIS", "LOS ALAMITOS", "LOS ALTOS", "LOS ANGELES", "LOS BANOS", "LOS GATOS", "LOS OLIVOS", "LOS OSOS", "LOTUS", "LOWER LAKE", "LUCERNE", "LUCERNE VALLEY", "LYNWOOD", "MACDOEL", "MAD RIVER", "MADERA", "MAGALIA", "MALIBU", "MAMMOTH LAKES", "MANHATTAN BEACH", "MANTECA", "MARCH AIR RESERVE BASE", "MARICOPA", "MARINA", "MARINA DEL REY", "MARTINEZ", "MARYSVILLE", "MATHER", "MAYWOOD", "MC FARLAND", "MCCLELLAN", "MCCLOUD", "MCKINLEYVILLE", "MEADOW VALLEY", "MECCA", "MENIFEE", "MENLO PARK", "MENTONE", "MERCED", "MIDWAY CITY", "MILL VALLEY", "MILLBRAE", "MILPITAS", "MIRA LOMA", "MISSION HILLS", "MISSION VIEJO", "MODESTO", "MOJAVE", "MONROVIA", "MONTCLAIR", "MONTEBELLO", "MONTEREY", "MONTEREY PARK", "MONTROSE", "MOORPARK", "MORAGA", "MORENO VALLEY", "MORGAN HILL", "MORONGO VALLEY", "MORRO BAY", "MOSS LANDING", "MOUNT SHASTA", "MOUNTAIN VIEW", "MURRIETA", "NAPA", "NATIONAL CITY", "NEEDLES", "NEVADA CITY", "NEWARK", "NEWBURY PARK", "NEWHALL", "NEWMAN", "NEWPORT BEACH", "NIPOMO", "NORCO", "NORDEN", "NORTH HIGHLANDS", "NORTH HILLS", "NORTH HOLLYWOOD", "NORTHRIDGE", "NORWALK", "NOVATO", "NUEVO", "OAK PARK", "OAK VIEW", "OAKDALE", "OAKLAND", "OAKLEY", "OCEANSIDE", "OJAI", "OLIVEHURST", "ONTARIO", "ORANGE", "ORANGE COVE", "ORANGEVALE", "ORICK", "ORINDA", "ORLAND", "OROVILLE", "OXNARD", "PACIFIC GROVE", "PACIFIC PALISADES", "PACIFICA", "PACOIMA", "PALM DESERT", "PALM SPRINGS", "PALMDALE", "PALO ALTO", "PALOS VERDES PENINSULA", "PANORAMA CITY", "PARADISE", "PARAMOUNT", "PASADENA", "PASO ROBLES", "PATTERSON", "PAUMA VALLEY", "PENN VALLEY", "PENNGROVE", "PERRIS", "PETALUMA", "PHELAN", "PICO RIVERA", "PINOLE", "PIONEER", "PIONEERTOWN", "PISMO BEACH", "PITTSBURG", "PLACENTIA", "PLACERVILLE", "PLAYA DEL REY", "PLEASANT HILL", "PLEASANTON", "POINT MUGU NAWC", "POMONA", "PORT HUENEME", "PORTER RANCH", "PORTERVILLE", "POTTER VALLEY", "POWAY", "QUINCY", "RAMONA", "RANCHO CORDOVA", "RANCHO CUCAMONGA", "RANCHO MIRAGE", "RANCHO PALOS VERDES", "RANCHO SANTA FE", "RANCHO SANTA MARGARITA", "RAYMOND", "RED BLUFF", "REDDING", "REDLANDS", "REDONDO BEACH", "REDWOOD CITY", "REDWOOD VALLEY", "REEDLEY", "RESCUE", "RESEDA", "RIALTO", "RICHMOND", "RIDGECREST", "RIO LINDA", "RIO VISTA", "RIPON", "RIVERBANK", "RIVERSIDE", "ROCKLIN", "ROHNERT PARK", "ROSAMOND", "ROSEMEAD", "ROSEVILLE", "ROWLAND HEIGHTS", "SACRAMENTO", "SAINT HELENA", "SALINAS", "SAN ANSELMO", "SAN BERNARDINO", "SAN BRUNO", "SAN CARLOS", "SAN CLEMENTE", "SAN DIEGO", "SAN DIMAS", "SAN FERNANDO", "SAN FRANCISCO", "SAN GABRIEL", "SAN JACINTO", "SAN JOSE", "SAN JUAN CAPISTRANO", "SAN LEANDRO", "SAN LORENZO", "SAN LUIS OBISPO", "SAN MARCOS", "SAN MARINO", "SAN MATEO", "SAN PABLO", "SAN PEDRO", "SAN QUENTIN", "SAN RAFAEL", "SAN RAMON", "SAN YSIDRO", "SANGER", "SANTA ANA", "SANTA BARBARA", "SANTA CLARA", "SANTA CLARITA", "SANTA CRUZ", "SANTA FE SPRINGS", "SANTA MARIA", "SANTA MONICA", "SANTA PAULA", "SANTA ROSA", "SANTEE", "SARATOGA", "SAUSALITO", "SCOTTS VALLEY", "SEAL BEACH", "SEASIDE", "SEBASTOPOL", "SELMA", "SHAFTER", "SHASTA LAKE", "SHERMAN OAKS", "SHINGLE SPRINGS", "SIERRA MADRE", "SIGNAL HILL", "SILVERADO", "SIMI VALLEY", "SOLANA BEACH", "SOLEDAD", "SOMES BAR", "SONOMA", "SONORA", "SOUTH EL MONTE", "SOUTH GATE", "SOUTH LAKE TAHOE", "SOUTH PASADENA", "SOUTH SAN FRANCISCO", "SPRING VALLEY", "STANFORD", "STANTON", "STEVENSON RANCH", "STOCKTON", "STUDIO CITY", "SUISUN CITY", "SUN CITY", "SUN VALLEY", "SUNLAND", "SUNNYVALE", "SUNSET BEACH", "SUSANVILLE", "SYLMAR", "TAFT", "TAHOE CITY", "TARZANA", "TEHACHAPI", "TEMECULA", "TEMPLE CITY", "THERMAL", "THOUSAND OAKS", "THOUSAND PALMS", "TOPANGA", "TORRANCE", "TRABUCO CANYON", "TRACY", "TRAVIS AFB", "TRUCKEE", "TUJUNGA", "TULARE", "TURLOCK", "TUSTIN", "TWENTYNINE PALMS", "UKIAH", "UNION CITY", "UNIVERSAL CITY", "UPLAND", "VACAVILLE", "VALENCIA", "VALLEJO", "VALLEY VILLAGE", "VAN NUYS", "VENICE", "VENTURA", "VICTORVILLE", "VILLA PARK", "VISALIA", "VISTA", "WALNUT", "WALNUT CREEK", "WASCO", "WATSONVILLE", "WEST COVINA", "WEST HILLS", "WEST HOLLYWOOD", "WEST SACRAMENTO", "WESTLAKE VILLAGE", "WESTMINSTER", "WHEATLAND", "WHITE WATER", "WHITTIER", "WILDOMAR", "WILLITS", "WILLOWS", "WILMINGTON", "WINCHESTER", "WINDSOR", "WINNETKA", "WINTON", "WOODLAKE", "WOODLAND", "WOODLAND HILLS", "YORBA LINDA", "YOUNTVILLE", "YREKA", "YUBA CITY", "YUCAIPA", "YUCCA VALLEY"];

    headersList = ["CITY", "COUNTY", "LANDAREA", "DENSITY", "EMPDEN", "URBAN", "CDD", "HDD", "PEOPLE", "WORKERS", "WORKCNT", "HOUSEHOLDS", "HHSIZE", "SIZEOWN", "SIZERENT", "GRAD", "INCOME2013", "INCOME2007", "AGE", "WHITE", "BLACK", "ASIAN", "OTHERACE", "VEHICLES", "CARCOMMUTE", "TIMETOWORK", "OWN", "ROOMS", "GAS", "ELECTRIC", "OIL", "NOFUEL", "OTHERFUEL", "YEARBUILT", "SINGDET", "SQFT", "Children", "Adults", "NumPubTrans", "Public Transit Commuters", "Bus Commuters", "Subway Commuters", "Railroad Commuters"];

    // Constructors
    //***************************************************************************//

    CtyObj = function CtyObj() {
        this.CTY = "";
        this.COUNTY = 0;
        this.LANDAREA = 0;
        this.DENSITY = 0;
        this.EMPDEN = 0;
        this.URBAN = 0;
        this.CDD = 0;
        this.HDD = 0;
        this.PEOPLE = 0;
        this.WORKERS = 0;
        this.WORKCNT = 0;
        this.HOUSEHOLDS = 0;
        this.HHSIZE = 0;
        this.SIZEOWN = 0;
        this.SIZERENT = 0;
        this.GRAD = 0;
        this.INCOME2013 = 0;
        this.INCOME2007 = 0;
        this.AGE = 0;
        this.WHITE = 0;
        this.BLACK = 0;
        this.ASIAN = 0;
        this.OTHERACE = 0;
        this.WORKERS = 0;
        this.VEHICLES = 0;
        this.CARCOMMUTE = 0;
        this.TIMETOWORK = 0;
        this.OWN = 0;
        this.ROOMS = 0;
        this.GAS = 0;
        this.ELECTRIC = 0;
        this.OIL = 0;
        this.NOFUEL = 0;
        this.OTHERFUEL = 0;
        this.YEARBUILT = 0;
        this.SINGDET = 0;
        this.SQFT = 0;
        this.Children = 0;
        this.Adults = 0;
        this.NumPubTrans = 0;
        this["Public Transit Commuters"] = 0;
        this["Bus Commuters"] = 0;
        this["Subway Commuters"] = 0;
        this["Railroad Commuters"] = 0;
    }
    
    cty = 'ACAMPO';
    
    cityMenuHTML = '';
    countyMenuHTML = '';
    
    for (i = 0; i < city.length; i++) {
        cityMenuHTML += '<option value=' + cityList[i] + '>' + cityList[i] + '</option>'
    }
    
    for (i = 0; i < countyList.length; i++) {
        countyMenuHTML += '<option value=' + countyList[i] + '>' + countyList[i] + '</option>'
    }   
}