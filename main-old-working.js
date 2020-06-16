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
    years = [0];

// Value holders
var writeFile, spacing, reached, i,
    cty, locale;

// Global val holder for current selected county & city
var COUNTY, CITY;

// Object index counters
// For looping through objects with the object keys

    
// Chart objects
var emissionsChart;

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
var HHEmissions = {};

// End Variable Declarations
//***************************************************************************//



// Functions
//***************************************************************************//

// Data init/save functions (disabled)
// ========================================= //

/*

function writePrivate(dat, name) {
    writeFile = './data/' + name + '.json';
    spacing = 4;

    fs.writeFile(writeFile, JSON.stringify(dat, null, spacing), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Full-length JSON saved to " + writeFile);
        }
    });
}

function writePublic(dat, name) {
    writeFile = './data/' + name + '-min.json';
    spacing = 0;

    fs.writeFile(writeFile, JSON.stringify(dat, null, spacing), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Concise JSON saved to " + writeFile);
        }
    });
}

function writeAll(dat, name) {
    writePrivate(dat, name);
    writePublic(dat, name);
}

*/

// Data transformation tools
// ========================================= //
2
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

function transportationModel() {
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

function vmt() {
    var model = VMTMODEL[transportationModel()],
        result =  Math.exp(model.Constant + model.LNVEH * Math.log(locale.VEHICLES) + model.LNHHSIZE * Math.log(locale.HHSIZE) + model.LNHHINC * Math.log(locale.INCOME2013) + model.WORKCOUNT * locale.WORKCNT + model.TIMETOWORK * locale.TIMETOWORK + model.DRIVE * locale.CARCOMMUTE + model.HHVEHCOUNT * locale.VEHICLES + model.HBPOPDN * locale.DENSITY + model.HHSIZE * locale.HHSIZE + model.HHINC * locale.INCOME2013 + model.WHITE * locale.WHITE + model.HOMEOWN * locale.OWN + model.HISP * locale.LATINO);
    
    return result;
             
}

// (float), returns floats [therms]
function naturalGasTherms() {
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

    result = Math.exp((NGCONSTANT + NGGASCOEF * locale.GAS + NGROOMSCOEF * locale.ROOMS + NGYEARBUILTCOEF * (REFYEAR - locale.YEARBUILT) + NGASIANCOEF * locale.ASIAN + NGHHSIZELNCOEF * Math.log(locale.HHSIZE) + NGWHITECOEF * (locale.WHITE / 2) + NGGRADCOEF * locale.GRAD + NGSQFTCOEF * locale.SQFT + NGOWNCOEF * locale.OWN + NGSINGDETCOEF * locale.SINGDET));
    
    return result;
}

// (float), returns floats [miles]
function airTravelDistance() {
    var AIRTRAVELCONSTANT = 33.088,
        AIRINCOMECOEF = 0.0633;
    
    return (AIRTRAVELCONSTANT + AIRINCOMECOEF * locale.INCOME2007);
}

// (string), returns floats [miles / HH]
function hsrTravel(year) {
    var perCapitaMiles = 0,
        mpo = locale.MPO,
        pop = 0;
    
    pop = mpoPopCalc(year);
    
    perCapitaMiles = MPOHSRTABLE[mpo][year] / pop;
    
    return perCapitaMiles;
}

// (floats), returns floats [miles / HH]
function lightRailTravel() {
    return (locale["Subway Commuters"] * PUBLICTRANSTABLE[COUNTY].CommuterRailMilesPerCommuter / locale.WORKERS * locale.WORKCNT);
}

function heavyRailTravel() {
    return (locale["Railroad Commuters"] * PUBLICTRANSTABLE[COUNTY].AmtrakMilesPerCommuter / locale.WORKERS * locale.WORKCNT);
}

function busTravel() {
    return (locale["Bus Commuters"] * PUBLICTRANSTABLE[COUNTY].BusMilesPerCommuter / locale.WORKERS * locale.WORKCNT);
}

// (float), returns floats  [gCO2e/HH]
function waterUse() {
    var WATERHHSIZECOEF = 25550; // 70 gal/day/person * 365 days/yr
    
    return (WATERHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [miles]
// this needs to be updated 
// needs to include vehicle manufacturing??? miles driven (vmt) * manufacturing emission factor
function vmnt() {
    var VMNTCONSTANT = 78.20,
        VMNTINCOME07COEF = 0.0021,
        AUTOPARTHHSIZECOEF =  7.80,
        VEHSERVCONSTANT =  158.78,
        VEHSERVINCOMECOEF =  0.0043,
        VEHSERVEHHSIZECOEF =  15.83;
        
    return ((VMNTCONSTANT + VMNTINCOME07COEF * locale.INCOME2007 + AUTOPARTHHSIZECOEF * locale.HHSIZE) + (VEHSERVCONSTANT + VEHSERVINCOMECOEF * locale.INCOME2007 + VEHSERVEHHSIZECOEF * locale.HHSIZE));
}

// (float), returns floats [kwh]
function kwhUse() {
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
    
    return (Math.exp(KWHCONSTANT + KWHROOMSCOEF * locale.ROOMS + KWHLNCDDSQFTCOEF * Math.log(locale.CDD * locale.SQFT) + KWHLNHHSIZECOEF * Math.log(locale.HHSIZE) + KWHLNINCOME13COEF * Math.log(locale.INCOME2013) + KWHASIANCOEF * locale.ASIAN + KWHGASCOEF * locale.GAS + KWHOWNCOEF * locale.OWN + KWHSQFTCOEF * locale.SQFT + KWHGRADCOEF * locale.GRAD + KWHSINGDETCOEF * locale.SINGDET));
}

// (float), returns floats [gallons]
function oilUse() {
    var FOCONSTANT = 228.95,
        FOROOMSCOEF = 75.846,
        FOREGIONCOEF = 128.895,
        FOOWNCOEF = -164.353,
        FOAGECOEF = 2.836,
        FODIV1COEF = 99.678,
        FOWHITECOEF = -94.047,
        
        REGION = 0,
        DIV1 = 0;
    
    return ((FOCONSTANT + FOROOMSCOEF * locale.ROOMS + FOREGIONCOEF * REGION + FOOWNCOEF * locale.OWN + FOAGECOEF * locale.AGE + FODIV1COEF * DIV1 + FOWHITECOEF * locale.WHITE) * locale.OTHERFUEL);
}

// (float), returns floats [tons]
function wasteGeneration() {
    if (MSWTABLE[COUNTY].DISPOSALRATE) {
        return (MSWTABLE[COUNTY].DISPOSALRATE);
    } else {
        return (0.5);
    }
}

// (float), returns floats
function housingConstruction() {
    return (((0.0097 * Math.pow(locale.SQFT, 2) - 10.012 * locale.SQFT + 80256) / 70) * 1000); // gCO2/HH, amortized over 70 years
}

// (float), returns floats [calories]
function meatConsumption() {
    var ADULTMEATCAL = 487,
        CHILDMEATCAL = 365;
    return ((ADULTMEATCAL * locale.Adults + CHILDMEATCAL * locale.Children) * 365);
}

// (float), returns floats [calories]
function dairyConsumption() {
    var ADULTDAIRYCAL = 232,
        CHILDDAIRYCAL = 174;
    return ((ADULTDAIRYCAL * locale.Adults + CHILDDAIRYCAL * locale.Children) * 365);
}

// (float), returns floats [calories]
function otherFoodConsumption() {
    var ADULTOTHERCAL = 1170,
        CHILDOTHERCAL = 877;
    return ((ADULTOTHERCAL * locale.Adults + CHILDOTHERCAL * locale.Children) * 365);
}

// (float), returns floats [calories]
function vegeCalories() {
    var ADULTVEGECAL = 304,
        CHILDVEGECAL = 228;
    return ((ADULTVEGECAL * locale.Adults + CHILDVEGECAL * locale.Children) * 365);
}

// (float), returns floats [calories]
function cerealCalories() {
    var ADULTCEREALCAL = 584,
        CHILDCEREALCAL = 438;
    
    return ((ADULTCEREALCAL * locale.Adults + CHILDCEREALCAL * locale.Children) * 365);
}

// (float), returns floats [dollars]
function clothingUSD() {
    var CLOTHCONSTANT = 75.63,
        CLOTHINCOME07COEF =  0.0149,
        CLOTHHHSIZECOEF =  323.60;
    
    return (CLOTHCONSTANT + CLOTHINCOME07COEF * locale.INCOME2007 + CLOTHHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function furnishingsUSD() {
    var FURCONSTANT =  278.96,
        FURINCOME07COEF =  0.0231,
        FURHHSIZECOEF =  27.70;
    
    return (FURCONSTANT + FURINCOME07COEF * locale.INCOME2007 + FURHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function otherGoodsUSD() {
    var OTHERGOODSCONSTANT =  2769.82,
        OTHERGOODSINCOME07COEF =  0.0291,
        OTHERGOODSHHSIZECOEF =  100.70;
    
    return (OTHERGOODSCONSTANT + OTHERGOODSINCOME07COEF * locale.INCOME2007 + OTHERGOODSHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function servicesUSD() {
    var SERVICESCONSTANT =  3939.74,
        SERVICESINCOME07COEF =  0.1428,
        SERVICESHHSIZECOEF =  102.47;
    
    return (SERVICESCONSTANT + SERVICESINCOME07COEF * locale.INCOME2007 + SERVICESHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function medical() {
    var MEDICALCONSTANT = 775.25,
        MEDICALINCOME07COEF = 0.0029,
        MEDICALHHSIZECOEF = 0.13;
    
    return (MEDICALCONSTANT + MEDICALINCOME07COEF * locale.INCOME2007 + MEDICALHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function entertainment() {
    var ENTERTAINCONSTANT =  228.57,
        ENTERTAININCOME07COEF =  0.0146,
        ENTERTAINHHSIZECOEF =  24.73;
    
    return (ENTERTAINCONSTANT + ENTERTAININCOME07COEF * locale.INCOME2007 + ENTERTAINHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function reading() {
    var READINGCONSTANT =  73.68,
        READINGINCOME07COEF =  0.0015,
        READINGHHSIZECOEF =  -17.53;
    
    return (READINGCONSTANT + READINGINCOME07COEF * locale.INCOME2007 + READINGHHSIZECOEF * locale.HHSIZE);
}

// (float), returns floats [dollars]
function careClean() {
    var CARECLEANCONSTANT =  229.21,
        CARECLEANINCOME07COEF =  0.0079,
        CARECLEANHHSZIECOEF =  85.57;
    
    return (CARECLEANCONSTANT + CARECLEANINCOME07COEF * locale.INCOME2007 + CARECLEANHHSZIECOEF * locale.HHSIZE);
}

// Calculation functions
// ========================================= //

function updateCharts() {
    emissionsChart.chartChange();
}

function cityChange() {
    var val = $('#cityMenu :selected').text();
    cty = allCities[val];
    CITY = val;
    COUNTY = cty.COUNTY;
    locale = allCities[val];
    updateCharts();
}

function countyChange() {
    var val = $('#countyMenu :selected').text();
    cty = allCounties[val];
    COUNTY = val;
    locale = allCounties[val];
    locale.COUNTY = COUNTY;
    $.getJSON('https://coolclimatenetwork.github.io/data/tract/counties/' + COUNTY + '-tracts.json', function (allCounties_imported) {
        allCounties = allCounties_imported;
    })
    updateCharts();
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
//=============================================================================
function emissionsCalc(year) {
    // To-do list:
    // DONE: include policy control factors / multipliers from spreadsheet. Don't include taxation or home size efficiency
    // DONE: Include adoption curves
    // 
    // Need to develop stacked chart graph / graph of each sector?
    //
    // Need to do population growth by PDA
    
    var HHVMT = vmt() * consumptionMultiplier("VMT", year),
        ELECTRICHEATNEW2010 = 0.1,
        ELECTRICHEATEXISTING2010 = 0.1,
        sum = 0,
        ef,
        // simple placeholder assumption that relative sizes between cities remain constant as county pop grows
        // also assumes that household size remains constant
        // this needs to be updated - use PDAs, other things
        popmultiplier = POPTABLE[locale.COUNTY][year] / POPTABLE[locale.COUNTY]["2010"];
    
    // Transportation emissions
    HHEmissions.AirTravel = (ghgFactors.Flightdirect + ghgFactors.Flightindirect) * airTravelDistance() * consumptionMultiplier("AirTravel", year) * efficiencyMultiplier("AirTravelEfficiency", year);
    HHEmissions.HSR = ghgFactors.HSR * hsrTravel(year);
    HHEmissions.HeavyRail = ghgFactors.HeavyRail * heavyRailTravel();
    HHEmissions.LightRail = ghgFactors.LightRail * lightRailTravel();
    HHEmissions.Bus = ghgFactors.Bus * busTravel();
    
    // Vehicles
    // this needs to be updated
    // clean this up
    
    
    // this needs to be updated
    // clean this up - adoption curve generation and then multiplier based on slider chart
    
    HHEmissions.VMT = (HHVMT / ghgFactors.MPG) * ghgFactors.Gasoline * (efficiencyMultiplier("ZeroCarbonFuels", year)) * (1 - ((policyMultipliers.EVs * adoptionCurves.EVs[year]) + (policyMultipliers["50MPG"] * adoptionCurves["50MPG"][year])));
    
    
    // TOTAL TRANSPORTATION
    HHEmissions.Transportation = HHEmissions.AirTravel + HHEmissions.HSR + HHEmissions.HeavyRail + HHEmissions.LightRail + HHEmissions.Bus + HHEmissions.VMT;
    
    // ******************************************************* //
    
    // Energy emissions
    // kWh
    HHEmissions.kWh = ((ghgFactors.kWh + (ghgFactors.kWhindirect * efficiencyMultiplier("IndustrialEfficiency", year))) * efficiencyMultiplier("LowCarbonElectricity", year)) * ((kwhUse() * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year)) + (kwhUse() * consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)));
    
    // this is insane
    // NatGas
    HHEmissions.NaturalGas = (ghgFactors.NGdirect + ghgFactors.NGindirect) * (naturalGasTherms() * ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / (1 - ELECTRICHEATNEW2010))) + ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)) * (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / (1 - ELECTRICHEATEXISTING2010)))));
        
    // Fuel Oil
    // For Chris: error in original excel cells regarding second + block missing first instance of 2050HH
    // Same insanity as NatGas
    HHEmissions.FuelOil = (ghgFactors.FuelOildirect + ghgFactors.FuelOilindirect) * (oilUse() * ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyNew", year) * (1 - ((policyMultipliers.HeatingElectrificationNew * adoptionCurves.HeatingElectrificationNew[year]) - ELECTRICHEATNEW2010) / (1 - ELECTRICHEATNEW2010))) + ((consumptionMultiplier("EnergyConsumption", year) * efficiencyMultiplier("EnergyEfficiencyExisting", year)) * (1 - ((policyMultipliers.HeatingElectrificationExisting * adoptionCurves.HeatingElectrificationExisting[year]) - ELECTRICHEATEXISTING2010) / (1 - ELECTRICHEATEXISTING2010)))));
        
    // Water & waste
    // Model is inconsistent - has both Waste & Water EFficiency & Industrial Efficiency, uses Industrial for wateremissions and Waste&Water for waste. Does not include Waste and Water Efficiency policy calc for waste
    // For Chris: check in 
    // Not sure what the 1000000 is for ????
    HHEmissions.Water = ghgFactors.Water * waterUse() * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WaterConsumption", year);
    HHEmissions.Waste = ghgFactors.Waste * wasteGeneration() * efficiencyMultiplier("WasteandWaterEfficiency", year) * consumptionMultiplier("WasteConsumption", year);
    
    // TOTAL WASTE WATER ENERGY
    HHEmissions.WWE = HHEmissions.Water + HHEmissions.Waste + HHEmissions.FuelOil + HHEmissions.NaturalGas + HHEmissions.kWh;
    
    // ******************************************************* //
    
    // policiesList: .Infill

    // Food
    // For Chris: Not sure what 1000000 is for / from
    HHEmissions.Meat = ghgFactors.Meat * meatConsumption() * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
    HHEmissions.Dairy = ghgFactors.Dairy * dairyConsumption() * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
    HHEmissions.OtherFood = ghgFactors.Food * otherFoodConsumption() * efficiencyMultiplier("AgriculturalEfficiency", year) * consumptionMultiplier("FoodConsumption", year);
    HHEmissions.Veggies = ghgFactors.FruitsVegetables * vegeCalories() * efficiencyMultiplier("AgriculturalEfficiency", year);// * consumptionMultiplier("FoodConsumption", year);
    HHEmissions.Cereal = ghgFactors.Cereal * cerealCalories() * efficiencyMultiplier("AgriculturalEfficiency", year);// * consumptionMultiplier("FoodConsumption", year);
        
    HHEmissions.Food = HHEmissions.Meat + HHEmissions.Dairy + HHEmissions.OtherFood + HHEmissions.Veggies + HHEmissions.Cereal;
    
    // ******************************************************* //
    
    // Goods & Services
    // For Chris: Not sure what 1000000 is for / from
    // For Chris: Not sure what second (set of multipliers) / 2 is for / from
    HHEmissions.Clothing = ghgFactors.Clothing * (clothingUSD() * consumptionMultiplier("GoodsConsumption", year) + (clothingUSD() * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);
    
    HHEmissions.Furnishings = ghgFactors.Furnishings * (furnishingsUSD() * consumptionMultiplier("GoodsConsumption", year) + (furnishingsUSD() * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);
    
    HHEmissions.OtherGoods = ghgFactors.OtherGoodsSum * (otherGoodsUSD() * consumptionMultiplier("GoodsConsumption", year) + (otherGoodsUSD() * policyMultipliers.GoodsConsumption * adoptionCurves.GoodsConsumption[year]) / 2) * efficiencyMultiplier("IndustrialEfficiency", year);
        
    // There is a policy on the dashboard for adjusting home size, not a very feasible / realistic policy goal
    HHEmissions.HousingConstruction = housingConstruction();// * consumptionMultiplier("GoodsConsumption", year);
    
    HHEmissions.vehicleMaintenance = (ghgFactors.VehicleMain * vmnt() + ghgFactors.VehicleManufacturing * HHVMT) * efficiencyMultiplier("IndustrialEfficiency", year);
    
    HHEmissions.AllGoods = HHEmissions.Clothing + HHEmissions.Furnishings + HHEmissions.OtherGoods + HHEmissions.vehicleMaintenance + HHEmissions.HousingConstruction;
    
    // ******************************************************* //
    
    HHEmissions.Services = ghgFactors.ServicesSum * servicesUSD() * efficiencyMultiplier("CommercialEfficiency", year);
    
    // this needs to be updated
    // sums HHEmissions across all categories
    // clean this up for calculating emissions total
    for (ef in HHEmissions) {
        sum += HHEmissions[ef];
    }
    
    return sum * (locale.HOUSEHOLDS * popmultiplier) / 1000000; // convert gCO2e to tCO2e
}

// Chart functions
//=============================================================================
// Make line charts
LineChart = function LineChart(chartselect) {
    
    var i, j, k, m, n, len,
        demain = [], // A holder for domain values
        data = [],
        focus, lineFunc, margin, width, height,
        x, y, xAxis, yAxis, chart, legend,
        
        bisect = d3.bisector(function (d) { return d.horiz; }).left,
        formatValue = d3.format(",.2f"),
        formatCurrency = function (d) { return "$" + formatValue(d); },

        
        EmissionLevel;
    
    
    // Deep copy data to preserve originals
    // this needs to be updated with the correct data
    //var vehicleesyear = JSON.parse(JSON.stringify(vehiclees, null, 0));
    
    // Local Constructors
    //***********************************************************************//
    
    //=========================================================================
    EmissionLevel = function EmissionLevel(yearCount) {
        var sum = 0;
        
        //Sets the x-axis
        this.horiz = years[yearCount];
        
        // Calculates the Y-values
        this.vertic = emissionsCalc(years[yearCount]);
    };
    
    //Helper Functions
    //***********************************************************************//
    
    // Initializes the 'data' variable to the appropriate emission values
    function dataInit() {
        switch (chartselect) {
        case "emissions":
            for (k = 0; k < TOTAL_YEARS; k++) {
                data[k] = new EmissionLevel(k);
            }
            break;
        default:
            alert("I don't know what data to use!");
        }
    }
    
    // (Re)Calculates the data
    function dataCalc() {
        switch (chartselect) {
        case "emissions":
            for (k = 0; k < TOTAL_YEARS; k++) {
                data[k] = new EmissionLevel(k);
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
        /*chart.select("." + chartselect + "xlegend").text("Year: " + dateToYear(d.horiz));
        switch (chartselect) {
        case "emissions":
            legend.text("CO2 Emissions");
            break;
        case "adoption":
            legend.text("adoption");
            break;
        case "bau":
            legend.text("bau");
            break;
        }*/
    }
    
    function updateLegend() {
        switch (chartselect) {
        case "emissions":
            legend.text("CO2 Emissions");
            break;
        case "adoption":
            legend.text("adoption");
            break;
        case "bau":
            legend.text("bau");
            break;
        }
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
    };
    
    // Does not need to be changed
    this.load = function () {
        dataCalc();
        this.render();
        chartInit();
        lineUpdate();
        focusOverlay();
    };
};

// Make a policy slider
function policySliderInit(policy) {
    
    var policySlider = $("#" + policy + "Slider");
    
    $(".slider").css("max-width", 400);
    
    policySlider.slider({
        min: policies[policy].Range[0],
        max: policies[policy].Range[1],
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
    var tableHTML = '<table class="table table-striped"><thead><th><div class="col-lg-3 col-med-3 col-sm-3 col-xs-3"><p>Policy</p></div><div class="col-lg-5 col-med-5 col-sm-5 col-xs-5"><p>Implementation Level</p></div><div class="col-lg-4 col-med-4 col-sm-4 col-xs-4"><p>Implementation Rate</p></div></th></thead>';
    
    for (i = 0; i < policiesList.length; i++) {
        tableHTML += '<tr><td id="' + policiesList[i] + '"><div class="col-lg-3 col-med-3 col-sm-12 col-xs-12"><p>' + policies[policiesList[i]].Title + '</p></div><div class="col-lg-5 col-med-5 col-sm-6 col-xs-12 slider"><br><div id="' + policiesList[i] + 'Slider"></div><br></div><div class="col-lg-4 col-med-4 col-sm-6 col-xs-12 slider"><br><div id="' + policiesList[i] + 'adoptioncurve"></div></div></td></tr>';
    }

    $("#policiesTable").html(tableHTML);
    
    for (i = 0; i < policiesList.length; i++) {
        policySliderInit(policiesList[i]);
        adoptionSliderInit(policiesList[i]);
    }
    
}

// Initiate vars to save space above
function listsInit() {
    countyList = ["Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"];

    cityList = ["ACAMPO", "ACTON", "ADELANTO", "ADIN", "AGOURA HILLS", "AGUANGA", "AHWAHNEE", "ALAMEDA", "ALAMO", "ALBANY", "ALBION", "ALDERPOINT", "ALHAMBRA", "ALISO VIEJO", "ALPAUGH", "ALPINE", "ALTA", "ALTADENA", "ALTURAS", "AMADOR CITY", "AMERICAN CANYON", "ANAHEIM", "ANDERSON", "ANGELS CAMP", "ANGELUS OAKS", "ANGWIN", "ANTELOPE", "ANTIOCH", "APPLE VALLEY", "APPLEGATE", "APTOS", "ARBUCKLE", "ARCADIA", "ARCATA", "ARMONA", "ARNOLD", "AROMAS", "ARROYO GRANDE", "ARTESIA", "ARVIN", "ATASCADERO", "ATHERTON", "ATWATER", "AUBERRY", "AUBURN", "AVALON", "AVENAL", "AZUSA", "BAKERSFIELD", "BALDWIN PARK", "BALLICO", "BANNING", "BARD", "BARSTOW", "BASS LAKE", "BEALE AFB", "BEAUMONT", "BELDEN", "BELL", "BELLFLOWER", "BELMONT", "BELVEDERE TIBURON", "BEN LOMOND", "BENICIA", "BERKELEY", "BERRY CREEK", "BETHEL ISLAND", "BEVERLY HILLS", "BIG BEAR CITY", "BIG BEAR LAKE", "BIG OAK FLAT", "BIG PINE", "BIG SUR", "BIGGS", "BIOLA", "BIRDS LANDING", "BISHOP", "BLAIRSDEN-GRAEAGLE", "BLOCKSBURG", "BLOOMINGTON", "BLUE LAKE", "BLYTHE", "BODEGA", "BODEGA BAY", "BODFISH", "BOLINAS", "BONITA", "BONSALL", "BOONVILLE", "BORON", "BORREGO SPRINGS", "BOULDER CREEK", "BRADLEY", "BRANSCOMB", "BRAWLEY", "BREA", "BRENTWOOD", "BRIDGEPORT", "BRISBANE", "BROOKS", "BUELLTON", "BUENA PARK", "BURBANK", "BURLINGAME", "BURNEY", "BURNT RANCH", "BURSON", "BUTTE CITY", "BUTTONWILLOW", "CALABASAS", "CALEXICO", "CALIENTE", "CALIFORNIA CITY", "CALIFORNIA HOT SPRINGS", "CALIMESA", "CALISTOGA", "CALLAHAN", "CAMARILLO", "CAMBRIA", "CAMINO", "CAMPBELL", "CANOGA PARK", "CANTUA CREEK", "CANYON", "CANYON COUNTRY", "CANYON DAM", "CAPISTRANO BEACH", "CAPITOLA", "CARDIFF BY THE SEA", "CARLSBAD", "CARMEL", "CARMEL BY THE SEA", "CARMEL VALLEY", "CARMICHAEL", "CARNELIAN BAY", "CARPINTERIA", "CARSON", "CARUTHERS", "CASMALIA", "CASPAR", "CASTAIC", "CASTELLA", "CASTRO VALLEY", "CASTROVILLE", "CATHEDRAL CITY", "CAYUCOS", "CAZADERO", "CEDAR GLEN", "CEDARPINES PARK", "CEDARVILLE", "CERES", "CERRITOS", "CHATSWORTH", "CHESTER", "CHICO", "CHILCOOT", "CHINO", "CHINO HILLS", "CHOWCHILLA", "CHULA VISTA", "CITRUS HEIGHTS", "CLAREMONT", "CLARKSBURG", "CLAYTON", "CLEARLAKE", "CLEARLAKE OAKS", "CLOVERDALE", "CLOVIS", "COACHELLA", "COALINGA", "COARSEGOLD", "COBB", "COLFAX", "COLTON", "COLUSA", "COMPTON", "CONCORD", "COOL", "CORCORAN", "CORONA", "CORONA DEL MAR", "CORONADO", "CORTE MADERA", "COSTA MESA", "COTATI", "COTTONWOOD", "COULTERVILLE", "COURTLAND", "COVELO", "COVINA", "COYOTE", "CRESCENT CITY", "CRESTLINE", "CRESTON", "CROCKETT", "CROWS LANDING", "CULVER CITY", "CUPERTINO", "CUTLER", "CYPRESS", "DALY CITY", "DANA POINT", "DANVILLE", "DARDANELLE", "DAVIS", "DEL MAR", "DEL REY", "DELANO", "DELHI", "DENAIR", "DESCANSO", "DESERT HOT SPRINGS", "DIAMOND BAR", "DIAMOND SPRINGS", "DILLON BEACH", "DINUBA", "DISCOVERY BAY", "DIXON", "DORRIS", "DOS PALOS", "DOUGLAS CITY", "DOWNEY", "DUARTE", "DUBLIN", "DUCOR", "DUNLAP", "DUNSMUIR", "EARLIMART", "EARP", "ECHO LAKE", "EDISON", "EL CAJON", "EL CENTRO", "EL CERRITO", "EL DORADO", "EL DORADO HILLS", "EL MONTE", "EL SEGUNDO", "EL SOBRANTE", "ELK", "ELK CREEK", "ELK GROVE", "ELVERTA", "EMERYVILLE", "EMIGRANT GAP", "EMPIRE", "ENCINITAS", "ENCINO", "ESCALON", "ESCONDIDO", "ESPARTO", "EUREKA", "EXETER", "FAIR OAKS", "FAIRFAX", "FAIRFIELD", "FALLBROOK", "FARMERSVILLE", "FARMINGTON", "FELLOWS", "FELTON", "FERNDALE", "FILLMORE", "FINLEY", "FIREBAUGH", "FISH CAMP", "FOLSOM", "FONTANA", "FOOTHILL RANCH", "FOREST KNOLLS", "FOREST RANCH", "FORESTHILL", "FORESTVILLE", "FORT BRAGG", "FORT IRWIN", "FORT JONES", "FORTUNA", "FOUNTAIN VALLEY", "FOWLER", "FRAZIER PARK", "FREEDOM", "FREMONT", "FRENCH CAMP", "FRESNO", "FULLERTON", "GALT", "GARBERVILLE", "GARDEN GROVE", "GARDEN VALLEY", "GARDENA", "GAZELLE", "GERBER", "GEYSERVILLE", "GILROY", "GLEN ELLEN", "GLENCOE", "GLENDALE", "GLENDORA", "GLENN", "GLENNVILLE", "GOLETA", "GRANADA HILLS", "GRAND TERRACE", "GRANITE BAY", "GRASS VALLEY", "GRATON", "GREENBRAE", "GREENFIELD", "GRIDLEY", "GROVER BEACH", "GUERNEVILLE", "HACIENDA HEIGHTS", "HALF MOON BAY", "HANFORD", "HARBOR CITY", "HAWAIIAN GARDENS", "HAWTHORNE", "HAYWARD", "HEALDSBURG", "HEMET", "HERCULES", "HERMOSA BEACH", "HESPERIA", "HIGHLAND", "HOLLISTER", "HOLTVILLE", "HOMELAND", "HOMEWOOD", "HOOPA", "HORNBROOK", "HORNITOS", "HUGHSON", "HUNTINGTON BEACH", "HUNTINGTON PARK", "IMPERIAL BEACH", "INDIAN WELLS", "INDIO", "INGLEWOOD", "INYOKERN", "IONE", "IRVINE", "IVANHOE", "JACKSON", "JACUMBA", "JAMESTOWN", "JAMUL", "JANESVILLE", "JOSHUA TREE", "JULIAN", "KEENE", "KELSEYVILLE", "KERMAN", "KING CITY", "KINGS BEACH", "KINGSBURG", "KIRKWOOD", "KLAMATH", "KNIGHTS LANDING", "KNIGHTSEN", "KYBURZ", "LA CANADA FLINTRIDGE", "LA CRESCENTA", "LA HABRA", "LA JOLLA", "LA MESA", "LA MIRADA", "LA PALMA", "LA PUENTE", "LA QUINTA", "LA VERNE", "LADERA RANCH", "LAFAYETTE", "LAGUNA BEACH", "LAGUNA HILLS", "LAGUNA NIGUEL", "LAGUNA WOODS", "LAKE ARROWHEAD", "LAKE ELSINORE", "LAKE FOREST", "LAKE HUGHES", "LAKEPORT", "LAKESIDE", "LAKEWOOD", "LAMONT", "LANCASTER", "LATHROP", "LATON", "LAWNDALE", "LE GRAND", "LEBEC", "LEMON GROVE", "LEMOORE", "LEWISTON", "LINCOLN", "LINDSAY", "LITTLEROCK", "LIVE OAK", "LIVERMORE", "LIVINGSTON", "LLANO", "LOCKEFORD", "LODI", "LOMA LINDA", "LOMITA", "LOMPOC", "LONG BEACH", "LOOMIS", "LOS ALAMITOS", "LOS ALTOS", "LOS ANGELES", "LOS BANOS", "LOS GATOS", "LOS OLIVOS", "LOS OSOS", "LOTUS", "LOWER LAKE", "LUCERNE", "LUCERNE VALLEY", "LYNWOOD", "MACDOEL", "MAD RIVER", "MADERA", "MAGALIA", "MALIBU", "MAMMOTH LAKES", "MANHATTAN BEACH", "MANTECA", "MARCH AIR RESERVE BASE", "MARICOPA", "MARINA", "MARINA DEL REY", "MARTINEZ", "MARYSVILLE", "MATHER", "MAYWOOD", "MC FARLAND", "MCCLELLAN", "MCCLOUD", "MCKINLEYVILLE", "MEADOW VALLEY", "MECCA", "MENIFEE", "MENLO PARK", "MENTONE", "MERCED", "MIDWAY CITY", "MILL VALLEY", "MILLBRAE", "MILPITAS", "MIRA LOMA", "MISSION HILLS", "MISSION VIEJO", "MODESTO", "MOJAVE", "MONROVIA", "MONTCLAIR", "MONTEBELLO", "MONTEREY", "MONTEREY PARK", "MONTROSE", "MOORPARK", "MORAGA", "MORENO VALLEY", "MORGAN HILL", "MORONGO VALLEY", "MORRO BAY", "MOSS LANDING", "MOUNT SHASTA", "MOUNTAIN VIEW", "MURRIETA", "NAPA", "NATIONAL CITY", "NEEDLES", "NEVADA CITY", "NEWARK", "NEWBURY PARK", "NEWHALL", "NEWMAN", "NEWPORT BEACH", "NIPOMO", "NORCO", "NORDEN", "NORTH HIGHLANDS", "NORTH HILLS", "NORTH HOLLYWOOD", "NORTHRIDGE", "NORWALK", "NOVATO", "NUEVO", "OAK PARK", "OAK VIEW", "OAKDALE", "OAKLAND", "OAKLEY", "OCEANSIDE", "OJAI", "OLIVEHURST", "ONTARIO", "ORANGE", "ORANGE COVE", "ORANGEVALE", "ORICK", "ORINDA", "ORLAND", "OROVILLE", "OXNARD", "PACIFIC GROVE", "PACIFIC PALISADES", "PACIFICA", "PACOIMA", "PALM DESERT", "PALM SPRINGS", "PALMDALE", "PALO ALTO", "PALOS VERDES PENINSULA", "PANORAMA CITY", "PARADISE", "PARAMOUNT", "PASADENA", "PASO ROBLES", "PATTERSON", "PAUMA VALLEY", "PENN VALLEY", "PENNGROVE", "PERRIS", "PETALUMA", "PHELAN", "PICO RIVERA", "PINOLE", "PIONEER", "PIONEERTOWN", "PISMO BEACH", "PITTSBURG", "PLACENTIA", "PLACERVILLE", "PLAYA DEL REY", "PLEASANT HILL", "PLEASANTON", "POINT MUGU NAWC", "POMONA", "PORT HUENEME", "PORTER RANCH", "PORTERVILLE", "POTTER VALLEY", "POWAY", "QUINCY", "RAMONA", "RANCHO CORDOVA", "RANCHO CUCAMONGA", "RANCHO MIRAGE", "RANCHO PALOS VERDES", "RANCHO SANTA FE", "RANCHO SANTA MARGARITA", "RAYMOND", "RED BLUFF", "REDDING", "REDLANDS", "REDONDO BEACH", "REDWOOD CITY", "REDWOOD VALLEY", "REEDLEY", "RESCUE", "RESEDA", "RIALTO", "RICHMOND", "RIDGECREST", "RIO LINDA", "RIO VISTA", "RIPON", "RIVERBANK", "RIVERSIDE", "ROCKLIN", "ROHNERT PARK", "ROSAMOND", "ROSEMEAD", "ROSEVILLE", "ROWLAND HEIGHTS", "SACRAMENTO", "SAINT HELENA", "SALINAS", "SAN ANSELMO", "SAN BERNARDINO", "SAN BRUNO", "SAN CARLOS", "SAN CLEMENTE", "SAN DIEGO", "SAN DIMAS", "SAN FERNANDO", "SAN FRANCISCO", "SAN GABRIEL", "SAN JACINTO", "SAN JOSE", "SAN JUAN CAPISTRANO", "SAN LEANDRO", "SAN LORENZO", "SAN LUIS OBISPO", "SAN MARCOS", "SAN MARINO", "SAN MATEO", "SAN PABLO", "SAN PEDRO", "SAN QUENTIN", "SAN RAFAEL", "SAN RAMON", "SAN YSIDRO", "SANGER", "SANTA ANA", "SANTA BARBARA", "SANTA CLARA", "SANTA CLARITA", "SANTA CRUZ", "SANTA FE SPRINGS", "SANTA MARIA", "SANTA MONICA", "SANTA PAULA", "SANTA ROSA", "SANTEE", "SARATOGA", "SAUSALITO", "SCOTTS VALLEY", "SEAL BEACH", "SEASIDE", "SEBASTOPOL", "SELMA", "SHAFTER", "SHASTA LAKE", "SHERMAN OAKS", "SHINGLE SPRINGS", "SIERRA MADRE", "SIGNAL HILL", "SILVERADO", "SIMI VALLEY", "SOLANA BEACH", "SOLEDAD", "SOMES BAR", "SONOMA", "SONORA", "SOUTH EL MONTE", "SOUTH GATE", "SOUTH LAKE TAHOE", "SOUTH PASADENA", "SOUTH SAN FRANCISCO", "SPRING VALLEY", "STANFORD", "STANTON", "STEVENSON RANCH", "STOCKTON", "STUDIO CITY", "SUISUN CITY", "SUN CITY", "SUN VALLEY", "SUNLAND", "SUNNYVALE", "SUNSET BEACH", "SUSANVILLE", "SYLMAR", "TAFT", "TAHOE CITY", "TARZANA", "TEHACHAPI", "TEMECULA", "TEMPLE CITY", "THERMAL", "THOUSAND OAKS", "THOUSAND PALMS", "TOPANGA", "TORRANCE", "TRABUCO CANYON", "TRACY", "TRAVIS AFB", "TRUCKEE", "TUJUNGA", "TULARE", "TURLOCK", "TUSTIN", "TWENTYNINE PALMS", "UKIAH", "UNION CITY", "UNIVERSAL CITY", "UPLAND", "VACAVILLE", "VALENCIA", "VALLEJO", "VALLEY VILLAGE", "VAN NUYS", "VENICE", "VENTURA", "VICTORVILLE", "VILLA PARK", "VISALIA", "VISTA", "WALNUT", "WALNUT CREEK", "WASCO", "WATSONVILLE", "WEST COVINA", "WEST HILLS", "WEST HOLLYWOOD", "WEST SACRAMENTO", "WESTLAKE VILLAGE", "WESTMINSTER", "WHEATLAND", "WHITE WATER", "WHITTIER", "WILDOMAR", "WILLITS", "WILLOWS", "WILMINGTON", "WINCHESTER", "WINDSOR", "WINNETKA", "WINTON", "WOODLAKE", "WOODLAND", "WOODLAND HILLS", "YORBA LINDA", "YOUNTVILLE", "YREKA", "YUBA CITY", "YUCAIPA", "YUCCA VALLEY"];

    headersList = ["CITY", "COUNTY", "LANDAREA", "DENSITY", "EMPDEN", "URBAN", "PDAAREA", "PDAPOP", "CDD", "HDD", "PEOPLE", "WORKERS", "WORKCNT", "HOUSEHOLDS", "HHSIZE", "SIZEOWN", "SIZERENT", "GRAD", "INCOME2013", "INCOME2007", "AGE", "WHITE", "LATINO", "BLACK", "ASIAN", "OTHERACE", "VEHICLES", "CARCOMMUTE", "TIMETOWORK", "OWN", "ROOMS", "GAS", "ELECTRIC", "OIL", "NOFUEL", "OTHERFUEL", "YEARBUILT", "SINGDET", "SQFT", "Children", "Adults", "NumPubTrans", "Public Transit Commuters", "Bus Commuters", "Subway Commuters", "Railroad Commuters"];
    
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
            Range: [-100, 40]
        },
        "EVs": {
            Title: "Electric Vehicle Uptake",
            Range: [0, 50]
        },
        "50MPG": {
            Title: "50 MPG+ Vehicle Fleet Share",
            Range: [-50, 100]
        },
        "LowCarbonElectricity": {
            Title: "Carbon-Free Electricity",
            Range: [0, 100]
        },
        "HeatingElectrificationNew": {
            Title: "Heating Electrification (New Construction)",
            Range: [0, 100]
        },
        "HeatingElectrificationExisting": {
            Title: "Heating Electrification (Existing Buildings)",
            Range: [0, 100]
        },
        "EnergyEfficiencyNew": {
            Title: "Energy Efficiency (New Construction)",
            Range: [0, 75]
        },
        "EnergyEfficiencyExisting": {
            Title: "Energy Efficiency (Existing Buildings)",
            Range: [0, 75]
        },
        "ZeroCarbonFuels": {
            Title: "Zero-Carbon Fuels",
            Range: [-50, 50]
        },
        "AirTravelEfficiency": {
            Title: "Air Travel Efficiency",
            Range: [-10, 50]
        },
        "CommercialEfficiency": {
            Title: "Commercial Efficiency",
            Range: [-25, 75]
        },
        "WasteandWaterEfficiency": {
            Title: "Waste & Water Efficiency",
            Range: [-25, 75]
        },
        "IndustrialEfficiency": {
            Title: "Industrial Efficiency",
            Range: [-25, 75]
        },
        "AgriculturalEfficiency": {
            Title: "Agricultural Efficiency",
            Range: [-25, 75]
        },
        "VMT": {
            Title: "VMT",
            Range: [-50, 25]
        },
        "AirTravel": {
            Title: "Air Travel",
            Range: [-40, 40]
        },
        "EnergyConsumption": {
            Title: "Energy Consumption",
            Range: [-50, 25]
        },
        "GoodsConsumption": {
            Title: "Goods Consumption",
            Range: [-50, 50]
        },
        "FoodConsumption": {
            Title: "Food Consumption",
            Range: [-30, 30]
        },
        "WasteConsumption": {
            Title: "Waste Generation",
            Range: [-50, 25]
        },
        "WaterConsumption": {
            Title: "Water Consumption",
            Range: [-50, 25]
        }
    };
    
    for (each in policies) {
        policies[each].steps = (policies[each].Range[1] - policies[each].Range[0]) / 5;
    }
    
    // Make custom step intervals here:
    policies.Infill.steps = 20;
    policies["50MPG"].steps = 25;
    policies.AirTravelEfficiency.steps = 10;
    policies.CommercialEfficiency.steps = policies.WasteandWaterEfficiency.steps = policies.IndustrialEfficiency.steps = policies.AgriculturalEfficiency.steps = 25;
    

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
    
    cty = 'ACAMPO';
    
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
        policyMultipliers[policiesList[i]] = 0;
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
            
            locale = allCities[cty];
            CITY = locale.CTY;
            COUNTY = locale.COUNTY;
            cty = allCities[cty];
            
            // Creates the policy table and initializes the policy slider settings
            policyTableInit();
            
            // Create chart objects, but don't populate yet
            emissionsChart = new LineChart("emissions");
            
            // Other charts to make:
            // Stacked bar chart: Average HH CO2 footprint, slider bar for year adjustment
            // Stacked bar chart or wedge/area: Citywide emissions
            // Cumulative savings of each policy
            
            //adoptionChart = new LineChart("adoption");
            //bauChart = new LineChart("bau");
            //consumptionChart = new StackedChart("consumption");

            // Generate the chart outline
            emissionsChart.render();
            
            // Load the data
            emissionsChart.load();
            

            //updateText();         
        });
    } else {
        alert("Could not load data!");
    }
});