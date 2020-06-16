//'use strict';
/*jslint plusplus: true */

var fs = require('fs');
var d3 = require('d3');
var $ = require('jquery');

// Constants
var TOTAL_YEARS = 9,
    MSWTABLE,
    POPTABLE,
    MPOHSRTABLE,
    PUBLICTRANSTABLE,
    ghgFactors = {},
    years = [0],
    tractCounter = 0;

// Value holders
var writeFile, spacing, reached, i,
    localeTracts = {};

// Global val holder for current selected county & city
var COUNTY, CITY, PLACE;

// Object index counters
// For looping through objects with the object keys
var i, j, k;

// Chart objects
var emissionsTractsChart;

// Objects
var allCities, allCounties, consumption, emissions, VMTMODEL, policies = {};

// Multipliers
var policyMultipliers = {}, adoptionCurves = {};

// Keys to object (database) structure
var countyList, cityList, headersList, policiesList;

// Constructors
var CtyObj, AdoptionCurve;

// HTML strings
var cityMenuHTML, countyMenuHTML;

// Data
var HHEmissions = {}, HHTractEmissions = {};

var bauEmissions = {};

var scenarioEmissions = {};
var differentCityEmissions = [], differentCountyEmissions = [], differentEmissions = [];


// End Variable Declarations
//***************************************************************************//

// Functions
//***************************************************************************//

function writePrivate (dat, name) {
    writeFile = './data/' + name + '.json';
    spacing = 4;

    fs.writeFileSync(writeFile, JSON.stringify(dat, null, spacing));
    console.log("Readable JSON saved to " + writeFile)
}

function writePublic (dat, name) {
    writeFile = './data/' + name + '-min.json';
    spacing = 0;

    fs.writeFileSync(writeFile, JSON.stringify(dat, null, spacing));
    console.log("Concise JSON saved to " + writeFile);
}

function writeAll (dat, name) {
    writePrivate(dat, name);
    writePublic(dat, name);
}


// Data transformation tools
// ========================================= //

// Find the MPO and population for a given year
// (string, string), returns int
// this needs to be updated
// MPO is included in locale, could probably be done more cleanly
function mpoPopCalc(year) {
    var MPO = "", pop = 0;
    
    if (COUNTY === "Alameda" || COUNTY === "Contra Costa" || COUNTY === "Marin" || COUNTY === "Napa" || COUNTY === "San Francisco" || COUNTY === "San Mateo" || COUNTY === "Santa Clara" || COUNTY === "Solano" || COUNTY === "Sonoma") {
        MPO = "MTC";
        pop = POPTABLE.Alameda[year] +  POPTABLE["Contra Costa"][year] + POPTABLE.Marin[year] + POPTABLE.Napa[year] + POPTABLE["San Francisco"][year] + POPTABLE["San Mateo"][year] + POPTABLE["Santa Clara"][year] + POPTABLE.Solano[year] + POPTABLE.Sonoma[year];
        
    } else if (COUNTY === "El Dorado" || COUNTY === "Placer" || COUNTY === "Sacramento" || COUNTY === "Sutter" || COUNTY === "Yolo" || COUNTY === "Yuba") {
        MPO = "SACOG";
        pop = POPTABLE["El Dorado"][year] + POPTABLE.Placer[year] + POPTABLE.Sacramento[year] + POPTABLE.Sutter[year] + POPTABLE.Yolo[year] + POPTABLE.Yuba[year];
            
    } else if (COUNTY === "San Diego") {
        MPO = "SANDAG";
        pop = POPTABLE["San Diego"][year];
        
    } else if (COUNTY === "Imperial" || COUNTY === "Los Angeles" || COUNTY === "Orange" || COUNTY === "Riverside" || COUNTY === "San Bernardino" || COUNTY === "Ventura") {
        MPO = "SCAG";
        pop = POPTABLE.Imperial[year] + POPTABLE["Los Angeles"][year] + POPTABLE.Orange[year] + POPTABLE.Riverside[year] + POPTABLE["San Bernardino"][year] + POPTABLE.Ventura[year];
        
    } else if (COUNTY === "San Joaquin" || COUNTY === "Merced" || COUNTY === "Madera" || COUNTY === "Fresno" || COUNTY === "Tulare" || COUNTY === "Kings" || COUNTY === "Kern" || COUNTY === "Stanislaus") {
        MPO = "San Joaquin Valley";
        pop = POPTABLE["San Joaquin"][year] + POPTABLE.Merced[year] + POPTABLE.Madera[year] + POPTABLE.Fresno[year] + POPTABLE.Tulare[year] + POPTABLE.Kings[year] + POPTABLE.Kern[year] + POPTABLE.Stanislaus[year];
        
    } else {
        MPO = "Other";
        pop = POPTABLE.Alpine[year] + POPTABLE.Amador[year] + POPTABLE.Butte[year] + POPTABLE.Calaveras[year] + POPTABLE.Colusa[year] + POPTABLE["Del Norte"][year] + POPTABLE.Glenn[year] + POPTABLE.Humboldt[year] + POPTABLE.Inyo[year] + POPTABLE.Lake[year] + POPTABLE.Lassen[year] + POPTABLE.Mariposa[year] + POPTABLE.Mendocino[year] + POPTABLE.Modoc[year] + POPTABLE.Mono[year] + POPTABLE.Monterey[year] + POPTABLE.Nevada[year] + POPTABLE.Plumas[year] + POPTABLE["San Benito"][year] + POPTABLE["San Luis Obispo"][year] + POPTABLE["Santa Barbara"][year] + POPTABLE["Santa Cruz"][year] + POPTABLE.Shasta[year] + POPTABLE.Sierra[year] + POPTABLE.Siskiyou[year] + POPTABLE.Tehama[year] + POPTABLE.Trinity[year] + POPTABLE.Tuolumne[year];
    }
    
    return pop;
}

// Modeling functions
// ========================================= //

function transportationModelTracts(tract) {
    var model;
    
    if (COUNTY === "Alameda" || COUNTY === "Contra Costa" || COUNTY === "Marin" || COUNTY === "San Francisco" || COUNTY === "San Mateo") {
        return "San Francisco";
    } else if (COUNTY === "Santa Clara" || COUNTY === "San Benito") {
        return "Santa Clara";
    } else if (COUNTY === "El Dorado" || COUNTY === "Placer" || COUNTY === "Sacramento" || COUNTY === "Yolo") {
        return "Sacramento";
    } else if (COUNTY === "San Diego") {
        return "San Diego";
    } else if (COUNTY === "Los Angeles" || COUNTY === "Orange") {
        return "Los Angeles";
    } else if (COUNTY === "Riverside" || COUNTY === "San Bernardino") {
        return "Riverside";
    } else {
        return "Other";
    }
}

function vmtTracts(tract) {
    var model = VMTMODEL[transportationModelTracts(tract)],
        result =  Math.exp(model.Constant + model.LNVEH * Math.log(tract.VEHICLES) + model.LNHHSIZE * Math.log(tract.HHSIZE) + model.LNHHINC * Math.log(tract.INCOME2013) + model.WORKCOUNT * tract.WORKCNT + model.TIMETOWORK * tract.TIMETOWORK + model.DRIVE * tract.CARCOMMUTE + model.HHVEHCOUNT * tract.VEHICLES + model.HBPOPDN * tract.DENSITY + model.HHSIZE * tract.HHSIZE + model.HHINC * tract.INCOME2013 + model.WHITE * tract.WHITE + model.HOMEOWN * tract.OWN + model.HISP * tract.LATINO);
    
    return result;
             
}

// (float), returns floats [therms]
function naturalGasThermsTracts(tract) {
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
        REFYEAR = 2013,
        
        result;

    result = Math.exp((NGCONSTANT + NGGASCOEF * tract.GAS + NGROOMSCOEF * tract.ROOMS + NGYEARBUILTCOEF * (REFYEAR - tract.YEARBUILT) + NGASIANCOEF * tract.ASIAN + NGHHSIZELNCOEF * Math.log(tract.HHSIZE) + NGWHITECOEF * (tract.WHITE / 2) + NGGRADCOEF * tract.GRAD + NGSQFTCOEF * tract.SQFT + NGOWNCOEF * tract.OWN + NGSINGDETCOEF * tract.SINGDET));
    
    return result;
}

// (float), returns floats [miles]
function airTravelDistanceTracts(tract) {
    var AIRTRAVELCONSTANT = 33.088,
        AIRINCOMECOEF = 0.0633;
    
    return (AIRTRAVELCONSTANT + AIRINCOMECOEF * tract.INCOME2007);
}

// (string), returns floats [miles / HH]
function hsrTravelTracts(tract, year) {
    var perCapitaMiles = 0,
        mpo = tract.MPO,
        pop = 0;
    
    pop = mpoPopCalc(year);
    
    perCapitaMiles = MPOHSRTABLE[mpo][year] / pop;
    
    return perCapitaMiles;
}

// (floats), returns floats [miles / HH]
function lightRailTravelTracts(tract) {
    return (localeTracts[PLACE][tractCounter]["Subway Commuters"] * PUBLICTRANSTABLE[COUNTY].CommuterRailMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
}

function heavyRailTravelTracts(tract) {
    return (localeTracts[PLACE][tractCounter]["Railroad Commuters"] * PUBLICTRANSTABLE[COUNTY].AmtrakMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
}

function busTravelTracts(tract) {
    return (localeTracts[PLACE][tractCounter]["Bus Commuters"] * PUBLICTRANSTABLE[COUNTY].BusMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
}

// (float), returns floats  [gCO2e/HH]
function waterUseTracts(tract) {
    var WATERHHSIZECOEF = 25550; // 70 gal/day/person * 365 days/yr
    
    return (WATERHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [miles]
// this needs to be updated 
// needs to include vehicle manufacturing??? miles driven (vmt) * manufacturing emission factor
function vmntTracts(tract) {
    var VMNTCONSTANT = 78.20,
        VMNTINCOME07COEF = 0.0021,
        AUTOPARTHHSIZECOEF =  7.80,
        VEHSERVCONSTANT =  158.78,
        VEHSERVINCOMECOEF =  0.0043,
        VEHSERVEHHSIZECOEF =  15.83;
        
    return ((VMNTCONSTANT + VMNTINCOME07COEF * tract.INCOME2007 + AUTOPARTHHSIZECOEF * tract.HHSIZE) + (VEHSERVCONSTANT + VEHSERVINCOMECOEF * tract.INCOME2007 + VEHSERVEHHSIZECOEF * tract.HHSIZE));
}

// (float), returns floats [kwh]
function kwhUseTracts(tract) {
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
    
    return (Math.exp(KWHCONSTANT + KWHROOMSCOEF * tract.ROOMS + KWHLNCDDSQFTCOEF * Math.log(tract.CDD * tract.SQFT) + KWHLNHHSIZECOEF * Math.log(tract.HHSIZE) + KWHLNINCOME13COEF * Math.log(tract.INCOME2013) + KWHASIANCOEF * tract.ASIAN + KWHGASCOEF * tract.GAS + KWHOWNCOEF * tract.OWN + KWHSQFTCOEF * tract.SQFT + KWHGRADCOEF * tract.GRAD + KWHSINGDETCOEF * tract.SINGDET));
}

// (float), returns floats [gallons]
function oilUseTracts(tract) {
    var FOCONSTANT = 228.95,
        FOROOMSCOEF = 75.846,
        FOREGIONCOEF = 128.895,
        FOOWNCOEF = -164.353,
        FOAGECOEF = 2.836,
        FODIV1COEF = 99.678,
        FOWHITECOEF = -94.047,
        
        REGION = 0,
        DIV1 = 0;
    
    return ((FOCONSTANT + FOROOMSCOEF * tract.ROOMS + FOREGIONCOEF * REGION + FOOWNCOEF * tract.OWN + FOAGECOEF * tract.AGE + FODIV1COEF * DIV1 + FOWHITECOEF * tract.WHITE) * tract.OTHERFUEL);
}

// (float), returns floats [tons]
function wasteGenerationTracts(tract) {
    if (MSWTABLE[COUNTY].DISPOSALRATE) {
        return (MSWTABLE[COUNTY].DISPOSALRATE);
    } else {
        return (0.5);
    }
}

// (float), returns floats
function housingConstructionTracts(tract) {
    return (((0.0097 * Math.pow(tract.SQFT, 2) - 10.012 * tract.SQFT + 80256) / 70) * 1000); // gCO2/HH, amortized over 70 years
}

// (float), returns floats [calories]
function meatConsumptionTracts(tract) {
    var ADULTMEATCAL = 487,
        CHILDMEATCAL = 365;
    return ((ADULTMEATCAL * tract.Adults + CHILDMEATCAL * tract.Children) * 365);
}

// (float), returns floats [calories]
function dairyConsumptionTracts(tract) {
    var ADULTDAIRYCAL = 232,
        CHILDDAIRYCAL = 174;
    return ((ADULTDAIRYCAL * tract.Adults + CHILDDAIRYCAL * tract.Children) * 365);
}

// (float), returns floats [calories]
function otherFoodConsumptionTracts(tract) {
    var ADULTOTHERCAL = 1170,
        CHILDOTHERCAL = 877;
    return ((ADULTOTHERCAL * tract.Adults + CHILDOTHERCAL * tract.Children) * 365);
}

// (float), returns floats [calories]
function vegeCaloriesTracts(tract) {
    var ADULTVEGECAL = 304,
        CHILDVEGECAL = 228;
    return ((ADULTVEGECAL * tract.Adults + CHILDVEGECAL * tract.Children) * 365);
}

// (float), returns floats [calories]
function cerealCaloriesTracts(tract) {
    var ADULTCEREALCAL = 584,
        CHILDCEREALCAL = 438;
    
    return ((ADULTCEREALCAL * tract.Adults + CHILDCEREALCAL * tract.Children) * 365);
}

// (float), returns floats [dollars]
function clothingUSDTracts(tract) {
    var CLOTHCONSTANT = 75.63,
        CLOTHINCOME07COEF =  0.0149,
        CLOTHHHSIZECOEF =  323.60;
    
    return (CLOTHCONSTANT + CLOTHINCOME07COEF * tract.INCOME2007 + CLOTHHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function furnishingsUSDTracts(tract) {
    var FURCONSTANT =  278.96,
        FURINCOME07COEF =  0.0231,
        FURHHSIZECOEF =  27.70;
    
    return (FURCONSTANT + FURINCOME07COEF * tract.INCOME2007 + FURHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function otherGoodsUSDTracts(tract) {
    var OTHERGOODSCONSTANT =  2769.82,
        OTHERGOODSINCOME07COEF =  0.0291,
        OTHERGOODSHHSIZECOEF =  100.70;
    
    return (OTHERGOODSCONSTANT + OTHERGOODSINCOME07COEF * tract.INCOME2007 + OTHERGOODSHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function servicesUSDTracts(tract) {
    var SERVICESCONSTANT =  3939.74,
        SERVICESINCOME07COEF =  0.1428,
        SERVICESHHSIZECOEF =  102.47;
    
    return (SERVICESCONSTANT + SERVICESINCOME07COEF * tract.INCOME2007 + SERVICESHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function medicalTracts(tract) {
    var MEDICALCONSTANT = 775.25,
        MEDICALINCOME07COEF = 0.0029,
        MEDICALHHSIZECOEF = 0.13;
    
    return (MEDICALCONSTANT + MEDICALINCOME07COEF * tract.INCOME2007 + MEDICALHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function entertainmentTracts(tract) {
    var ENTERTAINCONSTANT =  228.57,
        ENTERTAININCOME07COEF =  0.0146,
        ENTERTAINHHSIZECOEF =  24.73;
    
    return (ENTERTAINCONSTANT + ENTERTAININCOME07COEF * tract.INCOME2007 + ENTERTAINHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function readingTracts(tract) {
    var READINGCONSTANT =  73.68,
        READINGINCOME07COEF =  0.0015,
        READINGHHSIZECOEF =  -17.53;
    
    return (READINGCONSTANT + READINGINCOME07COEF * tract.INCOME2007 + READINGHHSIZECOEF * tract.HHSIZE);
}

// (float), returns floats [dollars]
function careCleanTracts(tract) {
    var CARECLEANCONSTANT =  229.21,
        CARECLEANINCOME07COEF =  0.0079,
        CARECLEANHHSZIECOEF =  85.57;
    
    return (CARECLEANCONSTANT + CARECLEANINCOME07COEF * tract.INCOME2007 + CARECLEANHHSZIECOEF * tract.HHSIZE);
}

// ========================================= //

function curveCalc(curve, policy) {
    var extrap = new extrapolate();
    extrap.given(2010, 0);
    
    for (i = 0; i < 4; i++) {
        extrap.given(curve[i], (i / 4) + 0.25);
    }
    
    if (curve[3] < 2050 && curve[2] < curve[3]) {
        extrap.given(2050, 1);
    }
    
    for (i = 0; i < TOTAL_YEARS; i++) {
        adoptionCurves[policy][years[i]] = extrap.getLinear(parseInt(years[i]));
    }
    
}

function consumptionMultiplier(policy, year) {
    return (1 + (policyMultipliers[policy] * adoptionCurves[policy][year]));
}

function efficiencyMultiplier(policy, year) {
    return (1 - (policyMultipliers[policy] * adoptionCurves[policy][year]));
}

// End Helper Functions
//***************************************************************************//

// Generate data
// Monster function
// This needs to be cleaned up
// ============================================================================== //
// this is insane

function emissionsTractCalc(year) {
    // To-do list:
    // Clean this up
    // Need to develop stacked chart graph / graph of each sector
    
    var HHVMT,
        ELECTRICHEATNEW2010 = 0.1,
        ELECTRICHEATEXISTING2010 = 0.1,
        sum = 0,
        emissionSector,
        counter,
        popIncrease,
        HHadditive,
        totalPDAAREA, pctTotalPDA, //pctPDA,
        pdaGrowthMultiplier, suburbGrowthMultiplier,
        
        tract,
        tractID,
        localEmissions,
        
        pctInfill = policyMultipliers.Infill;// * adoptionCurves.Infill[year]);
        
    localEmissions = {};
    
    localEmissions[PLACE + " " + year + " " + "sum"] = 0;
    
    // This works by estimating how many people are needed, calculating the average household size, and then allocating those households to PDAs with lower average household size. The model is critically flawed
    HHadditive = (POPTABLE[COUNTY][year] - POPTABLE[COUNTY]["2010"]) / allCounties[COUNTY].HHSIZE;
    
    totalPDAArea = allCounties[COUNTY].PDAAREA * allCounties[COUNTY].LANDAREA;
    
    for (tractCounter = 0; tractCounter < localeTracts[PLACE].length; tractCounter++) {
    
        tract = localeTracts[PLACE][tractCounter];
        tractID = tract.CTY;
        
        pctTotalPDA = (tract.LANDAREA / totalPDAArea);
        pctTotalSuburb = (tract.LANDAREA / (allCounties[COUNTY].LANDAREA - totalPDAArea));
        
        if (tract.PDAAREA === 1) {
            popIncrease = (pctInfill * pctTotalPDA * HHadditive);
        } else {
            popIncrease = ((1 - pctInfill) * HHadditive * pctTotalSuburb);
        }
        
        localEmissions[tractID] = {};
    
        HHVMT = vmtTracts(tract) * consumptionMultiplier("VMT", year);
        
        // ******************************************************* //
        // Transportation
        // ******************************************************* //
        
        localEmissions[tractID].AirTravel = (ghgFactors.Flightdirect + ghgFactors.Flightindirect) * airTravelDistanceTracts(tract) *
                                            consumptionMultiplier("AirTravel", year) * efficiencyMultiplier("AirTravelEfficiency", year);
        
        localEmissions[tractID].HSR = ghgFactors.HSR * hsrTravelTracts(tract, year);
        
        localEmissions[tractID].HeavyRail = ghgFactors.HeavyRail * heavyRailTravelTracts(tract);
        
        localEmissions[tractID].LightRail = ghgFactors.LightRail * lightRailTravelTracts(tract);
        
        localEmissions[tractID].Bus = ghgFactors.Bus * busTravelTracts(tract);

        // Vehicles
        // this needs to be updated
        // clean this up - adoption curve generation and then multiplier based on slider chart

        localEmissions[tractID].VMT = (HHVMT / ghgFactors.MPG) * ghgFactors.Gasoline * (efficiencyMultiplier("ZeroCarbonFuels", year))
                                        * (1 - ((policyMultipliers.EVs * adoptionCurves.EVs[year]) + (policyMultipliers["50MPG"] * adoptionCurves["50MPG"][year])));


        // TOTAL TRANSPORTATION
        localEmissions[tractID].Transportation = localEmissions[tractID].AirTravel + localEmissions[tractID].HSR +
                                                localEmissions[tractID].HeavyRail + localEmissions[tractID].LightRail + localEmissions[tractID].Bus + localEmissions[tractID].VMT;

        // ******************************************************* //
        // Waste, Water, and Energy
        // ******************************************************* //
        
        // Energy emissions
        // kWh
        // Double checked equations, they're correct (parens and all)
        localEmissions[tractID].kWh = ((ghgFactors.kWh + (ghgFactors.kWhindirect * efficiencyMultiplier("IndustrialEfficiency", year))) 
                                       * efficiencyMultiplier("LowCarbonElectricity", year)) *
            
                                       ((kwhUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year)) + 
                                        
                                       (kwhUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)));

        // this is insane
        // NatGas
        // Double checked equations, they're correct (parens and all)
        localEmissions[tractID].NaturalGas = (ghgFactors.NGdirect + ghgFactors.NGindirect) *
                                             ((naturalGasThermsTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / (1 - ELECTRICHEATNEW2010)))+
                                              
                                             (naturalGasThermsTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year) *
                                             (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / (1 - ELECTRICHEATEXISTING2010))));

        // Fuel Oil
        // For Chris: error in original excel cells regarding second + block missing first instance of 2050HH
        // Same insanity as NatGas
        // Double checked equations, they're correct (parens and all)
        localEmissions[tractID].FuelOil = (ghgFactors.FuelOildirect + ghgFactors.FuelOilindirect) * 
                                            ((oilUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * 
                                            (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / 
                                            (1 - ELECTRICHEATNEW2010))) +
                                             
                                            ((oilUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)) * 
                                            (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / 
                                            (1 - ELECTRICHEATEXISTING2010))));

        // Water & waste
        // Model is inconsistent - has both Waste & Water EFficiency & Industrial Efficiency, uses Industrial for wateremissions and Waste&Water for waste. Does not include Waste and Water Efficiency policy calc for waste
        // For Chris: check in 
        // Not sure what the 1000000 is for ????
        localEmissions[tractID].Water = ghgFactors.Water * waterUseTracts(tract) * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WaterConsumption", year);
    
        localEmissions[tractID].Waste = ghgFactors.Waste * wasteGenerationTracts(tract) * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WasteConsumption", year);

        // TOTAL WASTE WATER ENERGY
        localEmissions[tractID].WWE = localEmissions[tractID].Water + localEmissions[tractID].Waste +
                                      localEmissions[tractID].FuelOil + localEmissions[tractID].NaturalGas + localEmissions[tractID].kWh;

        // ******************************************************* //
        // Food
        // ******************************************************* //
        
        localEmissions[tractID].Meat = ghgFactors.Meat * meatConsumptionTracts(tract) *
                                       efficiencyMultiplier("AgriculturalEfficiency", year) *
                                       consumptionMultiplier("FoodConsumption", year);
        
        localEmissions[tractID].Dairy = ghgFactors.Dairy * dairyConsumptionTracts(tract) *
                                       efficiencyMultiplier("AgriculturalEfficiency", year) *
                                       consumptionMultiplier("FoodConsumption", year);
        
        localEmissions[tractID].OtherFood = ghgFactors.Food * otherFoodConsumptionTracts(tract) *
                                       efficiencyMultiplier("AgriculturalEfficiency", year) *
                                       consumptionMultiplier("FoodConsumption", year);
        
        localEmissions[tractID].Veggies = ghgFactors.FruitsVegetables * vegeCaloriesTracts(tract) *
                                          efficiencyMultiplier("AgriculturalEfficiency", year);
        
        localEmissions[tractID].Cereal = ghgFactors.Cereal * cerealCaloriesTracts(tract) * 
                                         efficiencyMultiplier("AgriculturalEfficiency", year);

        // All Food
        localEmissions[tractID].Food = localEmissions[tractID].Meat + localEmissions[tractID].Dairy +
                                       localEmissions[tractID].OtherFood + localEmissions[tractID].Veggies + localEmissions[tractID].Cereal;

        // ******************************************************* //
        // All Goods
        // ******************************************************* //
        
        // Goods & Services
        // For Chris: Not sure what second (set of multipliers) / 2 is for / from
        
        localEmissions[tractID].Clothing = ghgFactors.Clothing * (clothingUSDTracts(tract) * consumptionMultiplier("GoodsConsumption", year) + (clothingUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].Furnishings = ghgFactors.Furnishings * (furnishingsUSDTracts(tract) *
                                                                        consumptionMultiplier("GoodsConsumption", year) + (furnishingsUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].OtherGoods = ghgFactors.OtherGoodsSum * (otherGoodsUSDTracts(tract) * 
                                                                         consumptionMultiplier("GoodsConsumption", year) + (otherGoodsUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        // There is a policy on the dashboard for adjusting home size, not included here
        localEmissions[tractID].HousingConstruction = housingConstructionTracts(tract);// * consumptionMultiplier("GoodsConsumption", year);

        localEmissions[tractID].vehicleMaintenance = (ghgFactors.VehicleMain * vmntTracts(tract) + ghgFactors.VehicleManufacturing * HHVMT) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].AllGoods = localEmissions[tractID].Clothing + localEmissions[tractID].Furnishings +
                                           localEmissions[tractID].OtherGoods + localEmissions[tractID].vehicleMaintenance + localEmissions[tractID].HousingConstruction;

        // ******************************************************* //
        // Services
        // ******************************************************* //

        localEmissions[tractID].Services = ghgFactors.ServicesSum * servicesUSDTracts(tract) * efficiencyMultiplier("CommercialEfficiency", year);

        // ******************************************************* //
        // Sum
        // ******************************************************* //
        
        localEmissions[tractID].sum = 0;
        
        localEmissions[tractID].sum = localEmissions[tractID].AllGoods + localEmissions[tractID].Services +
                                      localEmissions[tractID].Food + localEmissions[tractID].WWE + localEmissions[tractID].Transportation;
        
        localEmissions[tractID].sum = (localEmissions[tractID].sum * (tract.HOUSEHOLDS + popIncrease)) / 1000000;
        
        localEmissions[PLACE + " " + year + " " + "sum"] += localEmissions[tractID].sum;
    }
    
    return localEmissions;
}

//***************************************************************************//


// Give vars initial settings to save space above
function listsInit() {
    countyList = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"];

    cityList = ["ACAMPO", "ACTON", "ADELANTO", "ADIN", "AGOURA HILLS", "AGUANGA", "AHWAHNEE", "ALAMEDA", "ALAMO", "ALBANY", "ALBION", "ALDERPOINT", "ALHAMBRA", "ALISO VIEJO", "ALPAUGH", "ALPINE", "ALTA", "ALTADENA", "ALTURAS", "AMADOR CITY", "AMERICAN CANYON", "ANAHEIM", "ANDERSON", "ANGELS CAMP", "ANGELUS OAKS", "ANGWIN", "ANTELOPE", "ANTIOCH", "APPLE VALLEY", "APPLEGATE", "APTOS", "ARBUCKLE", "ARCADIA", "ARCATA", "ARMONA", "ARNOLD", "AROMAS", "ARROYO GRANDE", "ARTESIA", "ARVIN", "ATASCADERO", "ATHERTON", "ATWATER", "AUBERRY", "AUBURN", "AVALON", "AVENAL", "AZUSA", "BAKERSFIELD", "BALDWIN PARK", "BALLICO", "BANNING", "BARD", "BARSTOW", "BASS LAKE", "BEALE AFB", "BEAUMONT", "BELDEN", "BELL", "BELLFLOWER", "BELMONT", "BELVEDERE TIBURON", "BEN LOMOND", "BENICIA", "BERKELEY", "BERRY CREEK", "BETHEL ISLAND", "BEVERLY HILLS", "BIG BEAR CITY", "BIG BEAR LAKE", "BIG OAK FLAT", "BIG PINE", "BIG SUR", "BIGGS", "BIOLA", "BIRDS LANDING", "BISHOP", "BLAIRSDEN-GRAEAGLE", "BLOCKSBURG", "BLOOMINGTON", "BLUE LAKE", "BLYTHE", "BODEGA", "BODEGA BAY", "BODFISH", "BOLINAS", "BONITA", "BONSALL", "BOONVILLE", "BORON", "BORREGO SPRINGS", "BOULDER CREEK", "BRADLEY", "BRANSCOMB", "BRAWLEY", "BREA", "BRENTWOOD", "BRIDGEPORT", "BRISBANE", "BROOKS", "BUELLTON", "BUENA PARK", "BURBANK", "BURLINGAME", "BURNEY", "BURNT RANCH", "BURSON", "BUTTE CITY", "BUTTONWILLOW", "CALABASAS", "CALEXICO", "CALIENTE", "CALIFORNIA CITY", "CALIFORNIA HOT SPRINGS", "CALIMESA", "CALISTOGA", "CALLAHAN", "CAMARILLO", "CAMBRIA", "CAMINO", "CAMPBELL", "CANOGA PARK", "CANTUA CREEK", "CANYON", "CANYON COUNTRY", "CANYON DAM", "CAPISTRANO BEACH", "CAPITOLA", "CARDIFF BY THE SEA", "CARLSBAD", "CARMEL", "CARMEL BY THE SEA", "CARMEL VALLEY", "CARMICHAEL", "CARNELIAN BAY", "CARPINTERIA", "CARSON", "CARUTHERS", "CASMALIA", "CASPAR", "CASTAIC", "CASTELLA", "CASTRO VALLEY", "CASTROVILLE", "CATHEDRAL CITY", "CAYUCOS", "CAZADERO", "CEDAR GLEN", "CEDARPINES PARK", "CEDARVILLE", "CERES", "CERRITOS", "CHATSWORTH", "CHESTER", "CHICO", "CHILCOOT", "CHINO", "CHINO HILLS", "CHOWCHILLA", "CHULA VISTA", "CITRUS HEIGHTS", "CLAREMONT", "CLARKSBURG", "CLAYTON", "CLEARLAKE", "CLEARLAKE OAKS", "CLOVERDALE", "CLOVIS", "COACHELLA", "COALINGA", "COARSEGOLD", "COBB", "COLFAX", "COLTON", "COLUSA", "COMPTON", "CONCORD", "COOL", "CORCORAN", "CORONA", "CORONA DEL MAR", "CORONADO", "CORTE MADERA", "COSTA MESA", "COTATI", "COTTONWOOD", "COULTERVILLE", "COURTLAND", "COVELO", "COVINA", "COYOTE", "CRESCENT CITY", "CRESTLINE", "CRESTON", "CROCKETT", "CROWS LANDING", "CULVER CITY", "CUPERTINO", "CUTLER", "CYPRESS", "DALY CITY", "DANA POINT", "DANVILLE", "DARDANELLE", "DAVIS", "DEL MAR", "DEL REY", "DELANO", "DELHI", "DENAIR", "DESCANSO", "DESERT HOT SPRINGS", "DIAMOND BAR", "DIAMOND SPRINGS", "DILLON BEACH", "DINUBA", "DISCOVERY BAY", "DIXON", "DORRIS", "DOS PALOS", "DOUGLAS CITY", "DOWNEY", "DUARTE", "DUBLIN", "DUCOR", "DUNLAP", "DUNSMUIR", "EARLIMART", "EARP", "ECHO LAKE", "EDISON", "EL CAJON", "EL CENTRO", "EL CERRITO", "EL DORADO", "EL DORADO HILLS", "EL MONTE", "EL SEGUNDO", "EL SOBRANTE", "ELK", "ELK CREEK", "ELK GROVE", "ELVERTA", "EMERYVILLE", "EMIGRANT GAP", "EMPIRE", "ENCINITAS", "ENCINO", "ESCALON", "ESCONDIDO", "ESPARTO", "EUREKA", "EXETER", "FAIR OAKS", "FAIRFAX", "FAIRFIELD", "FALLBROOK", "FARMERSVILLE", "FARMINGTON", "FELLOWS", "FELTON", "FERNDALE", "FILLMORE", "FINLEY", "FIREBAUGH", "FISH CAMP", "FOLSOM", "FONTANA", "FOOTHILL RANCH", "FOREST KNOLLS", "FOREST RANCH", "FORESTHILL", "FORESTVILLE", "FORT BRAGG", "FORT IRWIN", "FORT JONES", "FORTUNA", "FOUNTAIN VALLEY", "FOWLER", "FRAZIER PARK", "FREEDOM", "FREMONT", "FRENCH CAMP", "FRESNO", "FULLERTON", "GALT", "GARBERVILLE", "GARDEN GROVE", "GARDEN VALLEY", "GARDENA", "GAZELLE", "GERBER", "GEYSERVILLE", "GILROY", "GLEN ELLEN", "GLENCOE", "GLENDALE", "GLENDORA", "GLENN", "GLENNVILLE", "GOLETA", "GRANADA HILLS", "GRAND TERRACE", "GRANITE BAY", "GRASS VALLEY", "GRATON", "GREENBRAE", "GREENFIELD", "GRIDLEY", "GROVER BEACH", "GUERNEVILLE", "HACIENDA HEIGHTS", "HALF MOON BAY", "HANFORD", "HARBOR CITY", "HAWAIIAN GARDENS", "HAWTHORNE", "HAYWARD", "HEALDSBURG", "HEMET", "HERCULES", "HERMOSA BEACH", "HESPERIA", "HIGHLAND", "HOLLISTER", "HOLTVILLE", "HOMELAND", "HOMEWOOD", "HOOPA", "HORNBROOK", "HORNITOS", "HUGHSON", "HUNTINGTON BEACH", "HUNTINGTON PARK", "IMPERIAL BEACH", "INDIAN WELLS", "INDIO", "INGLEWOOD", "INYOKERN", "IONE", "IRVINE", "IVANHOE", "JACKSON", "JACUMBA", "JAMESTOWN", "JAMUL", "JANESVILLE", "JOSHUA TREE", "JULIAN", "KEENE", "KELSEYVILLE", "KERMAN", "KING CITY", "KINGS BEACH", "KINGSBURG", "KIRKWOOD", "KLAMATH", "KNIGHTS LANDING", "KNIGHTSEN", "KYBURZ", "LA CANADA FLINTRIDGE", "LA CRESCENTA", "LA HABRA", "LA JOLLA", "LA MESA", "LA MIRADA", "LA PALMA", "LA PUENTE", "LA QUINTA", "LA VERNE", "LADERA RANCH", "LAFAYETTE", "LAGUNA BEACH", "LAGUNA HILLS", "LAGUNA NIGUEL", "LAGUNA WOODS", "LAKE ARROWHEAD", "LAKE ELSINORE", "LAKE FOREST", "LAKE HUGHES", "LAKEPORT", "LAKESIDE", "LAKEWOOD", "LAMONT", "LANCASTER", "LATHROP", "LATON", "LAWNDALE", "LE GRAND", "LEBEC", "LEMON GROVE", "LEMOORE", "LEWISTON", "LINCOLN", "LINDSAY", "LITTLEROCK", "LIVE OAK", "LIVERMORE", "LIVINGSTON", "LLANO", "LOCKEFORD", "LODI", "LOMA LINDA", "LOMITA", "LOMPOC", "LONG BEACH", "LOOMIS", "LOS ALAMITOS", "LOS ALTOS", "LOS ANGELES", "LOS BANOS", "LOS GATOS", "LOS OLIVOS", "LOS OSOS", "LOTUS", "LOWER LAKE", "LUCERNE", "LUCERNE VALLEY", "LYNWOOD", "MACDOEL", "MAD RIVER", "MADERA", "MAGALIA", "MALIBU", "MAMMOTH LAKES", "MANHATTAN BEACH", "MANTECA", "MARCH AIR RESERVE BASE", "MARICOPA", "MARINA", "MARINA DEL REY", "MARTINEZ", "MARYSVILLE", "MATHER", "MAYWOOD", "MC FARLAND", "MCCLELLAN", "MCCLOUD", "MCKINLEYVILLE", "MEADOW VALLEY", "MECCA", "MENIFEE", "MENLO PARK", "MENTONE", "MERCED", "MIDWAY CITY", "MILL VALLEY", "MILLBRAE", "MILPITAS", "MIRA LOMA", "MISSION HILLS", "MISSION VIEJO", "MODESTO", "MOJAVE", "MONROVIA", "MONTCLAIR", "MONTEBELLO", "MONTEREY", "MONTEREY PARK", "MONTROSE", "MOORPARK", "MORAGA", "MORENO VALLEY", "MORGAN HILL", "MORONGO VALLEY", "MORRO BAY", "MOSS LANDING", "MOUNT SHASTA", "MOUNTAIN VIEW", "MURRIETA", "NAPA", "NATIONAL CITY", "NEEDLES", "NEVADA CITY", "NEWARK", "NEWBURY PARK", "NEWHALL", "NEWMAN", "NEWPORT BEACH", "NIPOMO", "NORCO", "NORDEN", "NORTH HIGHLANDS", "NORTH HILLS", "NORTH HOLLYWOOD", "NORTHRIDGE", "NORWALK", "NOVATO", "NUEVO", "OAK PARK", "OAK VIEW", "OAKDALE", "OAKLAND", "OAKLEY", "OCEANSIDE", "OJAI", "OLIVEHURST", "ONTARIO", "ORANGE", "ORANGE COVE", "ORANGEVALE", "ORICK", "ORINDA", "ORLAND", "OROVILLE", "OXNARD", "PACIFIC GROVE", "PACIFIC PALISADES", "PACIFICA", "PACOIMA", "PALM DESERT", "PALM SPRINGS", "PALMDALE", "PALO ALTO", "PALOS VERDES PENINSULA", "PANORAMA CITY", "PARADISE", "PARAMOUNT", "PASADENA", "PASO ROBLES", "PATTERSON", "PAUMA VALLEY", "PENN VALLEY", "PENNGROVE", "PERRIS", "PETALUMA", "PHELAN", "PICO RIVERA", "PINOLE", "PIONEER", "PIONEERTOWN", "PISMO BEACH", "PITTSBURG", "PLACENTIA", "PLACERVILLE", "PLAYA DEL REY", "PLEASANT HILL", "PLEASANTON", "POMONA", "PORT HUENEME", "PORTER RANCH", "PORTERVILLE", "POTTER VALLEY", "POWAY", "QUINCY", "RAMONA", "RANCHO CORDOVA", "RANCHO CUCAMONGA", "RANCHO MIRAGE", "RANCHO PALOS VERDES", "RANCHO SANTA FE", "RANCHO SANTA MARGARITA", "RAYMOND", "RED BLUFF", "REDDING", "REDLANDS", "REDONDO BEACH", "REDWOOD CITY", "REDWOOD VALLEY", "REEDLEY", "RESCUE", "RESEDA", "RIALTO", "RICHMOND", "RIDGECREST", "RIO LINDA", "RIO VISTA", "RIPON", "RIVERBANK", "RIVERSIDE", "ROCKLIN", "ROHNERT PARK", "ROSAMOND", "ROSEMEAD", "ROSEVILLE", "ROWLAND HEIGHTS", "SACRAMENTO", "SAINT HELENA", "SALINAS", "SAN ANSELMO", "SAN BERNARDINO", "SAN BRUNO", "SAN CARLOS", "SAN CLEMENTE", "SAN DIEGO", "SAN DIMAS", "SAN FERNANDO", "SAN FRANCISCO", "SAN GABRIEL", "SAN JACINTO", "SAN JOSE", "SAN JUAN CAPISTRANO", "SAN LEANDRO", "SAN LORENZO", "SAN LUIS OBISPO", "SAN MARCOS", "SAN MARINO", "SAN MATEO", "SAN PABLO", "SAN PEDRO", "SAN RAFAEL", "SAN RAMON", "SAN YSIDRO", "SANGER", "SANTA ANA", "SANTA BARBARA", "SANTA CLARA", "SANTA CLARITA", "SANTA CRUZ", "SANTA FE SPRINGS", "SANTA MARIA", "SANTA MONICA", "SANTA PAULA", "SANTA ROSA", "SANTEE", "SARATOGA", "SAUSALITO", "SCOTTS VALLEY", "SEAL BEACH", "SEASIDE", "SEBASTOPOL", "SELMA", "SHAFTER", "SHASTA LAKE", "SHERMAN OAKS", "SHINGLE SPRINGS", "SIERRA MADRE", "SIGNAL HILL", "SILVERADO", "SIMI VALLEY", "SOLANA BEACH", "SOLEDAD", "SOMES BAR", "SONOMA", "SONORA", "SOUTH EL MONTE", "SOUTH GATE", "SOUTH LAKE TAHOE", "SOUTH PASADENA", "SOUTH SAN FRANCISCO", "SPRING VALLEY", "STANFORD", "STANTON", "STEVENSON RANCH", "STOCKTON", "STUDIO CITY", "SUISUN CITY", "SUN CITY", "SUN VALLEY", "SUNLAND", "SUNNYVALE", "SUNSET BEACH", "SUSANVILLE", "SYLMAR", "TAFT", "TAHOE CITY", "TARZANA", "TEHACHAPI", "TEMECULA", "TEMPLE CITY", "THERMAL", "THOUSAND OAKS", "THOUSAND PALMS", "TOPANGA", "TORRANCE", "TRABUCO CANYON", "TRACY", "TRUCKEE", "TUJUNGA", "TULARE", "TURLOCK", "TUSTIN", "TWENTYNINE PALMS", "UKIAH", "UNION CITY", "UPLAND", "VACAVILLE", "VALENCIA", "VALLEJO", "VALLEY VILLAGE", "VAN NUYS", "VENICE", "VENTURA", "VICTORVILLE", "VILLA PARK", "VISALIA", "VISTA", "WALNUT", "WALNUT CREEK", "WASCO", "WATSONVILLE", "WEST COVINA", "WEST HILLS", "WEST HOLLYWOOD", "WEST SACRAMENTO", "WESTLAKE VILLAGE", "WESTMINSTER", "WHEATLAND", "WHITE WATER", "WHITTIER", "WILDOMAR", "WILLITS", "WILLOWS", "WILMINGTON", "WINCHESTER", "WINDSOR", "WINNETKA", "WINTON", "WOODLAKE", "WOODLAND", "WOODLAND HILLS", "YORBA LINDA", "YOUNTVILLE", "YREKA", "YUBA CITY", "YUCAIPA", "YUCCA VALLEY"];

    headersList = ["CITY", "COUNTY", "LANDAREA", "DENSITY", "EMPDEN", "URBAN", "PDAAREA", "PDAPOP", "CDD", "HDD", "PEOPLE", "WORKERS", "WORKCNT", "HOUSEHOLDS", "HHSIZE", "SIZEOWN", "SIZERENT", "GRAD", "INCOME2013", "INCOME2007", "AGE", "WHITE", "LATINO", "BLACK", "ASIAN", "OTHERACE", "WORKERS2", "VEHICLES", "CARCOMMUTE", "TIMETOWORK", "OWN", "ROOMS", "GAS", "ELECTRIC", "OIL", "NOFUEL", "OTHERFUEL", "YEARBUILT", "SINGDET", "SQFT", "Children", "Adults", "NumPubTrans", "Public Transit Commuters", "Bus Commuters", "Subway Commuters", "Railroad Commuters"];
    
    policiesList = ["Infill", "EVs", "50MPG", "LowCarbonElectricity", "HeatingElectrificationNew", "HeatingElectrificationExisting", "EnergyEfficiencyNew", "EnergyEfficiencyExisting", "ZeroCarbonFuels", "AirTravelEfficiency", "CommercialEfficiency", "WasteandWaterEfficiency", "IndustrialEfficiency", "AgriculturalEfficiency", "VMT", "AirTravel", "EnergyConsumption", "GoodsConsumption", "FoodConsumption", "WasteConsumption", "WaterConsumption"];
}

// Give vars initial settings to save space above
function varsInit() {
    var each;
    
    listsInit();
    
    MSWTABLE = JSON.parse(fs.readFileSync('./data/MSWTABLE.json'));
    POPTABLE = JSON.parse(fs.readFileSync('./data/POPTABLE-min.json'));
    MPOHSRTABLE = JSON.parse(fs.readFileSync('./data/MPOHSRTABLE-min.json'));
    PUBLICTRANSTABLE = JSON.parse(fs.readFileSync('./data/PUBLICTRANSTABLE-min.json'));
    allCities = JSON.parse(fs.readFileSync('./data/city/allCities-min.json'));
    allCounties = JSON.parse(fs.readFileSync('./data/county/allCounties-min.json'));
    
    policies = {
        "Infill": {
            Title: "Urban Infill",
            Range: [0, 100],
            Initial: 50,
            Max: 100
        },
        "EVs": {
            Title: "Electric Vehicle Uptake",
            Range: [0, 50],
            Initial: 0,
            Max: 50
        },
        "50MPG": {
            Title: "50 MPG+ Vehicle Fleet Share",
            Range: [0, 50],
            Initial: 0,
            Max: 50
        },
        "LowCarbonElectricity": {
            Title: "Carbon-Free Electricity",
            Range: [0, 100],
            Initial: 0,
            Max: 100
        },
        "HeatingElectrificationNew": {
            Title: "Heating Electrification (New Construction)",
            Range: [0, 100],
            Initial: 0,
            Max: 100
        },
        "HeatingElectrificationExisting": {
            Title: "Heating Electrification (Existing Buildings)",
            Range: [0, 100],
            Initial: 0,
            Max: 100
        },
        "EnergyEfficiencyNew": {
            Title: "Energy Efficiency (New Construction)",
            Range: [0, 50],
            Initial: 0,
            Max: 50
        },
        "EnergyEfficiencyExisting": {
            Title: "Energy Efficiency (Existing Buildings)",
            Range: [0, 60],
            Initial: 0,
            Max: 60
        },
        "ZeroCarbonFuels": {
            Title: "Zero-Carbon Fuels",
            Range: [0, 30],
            Initial: 0,
            Max: 30
        },
        "AirTravelEfficiency": {
            Title: "Air Travel Efficiency",
            Range: [0, 30],
            Initial: 0,
            Max: 30
        },
        "CommercialEfficiency": {
            Title: "Commercial Efficiency",
            Range: [0, 60],
            Initial: 0,
            Max: 60
        },
        "WasteandWaterEfficiency": {
            Title: "Waste & Water Efficiency",
            Range: [0, 40],
            Initial: 0,
            Max: 40
        },
        "IndustrialEfficiency": {
            Title: "Industrial Efficiency",
            Range: [0, 60],
            Initial: 0,
            Max: 60
        },
        "AgriculturalEfficiency": {
            Title: "Agricultural Efficiency",
            Range: [0, 55],
            Initial: 0,
            Max: 55
        },
        "VMT": {
            Title: "VMT",
            Range: [-20, 20],
            Initial: 0,
            Max: -20
        },
        "AirTravel": {
            Title: "Air Travel",
            Range: [-25, 25],
            Initial: 0,
            Max: -40
        },
        "EnergyConsumption": {
            Title: "Energy Consumption",
            Range: [-20, 10],
            Initial: 0,
            Max: -20
        },
        "GoodsConsumption": {
            Title: "Goods Consumption",
            Range: [-25, 10],
            Initial: 0,
            Max: -25
        },
        "FoodConsumption": {
            Title: "Food Consumption",
            Range: [-20, 10],
            Initial: 0,
            Max: -20
        },
        "WasteConsumption": {
            Title: "Waste Generation",
            Range: [-30, 10],
            Initial: 0,
            Max: -30
        },
        "WaterConsumption": {
            Title: "Water Consumption",
            Range: [-30, 10],
            Initial: 0,
            Max: -30
        }
    };
    
    for (each in policies) {
        policies[each].steps = (policies[each].Range[1] - policies[each].Range[0]) / 5;
    }
    
    // Make custom step intervals here:
    policies.Infill.steps = 20;
    policies["50MPG"].steps = policies.VMT.steps = policies.WasteandWaterEfficiency.steps = policies.WasteConsumption.steps = policies.WaterConsumption.steps = 10;
    policies.CommercialEfficiency.steps = policies.IndustrialEfficiency.steps = 15;
    policies.AgriculturalEfficiency.steps = 11;
    policies.AirTravel.steps = 10;
    policies.EnergyConsumption.steps = policies.GoodsConsumption.steps = policies.FoodConsumption.steps = policies.AirTravelEfficiency.steps = 5;
        

    // Constructors
    //***************************************************************************//

    CtyObj = function CtyObj() {
        this.CTY = "";
        this.COUNTY = 0;
        this.LANDAREA = 0;
        this.DENSITY = 0;
        this.EMPDEN = 0;
        this.URBAN = 0;
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
    };
    
    AdoptionCurve = function AdoptionCurve() {
        this["2010"] = 0;
        this["2015"] = 0.125;
        this["2020"] = 0.25;
        this["2025"] = 0.375;
        this["2030"] = 0.5;
        this["2035"] = 0.625;
        this["2040"] = 0.75;
        this["2045"] = 0.875;
        this["2050"] = 1;
    };
    
    // Miscellaneous
    //***************************************************************************//
    
    adoptionCurves = {};
    
    for (i = 0; i < policiesList.length; i++) {
        adoptionCurves[policiesList[i]] = new AdoptionCurve();
        policyMultipliers[policiesList[i]] = policies[policiesList[i]].Initial / 100;
    }
    
    //Sets up years array, aka x-axis
    for (i = 0; i < TOTAL_YEARS; i++) {
        years[i] = ((5 * i) + 2010).toString();
    }
    
    // Create manual objects
    //=============================================================================
    ghgFactors = {
        kWh: 300, // gCO2/kWh
        kWhindirect: 60, // gCO2/kWh
        Gasoline: 11406, // gCO2e/gal
        VehicleManufacturing: 56, // gCO2e/mile
        MPG: 20, // this is only for the portion not 50 mpg+
        Flightdirect: 223, // gCO2/passenger-mile
        Flightindirect: 223, // gCO2/passenger-mile
        PublicTransit: 179, // gCO2/passenger-mile
        HSR: 20, // gCO2/passenger-mile
        HeavyRail: 180, // gCO2/passenger-mile
        LightRail: 55, // gCO2/passenger-mile
        Bus: 179, // gCO2/passenger-mile
        Taxi: 179, // gCO2/passenger-mile
        NGdirect: 5470, // gCO2/therm
        NGindirect: 1094, // gCO2/therm
        FuelOildirect: 10153, // gCO2e/gallon
        FuelOilindirect: 2031, // gCO2e/gallon
        Water: 10, // gCO2e/gallon
        Waste: 580000, // gCO2e / ton of landfilled waste (CA avg)
        Food: 2.92, // gCO2e/calorie
        Meat: 5.53, // gCO2e/calorie
        Beef: 6.09, // gCO2e/calorie
        ProcessedMeats: 2.24, // gCO2e/calorie
        Fish: 5.71, // gCO2e/calorie
        Eggs: 4.27, // gCO2e/calorie
        Cereal: 1.45, // gCO2e/calorie
        Dairy: 4.00, // gCO2e/calorie
        FruitsVegetables: 3.35, // gCO2e/calorie
        OtherFood: 2.24, // gCO2e/calorie
        Clothing: 750, // gCO2e/$(2005)
        Furnishings: 614, // gCO2e/$(2005)
        OtherGoodsSum: 971, // gCO2e/$(2005)
        Healthcare: 696, // gCO2e/$(2005)
        Electronics: 1279, // gCO2e/$(2005)
        Paper: 2100, // gCO2e/$(2005)
        PersonalCare: 954, // gCO2e/$(2005)
        VehicleMain: 496, // gCO2e/$(2005)
        ServicesSum: 507, // gCO2e/$(2005)
        
        /* unused 
        HHMain: 134, // gCO2e/$(2005)
        Edu: 1065, // gCO2e/$(2005)
        Healthcare: 1151, // gCO2e/$(2005)
        Personalbusiness: 197, // gCO2e/$(2005)
        Entertainment: 711, // gCO2e/$(2005)
        Information: 291, // gCO2e/$(2005)
        Organizations: 122, // gCO2e/$(2005)
        MiscServices: 720, // gCO2e/$(2005)
        */
        
        WaterEmissions: 10, // gCO2e/gallon - "SHOULD BE 27?"
        Recycling: -3160000, // gCO2e per short ton of mixed recycling
        Composting: -420000 // gCO2e per short ton of compost
    };
    
    VMTMODEL = {
        "Other": {
            "Constant": 7.185,
            "LNVEH": 0.954,
            "LNHHSIZE": 0.238,
            "LNHHINC": 0.164,
            "WORKCOUNT": 0.133,
            "TIMETOWORK": 0.003,
            "DRIVE": 0,
            "HHVEHCOUNT": -0.113,
            "HBPOPDN": 0,
            "HHSIZE": 0,
            "HHINC": 0,
            "WHITE": 0,
            "HOMEOWN": 0,
            "HISP": 0,
            "NHTS": 22962.00183,
            "Correction": 181
        },
        "Los Angeles": {
            "Constant": 8.501,
            "LNVEH": 0.933,
            "LNHHSIZE": 0.184,
            "LNHHINC": 0,
            "WORKCOUNT": 0.142,
            "TIMETOWORK": 0.004,
            "DRIVE": 0.267,
            "HHVEHCOUNT": -0.08,
            "HBPOPDN": 0,
            "HHSIZE": 0,
            "HHINC": 0.000002107,
            "WHITE": 0,
            "HOMEOWN": 0,
            "HISP": 0,
            "NHTS": 21717.60259,
            "Correction": 2527
        },
        "Riverside": {
            "Constant": 8.667,
            "LNVEH": 0.797,
            "LNHHSIZE": 0,
            "LNHHINC": 0,
            "WORKCOUNT": 0.139,
            "TIMETOWORK": 0.005,
            "DRIVE": 0.373,
            "HHVEHCOUNT": 0,
            "HBPOPDN": 0,
            "HHSIZE": 0,
            "HHINC": 0.000002164,
            "WHITE": -0.123,
            "HOMEOWN": 0,
            "HISP": 0,
            "NHTS": 24634.52783,
            "Correction": 3063
        },
        "Sacramento": {
            "Constant": 8.809,
            "LNVEH": 1.453,
            "LNHHSIZE": 0.186,
            "LNHHINC": 0,
            "WORKCOUNT": 0.126,
            "TIMETOWORK": 0,
            "DRIVE": 0,
            "HHVEHCOUNT": -0.242,
            "HBPOPDN": 0,
            "HHSIZE": 0,
            "HHINC": 0.000001993,
            "WHITE": 0,
            "HOMEOWN": 0,
            "HISP": 0,
            "NHTS": 21278.83489,
            "Correction": 4366
        },
        "San Diego": {
            "Constant": 8.662,
            "LNVEH": 1.007,
            "LNHHSIZE": 0.218,
            "LNHHINC": 0,
            "WORKCOUNT": 0.124,
            "TIMETOWORK": 0.005,
            "DRIVE": 0.137,
            "HHVEHCOUNT": -0.114,
            "HBPOPDN": 0,
            "HHSIZE": 0,
            "HHINC": 0.000002531,
            "WHITE": 0,
            "HOMEOWN": -0.057,
            "HISP": 0,
            "NHTS":  22570,
            "Correction": 4366
        },
        "San Francisco": {
            "Constant": 7.555,
            "LNVEH": 0.682,
            "LNHHSIZE": 0.596,
            "LNHHINC": 0.089,
            "WORKCOUNT": 0.145,
            "TIMETOWORK": 0.004,
            "DRIVE": 0.29,
            "HHVEHCOUNT": 0,
            "HBPOPDN": 0,
            "HHSIZE": -0.153,
            "HHINC": 0,
            "WHITE": 0,
            "HOMEOWN": 0.112,
            "HISP": 0.134,
            "NHTS": 20294.74262,
            "Correction": 3023
        },
        "Santa Clara": {
            "Constant": 6.735,
            "LNVEH": 0.895,
            "LNHHSIZE": 0.281,
            "LNHHINC": 0.174,
            "WORKCOUNT": 0.102,
            "TIMETOWORK": 0.007,
            "DRIVE": 0,
            "HHVEHCOUNT": 0,
            "HBPOPDN": -0.00001411,
            "HHSIZE": 0,
            "HHINC": 0,
            "WHITE": 0,
            "HOMEOWN": 0,
            "HISP": 0,
            "NHTS": 21789.83473,
            "Correction": 1453
        }
    };
    
}

// Load data
function dataLoad() {
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        localeTracts[PLACE] = JSON.parse(fs.readFileSync('./data/tract/cities/' + PLACE + '/allTracts-min.json'));
    }

    for (i = 0; i < countyList.length; i++) {
        PLACE = countyList[i];
        localeTracts[PLACE] = JSON.parse(fs.readFileSync('./data/tract/counties/' + PLACE + '/allTracts-min.json'));
    }
}

// Program Core
//***************************************************************************//
varsInit();
dataLoad();

function bau() {
    var calcHolder = {};
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        COUNTY = allCities[PLACE].COUNTY;
        policyMultipliers.Infill = allCities[PLACE].PDAAREA;
        bauEmissions[PLACE] = {};
        for (k = 0; k < TOTAL_YEARS; k++) {
            calcHolder = emissionsTractCalc(years[k]);
            bauEmissions[PLACE][years[k]] = JSON.parse(JSON.stringify(calcHolder, null, 0));
        }
    }

    for (i = 0; i < countyList.length; i++) {
        PLACE = countyList[i];
        COUNTY = countyList[i];
        policyMultipliers.Infill = allCounties[PLACE].PDAAREA;
        bauEmissions[PLACE] = {};
        for (k = 0; k < TOTAL_YEARS; k++) {
            calcHolder = emissionsTractCalc(years[k]);
            bauEmissions[PLACE][years[k]] = JSON.parse(JSON.stringify(calcHolder, null, 0));
        }
    }
}

function scenariosBAU() {
    
    var calcHolder = {}, year;
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        COUNTY = allCities[PLACE].COUNTY;
        policyMultipliers.Infill = allCities[PLACE].PDAAREA;
        bauEmissions[PLACE] = {};
        
        year = "2010";
        
        calcHolder = emissionsTractCalc(year);
        bauEmissions[PLACE][year] = JSON.parse(JSON.stringify(calcHolder, null, 0));
        
        year = "2050";
        
        calcHolder = emissionsTractCalc(year);
        bauEmissions[PLACE][year] = JSON.parse(JSON.stringify(calcHolder, null, 0));
    }

    for (i = 0; i < countyList.length; i++) {
        PLACE = countyList[i];
        COUNTY = countyList[i];
        policyMultipliers.Infill = allCounties[PLACE].PDAAREA;
        bauEmissions[PLACE] = {};
        
        year = "2010";
        
        calcHolder = emissionsTractCalc(year);
        bauEmissions[PLACE][year] = JSON.parse(JSON.stringify(calcHolder, null, 0));
        
        year = "2050";
        
        calcHolder = emissionsTractCalc(year);
        bauEmissions[PLACE][year] = JSON.parse(JSON.stringify(calcHolder, null, 0));
    }
}

function allScenariosCalc() {
    
    scenariosBAU();
    
    var x, policyName, year = "2050", 
        cityResults, countyResults, titleArray = ["Place", "BAU 2010", "BAU 2050"],
        differentCityEmissions = [], differentCountyEmissions = [], differentEmissions = [];
    
    for (i = 1; i < policiesList.length; i++) {
        titleArray.push(policiesList[i]);
        //titleArray.push("% Change from 2010 - " + policiesList[i]);
        //titleArray.push("% Change from 2050 - " + policiesList[i]);
    }

    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        COUNTY = allCities[PLACE].COUNTY;

        policyMultipliers.Infill = allCities[PLACE].PDAAREA;

        //scenarioEmissions[PLACE] = {};
        differentCityEmissions[i] = {};
        differentCityEmissions[i]["Place"] = PLACE;
        differentCityEmissions[i]["BAU 2010"] = bauEmissions[PLACE]["2010"][PLACE + " 2010 " + "sum"];
        differentCityEmissions[i]["BAU 2050"] = bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];

        for (x = 1; x < policiesList.length; x++) {
            policyName = policiesList[x];
            policyMultipliers[policyName] = policies[policyName].Max / 100;

            differentCityEmissions[i][policyName] = 0;

            cityResults = emissionsTractCalc(year);

            differentCityEmissions[i][policyName] = 1 - (cityResults[PLACE + " " + year + " " + "sum"] / bauEmissions[PLACE]["2050"][PLACE + " 2050 " + "sum"]);
            /*
            differentCityEmissions[i]["% Change from 2010 - " + policyName] = differentCityEmissions[i][policyName] / bauEmissions[PLACE]["2010"][PLACE + " 2010 " + "sum"];
            
            differentCityEmissions[i]["% Change from 2050 - " + policyName] = differentCityEmissions[i][policyName] / bauEmissions[PLACE]["2050"][PLACE + " 2050 " + "sum"];
*/
            policyMultipliers[policyName] = policies[policyName].Initial / 100;
        }

    }

    cityResults = d3.csvFormat(differentCityEmissions, titleArray);

    fs.writeFileSync("./data/results/CityPolicies.csv", cityResults);

    for (i = 0; i < countyList.length; i++) {
        PLACE = countyList[i];
        COUNTY = countyList[i];
        policyMultipliers.Infill = allCounties[PLACE].PDAAREA;
        //scenarioEmissions[PLACE] = {};
        differentCountyEmissions[i] = {};
        differentCountyEmissions[i]["Place"] = PLACE;
        differentCountyEmissions[i]["BAU 2010"] = bauEmissions[PLACE]["2010"][PLACE + " 2010 " + "sum"];
        differentCountyEmissions[i]["BAU 2050"] = bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];

        for (x = 1; x < policiesList.length; x++) {
            policyName = policiesList[x];
            policyMultipliers[policyName] = policies[policyName].Max / 100;

            differentCountyEmissions[i][policyName] = 0;

            countyResults = emissionsTractCalc(year);

            differentCountyEmissions[i][policyName] = 1 - (countyResults[PLACE + " " + year + " " + "sum"] / bauEmissions[PLACE]["2050"][PLACE + " 2050 " + "sum"]);
            
            /*
            differentCountyEmissions[i]["% Change from 2010 - " + policyName] = differentCountyEmissions[i][policyName] / bauEmissions[PLACE]["2010"][PLACE + " 2010 " + "sum"];
            
            differentCountyEmissions[i]["% Change from 2050 - " + policyName] = differentCountyEmissions[i][policyName] / bauEmissions[PLACE]["2050"][PLACE + " 2050 " + "sum"];
*/
            policyMultipliers[policyName] = policies[policyName].Initial;
        }
    }

    countyResults = d3.csvFormat(differentCountyEmissions, titleArray);

    fs.writeFileSync("./data/results/CountyPolicies.csv", countyResults);
    
}

function cityEmissionsDifference() {
    
    var year = 0, results;
    
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        COUNTY = allCities[PLACE].COUNTY;
        differentCityEmissions[i] = {};
        differentCityEmissions[i]["Place"] = PLACE;
        for (k = 0; k < TOTAL_YEARS; k++) {
            year = years[k];
            
            differentCityEmissions[i][year] = scenarioEmissions[PLACE][year][PLACE + " " + year + " " + "sum"] - bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];
        }
    }
    
    results = d3.csvFormat(differentCityEmissions, ["Place", "2010", "2015", "2020", "2025", "2030", "2035", "2040", "2045", "2050"]);
    
    fs.writeFileSync("./data/results/CitiesInfillDifference.csv", results);
}

function countyEmissionsDifference() {

    var year = 0, results;
    
    for (j = 0; j < countyList.length; j++) {
        //j = (i - cityList.length)
        PLACE = countyList[j];
        COUNTY = countyList[j];
        differentCountyEmissions[j] = {};
        differentCountyEmissions[j]["Place"] = PLACE;
        for (k = 0; k < TOTAL_YEARS; k++) {
            year = years[k];
            
            differentCountyEmissions[j][year] = scenarioEmissions[PLACE][year][PLACE + " " + year + " " + "sum"] - bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];
        }
    }
    
    
    results = d3.csvFormat(differentCountyEmissions, ["Place", "2010", "2015", "2020", "2025", "2030", "2035", "2040", "2045", "2050"]);
    
    fs.writeFileSync("./data/results/CountiesInfillDifference.csv", results);
}

function citiesBAUFormat() {
    var bauResults = [], year = 0, results;
    
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        COUNTY = allCities[PLACE].COUNTY;
        bauResults[i] = {};
        bauResults[i]["Place"] = PLACE;
        
        for (k = 0; k < TOTAL_YEARS; k++) {
            year = years[k];
            
            bauResults[i][year] = bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];
        }
        
    }
    
    results = d3.csvFormat(bauResults, ["Place", "2010", "2015", "2020", "2025", "2030", "2035", "2040", "2045", "2050"]);
    
    fs.writeFileSync("./data/results/CitiesBAU.csv", results);
}

function countiesBAUFormat() {
    var bauResults = [], year = 0, results;
    
    for (i = 0; i < countyList.length; i++) {
        PLACE = countyList[i];
        COUNTY = countyList[i].COUNTY;
        bauResults[i] = {};
        bauResults[i]["Place"] = PLACE;
        
        for (k = 0; k < TOTAL_YEARS; k++) {
            year = years[k];
            
            bauResults[i][year] = bauEmissions[PLACE][year][PLACE + " " + year + " " + "sum"];
        }
        
    }
    
    results = d3.csvFormat(bauResults, ["Place", "2010", "2015", "2020", "2025", "2030", "2035", "2040", "2045", "2050"]);
    
    fs.writeFileSync("./data/results/CountiesBAU.csv", results);
}

function test() {
    i = 64;

    PLACE = cityList[i];
    COUNTY = allCities[PLACE].COUNTY;
    HHTractEmissions[PLACE] = {};
    for (k = 0; k < TOTAL_YEARS; k++) {
        emissionsTractCalc(years[k]);
    }
}

var HHSize = 0, PDAHHSize = 0, counter;

function HHSizeCalc() {
    
    HHSize = 0, PDAHHSize = 0, counter = 0;
    
    for (i = 0; i < cityList.length; i++) {
        PLACE = cityList[i];
        for (k = 0; k < localeTracts[PLACE].length; k++) {
            if (localeTracts[PLACE][k].PDAAREA === 1) {
                HHSize += localeTracts[PLACE][k].ROOMS;
                counter++;
            }
        }
    }
    
    for (i = cityList.length; i < cityList.length + countyList.length; i++) {
        j = i - cityList.length;
        PLACE = countyList[j];
        
        for (k = 0; k < localeTracts[PLACE].length; k++) {
            if (localeTracts[PLACE][k].PDAAREA === 1) {
                HHSize += localeTracts[PLACE][k].ROOMS;
                counter++;
            }
        }
    }
    
    PDAHHSize = HHSize / counter;
    console.log(PDAHHSize);
    
}

function saveTestData() {
    writeFile = './test/sample.json';
    spacing = 4;

    fs.writeFileSync(writeFile, JSON.stringify(emissionsTractCalc("2010"), null, spacing));
}

//bau();
//allScenariosCalc();
//HHSizeCalc();
//citiesBAUFormat();
//countiesBAUFormat();

//cityEmissionsDifference();
//countyEmissionsDifference();

//curveCalc(curve, policy);

//writeAll(HHTractEmissions, "results/all_emissions");