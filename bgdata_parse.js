/* 
 *
 */

var fs = require('fs');
var d3 = require('d3');
var $ = require('jquery');

// Constants
var TOTAL_YEARS = 0;

// Value holders
var writeFile, spacing, sum, reached, i, k;

// Object index counters
// For looping through objects with the object keys
var county, city;
    
// Objects
var allCities, allCounties, MPOHSR, POPTABLE, PUBLICTRANS;

allCities = {};
allCounties = {};

// Imported data
var BGDATA, HSRTABLE, POP, PUBLICTRANSTABLE;
    
// Keys to object (database) structure
var countyList, cityList, headersList, mpoList, fiveYearsList, tenYearsList, manyYearsList;

// Constructors
var CtyObj, PopObj, MPOHSRObj;

// End Variable Declarations
//***************************************************************************//

varsInit();

// Constructors
//***************************************************************************//

CtyObj = function CtyObj() {
    this.CTY = "";
    this.COUNTY = 0;
    this.MPO = "";
    this.LANDAREA = 0;
    this.DENSITY = 0;
    this.EMPDEN = 0;
    this.SUBURBANAREA = 0;
    this.SUBURBANPOP = 0;
    this.PDAAREA = 0;
    this.PDAPOP = 0;
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
    this.LATINO = 0;
    this.BLACK = 0;
    this.ASIAN = 0;
    this.OTHERACE = 0;
    this.WORKERS2 = 0;
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

PopObj = function PopObj() {
    this["2010"] = 0;
    this["2015"] = 0;
    this["2020"] = 0;
    this["2025"] = 0;
    this["2030"] = 0;
    this["2035"] = 0;
    this["2040"] = 0;
    this["2045"] = 0;
    this["2050"] = 0;
    this["2055"] = 0;
    this["2060"] = 0;
}

MPOHSRObj = function MPOHSRObj () {
    this["2020"] = 0;
    this["2025"] = 0;
    this["2030"] = 0;
    this["2035"] = 0;
    this["2040"] = 0;
    this["2045"] = 0;
    this["2050"] = 0;
}

PublicTransObj = function PublicTransObj () {
    this.BusMilesPerCommuter = 0;
    this.CommuterRailMilesPerCommuter = 0;
    this.AmtrakMilesPerCommuter = 0;
    this.MPO = "";
}

// End Constructor Declaration
//***************************************************************************//


// Functions
//***************************************************************************//

function writePrivate (dat, name) {
    writeFile = './data/' + name + '.json';
    spacing = 4;

    fs.writeFileSync(writeFile, JSON.stringify(dat, null, spacing)) /*, function (err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Full-length JSON saved to " + writeFile);
        }
    })*/;
}

function writePublic (dat, name) {
    writeFile = './data/' + name + '-min.json';
    spacing = 0;

    fs.writeFileSync(writeFile, JSON.stringify(dat, null, spacing))/*, function (err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Concise JSON saved to " + writeFile);
        }
    })*/;
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

// Handle imported data
//=============================================================================

function HSRCALC () {
    HSRTABLE = d3.csvParse((fs.readFileSync("./data/HSRTABLE.csv")).toString());
    MPOHSR = {};
    var HSR, year = 0;
    
    for (i = 0; i < HSRTABLE.length; i++) {
        HSRTABLE[i]["2020"] = parseFloat(HSRTABLE[i]["2020"])*1000000;
        HSRTABLE[i]["2025"] = parseFloat(HSRTABLE[i]["2025"])*1000000;
        HSRTABLE[i]["2030"] = parseFloat(HSRTABLE[i]["2030"])*1000000;
        HSRTABLE[i]["2035"] = parseFloat(HSRTABLE[i]["2035"])*1000000;
        HSRTABLE[i]["2040"] = parseFloat(HSRTABLE[i]["2040"])*1000000;
        HSRTABLE[i]["2045"] = parseFloat(HSRTABLE[i]["2045"])*1000000;
        HSRTABLE[i]["2050"] = parseFloat(HSRTABLE[i]["2050"])*1000000;
    }
    
    for (i = 0; i < mpoList.length; i++){
        HSR = new MPOHSRObj();
        
        for (year = 0; year < fiveYearsList.length; year++) {
            HSR[fiveYearsList[year]] = HSRTABLE[i][fiveYearsList[year]];
        }
        
        MPOHSR[mpoList[i]] = {};
        MPOHSR[mpoList[i]] = JSON.parse(JSON.stringify(HSR));
    }
    
    writeAll(MPOHSR, 'MPOHSRTABLE');
    
}

function POPCALC () {
    POP = d3.csvParse((fs.readFileSync("./data/Population.csv")).toString());
    POPTABLE = {};
    var population, year, county;
    
    for (i = 0; i < POP.length; i++) {    
        POP[i]["2010"] = parseFloat(POP[i]["2010"]);
        POP[i]["2015"] = parseFloat(POP[i]["2015"]);
        POP[i]["2020"] = parseFloat(POP[i]["2020"]);
        POP[i]["2025"] = parseFloat(POP[i]["2025"]);
        POP[i]["2030"] = parseFloat(POP[i]["2030"]);
        POP[i]["2035"] = parseFloat(POP[i]["2035"]);
        POP[i]["2040"] = parseFloat(POP[i]["2040"]);
        POP[i]["2045"] = parseFloat(POP[i]["2045"]);
        POP[i]["2050"] = parseFloat(POP[i]["2050"]);
        POP[i]["2055"] = parseFloat(POP[i]["2055"]);
        POP[i]["2060"] = parseFloat(POP[i]["2060"]);
    }
    
    for (county = 0; county < countyList.length; county++) {
        population = new PopObj();
        
        for (year = 0; year < manyYearsList.length; year++) {
            population[manyYearsList[year]] = POP[county][manyYearsList[year]];
        }
        
        POPTABLE[countyList[county]] = {};
        POPTABLE[countyList[county]] = JSON.parse(JSON.stringify(population));
    }
    
    writeAll(POPTABLE, "POPTABLE");
}

function PUBLICTRANSCALC () {
    PUBLICTRANSTABLE = d3.csvParse((fs.readFileSync("./data/PUBLICTRANSTABLE.csv")).toString());
    
    PUBLICTRANS = {};
    
    var county;
    
    for (i = 0; i < PUBLICTRANSTABLE.length; i++) {
        PUBLICTRANSTABLE[i]["BusMilesPerCommuter"] = parseFloat(PUBLICTRANSTABLE[i]["BusMilesPerCommuter"]);
        PUBLICTRANSTABLE[i]["CommuterRailMilesPerCommuter"] = parseFloat(PUBLICTRANSTABLE[i]["CommuterRailMilesPerCommuter"]);
        PUBLICTRANSTABLE[i]["AmtrakMilesPerCommuter"] = parseFloat(PUBLICTRANSTABLE[i]["AmtrakMilesPerCommuter"]);
    }
    
    for (i = 0; i < countyList.length; i++){
        county = new PublicTransObj();
        
        county.BusMilesPerCommuter = PUBLICTRANSTABLE[i]["BusMilesPerCommuter"];
        county.CommuterRailMilesPerCommuter = PUBLICTRANSTABLE[i]["CommuterRailMilesPerCommuter"];
        county.AmtrakMilesPerCommuter = PUBLICTRANSTABLE[i]["AmtrakMilesPerCommuter"];
        county.MPO = PUBLICTRANSTABLE[i]["MPO"];
        
        PUBLICTRANS[countyList[i]] = {};
        PUBLICTRANS[countyList[i]] = JSON.parse(JSON.stringify(county));
    }
    
    writeAll(PUBLICTRANS, 'PUBLICTRANSTABLE');
    
}

function readyBGDATA () {
    BGDATA = d3.csvParse((fs.readFileSync("./data/BGDATA.csv")).toString());
    
    for (i = 0; i < BGDATA.length; i++) {
        BGDATA[i].LANDAREA = parseFloat(BGDATA[i].LANDAREA);
        BGDATA[i].DENSITY = parseFloat(BGDATA[i].DENSITY);
        BGDATA[i].EMPDEN = parseFloat(BGDATA[i].EMPDEN);
        BGDATA[i].SUBURBAN = parseFloat(BGDATA[i].SUBURBAN);
        BGDATA[i].PDA = parseFloat(BGDATA[i].PDA);
        BGDATA[i].CDD = parseFloat(BGDATA[i].CDD);
        BGDATA[i].HDD = parseFloat(BGDATA[i].HDD);
        BGDATA[i].PEOPLE = parseFloat(BGDATA[i].PEOPLE);
        BGDATA[i].WORKERS = parseFloat(BGDATA[i].WORKERS);
        BGDATA[i].WORKCNT = parseFloat(BGDATA[i].WORKCNT);
        BGDATA[i].HOUSEHOLDS = parseFloat(BGDATA[i].HOUSEHOLDS);
        BGDATA[i].HHSIZE = parseFloat(BGDATA[i].HHSIZE);
        BGDATA[i].SIZEOWN = parseFloat(BGDATA[i].SIZEOWN);
        BGDATA[i].SIZERENT = parseFloat(BGDATA[i].SIZERENT);
        BGDATA[i].GRAD = parseFloat(BGDATA[i].GRAD);        // percentage
        BGDATA[i].INCOME2013 = parseFloat(BGDATA[i].INCOME2013);
        BGDATA[i].INCOME2007 = parseFloat(BGDATA[i].INCOME2007);
        BGDATA[i].AGE = parseFloat(BGDATA[i].AGE);
        BGDATA[i].WHITE = parseFloat(BGDATA[i].WHITE);       // percentage
        BGDATA[i].LATINO = parseFloat(BGDATA[i].LATINO);     // percentage but already stored as decimal unlike other races
        BGDATA[i].BLACK = parseFloat(BGDATA[i].BLACK);       // percentage
        BGDATA[i].ASIAN = parseFloat(BGDATA[i].ASIAN);       // percentage
        BGDATA[i].OTHERACE = parseFloat(BGDATA[i].OTHERACE); // percentage
        BGDATA[i].WORKERS2 = parseFloat(BGDATA[i].WORKERS2); // percentage
        BGDATA[i].VEHICLES = parseFloat(BGDATA[i].VEHICLES);
        BGDATA[i].CARCOMMUTE = parseFloat(BGDATA[i].CARCOMMUTE); // percentage
        BGDATA[i].TIMETOWORK = parseFloat(BGDATA[i].TIMETOWORK);
        BGDATA[i].OWN = parseFloat(BGDATA[i].OWN);             // percentage
        BGDATA[i].ROOMS = parseFloat(BGDATA[i].ROOMS);
        BGDATA[i].GAS = parseFloat(BGDATA[i].GAS);             // percentage
        BGDATA[i].ELECTRIC = parseFloat(BGDATA[i].ELECTRIC);   // percentage
        BGDATA[i].OIL = parseFloat(BGDATA[i].OIL);             // percentage
        BGDATA[i].NOFUEL = parseFloat(BGDATA[i].NOFUEL);       // percentage
        BGDATA[i].OTHERFUEL = parseFloat(BGDATA[i].OTHERFUEL); // percentage
        BGDATA[i].YEARBUILT = parseFloat(BGDATA[i].YEARBUILT);
        BGDATA[i].SINGDET = parseFloat(BGDATA[i].SINGDET);     // percentage
        BGDATA[i].SQFT = parseFloat(BGDATA[i].SQFT);
        BGDATA[i].Children = parseFloat(BGDATA[i].Children);
        BGDATA[i].Adults = parseFloat(BGDATA[i].Adults);
        BGDATA[i].NumPubTrans = parseFloat(BGDATA[i].NumPubTrans);
        BGDATA[i]["Public Transit Commuters"] = parseFloat(BGDATA[i]["Public Transit Commuters"]);
        BGDATA[i]["Bus Commuters"] = parseFloat(BGDATA[i]["Bus Commuters"]);
        BGDATA[i]["Subway Commuters"] = parseFloat(BGDATA[i]["Subway Commuters"]);
        BGDATA[i]["Railroad Commuters"] = parseFloat(BGDATA[i]["Railroad Commuters"]);
    }
}

function mpoCalc () {
    var county;
    
    if (cty.COUNTY === 1) {
        county = cty.CTY;
    } else {
        county = cty.COUNTY;
    }
    
    if (county === "Alameda" || county === "Contra Costa" || county === "Marin" || county === "Napa" || county === "San Francisco" || county === "San Mateo" || county === "Santa Clara" || county === "Solano" || county === "Sonoma") {
        cty.MPO = "MTC"; 
    } else if (county === "El Dorado" || county === "Placer" || county === "Sacramento" || county === "Sutter" || county === "Yolo" || county === "Yuba") {
        cty.MPO = "SACOG";
    } else if (county === "San Diego") {
        cty.MPO = "SANDAG";
    } else if (county === "Imperial" || county === "Los Angeles" || county === "Orange" || county === "Riverside" || county === "San Bernardino" || county === "Ventura") {
        cty.MPO = "SCAG";
    } else if (county === "San Joaquin" || county === "Merced" || county === "Madera" || county === "Fresno" || county === "Tulare" || county === "Kings" || county === "Kern" || county === "Stanislaus") {
        cty.MPO = "San Joaquin Valley";
    } else {
        cty.MPO = "Other";
    }
}

function CityCalc () {

    for (city = 0; city < cityList.length; city++) {
        reached = 0;
        cty = 0;
        cty = new CtyObj();
        for (i = 0; i < BGDATA.length; i++) {
            if (BGDATA[i].CITY === cityList[city]) {
                reached = 1;
                cty.CTY = cityList[city];
                cty.COUNTY = BGDATA[i].COUNTY;
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
                cty.LATINO += BGDATA[i].LATINO * BGDATA[i].HOUSEHOLDS;
                cty.BLACK += BGDATA[i].BLACK * BGDATA[i].HOUSEHOLDS;
                cty.ASIAN += BGDATA[i].ASIAN * BGDATA[i].HOUSEHOLDS;
                cty.OTHERACE += BGDATA[i].OTHERACE * BGDATA[i].HOUSEHOLDS;
                cty.WORKERS2 += BGDATA[i].WORKERS2 * BGDATA[i].HOUSEHOLDS;
                cty.CDD += BGDATA[i].CDD * BGDATA[i].HOUSEHOLDS;
                cty.HDD += BGDATA[i].HDD * BGDATA[i].HOUSEHOLDS;
                cty.WORKCNT += BGDATA[i].WORKCNT * BGDATA[i].HOUSEHOLDS;
                cty.SUBURBANAREA += BGDATA[i].SUBURBAN * BGDATA[i].LANDAREA;
                cty.SUBURBANPOP += BGDATA[i].SUBURBAN * BGDATA[i].HOUSEHOLDS;
                cty.PDAAREA += BGDATA[i].PDA * BGDATA[i].LANDAREA;
                cty.PDAPOP += BGDATA[i].PDA * BGDATA[i].HOUSEHOLDS;
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
        cty.LATINO = cty.LATINO / cty.HOUSEHOLDS;
        cty.BLACK = cty.BLACK / cty.HOUSEHOLDS;
        cty.ASIAN = cty.ASIAN / cty.HOUSEHOLDS;
        cty.OTHERACE = cty.OTHERACE / cty.HOUSEHOLDS;
        cty.WORKERS2 = cty.WORKERS2 / cty.HOUSEHOLDS;
        cty.CDD = cty.CDD / cty.HOUSEHOLDS;
        cty.HDD = cty.HDD / cty.HOUSEHOLDS;
        cty.WORKCNT = cty.WORKCNT / cty.HOUSEHOLDS;
        cty.SUBURBANAREA = cty.SUBURBANAREA / cty.LANDAREA;
        cty.SUBURBANPOP = cty.SUBURBANPOP / cty.HOUSEHOLDS;
        cty.PDAAREA = cty.PDAAREA / cty.LANDAREA;
        cty.PDAPOP = cty.PDAPOP / cty.HOUSEHOLDS;
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
        
        mpoCalc();

        writeAll(cty, 'city/' + cityList[city]);
    }
}

function CountyCalc () {
    
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
                cty.LATINO += BGDATA[i].LATINO * BGDATA[i].HOUSEHOLDS;
                cty.BLACK += BGDATA[i].BLACK * BGDATA[i].HOUSEHOLDS;
                cty.ASIAN += BGDATA[i].ASIAN * BGDATA[i].HOUSEHOLDS;
                cty.OTHERACE += BGDATA[i].OTHERACE * BGDATA[i].HOUSEHOLDS;
                cty.WORKERS2 += BGDATA[i].WORKERS2 * BGDATA[i].HOUSEHOLDS;
                cty.CDD += BGDATA[i].CDD * BGDATA[i].HOUSEHOLDS;
                cty.HDD += BGDATA[i].HDD * BGDATA[i].HOUSEHOLDS;
                cty.WORKCNT += BGDATA[i].WORKCNT * BGDATA[i].HOUSEHOLDS;
                cty.SUBURBANAREA += BGDATA[i].SUBURBAN * BGDATA[i].LANDAREA;
                cty.SUBURBANPOP += BGDATA[i].SUBURBAN * BGDATA[i].HOUSEHOLDS;
                cty.PDAAREA += BGDATA[i].PDA * BGDATA[i].LANDAREA;
                cty.PDAPOP += BGDATA[i].PDA * BGDATA[i].HOUSEHOLDS;
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
        cty.LATINO = cty.LATINO / cty.HOUSEHOLDS;
        cty.BLACK = cty.BLACK / cty.HOUSEHOLDS;
        cty.ASIAN = cty.ASIAN / cty.HOUSEHOLDS;
        cty.OTHERACE = cty.OTHERACE / cty.HOUSEHOLDS;
        cty.WORKERS2 = cty.WORKERS2 / cty.HOUSEHOLDS;
        cty.CDD = cty.CDD / cty.HOUSEHOLDS;
        cty.HDD = cty.HDD / cty.HOUSEHOLDS;
        cty.WORKCNT = cty.WORKCNT / cty.HOUSEHOLDS;
        cty.SUBURBANAREA = cty.SUBURBANAREA / cty.LANDAREA;
        cty.SUBURBANPOP = cty.SUBURBANPOP / cty.HOUSEHOLDS;
        cty.PDAAREA = cty.PDAAREA / cty.LANDAREA;
        cty.PDAPOP = cty.PDAPOP / cty.HOUSEHOLDS;
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

        mpoCalc();
        
        writeAll(cty, 'county/' + countyList[county]);
    }
}

function allCityCalc () {
    
    for (city = 0; city < cityList.length; city++) {
        reached = 0;
        cty = 0;
        cty = new CtyObj();
        for (i = 0; i < BGDATA.length; i++) {
            if (BGDATA[i].CITY === cityList[city]) {
                reached = 1;
                cty.CTY = cityList[city];
                cty.COUNTY = BGDATA[i].COUNTY;
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
                cty.LATINO += BGDATA[i].LATINO * BGDATA[i].HOUSEHOLDS;
                cty.BLACK += BGDATA[i].BLACK * BGDATA[i].HOUSEHOLDS;
                cty.ASIAN += BGDATA[i].ASIAN * BGDATA[i].HOUSEHOLDS;
                cty.OTHERACE += BGDATA[i].OTHERACE * BGDATA[i].HOUSEHOLDS;
                cty.WORKERS2 += BGDATA[i].WORKERS2 * BGDATA[i].HOUSEHOLDS;
                cty.CDD += BGDATA[i].CDD * BGDATA[i].HOUSEHOLDS;
                cty.HDD += BGDATA[i].HDD * BGDATA[i].HOUSEHOLDS;
                cty.WORKCNT += BGDATA[i].WORKCNT * BGDATA[i].HOUSEHOLDS;
                cty.SUBURBANAREA += BGDATA[i].SUBURBAN * BGDATA[i].LANDAREA;
                cty.SUBURBANPOP += BGDATA[i].SUBURBAN * BGDATA[i].HOUSEHOLDS;
                cty.PDAAREA += BGDATA[i].PDA * BGDATA[i].LANDAREA;
                cty.PDAPOP += BGDATA[i].PDA * BGDATA[i].HOUSEHOLDS;
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
        cty.LATINO = cty.LATINO / cty.HOUSEHOLDS;
        cty.BLACK = cty.BLACK / cty.HOUSEHOLDS;
        cty.ASIAN = cty.ASIAN / cty.HOUSEHOLDS;
        cty.OTHERACE = cty.OTHERACE / cty.HOUSEHOLDS;
        cty.WORKERS2 = cty.WORKERS2 / cty.HOUSEHOLDS;
        cty.CDD = cty.CDD / cty.HOUSEHOLDS;
        cty.HDD = cty.HDD / cty.HOUSEHOLDS;
        cty.WORKCNT = cty.WORKCNT / cty.HOUSEHOLDS;
        cty.SUBURBANAREA = cty.SUBURBANAREA / cty.LANDAREA;
        cty.SUBURBANPOP = cty.SUBURBANPOP / cty.HOUSEHOLDS;
        cty.PDAAREA = cty.PDAAREA / cty.LANDAREA;
        cty.PDAPOP = cty.PDAPOP / cty.HOUSEHOLDS;
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
        
        mpoCalc();
        
        allCities[cityList[city]] = {};
        allCities[cityList[city]] = JSON.parse(JSON.stringify(cty));
    }
    writeAll(allCities, 'city/allCities');
}

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
                cty.LATINO += BGDATA[i].LATINO * BGDATA[i].HOUSEHOLDS;
                cty.BLACK += BGDATA[i].BLACK * BGDATA[i].HOUSEHOLDS;
                cty.ASIAN += BGDATA[i].ASIAN * BGDATA[i].HOUSEHOLDS;
                cty.OTHERACE += BGDATA[i].OTHERACE * BGDATA[i].HOUSEHOLDS;
                cty.WORKERS2 += BGDATA[i].WORKERS2 * BGDATA[i].HOUSEHOLDS;
                cty.CDD += BGDATA[i].CDD * BGDATA[i].HOUSEHOLDS;
                cty.HDD += BGDATA[i].HDD * BGDATA[i].HOUSEHOLDS;
                cty.WORKCNT += BGDATA[i].WORKCNT * BGDATA[i].HOUSEHOLDS;
                cty.SUBURBANAREA += BGDATA[i].SUBURBAN * BGDATA[i].LANDAREA;
                cty.SUBURBANPOP += BGDATA[i].SUBURBAN * BGDATA[i].HOUSEHOLDS;
                cty.PDAAREA += BGDATA[i].PDA * BGDATA[i].LANDAREA;
                cty.PDAPOP += BGDATA[i].PDA * BGDATA[i].HOUSEHOLDS;
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
        cty.LATINO = cty.LATINO / cty.HOUSEHOLDS;
        cty.BLACK = cty.BLACK / cty.HOUSEHOLDS;
        cty.ASIAN = cty.ASIAN / cty.HOUSEHOLDS;
        cty.OTHERACE = cty.OTHERACE / cty.HOUSEHOLDS;
        cty.WORKERS2 = cty.WORKERS2 / cty.HOUSEHOLDS;
        cty.CDD = cty.CDD / cty.HOUSEHOLDS;
        cty.HDD = cty.HDD / cty.HOUSEHOLDS;
        cty.WORKCNT = cty.WORKCNT / cty.HOUSEHOLDS;
        cty.SUBURBANAREA = cty.SUBURBANAREA / cty.LANDAREA;
        cty.SUBURBANPOP = cty.SUBURBANPOP / cty.HOUSEHOLDS;
        cty.PDAAREA = cty.PDAAREA / cty.LANDAREA;
        cty.PDAPOP = cty.PDAPOP / cty.HOUSEHOLDS;
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
        
        mpoCalc();
        
        allCounties[countyList[county]] = {};
        allCounties[countyList[county]] = JSON.parse(JSON.stringify(cty));
    }
    writeAll(allCounties, 'county/allCounties');
}

function tractCalc () {
    
    var tracts = {};
    
    for (i = 0; i < BGDATA.length; i++) {
        cty = 0;
        cty = new CtyObj();
        
        cty.CTY = BGDATA[i].Id2;
        cty.CITY = BGDATA[i].CITY;
        cty.COUNTY = BGDATA[i].COUNTY;
        cty.LANDAREA += BGDATA[i].LANDAREA;
        cty.PEOPLE += BGDATA[i].PEOPLE;
        cty.WORKERS += BGDATA[i].WORKERS;
        cty.HOUSEHOLDS += BGDATA[i].HOUSEHOLDS;

        cty.NumPubTrans += BGDATA[i].NumPubTrans;
        cty["Public Transit Commuters"] += BGDATA[i]["Public Transit Commuters"];
        cty["Bus Commuters"] += BGDATA[i]["Bus Commuters"];
        cty["Subway Commuters"] += BGDATA[i]["Subway Commuters"];
        cty["Railroad Commuters"] += BGDATA[i]["Railroad Commuters"];

        cty.AGE += Number((BGDATA[i].AGE).toFixed(4));
        cty.WHITE += Number((BGDATA[i].WHITE).toFixed(4));
        cty.LATINO += Number((BGDATA[i].LATINO).toFixed(4));
        cty.BLACK += Number((BGDATA[i].BLACK).toFixed(4));
        cty.ASIAN += Number((BGDATA[i].ASIAN).toFixed(4));
        cty.OTHERACE += Number((BGDATA[i].OTHERACE).toFixed(4));
        cty.WORKERS2 += Number((BGDATA[i].WORKERS2).toFixed(4));
        cty.CDD += Number((BGDATA[i].CDD).toFixed(4));
        cty.HDD += Number((BGDATA[i].HDD).toFixed(4));
        cty.WORKCNT += Number((BGDATA[i].WORKCNT).toFixed(4));
        cty.SUBURBANAREA += Number((BGDATA[i].SUBURBAN).toFixed(4));
        cty.SUBURBANPOP += Number((BGDATA[i].SUBURBAN).toFixed(4));
        cty.PDAAREA += Number((BGDATA[i].PDA).toFixed(4));
        cty.PDAPOP += Number((BGDATA[i].PDA).toFixed(4));
        cty.HHSIZE += Number((BGDATA[i].HHSIZE).toFixed(4));
        cty.SIZEOWN += Number((BGDATA[i].SIZEOWN).toFixed(4));
        cty.SIZERENT += Number((BGDATA[i].SIZERENT).toFixed(4));
        cty.GRAD += Number((BGDATA[i].GRAD).toFixed(4)); 
        cty.INCOME2013 += Number((BGDATA[i].INCOME2013).toFixed(4));
        cty.INCOME2007 += Number((BGDATA[i].INCOME2007).toFixed(4));
        cty.VEHICLES += Number((BGDATA[i].VEHICLES).toFixed(4));
        cty.CARCOMMUTE += Number((BGDATA[i].CARCOMMUTE).toFixed(4));
        cty.TIMETOWORK += Number((BGDATA[i].TIMETOWORK).toFixed(4));
        cty.OWN += Number((BGDATA[i].OWN).toFixed(4));
        cty.ROOMS += Number((BGDATA[i].ROOMS).toFixed(4));
        cty.GAS += Number((BGDATA[i].GAS).toFixed(4));
        cty.ELECTRIC += Number((BGDATA[i].ELECTRIC).toFixed(4));
        cty.OIL += Number((BGDATA[i].OIL).toFixed(4));
        cty.NOFUEL += Number((BGDATA[i].NOFUEL).toFixed(4));
        cty.OTHERFUEL += Number((BGDATA[i].OTHERFUEL).toFixed(4));
        cty.YEARBUILT += Number((BGDATA[i].YEARBUILT).toFixed(4));
        cty.SINGDET += Number((BGDATA[i].SINGDET).toFixed(4));
        cty.SQFT += Number((BGDATA[i].SQFT).toFixed(4));
        cty.Children += Number((BGDATA[i].Children).toFixed(4));
        cty.Adults += Number((BGDATA[i].Adults).toFixed(4));

        mpoCalc();
        
        tracts[cty.CTY] = cty;
        
        //writePublic(cty, 'tract/cities/' + cty.CITY + '/' + cty.CTY);
        //writePublic(cty, 'tract/counties/' + cty.COUNTY + '/' + cty.CTY);
    }

    for (i = 0; i < cityList.length; i++) {
        tracts[cityList[i]] = [];
        for (k in tracts) {
            if (tracts[k].CITY === cityList[i]) {
                tracts[cityList[i]].push(tracts[k]);
            }
        }
        writePublic(tracts[cityList[i]], 'tract/cities/' + cityList[i] + '/allTracts');
    }
    
    for (i = 0; i < countyList.length; i++) {
        tracts[countyList[i]] = [];
        for (k in tracts) {
            if (tracts[k].COUNTY === countyList[i]) {
                tracts[countyList[i]].push(tracts[k]);
            }
        }
        writePublic(tracts[countyList[i]], 'tract/counties/' + countyList[i] + '/allTracts');
    }
    
    //writePublic(tracts, 'tract/tracts');
}


function makeFolders() {
    var dir = "";
    
    for (i = 0; i < cityList.length; i++) {
        dir = './data/tract/cities/' + cityList[i];
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
    
    for (i = 0; i < countyList.length; i++) {
        dir = './data/tract/counties/' + countyList[i];
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
}

// Create manual objects
//=============================================================================

// Initialize long variables

function varsInit () {
    
    // Keys
    countyList = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"];

    cityList = ["ACAMPO", "ACTON", "ADELANTO", "ADIN", "AGOURA HILLS", "AGUANGA", "AHWAHNEE", "ALAMEDA", "ALAMO", "ALBANY", "ALBION", "ALDERPOINT", "ALHAMBRA", "ALISO VIEJO", "ALPAUGH", "ALPINE", "ALTA", "ALTADENA", "ALTURAS", "AMADOR CITY", "AMERICAN CANYON", "ANAHEIM", "ANDERSON", "ANGELS CAMP", "ANGELUS OAKS", "ANGWIN", "ANTELOPE", "ANTIOCH", "APPLE VALLEY", "APPLEGATE", "APTOS", "ARBUCKLE", "ARCADIA", "ARCATA", "ARMONA", "ARNOLD", "AROMAS", "ARROYO GRANDE", "ARTESIA", "ARVIN", "ATASCADERO", "ATHERTON", "ATWATER", "AUBERRY", "AUBURN", "AVALON", "AVENAL", "AZUSA", "BAKERSFIELD", "BALDWIN PARK", "BALLICO", "BANNING", "BARD", "BARSTOW", "BASS LAKE", "BEALE AFB", "BEAUMONT", "BELDEN", "BELL", "BELLFLOWER", "BELMONT", "BELVEDERE TIBURON", "BEN LOMOND", "BENICIA", "BERKELEY", "BERRY CREEK", "BETHEL ISLAND", "BEVERLY HILLS", "BIG BEAR CITY", "BIG BEAR LAKE", "BIG OAK FLAT", "BIG PINE", "BIG SUR", "BIGGS", "BIOLA", "BIRDS LANDING", "BISHOP", "BLAIRSDEN-GRAEAGLE", "BLOCKSBURG", "BLOOMINGTON", "BLUE LAKE", "BLYTHE", "BODEGA", "BODEGA BAY", "BODFISH", "BOLINAS", "BONITA", "BONSALL", "BOONVILLE", "BORON", "BORREGO SPRINGS", "BOULDER CREEK", "BRADLEY", "BRANSCOMB", "BRAWLEY", "BREA", "BRENTWOOD", "BRIDGEPORT", "BRISBANE", "BROOKS", "BUELLTON", "BUENA PARK", "BURBANK", "BURLINGAME", "BURNEY", "BURNT RANCH", "BURSON", "BUTTE CITY", "BUTTONWILLOW", "CALABASAS", "CALEXICO", "CALIENTE", "CALIFORNIA CITY", "CALIFORNIA HOT SPRINGS", "CALIMESA", "CALISTOGA", "CALLAHAN", "CAMARILLO", "CAMBRIA", "CAMINO", "CAMPBELL", "CANOGA PARK", "CANTUA CREEK", "CANYON", "CANYON COUNTRY", "CANYON DAM", "CAPISTRANO BEACH", "CAPITOLA", "CARDIFF BY THE SEA", "CARLSBAD", "CARMEL", "CARMEL BY THE SEA", "CARMEL VALLEY", "CARMICHAEL", "CARNELIAN BAY", "CARPINTERIA", "CARSON", "CARUTHERS", "CASMALIA", "CASPAR", "CASTAIC", "CASTELLA", "CASTRO VALLEY", "CASTROVILLE", "CATHEDRAL CITY", "CAYUCOS", "CAZADERO", "CEDAR GLEN", "CEDARPINES PARK", "CEDARVILLE", "CERES", "CERRITOS", "CHATSWORTH", "CHESTER", "CHICO", "CHILCOOT", "CHINO", "CHINO HILLS", "CHOWCHILLA", "CHULA VISTA", "CITRUS HEIGHTS", "CLAREMONT", "CLARKSBURG", "CLAYTON", "CLEARLAKE", "CLEARLAKE OAKS", "CLOVERDALE", "CLOVIS", "COACHELLA", "COALINGA", "COARSEGOLD", "COBB", "COLFAX", "COLTON", "COLUSA", "COMPTON", "CONCORD", "COOL", "CORCORAN", "CORONA", "CORONA DEL MAR", "CORONADO", "CORTE MADERA", "COSTA MESA", "COTATI", "COTTONWOOD", "COULTERVILLE", "COURTLAND", "COVELO", "COVINA", "COYOTE", "CRESCENT CITY", "CRESTLINE", "CRESTON", "CROCKETT", "CROWS LANDING", "CULVER CITY", "CUPERTINO", "CUTLER", "CYPRESS", "DALY CITY", "DANA POINT", "DANVILLE", "DARDANELLE", "DAVIS", "DEL MAR", "DEL REY", "DELANO", "DELHI", "DENAIR", "DESCANSO", "DESERT HOT SPRINGS", "DIAMOND BAR", "DIAMOND SPRINGS", "DILLON BEACH", "DINUBA", "DISCOVERY BAY", "DIXON", "DORRIS", "DOS PALOS", "DOUGLAS CITY", "DOWNEY", "DUARTE", "DUBLIN", "DUCOR", "DUNLAP", "DUNSMUIR", "EARLIMART", "EARP", "ECHO LAKE", "EDISON", "EL CAJON", "EL CENTRO", "EL CERRITO", "EL DORADO", "EL DORADO HILLS", "EL MONTE", "EL SEGUNDO", "EL SOBRANTE", "ELK", "ELK CREEK", "ELK GROVE", "ELVERTA", "EMERYVILLE", "EMIGRANT GAP", "EMPIRE", "ENCINITAS", "ENCINO", "ESCALON", "ESCONDIDO", "ESPARTO", "EUREKA", "EXETER", "FAIR OAKS", "FAIRFAX", "FAIRFIELD", "FALLBROOK", "FARMERSVILLE", "FARMINGTON", "FELLOWS", "FELTON", "FERNDALE", "FILLMORE", "FINLEY", "FIREBAUGH", "FISH CAMP", "FOLSOM", "FONTANA", "FOOTHILL RANCH", "FOREST KNOLLS", "FOREST RANCH", "FORESTHILL", "FORESTVILLE", "FORT BRAGG", "FORT IRWIN", "FORT JONES", "FORTUNA", "FOUNTAIN VALLEY", "FOWLER", "FRAZIER PARK", "FREEDOM", "FREMONT", "FRENCH CAMP", "FRESNO", "FULLERTON", "GALT", "GARBERVILLE", "GARDEN GROVE", "GARDEN VALLEY", "GARDENA", "GAZELLE", "GERBER", "GEYSERVILLE", "GILROY", "GLEN ELLEN", "GLENCOE", "GLENDALE", "GLENDORA", "GLENN", "GLENNVILLE", "GOLETA", "GRANADA HILLS", "GRAND TERRACE", "GRANITE BAY", "GRASS VALLEY", "GRATON", "GREENBRAE", "GREENFIELD", "GRIDLEY", "GROVER BEACH", "GUERNEVILLE", "HACIENDA HEIGHTS", "HALF MOON BAY", "HANFORD", "HARBOR CITY", "HAWAIIAN GARDENS", "HAWTHORNE", "HAYWARD", "HEALDSBURG", "HEMET", "HERCULES", "HERMOSA BEACH", "HESPERIA", "HIGHLAND", "HOLLISTER", "HOLTVILLE", "HOMELAND", "HOMEWOOD", "HOOPA", "HORNBROOK", "HORNITOS", "HUGHSON", "HUNTINGTON BEACH", "HUNTINGTON PARK", "IMPERIAL BEACH", "INDIAN WELLS", "INDIO", "INGLEWOOD", "INYOKERN", "IONE", "IRVINE", "IVANHOE", "JACKSON", "JACUMBA", "JAMESTOWN", "JAMUL", "JANESVILLE", "JOSHUA TREE", "JULIAN", "KEENE", "KELSEYVILLE", "KERMAN", "KING CITY", "KINGS BEACH", "KINGSBURG", "KIRKWOOD", "KLAMATH", "KNIGHTS LANDING", "KNIGHTSEN", "KYBURZ", "LA CANADA FLINTRIDGE", "LA CRESCENTA", "LA HABRA", "LA JOLLA", "LA MESA", "LA MIRADA", "LA PALMA", "LA PUENTE", "LA QUINTA", "LA VERNE", "LADERA RANCH", "LAFAYETTE", "LAGUNA BEACH", "LAGUNA HILLS", "LAGUNA NIGUEL", "LAGUNA WOODS", "LAKE ARROWHEAD", "LAKE ELSINORE", "LAKE FOREST", "LAKE HUGHES", "LAKEPORT", "LAKESIDE", "LAKEWOOD", "LAMONT", "LANCASTER", "LATHROP", "LATON", "LAWNDALE", "LE GRAND", "LEBEC", "LEMON GROVE", "LEMOORE", "LEWISTON", "LINCOLN", "LINDSAY", "LITTLEROCK", "LIVE OAK", "LIVERMORE", "LIVINGSTON", "LLANO", "LOCKEFORD", "LODI", "LOMA LINDA", "LOMITA", "LOMPOC", "LONG BEACH", "LOOMIS", "LOS ALAMITOS", "LOS ALTOS", "LOS ANGELES", "LOS BANOS", "LOS GATOS", "LOS OLIVOS", "LOS OSOS", "LOTUS", "LOWER LAKE", "LUCERNE", "LUCERNE VALLEY", "LYNWOOD", "MACDOEL", "MAD RIVER", "MADERA", "MAGALIA", "MALIBU", "MAMMOTH LAKES", "MANHATTAN BEACH", "MANTECA", "MARCH AIR RESERVE BASE", "MARICOPA", "MARINA", "MARINA DEL REY", "MARTINEZ", "MARYSVILLE", "MATHER", "MAYWOOD", "MC FARLAND", "MCCLELLAN", "MCCLOUD", "MCKINLEYVILLE", "MEADOW VALLEY", "MECCA", "MENIFEE", "MENLO PARK", "MENTONE", "MERCED", "MIDWAY CITY", "MILL VALLEY", "MILLBRAE", "MILPITAS", "MIRA LOMA", "MISSION HILLS", "MISSION VIEJO", "MODESTO", "MOJAVE", "MONROVIA", "MONTCLAIR", "MONTEBELLO", "MONTEREY", "MONTEREY PARK", "MONTROSE", "MOORPARK", "MORAGA", "MORENO VALLEY", "MORGAN HILL", "MORONGO VALLEY", "MORRO BAY", "MOSS LANDING", "MOUNT SHASTA", "MOUNTAIN VIEW", "MURRIETA", "NAPA", "NATIONAL CITY", "NEEDLES", "NEVADA CITY", "NEWARK", "NEWBURY PARK", "NEWHALL", "NEWMAN", "NEWPORT BEACH", "NIPOMO", "NORCO", "NORDEN", "NORTH HIGHLANDS", "NORTH HILLS", "NORTH HOLLYWOOD", "NORTHRIDGE", "NORWALK", "NOVATO", "NUEVO", "OAK PARK", "OAK VIEW", "OAKDALE", "OAKLAND", "OAKLEY", "OCEANSIDE", "OJAI", "OLIVEHURST", "ONTARIO", "ORANGE", "ORANGE COVE", "ORANGEVALE", "ORICK", "ORINDA", "ORLAND", "OROVILLE", "OXNARD", "PACIFIC GROVE", "PACIFIC PALISADES", "PACIFICA", "PACOIMA", "PALM DESERT", "PALM SPRINGS", "PALMDALE", "PALO ALTO", "PALOS VERDES PENINSULA", "PANORAMA CITY", "PARADISE", "PARAMOUNT", "PASADENA", "PASO ROBLES", "PATTERSON", "PAUMA VALLEY", "PENN VALLEY", "PENNGROVE", "PERRIS", "PETALUMA", "PHELAN", "PICO RIVERA", "PINOLE", "PIONEER", "PIONEERTOWN", "PISMO BEACH", "PITTSBURG", "PLACENTIA", "PLACERVILLE", "PLAYA DEL REY", "PLEASANT HILL", "PLEASANTON", "POMONA", "PORT HUENEME", "PORTER RANCH", "PORTERVILLE", "POTTER VALLEY", "POWAY", "QUINCY", "RAMONA", "RANCHO CORDOVA", "RANCHO CUCAMONGA", "RANCHO MIRAGE", "RANCHO PALOS VERDES", "RANCHO SANTA FE", "RANCHO SANTA MARGARITA", "RAYMOND", "RED BLUFF", "REDDING", "REDLANDS", "REDONDO BEACH", "REDWOOD CITY", "REDWOOD VALLEY", "REEDLEY", "RESCUE", "RESEDA", "RIALTO", "RICHMOND", "RIDGECREST", "RIO LINDA", "RIO VISTA", "RIPON", "RIVERBANK", "RIVERSIDE", "ROCKLIN", "ROHNERT PARK", "ROSAMOND", "ROSEMEAD", "ROSEVILLE", "ROWLAND HEIGHTS", "SACRAMENTO", "SAINT HELENA", "SALINAS", "SAN ANSELMO", "SAN BERNARDINO", "SAN BRUNO", "SAN CARLOS", "SAN CLEMENTE", "SAN DIEGO", "SAN DIMAS", "SAN FERNANDO", "SAN FRANCISCO", "SAN GABRIEL", "SAN JACINTO", "SAN JOSE", "SAN JUAN CAPISTRANO", "SAN LEANDRO", "SAN LORENZO", "SAN LUIS OBISPO", "SAN MARCOS", "SAN MARINO", "SAN MATEO", "SAN PABLO", "SAN PEDRO", "SAN RAFAEL", "SAN RAMON", "SAN YSIDRO", "SANGER", "SANTA ANA", "SANTA BARBARA", "SANTA CLARA", "SANTA CLARITA", "SANTA CRUZ", "SANTA FE SPRINGS", "SANTA MARIA", "SANTA MONICA", "SANTA PAULA", "SANTA ROSA", "SANTEE", "SARATOGA", "SAUSALITO", "SCOTTS VALLEY", "SEAL BEACH", "SEASIDE", "SEBASTOPOL", "SELMA", "SHAFTER", "SHASTA LAKE", "SHERMAN OAKS", "SHINGLE SPRINGS", "SIERRA MADRE", "SIGNAL HILL", "SILVERADO", "SIMI VALLEY", "SOLANA BEACH", "SOLEDAD", "SOMES BAR", "SONOMA", "SONORA", "SOUTH EL MONTE", "SOUTH GATE", "SOUTH LAKE TAHOE", "SOUTH PASADENA", "SOUTH SAN FRANCISCO", "SPRING VALLEY", "STANFORD", "STANTON", "STEVENSON RANCH", "STOCKTON", "STUDIO CITY", "SUISUN CITY", "SUN CITY", "SUN VALLEY", "SUNLAND", "SUNNYVALE", "SUNSET BEACH", "SUSANVILLE", "SYLMAR", "TAFT", "TAHOE CITY", "TARZANA", "TEHACHAPI", "TEMECULA", "TEMPLE CITY", "THERMAL", "THOUSAND OAKS", "THOUSAND PALMS", "TOPANGA", "TORRANCE", "TRABUCO CANYON", "TRACY", "TRUCKEE", "TUJUNGA", "TULARE", "TURLOCK", "TUSTIN", "TWENTYNINE PALMS", "UKIAH", "UNION CITY", "UPLAND", "VACAVILLE", "VALENCIA", "VALLEJO", "VALLEY VILLAGE", "VAN NUYS", "VENICE", "VENTURA", "VICTORVILLE", "VILLA PARK", "VISALIA", "VISTA", "WALNUT", "WALNUT CREEK", "WASCO", "WATSONVILLE", "WEST COVINA", "WEST HILLS", "WEST HOLLYWOOD", "WEST SACRAMENTO", "WESTLAKE VILLAGE", "WESTMINSTER", "WHEATLAND", "WHITE WATER", "WHITTIER", "WILDOMAR", "WILLITS", "WILLOWS", "WILMINGTON", "WINCHESTER", "WINDSOR", "WINNETKA", "WINTON", "WOODLAKE", "WOODLAND", "WOODLAND HILLS", "YORBA LINDA", "YOUNTVILLE", "YREKA", "YUBA CITY", "YUCAIPA", "YUCCA VALLEY"];

    headersList = ["CITY", "COUNTY", "LANDAREA", "DENSITY", "EMPDEN", "SUBURBANAREA", "SUBURBANPOP", "PDAAREA", "PDAPOP", "CDD", "HDD", "PEOPLE", "WORKERS", "WORKCNT", "HOUSEHOLDS", "HHSIZE", "SIZEOWN", "SIZERENT", "GRAD", "INCOME2013", "INCOME2007", "AGE", "WHITE", "LATINO", "BLACK", "ASIAN", "OTHERACE", "WORKERS2", "VEHICLES", "CARCOMMUTE", "TIMETOWORK", "OWN", "ROOMS", "GAS", "ELECTRIC", "OIL", "NOFUEL", "OTHERFUEL", "YEARBUILT", "SINGDET", "SQFT", "Children", "Adults", "NumPubTrans", "Public Transit Commuters", "Bus Commuters", "Subway Commuters", "Railroad Commuters"];

    mpoList = ["MTC", "SACOG", "SANDAG", "SCAG", "San Joaquin Valley", "Other"];

    fiveYearsList = ["2020", "2025", "2030", "2035", "2040", "2045", "2050"];

    tenYearsList = ["2020", "2030", "2040", "2050"];
    
    manyYearsList = ["2010", "2015", "2020", "2025", "2030", "2035", "2040", "2045", "2050", "2055", "2060"];

}

readyBGDATA();
//makeFolders();

// Calculate demographics
//=============================================================================

tractCalc();
//CountyCalc();
//CityCalc();
//allCountyCalc();
//allCityCalc();
//HSRCALC();
//POPCALC();
//PUBLICTRANSCALC();