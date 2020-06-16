
// Make a stacked chart
StackedChart = function StackedChart(chartselect) {
    var i, j, k, len, len2, len3,
        demain = [],
        data,
        focus, lineFunc,
        margin, width, height,
        x, y, z,
        xAxis, yAxis,
        chart, xlegend, ylegend,
        valgroup, rect,
        mapptrix,
        colorList = ["black", "red", "orange", "gold", "#5CBD5C", "#70B7C9", "#007A94", "purple"];
    
    var vktholder = JSON.parse(JSON.stringify(globalVKTbystd, null, 0)),
        vktbystd = JSON.parse(JSON.stringify(globalVKTbystd, null, 0)),
        vehicleesyear = JSON.parse(JSON.stringify(vehiclees, null, 0));
    
    this.render = function () {
        margin = {top: 50, right: 70, bottom: 30, left: 70};
        
        width = 400 - margin.left - margin.right;
        height = 250 - margin.top - margin.bottom;

        x = d3.time.scale()
            .range([0, width]);

        y = d3.scale.linear()
            .range([height, 0]);
        
        z = d3.scale.ordinal()
            /*
             *.range(["#4E3227", "#9B243E", "#D6492A", "#F4AF00", "#6C953C",
             *      "#007A94", "#642566", "#DED5B3"]);
             *.range(["#4E3227", "#9B243E", "#D6492A", "#F4AF00",
             *      "mediumseagreen", "#6C953C", "darkgreen", "steelblue"]);
             *.range(["black", "red", "orange", "yellow", "lightgreen", "green",
             *      "darkgreen", "steelblue"]);
             */
            .range(colorList);
        
        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5);

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5);
        
        chart = d3.select("#" + chartselect)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "chart");
    };
        
    function chartInit() {
        
        x.domain([years[0], years[(years.length - 1)]]);
        
        // Move xAxis to desired location & create it:
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
        
        xlegend = chart.select("." + chartselect + "xlegend");

        //For adding the Y axis
        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        // Add the Y axis legend
        // Same sort of stuff as X axis
            .append("text")
            .attr("class", chartselect + "ylegend")
            .attr("x", 0)
            .attr("y", -40)
            .attr("dy", ".71em")
            .style("text-anchor", "start");
        
        ylegend = chart.select("." + chartselect + "ylegend");
        
        for (standard = 0; standard < standardList.length; standard++) {
            chart.append("g")
            .append("text")
            .attr("class", standardList[standard] + "colorLegend")
            .attr("x", width + 10)
            .attr("y", height - (20 + 15*standard))
            .text(standardList[standard]);
            
            $("." + standardList[standard] + "colorLegend").css({"font-size": "9px"}).css({"fill": colorList[standard]});
            console.log(colorList[standard]);
        }
        
        updateLegend();
    }
    
    function dataInit() {
        len = vehicleList.length; // i = vehicle
        len2 = fuelList.length; // j = fuel
        len3 = regionList.length; // k = region
        
        for (i = 0; i < len; i++) {
            for (j = 0; j < len2; j++) {
                for (k = 0; k < len3; k++) {
                    vktbystd[vehicleList[i]][fuelList[j]][regionList[k]] = ["", "", "", "", "", "", "", ""].map(function (dat, n) {
                        mapptrix = vktholder[vehicleList[i]][fuelList[j]][regionList[k]].map(function (m, q) {
                            return { x: q.toFixed(2), y: m[n] };
                        });
                        return mapptrix;
                    });
                    vktholder[vehicleList[i]][fuelList[j]][regionList[k]] = d3.layout.stack()(vktbystd[vehicleList[i]][fuelList[j]][regionList[k]]);
                    vktbystd[vehicleList[i]][fuelList[j]][regionList[k]] = vktholder[vehicleList[i]][fuelList[j]][regionList[k]];
                }
            }
        }
    }
    
    function dataRecalc() {
        data = vktbystd[vehicle][fuel][region];
        y.domain([0, d3.max(data[data.length - 1], function (d) { return (d.y0 + d.y) * VKTmultiplier; })]);
    }
    
    function barUpdate() {
        chart.selectAll("g.valgroup").remove();
        // Add a group for each column.
        valgroup = chart.selectAll("g.valgroup")
                        .data(data)
                        .enter().append("svg:g")
                        .attr("class", "valgroup")
                        .style("fill", function (d, q) { return z(q); })
                        .style("stroke", function (d, q) { return d3.rgb(z(q)).darker(); });

        // Add a rect for each date.
        rect = valgroup.selectAll("rect");

        rect.data(function (d) { return d; })
                .enter().append("svg:rect")
                .attr("x", function (d) { return x(parseDate("1-Jan-" + (+d.x + 2000).toString())); })
                // Somehow this next part works. Not sure why/how.
                .attr("y", function (d) {
                if (+d.x < 15) {
                    return (y(0) - (y(0) - y(d.y)) - (y(0) - y(d.y0)));
                } else {
                    return (y(0) - (y(0) - y(d.y)) * VKTmultiplier - (y(0) - y(d.y0)) * VKTmultiplier);
                }
            })
                .attr("height", function (d) {
                if (+d.x < 15) {
                    return (y(0) - y(d.y));
                } else {
                    return (y(0) - y(d.y)) * VKTmultiplier;
                }
            })
                .attr("width", (width / 51));
        
        //chart.transition().duration(750).transition().select("rect").attr('g', data);
        //chart.transition().duration(750).transition().call(drawRect);
        chart.transition().duration(750).transition().select(".y.axis").call(yAxis);
    }
    
    function updateLegend() {
        ylegend.text("ASDF");
        xlegend.text("YXCD");
    }
    
    /*
    function updateEuro6() {
        var year, age, yearProduced;
        
        vktholder = JSON.parse(JSON.stringify(globalVKTbystd, null, 0));
        vktbystd = JSON.parse(JSON.stringify(globalVKTbystd, null, 0));
        
        for (year = 0; year < TOTAL_YEARS; year++) {
            vktholder[vehicle][fuel][region][year] = [0, 0, 0, 0, 0, 0, 0, 0];
            for (age = TOTAL_AGE - 1; age >= 0; age--) {
                yearProduced = (year - age) + 2000;
                standard = standardList.length - 1;
                while ((yearProduced < vehicleesyear[vehicle][fuel][region][standard]) || (vehicleesyear[vehicle][fuel][region][standard] === 0)) {
                    standard--;
                }
                vktholder[vehicle][fuel][region][year][standard] += globalVKT[vehicle][fuel][region][year] * globalVKTpctbyage[vehicle][region][age];
            }
        }
    }
    */
    
    this.save = function() {
        return data;
    }
    
    this.load = function () {
        dataInit();
        dataRecalc();
        chartInit();
        barUpdate();
        updateLegend();
    };
    
    this.chartChange = function () {
        dataInit();
        dataRecalc();
        barUpdate();
        updateLegend();
    };
};

