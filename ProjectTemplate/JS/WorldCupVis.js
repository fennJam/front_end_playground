    
function drawDashBoard() {
	
	
		var format = d3.time.format("%d-%m-%Y (%H:%M h)");
	
		d3.tsv("world_cup.tsv", drawDimplePlot);  
		d3.tsv("world_cup_geo.tsv", function(d) {
        d['attendance'] = +d["attendance"];
        d['date'] = format.parse(d['date']);
			return d;}, drawSimpleScatterPlot);
	
		d3.json("world_countries.json", drawAnimnatedMap);
	}
	
	function drawAnimnatedMap(geo_data) {
        "use strict";
        var margin = 75,
            width = 1400 - margin,
            height = 600 - margin;

			
		var title = d3.select("body")
            .append("h2")
            .text("World Cup")
			
        var svg = d3.select("body")
            .append("svg")
            .attr("width", width + margin)
            .attr("height", height + margin)
            .append('g')
            .attr('class', 'map');

		//get projection function for mercator
		var merc_projection = d3.geo.mercator()
									.scale(150)//zoom 
									.translate([width/1.5,height/1.25]);//centre

        var path = d3.geo.path().projection(merc_projection);

        var map = svg.selectAll('path')
                     .data(geo_data.features)
                     .enter()
                     .append('path')
                     .attr('d', path)
                     .style('fill', 'lightBlue')
                     .style('stroke', 'black')
                     .style('stroke-width', 0.5);

       	function plot_world_cups(data){
		
		//function to get summary statistics (attendance + location) from subset
		function data_by_year(leaves){
								//sum up attendances
								var total = d3.sum(leaves, function(d) {
									return d['attendance'];
									});
								// convert each lat and long into pixel values
								var pixel_coords = leaves.map( function(d) {
									return merc_projection([+d.long, +d.lat]);
									});

								// get average lat pixel value
								var avg_x = d3.mean(pixel_coords, function(d) {
									return d[0];
									});
											
								// get average long pixel value
								var avg_y = d3.mean(pixel_coords, function(d) {
									return d[1];
									});
									
								var teams = d3.set()
								
								leaves.forEach(function(d){
									teams.add(d['team1']);
									teams.add(d['team2']);
								});

								return {//return values for the rollup function
										//aggregates for avg pixel location, total attendance
										//and all participating teams
										'attendance' : total,
										'x' : 	avg_x,
										'y' : 	avg_y,
										'teams': teams.values()
										};
								}
		
		
	//https://github.com/d3/d3-collection#nests && http://bl.ocks.org/phoebebright/raw/3176159/
		var aggregated_data = d3.nest()
			//grouping to subset the data
							.key(function(d){
								//group all worldcup matches by year
								return d['date'].getUTCFullYear();
								})
				//use data_by_year to roll up data from subset subset	
							.rollup(data_by_year)
							//pass all data through functions
							.entries(data);
		
		debugger;
		
		var attendance_extent = d3.extent(aggregated_data,function(d){
			return d.values['attendance'];
			});
			
		var radius_scale = d3.scale.sqrt()
							.domain(attendance_extent)
							.range([0,12]);
		
		//.data binds data to the map 
		//The second argument of databind 
		//takes a "key function" to control 
		//which datum is assigned to which 
		//element by coincidence the key element 
		//in our aggregated data, year in string format, 
		//happens to be very appropriate for us			
		function key_func(d){
					return d['key'];
			}		
		
		svg.append('g')
			.attr("class", "circle")
			.selectAll("circle")		
			.data(aggregated_data, key_func)
			.enter()
			.append("circle")
			.attr('cx',function(d){return d.values['x'];})
			.attr('cy',function(d){return d.values['y'];})
			.attr('r',function(d){return radius_scale(d.values['attendance']);})
			.attr('fill', "orange").attr('stroke', "black").attr('stroke-width', 1.5).attr('opacity', 0.7);

        
		function refresh(year){
		//Filter data for given year – filter()
			var filtered_agg_data =aggregated_data.filter(function(d){
					return new Date(d['key']).getUTCFullYear() === year;
			});

		//update year
		title.text("WorldCup"+year);
		
		//select all elements on the page
		//rebind our filtered aggregated data 
		//use the same key function to identify the joins
			var circles = svg.selectAll('circle')
								.data(filtered_agg_data,key_func);	
	
		//Remove visual elements that don’t belong - exit()
				circles.exit().remove();
		
		//Add elements that are required – enter()
		//styling is performed in the CSS header
				circles.enter()
					.append("circle")
					.transition()
					.duration(500)
					.attr('cx',function(d){return d.values['x'];})
					.attr('cy',function(d){return d.values['y'];})
					.attr('r',function(d){return radius_scale(d.values['attendance']);})
					.attr('fill', "orange").attr('stroke', "black").attr('stroke-width', 1.5).attr('opacity', 0.7);

		//Output the visuals for the countries participating in the year
			var countries = filtered_agg_data[0].values['teams'];
			
			svg.selectAll('path')
				.transition()
				.duration(500)
				.style('fill', function(d){
					if(countries.indexOf(d.properties.name)!==-1){
							return "lightBlue";
						}else{
							return "white";
						}
						});
		debugger;
		}
		
		
		//build code to iterate through the years we want to display
		
		var years = [];
		
		for (var i=1930;i<2015; i+=4){
			if (i!== 1942 && i!= 1946){
				years.push(i);
			}
		}
		
		//setTimeOut executes a function after a set delay
		//setInterval() repeatadly executes a function after a set delay
		var year_index = 0;
		
		var refresh_Interval = setInterval(function(){
			refresh(years[year_index]);
			year_index++;
			
			if(year_index>= years.length){
				clearInterval(refresh_Interval);
				
				var buttons = d3.select("body")
                        .append("div")
                        .attr("class", "years_buttons")
                        .selectAll("div")
                        .data(years)
                        .enter()
                        .append("div")
                        .text(function(d) {
                            return d;
                        });

                buttons.on("click", function(d) {
                    d3.select(".years_buttons")
                      .selectAll("div")
                      .transition()
                      .duration(500)
                      .style("color", "black")
                      .style("background", "white");

                    d3.select(this)
                      .transition()
                      .duration(500)
                      .style("background", "lightBlue")
                      .style("color", "black");
                    refresh(d);
                });
			}
			},1000);
		
        };

		
        var format = d3.time.format("%d-%m-%Y (%H:%M h)");

        d3.tsv("world_cup_geo.tsv", function(d) {
          d['attendance'] = +d['attendance'];
          d['date'] = format.parse(d['date']);
          return d;
        }, plot_world_cups);
    };
	
	
	
	function drawDimplePlot(data) {
      
      /*
        D3.js setup code
      */

          "use strict";
          var margin = 75,
              width = 1400 - margin,
              height = 600 - margin;

          var svg = d3.select("body")
            .append("svg")
              .attr("width", width + margin)
              .attr("height", height + margin)
            .append('g')
                .attr('class','chart');

      /*
        Dimple.js Chart construction code
      */

          var myChart = new dimple.chart(svg, data);
          var x = myChart.addTimeAxis("x", "year"); 
          myChart.addMeasureAxis("y", "attendance");
          x.dateParseFormat = "%Y";
          x.tickFormat = "%Y";
          x.timeInterval = 4;
          myChart.addSeries(null, dimple.plot.line);
          myChart.addSeries(null, dimple.plot.scatter);
          myChart.draw();
              
        };


      function drawSimpleScatterPlot(data) {

          /*
          D3.js setup code
          */

          "use strict";
          var margin = 75,
              width = 1400 - margin,
              height = 600 - margin;

          var radius = 3,
              multiplier = 2;

          d3.select("body")
              .append("h2")
              .text("World Cup Attendance");

          var svg = d3.select("body")
              .append("svg")
              .attr("width", width + margin)
              .attr("height", height + margin)
              .append('g')
              .attr('class', 'chart');



          d3.select('svg')
              .selectAll("circle")
              .data(data)
              .enter()
              .append("circle")

          var time_extent = d3.extent(data, function(d) {
              return d['date'];
          });

          var time_scale = d3.time.scale()
              .range([margin, width])
              .domain(time_extent);

          var attendance_extent = d3.extent(data, function(d) {
              return d['attendance'];
          });

          var attendance_scale = d3.scale.linear()
              .range([height, margin])
              .domain(attendance_extent);

          var time_axis = d3.svg.axis()
              .scale(time_scale)
              .ticks(d3.time.years, 2);

          d3.select("svg")
              .append('g')
              .attr('class', 'x axis')
              .attr('transform', "translate(0," + height + ")")
              .call(time_axis);

          var attendance_axis = d3.svg.axis()
              .scale(attendance_scale)
              .orient("left");

          d3.select("svg")
              .append('g')
              .attr('class', 'y axis')
              .attr('transform', "translate(" + margin + ",0)")
              .call(attendance_axis);

          d3.selectAll('circle')
              .attr('cx', function(d) {
                  return time_scale(d['date']);
              })
              .attr('cy', function(d) {
                  return attendance_scale(d['attendance']);
              })
              .attr('r', function(d) {
                  if (d['home'] === d['team1'] || d['home'] === d['team2']) {
                      return radius * multiplier;
                  } else {
                      return radius;
                  }
              })
              .attr('fill', function(d) {
                  if (d['home'] === d['team1'] || d['home'] === d['team2']) {
                      return 'red'
                  } else {
                      return 'blue';
                  }
              });

// Add an inner svg which will hold the legend graphics
//attr("transform", "translate(" + (width - 100) + "," + 20 + ")")
//sets the position of the top right corner of the svg at 100px from left and 20 from the top
//We add two "data elements" that we will use to populate the legend
          var legend = svg.append("g")
              .attr("class", "legend")
              .attr("transform", "translate(" + (width - 100) + "," + 20 + ")")
              .selectAll("g")
              .data(["Home Team", "Others"])
              .enter().append("g");

          legend.append("circle")
              .attr("cy", function(d, i) {
                  return i * 30;
              })
              .attr("r", function(d) {
                  if (d == "Home Team") {
                      return radius * multiplier;
                  } else {
                      return radius;
                  }
              })
              .attr("fill", function(d) {
                  if (d == "Home Team") {
                      return 'red';
                  } else {
                      return 'blue';
                  }
              });

          legend.append("text")
              .attr("y", function(d, i) {
                  return i * 30 + 5;
              })
              .attr("x", radius * 5)
              .text(function(d) {
                  return d;
              });
			  
      };