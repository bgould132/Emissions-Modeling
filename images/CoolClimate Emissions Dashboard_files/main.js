/*
 *
 *
 */

//'use strict';
/*jslint plusplus: true */
/*
var fs = require('fs');
var d3 = require('d3');
var $ = require('jquery');
*/
// Constants
var TOTAL_YEARS = 0;

// Value holders
var writeFile, spacing, sum, reached, i,
    cty;

// Object index counters
// For looping through objects with the object keys
var county, city;
    
// Chart objects
var emissionsChart, consumptionChart, adoptionChart;

// Objects
var allCities, allCounties, consumption, emissions;
    
// Keys to object (database) structure
var countyList, cityList, headersList;

// Constructors
var CtyObj;

// HTML strings
var cityMenuHTML, countyMenuHTML;

// Give variables their initial settings - to keep declarations clean
varsInit();

// End Variable Declarations
//***************************************************************************//




// Functions
//***************************************************************************//

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

function dataInit () {
    
}

//done
function naturalGasTherms (GAS, ROOMS, YEARBUILT, ASIAN, HHSIZE, WHITE, GRAD, SQFT, OWN, SINGDET) {
    var NGCONSTANT = 1.074,
        NGGASCOEF = 2.911,
        NGROOMSCOEF = 0.331,
        NGYEARBUILTCOEF = 0.008575,
        NGASIANCOEF = -0.499,
        NGHHSIZELNCOEF = 0.314,
        NGWHITECOEF = -0.369,
        NGGRADCOEF = -0.234,
        NGSQFTCOEF = 0.0001536,
        NGOWNCOEF = -0.261,
        NGSINGDETCOEF = 0.221,
        REFYEAR = 2013;
    
    var result;

    result = Math.exp((NGCONSTANT + NGGASCOEF*GAS + NGROOMSCOEF*ROOMS + NGYEARBUILTCOEF*(REFYEAR-YEARBUILT) + NGASIANCOEF*ASIAN + NGHHSIZELNCOEF*Math.log(HHSIZE) + NGWHITECOEF*(WHITE/2) + NGGRADCOEF*GRAD + NGSQFTCOEF*SQFT + NGOWNCOEF*OWN + NGSINGDETCOEF*SINGDET));
    
    console.log = result;
    
    return result;
}

//done
function airTravelDistance (INCOME) {
    var AIRTRAVELCONSTANT = 33.088,
        AIRINCOMECOEF = 0.633;
    
    return (AIRTRAVELCONSTANT + AIRINCOMECOEF*INCOME);
}

//done
function waterUse (HHSIZE) {
    var WATERHHSIZECOEF = 70;
    
    return (WATERHHSIZECOEF*HHSIZE);
}

function vmnt (INCOME07, HHSIZE) {
    var VMNTCONSTANT = 78.20,
        VMNTINCOME07COEF = 0.0021,
        AUTOPARTHHSIZECOEF =  7.80,
        VEHSERVCONSTANT =  158.78,
        VEHSERVINCOMECOEF =  0.0043,
        VEHSERVEHHSIZECOEF =  15.83;
        
    return ((VMNTCONSTANT + VMNTINCOME07COEF*INCOME07 + AUTOPARTHHSIZECOEF*HHSIZE) + (VEHSERVCONSTANT + VEHSERVINCOMECOEF*INCOME07 + VEHSERVEHHSIZECOEF*HHSIZE));
}

function kwhUse (ROOMS, CDD, SQFT, HHSIZE, INCOME13, ASIAN, GAS, OWN, SQFT, GRAD, SINGDET) {
    var KWHCONSTANT = 5.029,
        KWHROOMSCOEF = 0.09255,
        KWHLNCDDSQFTCOEF = 0.124,
        KWHLNHHSIZECOEF = 0.362,
        KWHLNINCOME13COEF = 0.09992,
        KWHASIANCOEF = -0.203,
        KWHGASCOEF = -0.212,
        KWHOWNCOEF = 0.133,
        KWHSQFTCOEF = 0.0001046,
        KWHGRADCOEF = -0.109,
        KWHSINGDETCOEF = 0.08848;
    
    return (Math.exp(KWHCONSTANT + KWHROOMSCOEF*ROOMS + KWHLNCDDSQFTCOEF*Math.log(CDD*SQFT) + KWHLNHHSIZECOEF*Math.log(HHSIZE) + KWHLNINCOME13COEF*Math.log(INCOME13) + KWHASIANCOEF*ASIAN + KWHGASCOEF*GAS + KWHOWNCOEF*OWN + KWHSQFTCOEF*SQFT + KWHGRADCOEF*GRAD + KWHSINGDETCOEF*SINGDET));
}

function oilUse (ROOMS, OWN, AGE, WHITE, OTHERFUEL) {
    var FOCONSTANT = 228.95,
        FOROOMSCOEF = 75.846,
        FOREGIONCOEF = 128.895,
        FOOWNCOEF = -164.353,
        FOAGECOEF = 2.836,
        FODIV1COEF = 99.678,
        FOWHITECOEF = -94.047;
    
    var REGION = 0,
        DIV1 = 0;
    
    return ((FOCONSTANT + FOROOMSCOEF*ROOMS + FOREGIONCOEF*REGION + FOOWNCOEF*OWN + FOAGECOEF*AGE + FODIV1COEF*DIV1 + FOWHITECOEF*WHITE)*OTHERFUEL);
}
/*
function wasteGeneration () {
    return (IF(ISNUMBER(VLOOKUP($E2,SOLIDWASTE!$F$38:$H$95,3,FALSE))=FALSE,0.5,VLOOKUP($E2,SOLIDWASTE!$F$38:$H$95,3,FALSE)));
}
*/
function SQFT () {
    
}

function meatConsumption (ADULTS, CHILDREN) {
    var ADULTMEATCAL = 487, 
        CHILDMEATCAL = 365;
    return (ADULTMEATCAL*ADULTS + CHILDMEATCAL*CHILDREN);
}

function dairyConsumption (ADULTS, CHILDREN) {
    var ADULTDAIRYCAL = 232,
        CHILDDAIRYCAL = 174;
    return (ADULTDAIRYCAL*ADULTS + CHILDDAIRYCAL*CHILDREN);
}

function otherFoodConsumption (ADULTS, CHILDREN) {
    var ADULTOTHERCAL = 1170,
        CHILDOTHERCAL = 877;
    return (ADULTOTHERCAL*ADULTS + CHILDOTHERCAL*CHILDREN);
}

function vegeCalories(ADULTS, CHILDREN) {
    var ADULTVEGECAL = 304,
        CHILDVEGECAL = 228;
    return (ADULTVEGECAL*ADULTS + CHILDVEGECAL*CHILDREN);
}

function cerealCalories(ADULTS, CHILDREN) {
    var ADULTCEREALCAL = 584,
        CHILDCEREALCAL = 438;
    
    return (ADULTCEREALCAL*ADULTS + CHILDCEREALCAL*CHILDREN);
}

function clothingUSD (INCOME07, HHSIZE) {
    var CLOTHCONSTANT = 75.63,
        CLOTHINCOME07COEF =  0.0149,
        CLOTHHHSIZECOEF =  323.60;
    
    return (CLOTHCONSTANT + CLOTHINCOME07COEF*INCOME07 + CLOTHHHSIZECOEF*HHSIZE);
}

function furnishingsUSD (INCOME07, HHSIZE) {
    var FURCONSTANT =  278.96,
        FURINCOME07COEF =  0.0231,
        FURHHSIZECOEF =  27.70;
    
    return (FURCONSTANT + FURINCOME07COEF*INCOME07 + FURHHSIZECOEF*HHSIZE);
}

function otherGoodsUSD (INCOME07, HHSIZE) {
    var OTHERGOODSCONSTANT =  2769.82,
        OTHERGOODSINCOME07COEF =  0.0291,
        OTHERGOODSHHSIZECOEF =  100.70;
    
    return (OTHERGOODSCONSTANT + OTHERGOODSINCOME07COEF*INCOME07 + OTHERGOODSHHSIZECOEF*HHSIZE);
}

function servicesUCSD (INCOME07, HHSIZE) {
    var SERVICESCONSTANT =  3939.74,
        SERVICESINCOME07COEF =  0.1428,
        SERVICESHHSIZECOEF =  102.47;
    
    return (SERVICESCONSTANT + SERVICESINCOME07COEF*INCOME07 + SERVICESHHSIZECOEF*HHSIZE);
}

function medical (INCOME07, HHSIZE) {
    var MEDICALCONSTANT = 775.25,
        MEDICALINCOME07COEF = 0.0029,
        MEDICALHHSIZECOEF = 0.13;
    
    return (MEDICALCONSTANT + MEDICALINCOME07COEF*INCOME07 + MEDICALHHSIZECOEF*HHSIZE);
}

function entertainment (INCOME07, HHSIZE) {
    var ENTERTAINCONSTANT =  228.57,
        ENTERTAININCOME07COEF =  0.0146,
        ENTERTAINHHSIZECOEF =  24.73;
    
    return (ENTERTAINCONSTANT + ENTERTAININCOME07COEF*INCOME07 + ENTERTAINHHSIZECOEF*HHSIZE);
}

function reading (INCOME07, HHSIZE) {
    var READINGCONSTANT =  73.68,
        READINGINCOME07COEF =  0.0015,
        READINGHHSIZECOEF =  -17.53;
    
    return (READINGCONSTANT + READINGINCOME07COEF*INCOME07 + READINGHHSIZECOEF*HHSIZE);
}

function careClean (INCOME07, HHSIZE) {
    var CARECLEANCONSTANT =  229.21,
        CARECLEANINCOME07COEF =  0.0079,
        CARECLEANHHSZIECOEF =  85.57;
    
    return (CARECLEANCONSTANT + CARECLEANINCOME07COEF*INCOME07 + CARECLEANHHSZIECOEF*HHSIZE);
}

function autoPart (HH2050, VMT2050) {
    return (HH2050 * VMT2050);
}


// End Helper Functions
//***************************************************************************//




// Program Core
//***************************************************************************//

// Get data while loading DOM =================================================
// jQuery AJAX call for JSON
console.log("Entering the JQUERY calls!");

$.when(
    $.getJSON('http://coolclimatenetwork.github.io/data/city/allCities-min.json', function (allCities_imported) {
        allCities = allCities_imported;
    }),
    $.getJSON('http://coolclimatenetwork.github.io/data/county/allCounties-min.json', function (allCounties_imported) {
        allCounties = allCounties_imported;
    })
    /*
    $.getJSON('./data/city/allCities-min.json', function (allCities_imported) {
        allCities = allCities_imported;
    }),
    $.getJSON('./data/county/allCounties-min.json', function (allCounties_imported) {
        allCounties = allCounties_imported;
    })
    */
    /* offline version
    d3.json('./data/city/allCities-min.json', function (allCities_imported) {
        allCities = JSON.parse(JSON.stringify(allCities_imported));
    }),
    d3.json('./data/county/allCounties-min.json', function (allCounties_imported) {
        allCounties = JSON.parse(JSON.stringify(allCounties_imported));
    });
    */
).then(function () {
    if (allCities && allCounties) {
        // DOM Ready ==========================================================
        $(document).ready(function () {
            console.log("DOM Ready!");
            
            //Create listener for city radio button to triger drop-down
            $("#cityButton").click(function() {
                $("#countyButton").html('<form id="countyButton"> <input type="radio" name="county" value="county" > County </form>');
                $("#countyMenu").html('<form id="countyMenu"> <select name="county" disabled> ' + countyMenuHTML + ' </select> </form>')
                 $("#cityMenu").html('<form id="cityMenu"> <select name="city"> ' + cityMenuHTML + ' </select> </form>')
            });
            
            //Create listener for county radio button to trigger drop-down
            $("#countyButton").click(function() {
                $("#cityButton").html('<form id="cityButton"> <input type="radio" name="city" value="city" > City </form>');
                $("#cityMenu").html('<form id="cityMenu"> <select name="city" disabled> ' + cityMenuHTML + ' </select> </form>')
                $("#countyMenu").html('<form id="countyMenu"> <select name="county"> ' + countyMenuHTML + ' </select> </form>')
            });
            
            // Create listener for city drop-down to change graphs
            $("#city").change(function() {
                cty = allCities[this.value];
                city = this.value;
                county = cty.COUNTY;
            });
            
            // Create listener for county drop-down to change graphs
            $("#county").change(function() {
                cty = allCounties[this.value];
                county = this.value;
            });
            
            console.log("Completed listening!");
            
            naturalGasTherms(cty.GAS, cty.ROOMS, cty.YEARBUILT, cty.ASIAN, cty.HHSIZE, cty.WHITE, cty.GRAD, cty.SQFT, cty.OWN, cty.SINGDET)
            
            /*
            // Create chart objects, but don't populate yet
            emissionsChart = new LineChart("emissions");
            urbanIntakeChart = new LineChart("intake");
            deathsChart = new LineChart("deaths");
            vktChart = new StackedChart("vkt");

            emissionsChart.render();
            urbanIntakeChart.render();
            deathsChart.render();
            vktChart.render();

            emissionsChart.load();
            urbanIntakeChart.load();
            deathsChart.load();
            vktChart.load();

            formInit();
            slidersInit();

            updateText();

            d3.select(".login").html('<form name="save"><input id="saveButton" type="button" value="Save Data" onClick="saveData(this.form)">');
            //});
         */   
        });
    } else {
        alert("Could not load data!");
    }
});

// Handle imported data
//=============================================================================


// Create manual objects
//=============================================================================



// Calculate demographics
//=============================================================================
//CountyCalc();
//CityCalc();

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
    
    for (i = 0; i < cityList.length; i++ ) {
        cityMenuHTML  += '<option value=' + cityList[i] + '>' + cityList[i] + '</option>'
    }
    
    for (i = 0; i < countyList.length; i++ ) {
        countyMenuHTML  += '<option value=' + countyList[i] + '>' + countyList[i] + '</option>'
    }
    
}