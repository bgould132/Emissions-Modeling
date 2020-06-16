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
    PLACE, locale, localeTracts;

// Global val holder for current selected county & city
var COUNTY, CITY;

// Object index counters
// For looping through objects with the object keys

    
// Chart objects
var emissionsTractsChart;

// Arrays


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
var HHTractEmissions = {};

// End Variable Declarations
//***************************************************************************//

// Functions
//***************************************************************************//

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

function transportationModelTracts() {
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
    return (tract["Subway Commuters"] * PUBLICTRANSTABLE[COUNTY].CommuterRailMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
}

function heavyRailTravelTracts(tract) {
    return (tract["Railroad Commuters"] * PUBLICTRANSTABLE[COUNTY].AmtrakMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
}

function busTravelTracts(tract) {
    return (tract["Bus Commuters"] * PUBLICTRANSTABLE[COUNTY].BusMilesPerCommuter / tract.WORKERS * tract.WORKCNT);
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

// Calculation functions
// ========================================= //

function updateCharts() {
    HHTractEmissions[PLACE] = {};
    
    emissionsTractsChart.chartChange();
    stackedEmissionsChart.chartChange();
}

function cityChange() {
    var val = $('#cityMenu :selected').text();
    locale = allCities[val];
    CITY = val;
    PLACE = val;
    COUNTY = locale.COUNTY;
    
    HHTractEmissions[PLACE] = {};
    
    policies.Infill.Initial = locale.PDAAREA * 100;
    
    policyMultipliers.Infill = locale.PDAAREA;
    
    policySliderInit("Infill");
    
    $.when(
        $.getJSON('https://coolclimatenetwork.github.io/data/tract/cities/' + CITY + '/allTracts-min.json', function (tracts_imported) {
            localeTracts = tracts_imported;
        })
    ).then(function() {
        d3.select("#emissionsChartTitle").html("CO2 emissions in the City of " + PLACE + " (ktons)");
        updateCharts();
    });
}

function countyChange() {
    var val = $('#countyMenu :selected').text();
    locale = allCounties[val];
    COUNTY = val;
    PLACE = val;
    locale.COUNTY = COUNTY;
    
    HHTractEmissions[PLACE] = {};
    
    policies.Infill.Initial = locale.PDAAREA * 100;
    
    policyMultipliers.Infill = locale.PDAAREA;
    
    policySliderInit("Infill");
    
    $.when(
        $.getJSON('https://coolclimatenetwork.github.io/data/tract/counties/' + COUNTY + '/allTracts-min.json', function (tracts_imported) {
            localeTracts = tracts_imported;
        })
    ).then(function() {
        d3.select("#emissionsChartTitle").html("CO2 emissions in " + PLACE + " County (ktons)");
        updateCharts();
    });
}

// will need to be debugged
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
// Alternative version of emissionsCalc to use tract-level data
// this is insane
function emissionsTractCalc(year) {
    // To-do list:
    // Need to do population growth by PDA
    //
    // Need to develop stacked chart graph / graph of each sector?
    
    var HHVMT,
        ELECTRICHEATNEW2010 = 0.1,
        ELECTRICHEATEXISTING2010 = 0.1,
        sum = 0,
        emissionSector,
        counter,
        // this assumes that household size remains constant and that population shrinks to accommodate smaller HH sizes in PDAs
        popIncrease,
        HHadditive,
        totalPDAAREA, pctTotalPDA, //pctPDA,
        pdaGrowthMultiplier, suburbGrowthMultiplier,
        
        tract,
        tractID,
        localEmissions,
        
        pctInfill = policyMultipliers.Infill;// * adoptionCurves.Infill[year]);
        
    HHTractEmissions[PLACE][year] = {};
    
    localEmissions = {};
    localEmissions[PLACE + " " + year + " " + "sum"] = 0;
    localEmissions[PLACE + " " + year + " " + "households"] = 0;
    
    HHadditive = (POPTABLE[COUNTY][year] - POPTABLE[COUNTY]["2010"]) / allCounties[COUNTY].HHSIZE;
    
    totalPDAArea = allCounties[COUNTY].PDAAREA * allCounties[COUNTY].LANDAREA;
    
    //pctPDA = totalPDAArea / allCounties[COUNTY].LANDAREA;
    
    //pdaGrowthMultiplier = popgrowth * pctInfill;
    
    //suburbGrowthMultiplier = popgrowth * (1 - pctInfill);
    
    for (tractCounter = 0; tractCounter < localeTracts.length; tractCounter++) {
        
        tract = localeTracts[tractCounter];
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
        
        localEmissions[tractID].AirTravel = (ghgFactors.Flightdirect + ghgFactors.Flightindirect) * airTravelDistanceTracts(tract) * consumptionMultiplier("AirTravel", year) * efficiencyMultiplier("AirTravelEfficiency", year);
        localEmissions[tractID].HSR = ghgFactors.HSR * hsrTravelTracts(tract, year);
        localEmissions[tractID].HeavyRail = ghgFactors.HeavyRail * heavyRailTravelTracts(tract);
        localEmissions[tractID].LightRail = ghgFactors.LightRail * lightRailTravelTracts(tract);
        localEmissions[tractID].Bus = ghgFactors.Bus * busTravelTracts(tract);

        // Vehicles
        // this needs to be updated
        // clean this up - adoption curve generation and then multiplier based on slider chart

        localEmissions[tractID].VMT = (HHVMT / ghgFactors.MPG) * ghgFactors.Gasoline * (efficiencyMultiplier("ZeroCarbonFuels", year)) * (1 - ((policyMultipliers.EVs * adoptionCurves.EVs[year]) + (policyMultipliers["50MPG"] * adoptionCurves["50MPG"][year])));


        // TOTAL TRANSPORTATION
        localEmissions[tractID].Transportation = localEmissions[tractID].AirTravel + localEmissions[tractID].HSR + localEmissions[tractID].HeavyRail + localEmissions[tractID].LightRail + localEmissions[tractID].Bus + localEmissions[tractID].VMT;

        // ******************************************************* //
        // Waste, Water, and Energy
        // ******************************************************* //
        
        // Energy emissions
        // kWh
        localEmissions[tractID].kWh = ((ghgFactors.kWh + (ghgFactors.kWhindirect * efficiencyMultiplier("IndustrialEfficiency", year))) * efficiencyMultiplier("LowCarbonElectricity", year)) * ((kwhUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year)) + (kwhUseTracts(tract) * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)));

        // this is insane
        console.log("Gas: " + naturalGasThermsTracts(tract));
        // NatGas
        localEmissions[tractID].NaturalGas = (ghgFactors.NGdirect + ghgFactors.NGindirect) * (naturalGasThermsTracts(tract) * ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / (1 - ELECTRICHEATNEW2010))) + ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)) * (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / (1 - ELECTRICHEATEXISTING2010)))));

        // Fuel Oil
        console.log("Oil: " + oilUseTracts(tract));
        // For Chris: error in original excel cells regarding second + block missing first instance of 2050HH
        // Same insanity as NatGas
        localEmissions[tractID].FuelOil = (ghgFactors.FuelOildirect + ghgFactors.FuelOilindirect) * (oilUseTracts(tract) * ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / (1 - ELECTRICHEATNEW2010))) + ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)) * (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / (1 - ELECTRICHEATEXISTING2010)))));

        // Water & waste
        // Model is inconsistent - has both Waste & Water EFficiency & Industrial Efficiency, uses Industrial for wateremissions and Waste&Water for waste. Does not include Waste and Water Efficiency policy calc for waste
        // For Chris: check in 
        // Not sure what the 1000000 is for ????
        localEmissions[tractID].Water = ghgFactors.Water * waterUseTracts(tract) * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WaterConsumption", year);
        localEmissions[tractID].Waste = ghgFactors.Waste * wasteGenerationTracts(tract) * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WasteConsumption", year);

        // TOTAL WASTE WATER ENERGY
        localEmissions[tractID].WWE = localEmissions[tractID].Water + localEmissions[tractID].Waste + localEmissions[tractID].FuelOil + localEmissions[tractID].NaturalGas + localEmissions[tractID].kWh;

        // ******************************************************* //
        // Food
        // ******************************************************* //
        
        // For Chris: Not sure what 1000000 is for / from
        localEmissions[tractID].Meat = ghgFactors.Meat * meatConsumptionTracts(tract) * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
        localEmissions[tractID].Dairy = ghgFactors.Dairy * dairyConsumptionTracts(tract) * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
        localEmissions[tractID].OtherFood = ghgFactors.Food * otherFoodConsumptionTracts(tract) * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
        localEmissions[tractID].Veggies = ghgFactors.FruitsVegetables * vegeCaloriesTracts(tract) * efficiencyMultiplier("AgriculturalEfficiency", year);// * consumptionMultiplier("FoodConsumption", year);
        localEmissions[tractID].Cereal = ghgFactors.Cereal * cerealCaloriesTracts(tract) * efficiencyMultiplier("AgriculturalEfficiency", year);// * consumptionMultiplier("FoodConsumption", year);

        localEmissions[tractID].Food = localEmissions[tractID].Meat + localEmissions[tractID].Dairy + localEmissions[tractID].OtherFood + localEmissions[tractID].Veggies + localEmissions[tractID].Cereal;

        // ******************************************************* //
        // All Goods
        // ******************************************************* //
        
        // Goods & Services
        // For Chris: Not sure what second (set of multipliers) / 2 is for / from
        
        localEmissions[tractID].Clothing = ghgFactors.Clothing * (clothingUSDTracts(tract) * consumptionMultiplier("GoodsConsumption", year) + (clothingUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].Furnishings = ghgFactors.Furnishings * (furnishingsUSDTracts(tract) * consumptionMultiplier("GoodsConsumption", year) + (furnishingsUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].OtherGoods = ghgFactors.OtherGoodsSum * (otherGoodsUSDTracts(tract) * consumptionMultiplier("GoodsConsumption", year) + (otherGoodsUSDTracts(tract) * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);

        // There is a policy on the dashboard for adjusting home size, not a very feasible / realistic policy goal
        localEmissions[tractID].HousingConstruction = housingConstructionTracts(tract);// * consumptionMultiplier("GoodsConsumption", year);

        localEmissions[tractID].vehicleMaintenance = (ghgFactors.VehicleMain * vmntTracts(tract) + ghgFactors.VehicleManufacturing * HHVMT) * efficiencyMultiplier("IndustrialEfficiency", year);

        localEmissions[tractID].AllGoods = localEmissions[tractID].Clothing + localEmissions[tractID].Furnishings + localEmissions[tractID].OtherGoods + localEmissions[tractID].vehicleMaintenance + localEmissions[tractID].HousingConstruction;

        // ******************************************************* //
        // Services
        // ******************************************************* //

        localEmissions[tractID].Services = ghgFactors.ServicesSum * servicesUSDTracts(tract) * efficiencyMultiplier("CommercialEfficiency", year);

        // ******************************************************* //
        // Sum
        // ******************************************************* //
        
        localEmissions[tractID].sum = 0;
        
        localEmissions[tractID].sum = localEmissions[tractID].AllGoods + localEmissions[tractID].Services + localEmissions[tractID].Food + localEmissions[tractID].WWE + localEmissions[tractID].Transportation;
        
        localEmissions[tractID].sum = (localEmissions[tractID].sum * (tract.HOUSEHOLDS + popIncrease)) / 1000000;
        
        localEmissions[tractID].households = tract.HOUSEHOLDS + popIncrease;
        localEmissions[PLACE + " " + year + " " + "households"] += tract.HOUSEHOLDS + popIncrease;
        
        localEmissions[PLACE + " " + year + " " + "sum"] += localEmissions[tractID].sum;
    }
    
    HHTractEmissions[PLACE][year] = JSON.parse(JSON.stringify(localEmissions, null, 0));
    
    return (HHTractEmissions[PLACE][year][PLACE + " " + year + " " + "sum"]);

}


// Chart functions
//=============================================================================
// Make a line chart
LineChart = function LineChart(chartselect) {
    
    var i, j, k, m, n, len,
        demain = [], // A holder for domain values
        data = [],
        focus, lineFunc, margin, width, height,
        x, y, xAxis, yAxis, chart, legend,
        
        bisect = d3.bisector(function (d) { return d.horiz; }).left,
        formatValue = d3.format(",.2f"),
        formatCurrency = function (d) { return "$" + formatValue(d); },
        
        EmissionTractLevel;
    
    // Deep copy data to preserve originals
    // this needs to be updated with the correct data
    
    // Local Constructors
    //***********************************************************************//
    
    //=========================================================================
    EmissionTractLevel = function EmissionTractLevel(yearCount) {
        var sum = 0, emissionsTotal;
        
        //Sets the x-axis
        this.horiz = years[yearCount];
        
        // Calculates the Y-values
        this.vertic = parseInt(emissionsTractCalc(years[yearCount])/1000);
    };
    
    //Helper Functions
    //***********************************************************************//
    
    // Initializes the 'data' variable to the appropriate emission values
    function dataInit() {
        switch (chartselect) {
            case "emissionsTracts":
                for (k = 0; k < TOTAL_YEARS; k++) {
                    data[k] = new EmissionTractLevel(k);
                }
                break;
            default:
                alert("I don't know what data to use!");
        }
    }
    
    // (Re)Calculates the data
    function dataCalc() {
        emissionsTotal = 0;
        switch (chartselect) {
            case "emissionsTracts":
                for (k = 0; k < TOTAL_YEARS; k++) {
                    data[k] = new EmissionTractLevel(k);
                    emissionsTotal += data[k].vertic;
                }
                break;
            default:
                alert("I don't know what data to use!");
        }
    }
    
    // Does not need to be changed, just renders graph
    this.render = function () {
    //Chart area formation
        margin = {top: 50, right: 30, bottom: 30, left: 50};
        
        width = 400 - margin.left - margin.right;
        height = 250 - margin.top - margin.bottom;

        x = d3.scaleTime()
            .range([0, width]);

        y = d3.scaleLinear()
            .range([height, 0]);

        xAxis = d3.axisBottom(x)
                .tickFormat(d3.format("5y"));

        yAxis = d3.axisLeft(y);

        chart = d3.select("#" + chartselect + "Chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    };
    
    // Does not need to be changed, just defines graph space
    function chartInit() {
        x.domain([years[0], years[(years.length - 1)]]);

        len = data.length;
        for (j = 0; j < len; j++) {
            demain[j] = +data[j].vertic;
        }
        
        y.domain([0, d3.max(demain)]);

        //To move xAxis to desired location & call it:
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")") //Moves it down to the bottom of the graph.
            .call(xAxis)
        
        // X axis legend
            .append("text")
            .attr("class", chartselect + "xlegend")
            .attr("x", width - 10)
            .attr("y", -height - 30)
            .attr("dx", ".71em")
            .style("text-anchor", "end")
            .text("Year");

        //For adding the Y axis
        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        //For adding the Y axis legend
        //Same sort of stuff as X axis
            .append("text")
            .attr("class", chartselect + "ylegend")
            .attr("x", 0)
            .attr("y", -40)
            .attr("dy", ".71em")
            .style("text-anchor", "start");
        
        //legend = chart.select("." + chartselect + "ylegend");
        
        //updateLegend();
    }
    
    // Does not need to be changed, creates and draws the line graph 
    function lineUpdate() {
        
        //For computing the line
        lineFunc = d3.line()
            .x(function (d) { return x(d.horiz); })
            .y(function (d) { return y(d.vertic); });
        
        len = data.length;
        for (j = 0; j < len; j++) {
            demain[j] = +data[j].vertic;
        }
        
        //For adding the line
        chart.append('svg:path')
            .attr('class', 'graphline').attr('stroke', '#007A94') // Need to figure out how to indicate data vs. model
            .attr('stroke-width', 2)
            .attr('fill', 'none');
        
        chart.transition().duration(750).select(".graphline").attr('d', lineFunc(data));
            
        y.domain([0, d3.max(demain)]);
        
        chart.transition().duration(750).transition().select(".graphline").attr('d', lineFunc(data));
        chart.transition().duration(750).transition().select(".y.axis").call(yAxis);
    }
    
    // Does not need to be changed, creates the circle and overlay
    function focusOverlay() {
        //Creates the tracking circle
        focus = chart.append("g")
            .attr("class", "focus") //The variable is called focus, and has a class of focus.
            .style("display", "none"); //Does not display initially

        focus.append("circle")  //Creates the circle
            .attr("r", 4.5);

        //Creates location for text to go.
        focus.append("text")
            .attr("x", -10)
            .attr("y", -15)
            .attr("dy", ".35em");

        //Adds a rectangular overlay on top of the chart to detect mouse events
        chart.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function () { focus.style("display", null); })
            .on("mouseout", mouseout)
            .on("mousemove", mousemove);
    }
    
    // Does not need to be changed 
    // Turn off the focus and legend values when not mousing over the chart
    function mouseout() {
        focus.style("display", "none");
        //chart.select("." + chartselect + "xlegend").text("Year");
        //updateLegend();
    }
    
    // Does not need to be changed
    // Get mouse position, update focus and legend values
    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisect(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.horiz > d1.horiz - x0 ? d1 : d0;
        
        focus.attr("transform", "translate(" + x(d.horiz) + "," + y(d.vertic) + ")");
        focus.select("text").text(d.vertic);
    }
    
    function updateLegend() {
        d3.select("#emissionsTractsLegend").html("<p>Total Emissions: " + emissionsTotal + " ktons</p>");
    }
    
    // Does not need to be changed
    this.save = function () {
        return data;
    };

    // Does not need to be changed
    this.chartChange = function () {
        //updateLegend();
        dataCalc();
        lineUpdate();
        focusOverlay();
        updateLegend();
    };
    
    // Does not need to be changed
    this.load = function () {
        dataCalc();
        chartInit();
        lineUpdate();
        focusOverlay();
        updateLegend();
    };
};

// Make a stacked chart
StackedChart = function StackedChart() {
    
    var svg = d3.select("#stackedEmissionsChart"),
        margin = {top: 50, right: 50, bottom: 30, left: 20},
        width = 400 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        .align(0.1);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]),
        yAxis = d3.axisLeft(y).ticks(null, "s");

    var z = d3.scaleOrdinal()
        .range(["darkred", "red", "crimson", "firebrick", "deeppink", "pink", "tomato",
                "darkgoldenrod", "peru", "goldenrod", "orange", "gold", "yellow", 
                "darkgreen", "seagreen", "green", "forestgreen", "springgreen",
                "navy", "mediumblue", "royalblue", "purple"]);

    var yearSet = "2010";
    
    var data, data2, dataIntermediate, dataFinal, keys = ["VMT", "AirTravel", "vehicleMaintenance", "Bus", "HeavyRail", "LightRail", "HSR", "kWh", "NaturalGas", "FuelOil", "Water", "Waste", "HousingConstruction",  "Meat", "Dairy", "OtherFood", "Veggies", "Cereal", "Clothing", "Furnishings", "OtherGoods", "Services"];
    
    
    var stack = d3.stack().keys(keys)
                    .order(d3.stackOrderNone)
                    .offset(d3.stackOffsetNone);
    
    //console.log(data);
    function dataCalc() {
        
        emissionsTractCalc(yearSet);
        data = HHTractEmissions[PLACE][yearSet];
        
        data.Transportation = {};
        data.Housing = {};
        data.Food = {};
        data.Goods = {};

        data.Transportation.AirTravel = data.Transportation.HSR = data.Transportation.HeavyRail = data.Transportation.LightRail = data.Transportation.Bus = data.Transportation.VMT = data.Housing.kWh = data.Housing.NaturalGas = data.Housing.FuelOil = data.Housing.Water = data.Housing.Waste = data.Food.Meat = data.Food.Dairy = data.Food.OtherFood = data.Food.Veggies = data.Food.Cereal = data.Goods.Clothing = data.Goods.Furnishings = data.Goods.OtherGoods = data.Housing.HousingConstruction = data.Transportation.vehicleMaintenance = data.Services = 0;

        var tracts = 0, wtdAvg = 0;

        for (var cle in data) {
            if (data[cle].sum) {
                
                wtdAvg = data[cle].households / data[PLACE + " " + yearSet + " " + "households"];
                tracts++;
                
                data.Transportation.AirTravel += +data[cle].AirTravel * wtdAvg;
                data.Transportation.HSR += +data[cle].HSR * wtdAvg;
                data.Transportation.HeavyRail += +data[cle].HeavyRail * wtdAvg;
                data.Transportation.LightRail += +data[cle].LightRail * wtdAvg;
                data.Transportation.Bus += +data[cle].Bus * wtdAvg;
                data.Transportation.VMT += +data[cle].VMT * wtdAvg;
                data.Housing.kWh += +data[cle].kWh * wtdAvg;
                data.Housing.NaturalGas += +data[cle].NaturalGas * wtdAvg;
                data.Housing.FuelOil += +data[cle].FuelOil * wtdAvg;
                data.Housing.Water += +data[cle].Water * wtdAvg;
                data.Housing.Waste += +data[cle].Waste * wtdAvg;
                data.Food.Meat += +data[cle].Meat * wtdAvg;
                data.Food.Dairy += +data[cle].Dairy * wtdAvg;
                data.Food.OtherFood += +data[cle].OtherFood * wtdAvg;
                data.Food.Veggies += +data[cle].Veggies * wtdAvg;
                data.Food.Cereal += +data[cle].Cereal * wtdAvg;
                data.Goods.Clothing += +data[cle].Clothing * wtdAvg;
                data.Goods.Furnishings += +data[cle].Furnishings * wtdAvg;
                data.Goods.OtherGoods += +data[cle].OtherGoods * wtdAvg;
                data.Housing.HousingConstruction += +data[cle].HousingConstruction * wtdAvg;
                data.Transportation.vehicleMaintenance += +data[cle].vehicleMaintenance * wtdAvg;
                data.Services += +data[cle].Services * wtdAvg;
                }
        }

        data.Transportation.AirTravel = data.Transportation.AirTravel / (1000000); 
        data.Transportation.HSR = data.Transportation.HSR / (1000000);
        data.Transportation.HeavyRail = data.Transportation.HeavyRail / (1000000);
        data.Transportation.LightRail = data.Transportation.LightRail / (1000000);
        data.Transportation.Bus = data.Transportation.Bus / (1000000);
        data.Transportation.VMT = data.Transportation.VMT / (1000000);
        data.Housing.kWh = data.Housing.kWh / (1000000);
        data.Housing.NaturalGas = data.Housing.NaturalGas / (1000000);
        data.Housing.FuelOil = data.Housing.FuelOil / (1000000);
        data.Housing.Water = data.Housing.Water / (1000000);
        data.Housing.Waste = data.Housing.Waste / (1000000);
        data.Housing.HousingConstruction = data.Housing.HousingConstruction / (1000000);
        data.Food.Meat = data.Food.Meat / (1000000);
        data.Food.Dairy = data.Food.Dairy / (1000000);
        data.Food.OtherFood = data.Food.OtherFood / (1000000);
        data.Food.Veggies = data.Food.Veggies / (1000000);
        data.Food.Cereal = data.Food.Cereal / (1000000);
        data.Goods.Clothing = data.Goods.Clothing / (1000000);
        data.Goods.Furnishings = data.Goods.Furnishings / (1000000);
        data.Goods.OtherGoods = data.Goods.OtherGoods / (1000000);
        data.Transportation.vehicleMaintenance = data.Transportation.vehicleMaintenance / (1000000);
        data.Services = data.Services / (1000000);


        data.Transportation.total = data.Transportation.AirTravel + data.Transportation.HSR + data.Transportation.HeavyRail + data.Transportation.LightRail + data.Transportation.Bus + data.Transportation.VMT + data.Transportation.vehicleMaintenance;

        data.Housing.total = data.Housing.HousingConstruction + data.Housing.kWh + data.Housing.NaturalGas + data.Housing.FuelOil + data.Housing.Water + data.Housing.Waste;

        data.Food.total = data.Food.Meat + data.Food.Dairy + data.Food.OtherFood + data.Food.Veggies + data.Food.Cereal;
        data.Goods.total = data.Goods.Clothing + data.Goods.Furnishings + data.Goods.OtherGoods;
         + data.Transportation.vehicleMaintenance + data.Services;
        data.total = data.Transportation.total + data.Housing.total + data.Food.total + data.Goods.total + data.Services;

        data2 = [
            {
                category: 'Transportation',
                VMT: data.Transportation.VMT,
                AirTravel: data.Transportation.AirTravel,
                vehicleMaintenance: data.Transportation.vehicleMaintenance,
                HeavyRail: data.Transportation.HeavyRail,
                Bus: data.Transportation.Bus,
                LightRail: data.Transportation.LightRail,
                HSR: data.Transportation.HSR,
                kWh: 0,
                NaturalGas: 0,
                FuelOil: 0,
                Water: 0,
                Waste: 0,
                Meat: 0,
                Dairy: 0,
                OtherFood: 0,
                Veggies: 0,
                Cereal: 0,
                Clothing: 0,
                Furnishings: 0,
                OtherGoods: 0,
                HousingConstruction: 0,
                Services: 0, 
                total: data.Transportation.total
            },
            {
                category: 'Housing',
                VMT: 0,
                AirTravel: 0,
                vehicleMaintenance: 0,
                Bus: 0,
                HeavyRail: 0,
                LightRail: 0,
                HSR: 0,
                kWh: data.Housing.kWh,
                NaturalGas: data.Housing.NaturalGas,
                FuelOil: data.Housing.FuelOil,
                Water: data.Housing.Water,
                Waste: data.Housing.Waste,
                HousingConstruction: data.Housing.HousingConstruction,
                Meat: 0,
                Dairy: 0,
                OtherFood: 0,
                Veggies: 0,
                Cereal: 0,
                Clothing: 0,
                Furnishings: 0,
                OtherGoods: 0,
                Services: 0,
                total: data.Housing.total
            },
            {
                category: 'Food',
                VMT: 0,
                AirTravel: 0,
                vehicleMaintenance: 0,
                Bus: 0,
                HeavyRail: 0,
                LightRail: 0,
                HSR: 0,
                kWh: 0,
                NaturalGas: 0,
                FuelOil: 0,
                Water: 0,
                Waste: 0,
                HousingConstruction: 0,
                Meat: data.Food.Meat,
                Dairy: data.Food.Dairy,
                OtherFood: data.Food.OtherFood,
                Veggies: data.Food.Veggies,
                Cereal: data.Food.Cereal,
                Clothing: 0,
                Furnishings: 0,
                OtherGoods: 0,
                Services: 0,
                total: data.Food.total
            },

            {
                category: 'Goods',
                VMT: 0,
                AirTravel: 0,
                vehicleMaintenance: 0,
                Bus: 0,
                HeavyRail: 0,
                LightRail: 0,
                HSR: 0,
                kWh: 0,
                NaturalGas: 0,
                FuelOil: 0,
                Water: 0,
                Waste: 0,
                HousingConstruction: 0,
                Meat: 0,
                Dairy: 0,
                OtherFood: 0,
                Veggies: 0,
                Cereal: 0,
                Clothing: data.Goods.Clothing,
                Furnishings: data.Goods.Furnishings,
                OtherGoods: data.Goods.OtherGoods,
                Services: 0,
                total: data.Goods.total
            },
            {
                category: 'Services',
                VMT: 0,
                AirTravel: 0,
                vehicleMaintenance: 0,
                Bus: 0,
                HeavyRail: 0,
                LightRail: 0,
                HSR: 0,
                kWh: 0,
                NaturalGas: 0,
                FuelOil: 0,
                Water: 0,
                Waste: 0,
                HousingConstruction: 0,
                Meat: 0,
                Dairy: 0,
                OtherFood: 0,
                Veggies: 0,
                Cereal: 0,
                Clothing: 0,
                Furnishings: 0,
                OtherGoods: 0,
                Services: data.Services,
                total: data.Services
            }
        ];
    }
    
    function chartInit() {
        x.domain(data2.map(function(d) { return d.category; }));
        z.domain(keys);
        y.domain([0, d3.max(data2, function(d) { return d.total; })]).nice();
        
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        
        g.append("g")
            .attr("class", "y axis")
            .call(yAxis)
        .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .attr("class", "charttitle")
            .text("Average Household Carbon Footprint: " + data.total);
    }

    function render() {
        svg.selectAll("g.emissionsrect").remove();
        
        y.domain([0, d3.max(data2, function(d) { return d.total; })]).nice();
        
        dataFinal = stack(data2);

        g.append("g")
        .attr("class", "emissionsrect")
        .selectAll("g")
        .data(dataFinal)
        .enter().append("g")
          .attr("fill", function(d) { return z(d.key); })
        .selectAll("rect")
        .data(function(d) { 
            for (var q = 0; q < 5; q++) {
                d[q].key = d.key;
            }
            return d; })
        .enter().append("rect")
            .attr("x", function(d) { return x(d.data.category); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width", x.bandwidth());
        
        g.append("g")
            .attr("class", "y axis");
        
        g.transition().duration(750).transition().select(".y.axis").call(yAxis);
        d3.select(".charttitle")
            .text("Average Household Carbon Footprint: " + (data.total).toFixed(2));

    }
    
    function createMouseovers() {
        g.selectAll("rect")
           .on("mouseover", function(d){
                var delta = (d[1] - d[0]).toFixed(2);
                var xPos = parseFloat(d3.select(this).attr("x"));
                var yPos = parseFloat(d3.select(this).attr("y"));
                var height = parseFloat(d3.select(this).attr("height"));

                d3.select(this).attr("stroke","black").attr("stroke-width",1);

                d3.select("#stackedEmissionsText").html("<p>" + d.key + ": " + delta + "</p>");
                d3.select("#stackedEmissionsChart").append("text")
                  .attr("x",xPos)
                  .attr("y",yPos +height/2)
                  .attr("class","tip")
                  .text(d.key +": "+ delta); 
           })
           .on("mouseout",function(){
                d3.select(".tip").remove();
                d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
                d3.select("#stackedEmissionsText").html("Mouseover text");
            });
        }
    
    function createLegend() {
        svg.selectAll(".legend").remove();
        
        var legend = g.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .attr("class", "legend")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width + 10)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z);

        legend.selectAll("rect")
            .on("mouseover", function(d) {
                legend.append("text")
                .attr("x", width)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .attr("class", "legendtext")
                .text(function(d) { return d; });
            })
            .on("mouseout",function(){
                legend.select(".legendtext").remove();
            });
    }
    
    this.load = function() {
        yearSet = $('#stackedEmissionsSelector :selected').text();
        dataCalc();
        chartInit();
        render();
        createMouseovers();
        createLegend();
    };

    this.chartChange = function() {
        yearSet = $('#stackedEmissionsSelector :selected').text();
        dataCalc();
        //chartInit();
        render();     
        createMouseovers();   
        createLegend();
    };

}


// Make a policy slider
function policySliderInit(policy) {
    
    var policySlider = $("#" + policy + "Slider");
    
    $(".slider").css("max-width", 400);
    
    policySlider.slider({
        min: policies[policy].Range[0],
        max: policies[policy].Range[1],
        value: policies[policy].Initial,
        animate: "fast",
        change: function (event, ui) {
            // Only trigger on a user-initiated change
            if (event.originalEvent) {
                policyMultipliers[policy] = (ui.value / 100);
                
                //call functions here
                updateCharts();
            }
        }
    }).slider("pips", {
        step: policies[policy].steps,
        rest: "label",
        suffix: "%"
    }).slider("float");
}

// Make an adoption curve slider
function adoptionSliderInit(policy) {
    
    var curveSlider = $("#" + policy + "adoptioncurve"),
        curve = [];
    
    $(".slider").css("max-width", 400);
    
    curveSlider.slider({
        min: 2010,
        max: 2050,
        values: [2020, 2030, 2040, 2050],
        animate: "fast",
        change: function (event, ui) {
            // Only trigger on a user-initiated change
            if (event.originalEvent) {
                curve = [ui.values[0], ui.values[1], ui.values[2], ui.values[3]];
                curveCalc(curve, policy);
                //call functions here
                updateCharts();
            }
        }
    }).slider("pips", {
        step: 10,
        rest: "label"
    }).slider("float");
    
    
}

// Make the table of policies, including sliders
function policyTableInit() {
    var tableHTML = '<table class="table table-striped"><thead><th><div class="col-lg-3 col-med-3 col-sm-3 col-xs-3"><p>Policy</p></div><div class="col-lg-5 col-med-5 col-sm-5 col-xs-5"><p>Implementation Level</p><text class="text-muted">Level of impact achieved by policies</text><br><br><button type="button" id="policyButton">Reset</button></div><div class="col-lg-4 col-med-4 col-sm-4 col-xs-4"><p>Implementation Rate</p><text class="text-muted">Year of 25%, 50%, 75%, and 100% impact</text><br><button type="button" id="adoptionButton">Reset</button></div></th></thead>';
    
    for (i = 0; i < policiesList.length; i++) {
        tableHTML += '<tr><td id="' + policiesList[i] + '"><div class="col-lg-3 col-med-3 col-sm-12 col-xs-12"><p>' + policies[policiesList[i]].Title + '</p></div><div class="col-lg-5 col-med-5 col-sm-6 col-xs-12 slider"><br><div id="' + policiesList[i] + 'Slider"></div><br></div><div class="col-lg-4 col-med-4 col-sm-6 col-xs-12 slider"><br><div id="' + policiesList[i] + 'adoptioncurve"></div></div></td></tr>';
    }

    $("#policiesTable").html(tableHTML);
    
    for (i = 0; i < policiesList.length; i++) {
        policySliderInit(policiesList[i]);
        adoptionSliderInit(policiesList[i]);
    }
    
    $("#policyButton").click(function () {
        var policy;
        for (i = 0; i < policiesList.length; i++) {
            policy = policiesList[i];
            policySliderInit(policiesList[i]);
            policyMultipliers[policy] = (policies[policy].Initial / 100);
        }
        updateCharts();
    });
    
    $("#adoptionButton").click(function () {
        var policy;
        for (i = 0; i < policiesList.length; i++) {
            policy = policiesList[i];
            adoptionSliderInit(policiesList[i]);
            adoptionCurves[policiesList[i]] = new AdoptionCurve();
        }
        updateCharts();
    });
}

// Initiate vars to save space above
function listsInit() {
    countyList = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"];

    cityList = ["ACAMPO", "ACTON", "ADELANTO", "ADIN", "AGOURA HILLS", "AGUANGA", "AHWAHNEE", "ALAMEDA", "ALAMO", "ALBANY", "ALBION", "ALDERPOINT", "ALHAMBRA", "ALISO VIEJO", "ALPAUGH", "ALPINE", "ALTA", "ALTADENA", "ALTURAS", "AMADOR CITY", "AMERICAN CANYON", "ANAHEIM", "ANDERSON", "ANGELS CAMP", "ANGELUS OAKS", "ANGWIN", "ANTELOPE", "ANTIOCH", "APPLE VALLEY", "APPLEGATE", "APTOS", "ARBUCKLE", "ARCADIA", "ARCATA", "ARMONA", "ARNOLD", "AROMAS", "ARROYO GRANDE", "ARTESIA", "ARVIN", "ATASCADERO", "ATHERTON", "ATWATER", "AUBERRY", "AUBURN", "AVALON", "AVENAL", "AZUSA", "BAKERSFIELD", "BALDWIN PARK", "BALLICO", "BANNING", "BARD", "BARSTOW", "BASS LAKE", "BEALE AFB", "BEAUMONT", "BELDEN", "BELL", "BELLFLOWER", "BELMONT", "BELVEDERE TIBURON", "BEN LOMOND", "BENICIA", "BERKELEY", "BERRY CREEK", "BETHEL ISLAND", "BEVERLY HILLS", "BIG BEAR CITY", "BIG BEAR LAKE", "BIG OAK FLAT", "BIG PINE", "BIG SUR", "BIGGS", "BIOLA", "BIRDS LANDING", "BISHOP", "BLAIRSDEN-GRAEAGLE", "BLOCKSBURG", "BLOOMINGTON", "BLUE LAKE", "BLYTHE", "BODEGA", "BODEGA BAY", "BODFISH", "BOLINAS", "BONITA", "BONSALL", "BOONVILLE", "BORON", "BORREGO SPRINGS", "BOULDER CREEK", "BRADLEY", "BRANSCOMB", "BRAWLEY", "BREA", "BRENTWOOD", "BRIDGEPORT", "BRISBANE", "BROOKS", "BUELLTON", "BUENA PARK", "BURBANK", "BURLINGAME", "BURNEY", "BURNT RANCH", "BURSON", "BUTTE CITY", "BUTTONWILLOW", "CALABASAS", "CALEXICO", "CALIENTE", "CALIFORNIA CITY", "CALIFORNIA HOT SPRINGS", "CALIMESA", "CALISTOGA", "CALLAHAN", "CAMARILLO", "CAMBRIA", "CAMINO", "CAMPBELL", "CANOGA PARK", "CANTUA CREEK", "CANYON", "CANYON COUNTRY", "CANYON DAM", "CAPISTRANO BEACH", "CAPITOLA", "CARDIFF BY THE SEA", "CARLSBAD", "CARMEL", "CARMEL BY THE SEA", "CARMEL VALLEY", "CARMICHAEL", "CARNELIAN BAY", "CARPINTERIA", "CARSON", "CARUTHERS", "CASMALIA", "CASPAR", "CASTAIC", "CASTELLA", "CASTRO VALLEY", "CASTROVILLE", "CATHEDRAL CITY", "CAYUCOS", "CAZADERO", "CEDAR GLEN", "CEDARPINES PARK", "CEDARVILLE", "CERES", "CERRITOS", "CHATSWORTH", "CHESTER", "CHICO", "CHILCOOT", "CHINO", "CHINO HILLS", "CHOWCHILLA", "CHULA VISTA", "CITRUS HEIGHTS", "CLAREMONT", "CLARKSBURG", "CLAYTON", "CLEARLAKE", "CLEARLAKE OAKS", "CLOVERDALE", "CLOVIS", "COACHELLA", "COALINGA", "COARSEGOLD", "COBB", "COLFAX", "COLTON", "COLUSA", "COMPTON", "CONCORD", "COOL", "CORCORAN", "CORONA", "CORONA DEL MAR", "CORONADO", "CORTE MADERA", "COSTA MESA", "COTATI", "COTTONWOOD", "COULTERVILLE", "COURTLAND", "COVELO", "COVINA", "COYOTE", "CRESCENT CITY", "CRESTLINE", "CRESTON", "CROCKETT", "CROWS LANDING", "CULVER CITY", "CUPERTINO", "CUTLER", "CYPRESS", "DALY CITY", "DANA POINT", "DANVILLE", "DARDANELLE", "DAVIS", "DEL MAR", "DEL REY", "DELANO", "DELHI", "DENAIR", "DESCANSO", "DESERT HOT SPRINGS", "DIAMOND BAR", "DIAMOND SPRINGS", "DILLON BEACH", "DINUBA", "DISCOVERY BAY", "DIXON", "DORRIS", "DOS PALOS", "DOUGLAS CITY", "DOWNEY", "DUARTE", "DUBLIN", "DUCOR", "DUNLAP", "DUNSMUIR", "EARLIMART", "EARP", "ECHO LAKE", "EDISON", "EL CAJON", "EL CENTRO", "EL CERRITO", "EL DORADO", "EL DORADO HILLS", "EL MONTE", "EL SEGUNDO", "EL SOBRANTE", "ELK", "ELK CREEK", "ELK GROVE", "ELVERTA", "EMERYVILLE", "EMIGRANT GAP", "EMPIRE", "ENCINITAS", "ENCINO", "ESCALON", "ESCONDIDO", "ESPARTO", "EUREKA", "EXETER", "FAIR OAKS", "FAIRFAX", "FAIRFIELD", "FALLBROOK", "FARMERSVILLE", "FARMINGTON", "FELLOWS", "FELTON", "FERNDALE", "FILLMORE", "FINLEY", "FIREBAUGH", "FISH CAMP", "FOLSOM", "FONTANA", "FOOTHILL RANCH", "FOREST KNOLLS", "FOREST RANCH", "FORESTHILL", "FORESTVILLE", "FORT BRAGG", "FORT IRWIN", "FORT JONES", "FORTUNA", "FOUNTAIN VALLEY", "FOWLER", "FRAZIER PARK", "FREEDOM", "FREMONT", "FRENCH CAMP", "FRESNO", "FULLERTON", "GALT", "GARBERVILLE", "GARDEN GROVE", "GARDEN VALLEY", "GARDENA", "GAZELLE", "GERBER", "GEYSERVILLE", "GILROY", "GLEN ELLEN", "GLENCOE", "GLENDALE", "GLENDORA", "GLENN", "GLENNVILLE", "GOLETA", "GRANADA HILLS", "GRAND TERRACE", "GRANITE BAY", "GRASS VALLEY", "GRATON", "GREENBRAE", "GREENFIELD", "GRIDLEY", "GROVER BEACH", "GUERNEVILLE", "HACIENDA HEIGHTS", "HALF MOON BAY", "HANFORD", "HARBOR CITY", "HAWAIIAN GARDENS", "HAWTHORNE", "HAYWARD", "HEALDSBURG", "HEMET", "HERCULES", "HERMOSA BEACH", "HESPERIA", "HIGHLAND", "HOLLISTER", "HOLTVILLE", "HOMELAND", "HOMEWOOD", "HOOPA", "HORNBROOK", "HORNITOS", "HUGHSON", "HUNTINGTON BEACH", "HUNTINGTON PARK", "IMPERIAL BEACH", "INDIAN WELLS", "INDIO", "INGLEWOOD", "INYOKERN", "IONE", "IRVINE", "IVANHOE", "JACKSON", "JACUMBA", "JAMESTOWN", "JAMUL", "JANESVILLE", "JOSHUA TREE", "JULIAN", "KEENE", "KELSEYVILLE", "KERMAN", "KING CITY", "KINGS BEACH", "KINGSBURG", "KIRKWOOD", "KLAMATH", "KNIGHTS LANDING", "KNIGHTSEN", "KYBURZ", "LA CANADA FLINTRIDGE", "LA CRESCENTA", "LA HABRA", "LA JOLLA", "LA MESA", "LA MIRADA", "LA PALMA", "LA PUENTE", "LA QUINTA", "LA VERNE", "LADERA RANCH", "LAFAYETTE", "LAGUNA BEACH", "LAGUNA HILLS", "LAGUNA NIGUEL", "LAGUNA WOODS", "LAKE ARROWHEAD", "LAKE ELSINORE", "LAKE FOREST", "LAKE HUGHES", "LAKEPORT", "LAKESIDE", "LAKEWOOD", "LAMONT", "LANCASTER", "LATHROP", "LATON", "LAWNDALE", "LE GRAND", "LEBEC", "LEMON GROVE", "LEMOORE", "LEWISTON", "LINCOLN", "LINDSAY", "LITTLEROCK", "LIVE OAK", "LIVERMORE", "LIVINGSTON", "LLANO", "LOCKEFORD", "LODI", "LOMA LINDA", "LOMITA", "LOMPOC", "LONG BEACH", "LOOMIS", "LOS ALAMITOS", "LOS ALTOS", "LOS ANGELES", "LOS BANOS", "LOS GATOS", "LOS OLIVOS", "LOS OSOS", "LOTUS", "LOWER LAKE", "LUCERNE", "LUCERNE VALLEY", "LYNWOOD", "MACDOEL", "MAD RIVER", "MADERA", "MAGALIA", "MALIBU", "MAMMOTH LAKES", "MANHATTAN BEACH", "MANTECA", "MARCH AIR RESERVE BASE", "MARICOPA", "MARINA", "MARINA DEL REY", "MARTINEZ", "MARYSVILLE", "MATHER", "MAYWOOD", "MC FARLAND", "MCCLELLAN", "MCCLOUD", "MCKINLEYVILLE", "MEADOW VALLEY", "MECCA", "MENIFEE", "MENLO PARK", "MENTONE", "MERCED", "MIDWAY CITY", "MILL VALLEY", "MILLBRAE", "MILPITAS", "MIRA LOMA", "MISSION HILLS", "MISSION VIEJO", "MODESTO", "MOJAVE", "MONROVIA", "MONTCLAIR", "MONTEBELLO", "MONTEREY", "MONTEREY PARK", "MONTROSE", "MOORPARK", "MORAGA", "MORENO VALLEY", "MORGAN HILL", "MORONGO VALLEY", "MORRO BAY", "MOSS LANDING", "MOUNT SHASTA", "MOUNTAIN VIEW", "MURRIETA", "NAPA", "NATIONAL CITY", "NEEDLES", "NEVADA CITY", "NEWARK", "NEWBURY PARK", "NEWHALL", "NEWMAN", "NEWPORT BEACH", "NIPOMO", "NORCO", "NORDEN", "NORTH HIGHLANDS", "NORTH HILLS", "NORTH HOLLYWOOD", "NORTHRIDGE", "NORWALK", "NOVATO", "NUEVO", "OAK PARK", "OAK VIEW", "OAKDALE", "OAKLAND", "OAKLEY", "OCEANSIDE", "OJAI", "OLIVEHURST", "ONTARIO", "ORANGE", "ORANGE COVE", "ORANGEVALE", "ORICK", "ORINDA", "ORLAND", "OROVILLE", "OXNARD", "PACIFIC GROVE", "PACIFIC PALISADES", "PACIFICA", "PACOIMA", "PALM DESERT", "PALM SPRINGS", "PALMDALE", "PALO ALTO", "PALOS VERDES PENINSULA", "PANORAMA CITY", "PARADISE", "PARAMOUNT", "PASADENA", "PASO ROBLES", "PATTERSON", "PAUMA VALLEY", "PENN VALLEY", "PENNGROVE", "PERRIS", "PETALUMA", "PHELAN", "PICO RIVERA", "PINOLE", "PIONEER", "PIONEERTOWN", "PISMO BEACH", "PITTSBURG", "PLACENTIA", "PLACERVILLE", "PLAYA DEL REY", "PLEASANT HILL", "PLEASANTON", "POMONA", "PORT HUENEME", "PORTER RANCH", "PORTERVILLE", "POTTER VALLEY", "POWAY", "QUINCY", "RAMONA", "RANCHO CORDOVA", "RANCHO CUCAMONGA", "RANCHO MIRAGE", "RANCHO PALOS VERDES", "RANCHO SANTA FE", "RANCHO SANTA MARGARITA", "RAYMOND", "RED BLUFF", "REDDING", "REDLANDS", "REDONDO BEACH", "REDWOOD CITY", "REDWOOD VALLEY", "REEDLEY", "RESCUE", "RESEDA", "RIALTO", "RICHMOND", "RIDGECREST", "RIO LINDA", "RIO VISTA", "RIPON", "RIVERBANK", "RIVERSIDE", "ROCKLIN", "ROHNERT PARK", "ROSAMOND", "ROSEMEAD", "ROSEVILLE", "ROWLAND HEIGHTS", "SACRAMENTO", "SAINT HELENA", "SALINAS", "SAN ANSELMO", "SAN BERNARDINO", "SAN BRUNO", "SAN CARLOS", "SAN CLEMENTE", "SAN DIEGO", "SAN DIMAS", "SAN FERNANDO", "SAN FRANCISCO", "SAN GABRIEL", "SAN JACINTO", "SAN JOSE", "SAN JUAN CAPISTRANO", "SAN LEANDRO", "SAN LORENZO", "SAN LUIS OBISPO", "SAN MARCOS", "SAN MARINO", "SAN MATEO", "SAN PABLO", "SAN PEDRO", "SAN RAFAEL", "SAN RAMON", "SAN YSIDRO", "SANGER", "SANTA ANA", "SANTA BARBARA", "SANTA CLARA", "SANTA CLARITA", "SANTA CRUZ", "SANTA FE SPRINGS", "SANTA MARIA", "SANTA MONICA", "SANTA PAULA", "SANTA ROSA", "SANTEE", "SARATOGA", "SAUSALITO", "SCOTTS VALLEY", "SEAL BEACH", "SEASIDE", "SEBASTOPOL", "SELMA", "SHAFTER", "SHASTA LAKE", "SHERMAN OAKS", "SHINGLE SPRINGS", "SIERRA MADRE", "SIGNAL HILL", "SILVERADO", "SIMI VALLEY", "SOLANA BEACH", "SOLEDAD", "SOMES BAR", "SONOMA", "SONORA", "SOUTH EL MONTE", "SOUTH GATE", "SOUTH LAKE TAHOE", "SOUTH PASADENA", "SOUTH SAN FRANCISCO", "SPRING VALLEY", "STANFORD", "STANTON", "STEVENSON RANCH", "STOCKTON", "STUDIO CITY", "SUISUN CITY", "SUN CITY", "SUN VALLEY", "SUNLAND", "SUNNYVALE", "SUNSET BEACH", "SUSANVILLE", "SYLMAR", "TAFT", "TAHOE CITY", "TARZANA", "TEHACHAPI", "TEMECULA", "TEMPLE CITY", "THERMAL", "THOUSAND OAKS", "THOUSAND PALMS", "TOPANGA", "TORRANCE", "TRABUCO CANYON", "TRACY", "TRUCKEE", "TUJUNGA", "TULARE", "TURLOCK", "TUSTIN", "TWENTYNINE PALMS", "UKIAH", "UNION CITY", "UPLAND", "VACAVILLE", "VALENCIA", "VALLEJO", "VALLEY VILLAGE", "VAN NUYS", "VENICE", "VENTURA", "VICTORVILLE", "VILLA PARK", "VISALIA", "VISTA", "WALNUT", "WALNUT CREEK", "WASCO", "WATSONVILLE", "WEST COVINA", "WEST HILLS", "WEST HOLLYWOOD", "WEST SACRAMENTO", "WESTLAKE VILLAGE", "WESTMINSTER", "WHEATLAND", "WHITE WATER", "WHITTIER", "WILDOMAR", "WILLITS", "WILLOWS", "WILMINGTON", "WINCHESTER", "WINDSOR", "WINNETKA", "WINTON", "WOODLAKE", "WOODLAND", "WOODLAND HILLS", "YORBA LINDA", "YOUNTVILLE", "YREKA", "YUBA CITY", "YUCAIPA", "YUCCA VALLEY"];

    headersList = ["CITY", "COUNTY", "LANDAREA", "DENSITY", "EMPDEN", "URBAN", "PDAAREA", "PDAPOP", "CDD", "HDD", "PEOPLE", "WORKERS", "WORKCNT", "HOUSEHOLDS", "HHSIZE", "SIZEOWN", "SIZERENT", "GRAD", "INCOME2013", "INCOME2007", "AGE", "WHITE", "LATINO", "BLACK", "ASIAN", "OTHERACE", "WORKERS2", "VEHICLES", "CARCOMMUTE", "TIMETOWORK", "OWN", "ROOMS", "GAS", "ELECTRIC", "OIL", "NOFUEL", "OTHERFUEL", "YEARBUILT", "SINGDET", "SQFT", "Children", "Adults", "NumPubTrans", "Public Transit Commuters", "Bus Commuters", "Subway Commuters", "Railroad Commuters"];
    
    policiesList = ["Infill", "EVs", "50MPG", "LowCarbonElectricity", "HeatingElectrificationNew", "HeatingElectrificationExisting", "EnergyEfficiencyNew", "EnergyEfficiencyExisting", "ZeroCarbonFuels", "AirTravelEfficiency", "CommercialEfficiency", "WasteandWaterEfficiency", "IndustrialEfficiency", "AgriculturalEfficiency", "VMT", "AirTravel", "EnergyConsumption", "GoodsConsumption", "FoodConsumption", "WasteConsumption", "WaterConsumption"];
}

// Initiate vars to save space above
function varsInit() {
    var each;
    // Keys to lists
    //***************************************************************************//
    listsInit();
    
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
    
    PLACE = 'ACAMPO';
    
    cityMenuHTML = '';
    countyMenuHTML = '';
    
    for (i = 0; i < cityList.length; i++) {
        cityMenuHTML  += '<option value=' + cityList[i] + '>' + cityList[i] + '</option>';
    }
    
    for (i = 0; i < countyList.length; i++) {
        countyMenuHTML  += '<option value=' + countyList[i] + '>' + countyList[i] + '</option>';
    }
    
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

// Give variables their initial settings - to keep declarations clean
varsInit();

// Program Core
//***************************************************************************//

// Get data while loading DOM =================================================
// jQuery AJAX call for JSON

$.when(
    // offline testing version
    $.getJSON('https://coolclimatenetwork.github.io/data/MSWTABLE.json', function (MSWTABLE_imported) {
        MSWTABLE = MSWTABLE_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/POPTABLE-min.json', function (POPTABLE_imported) {
        POPTABLE = POPTABLE_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/MPOHSRTABLE-min.json', function (MPOHSRTABLE_imported) {
        MPOHSRTABLE = MPOHSRTABLE_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/PUBLICTRANSTABLE-min.json', function (PUBLICTRANSTABLE_imported) {
        PUBLICTRANSTABLE = PUBLICTRANSTABLE_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/city/allCities-min.json', function (allCities_imported) {
        allCities = allCities_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/county/allCounties-min.json', function (allCounties_imported) {
        allCounties = allCounties_imported;
    }),
    $.getJSON('https://coolclimatenetwork.github.io/data/tract/cities/' + PLACE + '/allTracts-min.json', function (tracts_imported) {
        localeTracts = tracts_imported;
    })
    /* for live version
    $.getJSON('./data/MSWTABLE.json', function (MSWTABLE_imported) {
        MSWTABLE = MSWTABLE_imported;
    }),
    $.getJSON('./data/POPTABLE-min.json', function (POPTABLE_imported) {
        POPTABLE = POPTABLE_imported;
    }),
    $.getJSON('./data/MPOHSRTABLE-min.json', function (MPOHSRTABLE_imported) {
        MPOHSRTABLE = MPOHSRTABLE_imported;
    }),
    $.getJSON('./data/PUBLICTRANSTABLE-min.json', function (PUBLICTRANSTABLE_imported) {
        PUBLICTRANSTABLE = PUBLICTRANSTABLE_imported;
    }),
    $.getJSON('./data/city/allCities-min.json', function (allCities_imported) {
        allCities = allCities_imported;
    }),
    $.getJSON('./data/county/allCounties-min.json', function (allCounties_imported) {
        allCounties = allCounties_imported;
    }),
    $.getJSON('./data/tract/cities/' + PLACE + '/allTracts-min.json', function (tracts_imported) {
        localeTracts = tracts_imported;
    })*/
    
    /* for node testing
    MSWTABLE = JSON.parse(fs.readFileSync('./data/MSWTABLE.json'));
    POPTABLE = JSON.parse(fs.readFileSync('./data/POPTABLE-min.json'));
    MPOHSRTABLE = JSON.parse(fs.readFileSync('./data/MPOHSRTABLE-min.json'));
    PUBLICTRANSTABLE = JSON.parse(fs.readFileSync('./data/PUBLICTRANSTABLE-min.json'));
    VMTMODEL = JSON.parse(fs.readFileSync('./data/VMTMODEL.json'));
    allCities = JSON.parse(fs.readFileSync('./data/city/allCities-min.json'));
    allCounties_imported = JSON.parse(fs.readFileSync('./data/county/allCounties-min.json'));
    */
    
).then(function () {
    if (allCities && allCounties) {
        // DOM Ready ==========================================================
        $(document).ready(function () {
            
            $("#countyMenu").html('<form id="countyMenu"> <select name="county" disabled> ' + countyMenuHTML + ' </select> </form>');
            $("#cityMenu").html('<form id="cityMenu"> <select name="city"> ' + cityMenuHTML + ' </select> </form>');
            
            //Create listener for city radio button to trigger drop-down
            $("#cityButton").click(function () {
                $("#countyButton").html('<form id="countyButton"> <input type="radio" name="county" value="county" > County </form>');
                $("#countyMenu").html('<form id="countyMenu"> <select name="county" disabled> ' + countyMenuHTML + ' </select> </form>');
                $("#cityMenu").html('<form id="cityMenu"> <select name="city"> ' + cityMenuHTML + ' </select> </form>');
                cityChange();
            });
            
            //Create listener for county radio button to trigger drop-down
            $("#countyButton").click(function () {
                $("#cityButton").html('<form id="cityButton"> <input type="radio" name="city" value="city" > City </form>');
                $("#cityMenu").html('<form id="cityMenu"> <select name="city" disabled> ' + cityMenuHTML + ' </select> </form>');
                $("#countyMenu").html('<form id="countyMenu"> <select name="county"> ' + countyMenuHTML + ' </select> </form>');
                countyChange();
            });
            
            // Create listener for city drop-down to change graphs
            $("#cityMenu").change(function () {
                cityChange();
            });
            
            // Create listener for county drop-down to change graphs
            $("#countyMenu").change(function () {
                countyChange();
            });
            
            $("#stackedEmissionsSelector").change(function () {
                stackedEmissionsChart.chartChange();
            });
            
            locale = allCities[PLACE];
            CITY = locale.CTY;
            COUNTY = locale.COUNTY;
            
            d3.select("#emissionsChartTitle").html("CO2 emissions in the City of " + PLACE + " (ktons)");
            
            HHTractEmissions[PLACE] = {};
            
            // Creates the policy table and initializes the policy slider settings
            policyTableInit();
            
            // Create chart objects, but don't populate yet
            emissionsTractsChart = new LineChart("emissionsTracts");
            stackedEmissionsChart = new StackedChart();
            
            // Other charts to make:
            // Toggling option for line chart to switch between total city / per HH / per capita
            // Stacked bar chart: Average HH CO2 footprint, slider bar for year adjustment
            // Stacked bar chart or wedge/area: Citywide emissions
            // Cumulative savings of each policy
            
            // Generate the chart outline
            emissionsTractsChart.render();

            // Load the data
            emissionsTractsChart.load();
            stackedEmissionsChart.load();
            
            //d3.select(".policyButton").html('<form name="save"><input id="saveButton" type="button" value="Save Data" onClick="saveData(this.form)">');
        });
    } else {
        alert("Could not load data!");
    }
});