'use strict';

// fetches the data from the api and distributes it to the formatting functions
const getConfirmedCasesDataObj = (confirmedCases, deathCases) => {
    const formatDateString = (date) =>  date.split("T").splice(0, 1).toString() // returns a date string in the following format - "2020-04-26"
    const confirmedCasesReversed = confirmedCases.reverse()
    const deathCasesReversed = deathCases.reverse()
    // declaring the data object, which will provide data for charts later on 
    let dataObject = {confirmedCasesByDistricts: {}, confirmedCasesByDate: {}, deathCasesByDate: {}, deathCasesByArea: {}}
    // making data object default values be equal to zero in order to increment them later on 
    confirmedCasesReversed
                .map(confirmedCase => formatDateString(confirmedCase.date))
                .forEach(date => { dataObject["confirmedCasesByDate"][date] =  0 })
    dataObject["deathCasesByDate"] = {...dataObject["confirmedCasesByDate"]}
    confirmedCases
                .map(confirmedCase => confirmedCase.healthCareDistrict)
                .forEach(district => { dataObject["confirmedCasesByDistricts"][district] =  0 })
    deathCases
            .map(deathCase => deathCase.area)
            .forEach(area => { dataObject["deathCasesByArea"][area] =  0 })
    confirmedCasesReversed.forEach((confirmedCase, _) => {
        const formattedConfirmedCaseDate = formatDateString(confirmedCase.date)
        if (formattedConfirmedCaseDate) { // if string is not null
            // incrementing data object depending on confirmed cases on that particular date
            dataObject["confirmedCasesByDate"][formattedConfirmedCaseDate] += 1
        }
        // incrementing data object depending on a health care district where the confirmed case was determined
        dataObject["confirmedCasesByDistricts"][confirmedCase.healthCareDistrict] += 1
    })
    deathCasesReversed.forEach((deathCase, _) => {
        const formattedDeathCaseDate = formatDateString(deathCase.date)
        if (formattedDeathCaseDate && typeof dataObject["deathCasesByDate"][formattedDeathCaseDate] !== "undefined") {
            dataObject["deathCasesByDate"][formattedDeathCaseDate] += 1
        }
        // incrementing data object depending on a health care district where the death case occured
        dataObject["deathCasesByArea"][deathCase.area] += 1
    })
    return dataObject
}

// fetches the data from the api and distributes it to the formatting functions
async function getDataObj () {
    try {
        const response = await fetch('https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/finnishCoronaData/v2');
        if (!response.ok) throw new Error('jokin meni pieleen');
        const formattedResponse = await response.json();
        const confirmedCases = formattedResponse.confirmed
        const deathCases = formattedResponse.deaths
        const dataObject = getConfirmedCasesDataObj(confirmedCases, deathCases)
        return dataObject
    } catch (error) {
        console.log(error)
    }
}

// returns all confirmed cases in progression
const getTotalCases = (dataObj) => {
    const cumulativeSum = (sum => value => sum += value)(0);
    return Object.values(dataObj["confirmedCasesByDate"]).reverse().map(cumulativeSum)
}

// returns all death cases in progression
const getTotalDeaths = (dataObj) => {
    const cumulativeSum = (sum => value => sum += value)(0);
    return Object.values(dataObj["deathCasesByDate"]).reverse().map(cumulativeSum)
}

// contexts of the chart pointing element
const confirmedCasesByDateLineChartCtx = document.querySelector('#confirmedCasesByDateLineChart').getContext('2d');
const confirmedCasesByDistrictBarChartCtx = document.querySelector('#confirmedCasesByDistrictBarChart').getContext('2d');

const deathCasesByDateLineChartCtx = document.querySelector('#deathCasesByDateLineChart').getContext('2d');
const deathCasesByDistrictDoughnutChartCtx = document.querySelector('#deathCasesByDistrictDoughnutChart').getContext('2d');

const cumulativeLineChartCtx = document.querySelector('#cumulativeLineChart').getContext('2d');
const deathCasesCumulativeLineChartCtx = document.querySelector('#deathCasesCumulativeLineChart').getContext('2d');

const caseChartOptions = {
    scales: {
        yAxes: [{
            scaleLabel: {
                display: true,
                labelString: "Vahvistetut tapaukset"
            }
        }]
    }
}

const deathChartOptions = {
    scales: {
        yAxes: [{
            scaleLabel: {
                display: true,
                labelString: "Vahvistetut kuolemat"
            }
        }]
    }
}

// colors required to highlight the bar chart values
const confirmedCasesByDistrictBarColors = ["#10316b", "#000000", "#e25822", "#ececeb", "#f6f578", "#f6d743", "#649d66", "#06623b", "#10316b", "#000000", "#e25822", "#ececeb", "#f6f578", "#f6d743", "#649d66", "#06623b", "#10316b", "#000000", "#e25822", "#ececeb", "#f6f578", "#f6d743"]

const deathCasesByDistrictColors = ["#10316b", "#000000", "#e25822", "#ececeb", "#363636"]


const drawCharts = (dataObj) => {
    // initiation of chart objects that are responsible for chart illustrations
    new Chart(confirmedCasesByDateLineChartCtx, {
        type: 'line', // definition of the type (bar, line, doughnut etc.)
        data: {
            labels: Object.keys(dataObj["confirmedCasesByDate"]).reverse(), // x-axis values
            datasets: [{
                label: 'Vahvistetut tapaukset t??n?? p??iv??n??', 
                fill: false,
                data: Object.values(dataObj["confirmedCasesByDate"]).reverse(), // y-axis values
                // styles
                borderColor: "#10316b",
                borderWidth: 1
            }]
        },
        options: caseChartOptions
    })
    new Chart(confirmedCasesByDistrictBarChartCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(dataObj["confirmedCasesByDistricts"]),
            datasets: [{
                label: 'Vahvistetut tapaukset t??ss?? sairaanhoitopiiriss??',
                fill: false,
                point: {
                    radius: 0
                },
                data: Object.values(dataObj["confirmedCasesByDistricts"]),
                backgroundColor: confirmedCasesByDistrictBarColors,
                borderColor: confirmedCasesByDistrictBarColors,
                borderWidth: 1
            }]
        },
        options: caseChartOptions
    })
    new Chart(deathCasesByDateLineChartCtx, {
        type: 'line',
        data: {
            labels: Object.keys(dataObj["deathCasesByDate"]).reverse(),
            datasets: [{
                label: 'Vahvistetut kuolemat t??n?? p??iv??n??',
                fill: false,
                data: Object.values(dataObj["deathCasesByDate"]).reverse(),
                borderColor: "#222",
                borderWidth: 1
            }]
        },
        options: deathChartOptions
    })
    new Chart(deathCasesByDistrictDoughnutChartCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataObj["deathCasesByArea"]),
            datasets: [{
                label: 'Vahvistetut kuolemat t??ss?? sairaanhoitopiiriss??',
                fill: false,
                data: Object.values(dataObj["deathCasesByArea"]),
                backgroundColor: deathCasesByDistrictColors,
                borderColor: deathCasesByDistrictColors,
                borderWidth: 1
            }]
        }
    }),
    new Chart(cumulativeLineChartCtx, {
        type: 'line',
        data: {
            labels: Object.keys(dataObj["confirmedCasesByDate"]).reverse(),
            datasets: [{
                label: 'Vahvistetut tapaukset yhteens?? Suomessa',
                fill: false,
                data: getTotalCases(dataObj),
                borderColor: "#e25822",
                borderWidth: 1
            }]
        },
        options: caseChartOptions
    }),
    new Chart(deathCasesCumulativeLineChartCtx, {
        type: 'line',
        data: {
            labels: Object.keys(dataObj["deathCasesByDate"]).reverse(),
            datasets: [{
                label: 'Vahvistetut kuolemat yhteens?? Suomessa',
                fill: false,
                data: getTotalDeaths(dataObj),
                borderColor: "#222",
                borderWidth: 1
            }]
        },
        options: deathChartOptions
    })
}

(async () => {
    // awaiting for the function to obtain the latest data and passing it to the chart drawing function
    const dataSource = await getDataObj();
    drawCharts(dataSource);
})();