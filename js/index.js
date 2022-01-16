const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);
        
let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;


const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xLine = d3.scaleLinear().range([margin*2, width-margin]);
const yLine = d3.scaleLinear().range([height-margin, margin]);

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

 
loadData().then(data => {
    colorScale.domain(d3.set(data.map(d=>d.region)).values());
    
    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });
	
	d3.select('#lcparam').on('change', function(){
        lineParam = d3.select(this).property('value');
        updateLineChart();
    });

    function updateBar(){
        const barData = d3.nest()
            .key(d => d.region)
            .rollup(leaves => {
                return d3.mean(leaves.map(d=> Number(d[param][year])))
            })
            .entries(data);
        console.log(barData);
        
        xBar.domain(barData.map(d => d.key));
        yBar.domain(d3.extent(barData.map(d => d.value)));
        const selection = barChart.selectAll('rect').data(barData);

        const bars = selection.enter().append('rect');

        selection.merge(bars)
            .attr('x', d => xBar(d.key))
            .attr('y', d => yBar(d.value)-30)
            .attr('fill', d => colorScale(d.key))
            .attr('height', d => height - yBar(d.value))
            .attr('width', 100)
			.attr('region', d => d.key);
        
		xBarAxis.call(d3.axisBottom(xBar));
        yBarAxis.call(d3.axisLeft(yBar));
		
		//Выбранная колонка
        bars.on('click', function() {
            СlickedColumn = d3.select(this);
            highlighted = СlickedColumn.attr('region');
            bars.attr('fill-opacity', 0.35);
            СlickedColumn.attr('fill-opacity', 1);
            updateScatterPlot();
        });
        bars.on('dblclick', function() {
            highlighted = "";
            updateScatterPlot();
            bars.attr('fill-opacity', 1);
        });
	}

    function updateScatterPlot(){
        const xValues = data.map(d => Number(d[xParam][year])); // массив
        const xDomain = d3.extent(xValues); // [min, max]
        x.domain(xDomain); // [min, max] по xParam

        const yValues = data.map(d => Number(d[yParam][year])); // массив
        const yDomain = d3.extent(yValues); // [min, max]
        y.domain(yDomain); // [min, max] по xParam

        const rValues = data.map(d => Number(d[rParam][year])); // массив
        const rDomain = d3.extent(rValues); // [min, max]
        radiusScale.domain(rDomain);
		
        const selection = scatterPlot.selectAll('circle').data(data); 
            
        const circles = selection.enter()
                .append('circle'); /*создаем элементы*/

        //Обновление выбранного участка
        circles.on('click', function() {
            circles.attr('stroke-width', 'none');
            selected = d3.select(this);
            updateLineChart();
        });
        circles.on('dblclick', function() {
            circles.attr('stroke-width', 'none');
            selected = null;
            updateLineChart();
        });
		
		CountryFlag = null
        if (selected)
            CountryFlag = selected.attr('country');
		
        selection.merge(circles)
                .attr('r', d => radiusScale(d[rParam][year]))
                .attr('cx', d => x(Number(d[xParam][year])))
                .attr('cy', d => y(Number(d[yParam][year])))
                .attr('fill', d => colorScale(d.region))
				.attr('stroke-width', 'none')
                .attr('display', null)
                .attr('region', d => d.region)
                .attr('country', d => d.country);
				
		if (CountryFlag) {
            selected = scatterPlot.selectAll('circle[country="'+CountryFlag+'"]');
            selected.moveToFront();
            selected.attr('stroke-width', 3);
        }
        if (highlighted) {
            selection.attr('display', "none")
            highlightedCurcls = scatterPlot.selectAll('circle[region="'+highlighted+'"]');
            highlightedCurcls.moveToFront();
            highlightedCurcls.attr('display', null);
        }

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));
    }

    function updateLineChart() {
		if (!selected) {
			d3.select('#line-selector').style('display', "none")
            lineChart.style('display', "none")
            countryName.html('');
            return;
        }
        selected.moveToFront();
        selected.attr('stroke-width', 3);
        const country = selected.attr('country');

        countryName.html(country);
        d3.select('#line-selector').style('display', null)
        lineChart.style('display', null)

        const countryData = data.find(d => d.country == country)

       
		
        lineData = [];
        Object.entries(countryData[lineParam]).forEach(([key, value]) => {
            if(!isNaN(Number(key)) && Number(key) > 0)
                lineData.push({
                    year: Number(key),
                    value: Number(value)
                });
         });

        const xYears = lineData.map(d => d.year);
        const xDomain = d3.extent(xYears);
        xLine.domain(xDomain);

        const yValues = lineData.map(d => d.value);
        const yDomain = d3.extent(yValues);
        yLine.domain(yDomain);

        selection = lineChart.selectAll('path.lineChart').data([lineData]);
        selection.enter().append('path')
            .attr("d", d3.line()
                .x(d => xLine(d.year))
                .y(d => yLine(d.value))
                .curve(d3.curveLinear)(lineData))
            .attr("stroke", "rgb(11, 66, 170)")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("class", "lineChart");
        selection.transition()
            .duration(400)
            .attr("d", d3.line()
                .x(d => xLine(d.year))
                .y(d => yLine(d.value))
                .curve(d3.curveLinear)(lineData));
        selection.exit().remove();

        xLineAxis.call(d3.axisBottom(xLine).tickFormat(d3.format("d")));
        yLineAxis.call(d3.axisLeft(yLine));
    }
    
	updateBar();
    updateScatterPlot();
});

d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  
async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}
