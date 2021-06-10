// ECharts
var warenKatChart;
var specChart;
var ongoingEventChart;
var bestSellingChart;
var geringerWarenbestandChart;
var warenEingangChart;
var warenAusgangChart;
// Sonstiges
var stock;
var categories;
var categoryInfos;
var grid;
var events;
var allCategories;
var soldCategories = [];
// EChart Configuration
var theme = '';	// Design: "", "vintage", "dark"
var render = 'svg';	// Render Technology: "svg", "canvas"

function GenerateGrid() {	// Initializes the Dashboard
	grid = new Muuri('.grid', {
		dragEnabled: true,
		dragSort: true,
		layoutOnResize: true,
		layoutOnInit: true,
		layoutDuration: 200,
		layout: {
			fillGaps: true,
			horizontal: false,
			alignRight: false,
			alignBottom: false,
			rounding: true
		},
		dragStartPredicate: {
			distance: 100,
			delay: 0
		}
	});
}
async function RenderAllCharts() {	// Renders all ECharts in Dashboard
	await UpdateData();
	if (Api.isAllowed("StockView")) {
		await RenderWarenkategorieChart();
		await RenderGeringerWarenbestandChart();
	} else {
		$("#boxCategory").remove();
		$("#boxSpecs").remove();
		$("#boxBestSelling").remove();
		$("#boxLowStock").remove();
		$("#boxStockInYears").remove();
	}
	if(Api.isAllowed("StockViewHistory")) {
		await RenderBestCharts(2021);
	}
	if (Api.isAllowed("EventView")) {
		if (Api.isAllowed("StockView")) {
			await RenderFinishedEventChart();
		}
		await RenderFinishedEventTable();
	} else {
		$("#boxOngoingEvents").remove();
		$("#boxFinishedEvents").remove();
		$("#boxStockSoldYears").remove();
	}
}
// Render Charts
async function RenderWarenkategorieChart() {	// Category Pie-Chart
	warenKatChart = echarts.init(document.getElementById("chart1"), theme, {
		renderer: render
	});
	let data = [];
	for (let i = 0; i < categoryInfos.length; i++) {
		let good = categoryInfos[i];
		data[i] = {
			name: good.name,
			value: 0
		};
		let total = 0;
		for (let j = 0; j < stock.length; j++) {
			if (GetCategoryByGoodInfo(stock[j].good.goodInfo).name == data[i].name) {
				data[i].value += RoundNumber2(stock[j].good.weight);
			}
		}
	}

	warenKatChart.setOption({
		series: [{
			name: 'Show Categories',
			type: 'pie',
			stack: 'chart',
			radius: '70%',
			data: data,
			emphasis: {
				itemStyle: {
					shadowBlur: 20,
					shadowColor: '#444'
				}
			}
		}],
		tooltip: {
			trigger: 'item',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params.name + "</b><br>";
				text += '<span style="color:' + params.color + '" class="material-icons circle">circle</span> ' + "Gesamt" + "<span style='float:right;margin-left:15px;font-weight:bold'>" + RoundNumber2(params.value) + " Kg</span> ";
				return text;
			}
		},
	});
	warenKatChart.on('click', function(params) {
		RenderSpecificationChart(params.data.name, params.percent, params.value);
	});
}
async function RenderFinishedEventChart() {	// Finished Events Bar-Chart
	ongoingEventChart = echarts.init(document.getElementById("chart4"), theme, {
		renderer: render
	});
	events = await Api.fetchSimple("api/events/movement", 50);

	// 1 => Wieviel zurück
	// 2 => Wieviel noch im Event (Verkauf)
	let data = [{
			name: "Nicht verkauft",
			type: 'bar',
			stack: 'total',
			focus: 'series',
			data: []
		},
		{
			name: "Verkauft",
			type: 'bar',
			stack: 'total',
			focus: 'series',
			data: []
		}
	];
	let yAxis = [];
	let count = 0;
	for (let i = 0; i < events.length; i++) {
		if (events[i].event.completed) {
			//let move = await Api.fetchSimple("api/event/movement", events[i].id);
			let move = events[i].movement;
			let moveIn = 0;
			let moveReturn = 0;
			for (let i = 0; i < move.length; i++) {
				moveIn += move[i].outgoingSum;
				moveReturn += move[i].returningSum;
			}
			data[0].data[count] = RoundNumber2(moveReturn);
			data[1].data[count] = RoundNumber2(moveIn - moveReturn);

			yAxis[count] = events[i].event.eventname;
			for(let i = 0; i < soldCategories.length; i++) {
				//if()
			}
			//soldCategories[count] = { name : yAxis[count], sold : Math.round((moveIn - moveReturn) * 100) / 100};
			count++;
		}
	}

	ongoingEventChart.setOption({
		series: data,
		tooltip: {
			trigger: 'axis',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params[0].axisValue + "</b><br>";
				text += '<span style="color:' + params[0].color + '" class="material-icons circle">circle</span> ' + params[0].seriesName + "<span style='float:right;margin-left:15px;font-weight:bold'>" + params[0].value + " Kg</span> ";
				text += "<br>";
				text += '<span style="color:' + params[1].color + '" class="material-icons circle">circle</span> ' + params[1].seriesName + "<span style='float:right;margin-left:15px;font-weight:bold'>" + params[1].value + " Kg</span> ";
				return text;
			}
		},
		legend: {
			data: ['Nicht verkauft', 'Verkauft']
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'value',
		},
		yAxis: {
			type: 'category',
			data: yAxis
		},
	});
	ongoingEventChart.on('click', function(params) {
		//console.log(params);
		//return "";
		//window.location.href = Api.apiServerAdress + "/events/eventOverview.html?id=60b64815a36c6de3218c9140";
	});
}
async function RenderFinishedEventTable() {	// Finished Events Table
	let events = await GetEvents();
	let el = $("#chart3");
	let html = "<table class='chartTable'>";
	html += "<thead><tr><th>Datum<th>Event</tr></thead>";

	for (let i = events.length - 1; i > 0 && i > events.length - 50; i--) {
		if (events[i].completed == false) {
			let loc = moment(events[i].date);
			let c = "";
			if (i % 2) c = "stripe";
			loc.locale("de");
			html += '<tr class="' + c + '">';
			html += '<td>' + loc.format("D.M.YYYY");
			html += '<td class="chartTableHyphen">' + events[i].eventname;
			if (moment().diff(loc) < 0) {
				html += '<span class="material-icons" title="Startet erst in Zukunft.">event</span>';
			}
			html += '</tr>';
		}
	}
	html += "</table>";
	el.html(html);
}
async function RenderBestSellingChart(year) {
	bestSellingChart = echarts.init(document.getElementById("chart5"), theme, {
		renderer: render
	});
	let bestStock = await Api.fetchSimple("api/stock/bestselling", { from:new Date(year, 0), to:new Date(year, 11, 31)});
	let data = [{
			name: "Kategorie",
			type: 'bar',
			stack: 'total',
			focus: 'series',
			data: [],
			showBackground: true,
        backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
        }
		},
	];
	let xAxis = [];

	for(let i = 0; i < bestStock.length; i++) {
		data[0].data[i] = bestStock[i].weight;
		xAxis[i] = GetSpecificationById(bestStock[i].goodInfo).specification;
	}

	bestSellingChart.setOption({
		series: data,
		tooltip: {
			trigger: 'axis',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params[0].axisValue + "</b><br>";
				text += '<span style="color:' + params[0].color + '" class="material-icons circle">circle</span> ' + params[0].seriesName + "<span style='float:right;margin-left:15px;font-weight:bold'>" + params[0].value + " Kg</span> ";
				return text;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		yAxis: {
			type: 'value',
		},
		xAxis: {
			type: 'category',
			data: xAxis
		},
	});
}
async function RenderBestCharts(year) {
	let historyStock = await Api.fetchSimple("api/stock/history", { from:new Date(year, 0), to:new Date(year, 11, 31)});
	let historyStock2 = Array.from(historyStock);
	RenderWarenEingangChart(year, historyStock);
	RenderWarenAusgangChart(year, historyStock2);
	await RenderBestSellingChart(year);
}
async function RenderWarenEingangChart(year, histStock) {
	$("#warenEingangBox").find("h1").html("Waren Eingekauft <br>" + year + " - " + (year+1));
	warenEingangChart = echarts.init(document.getElementById("chart7"), theme, {
		renderer: render
	});
	if(histStock == null) {
		histStock = await Api.fetchSimple("api/stock/history", { from:new Date(year, 0), to:new Date(year, 11, 31)});
	}
	let newStock = [];
	for(let i = 0; i < histStock.length; i++) {
		if(!histStock[i].incoming) {
			newStock.push(histStock[i]);
		}
	}

	let data = [{
			name: "Eingekauft in " + year,
			type: 'bar',
			stack: 'total',
			focus: 'series',
			itemStyle: {
				color:"#f2c750"
			},
			data: []
		},
	];
	let yAxis = [];

	for(let i = 0; i < newStock.length; i++) {
		let name = GetCategoryByGoodInfo(newStock[i].good.goodInfo).name;
		if(yAxis.includes(name)) {
			data[0].data[yAxis.indexOf(name)] += newStock[i].good.weight;
		} else {
			yAxis.push(name);
			data[0].data[yAxis.indexOf(name)] = newStock[i].good.weight;
		}
	}

	warenEingangChart.setOption({
		series: data,
		tooltip: {
			trigger: 'axis',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params[0].axisValue + "</b><br>";
				text += '<span style="color:' + params[0].color + '" class="material-icons circle">circle</span> ' + params[0].seriesName + "<span style='float:right;margin-left:15px;font-weight:bold'>" + params[0].value + " Kg</span> ";
				return text;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'value',
		},
		yAxis: {
			type: 'category',
			data: yAxis
		},
	});
}
async function RenderWarenAusgangChart(year, histStock) {
	$("#warenAusgangBox").find("h1").html("Waren Verkauft <br>" + year + " - " + (year+1));
	warenAusgangChart = echarts.init(document.getElementById("chart8"), theme, {
		renderer: render
	});
	if(histStock == null) {
		histStock = await Api.fetchSimple("api/stock/history", { from:new Date(year, 0), to:new Date(year, 11, 31)});
	}

	let newStock = [];
	for(let i = 0; i < histStock.length; i++) {
		if(histStock[i].incoming) {
			newStock.push(histStock[i]);
		}
	}

	let data = [{
			name: "Verkauft in " + year,
			type: 'bar',
			stack: 'total',
			focus: 'series',
			itemStyle: {
				color:"#83c744",
			},
			data: []
		},
	];
	let yAxis = [];

	for(let i = 0; i < newStock.length; i++) {
		let name = GetCategoryByGoodInfo(newStock[i].good.goodInfo).name;
		if(yAxis.includes(name)) {
			data[0].data[yAxis.indexOf(name)] += newStock[i].good.weight;
		} else {
			yAxis.push(name);
			data[0].data[yAxis.indexOf(name)] = newStock[i].good.weight;
		}
	}

	warenAusgangChart.setOption({
		series: data,
		tooltip: {
			trigger: 'axis',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params[0].axisValue + "</b><br>";
				text += '<span style="color:' + params[0].color + '" class="material-icons circle">circle</span> ' + params[0].seriesName + "<span style='float:right;margin-left:15px;font-weight:bold'>" + params[0].value + " Kg</span> ";
				return text;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'value',
		},
		yAxis: {
			type: 'category',
			data: yAxis
		},
	});
}
async function RenderGeringerWarenbestandChart() {
	geringerWarenbestandChart = echarts.init(document.getElementById("chart6"), theme, {
		renderer: render
	});
	let lowStock = await Api.fetchSimple("api/stock/low");
	let el = $("#chart6");
	let html = "<table class='chartTable'>";
	html += "<thead><tr><th>Kategorie<th>Gelagert<th>Minimum</tr></thead>";
	html += "<tbody>";

	for(let i = 0; i < lowStock.length; i++) {
		let cat = GetSpecificationById(lowStock[i].good.goodInfo);
		html += "<tr>";
		html += "<td>" + cat.specification + "</td>";
		html += "<td><span style='color:red;font-weight:bold'>" + lowStock[i].good.weight + " Kg</span></td>";
		html += "<td>" + cat.minWeight + " Kg</td>";
		html += "</tr>";
	}
	html += "</tbody></table>";
	el.html(html);
}
async function UpdateData() {	// Refresh Data
	if (Api.isAllowed("StockView")) {
		stock = await GetStockList();
	}

	allCategories = await Api.fetchSimple("api/goodinfos");
	categories = await GetCategories();
	categoryInfos = [];

	for (let i = 0; i < categories.length; i++) {
		categoryInfos[i] = {
			name: categories[i],
			specs: [],
			count: 0
		};
		let specs = await GetSpecsByCategory2(categories[i]);
		categoryInfos[i].count = specs.length;
		categoryInfos[i].specs = specs;
	}
}
function RenderSpecificationChart(category, percent, kg) {	// Specification Pie-Chart
	// Doesn't need to fetch new data, since it uses the data from the "Category Pie-Chart"
	$("#chart2").find("h1").remove();
	$("#boxSpecs").find(".graphTitle").html(category);
	specChart = echarts.init(document.getElementById("chart2"), theme, {
		renderer: render
	});
	kg = Math.round(kg * 100) / 100;
	let data = [];
	let cat = GetCategoryByName(category);

	for (let i = 0; i < cat.count; i++) {
		if (GetStockById(cat.specs[i].id) != undefined) {
			data[i] = {
				name: cat.specs[i].specification,
				value: GetStockById(cat.specs[i].id).weight
			};
		}
	}

	specChart.setOption({
		series: [{
			name: 'Show Specifications',
			type: 'pie',
			stack: 'chart',
			radius: '70%',
			data: data,
			emphasis: {
				itemStyle: {
					shadowBlur: 20,
					shadowColor: '#444'
				}
			}
		}],
		title: {
			text: "Gesamt: " + kg + " Kg",
			left: 'center',
			top: "-5px"
		},
		tooltip: {
			trigger: 'item',
			formatter: function(params) {
				let text = "<b style='font-size:16px'>" + params.name + "</b><br>";
				text += '<span style="color:' + params.color + '" class="material-icons circle">circle</span> ' + "Gesamt" + "<span style='float:right;margin-left:15px;font-weight:bold'>" + RoundNumber2(params.value) + " Kg</span> ";
				return text;
			}
		},
	});
}
// Helper Functions
function GetCategoryByGoodInfo(id) {	// Returns (object)categoryInfo using "id"
	for (let i = 0; i < categoryInfos.length; i++) {
		for (let j = 0; j < categoryInfos[i].count; j++) {
			if (categoryInfos[i].specs[j].id == id) {
				return categoryInfos[i];
			}
		}
	}
}
function GetCategoryByName(name) {	//	Returns (object)categoryInfo using "name"
	for (let i = 0; i < categoryInfos.length; i++) {
		if (categoryInfos[i].name == name) return categoryInfos[i];
	}
}
function GetStockById(id) {	// Returns (object)goodInfo using "id"
	for (let i = 0; i < stock.length; i++) {
		if (stock[i].good.goodInfo == id) return stock[i].good;
	}
}
function GetSpecsByCategory2(cat) {
	let specs = [];
	let c = 0;
	for(let i = 0; i < allCategories.length; i++) {
		if(allCategories[i].category == cat) {
			specs[c] = allCategories[i];
			c++;
		}
	}
	return specs;
}
function GetSpecificationById(id) {
	for(let i = 0; i < allCategories.length; i++) {
		if(allCategories[i].id == id) {
			return allCategories[i];
		}
	}
}

$(async function() {	// Executed after page load
	if (await HeaderCheckLogin()) {
		GenerateGrid();
		await RenderAllCharts();
	}
});
