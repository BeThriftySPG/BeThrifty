// ECharts
var warenKatChart;
var specChart;
var ongoingEventChart;
// Sonstiges
var stock;
var categories;
var categoryInfos;
var grid;
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
	} else {
		$("#boxCategory").remove();
		$("#boxSpecs").remove();
		$("#boxBestSelling").remove();
		$("#boxLowStock").remove();
		$("#boxStockInYears").remove();
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
				data[i].value += stock[j].good.weight;
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
			formatter: '{b} {d} Kg'
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
	let events = await GetEvents();
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
	for (let i = 0; i < events.length && i < 25; i++) {
		if (events[i].completed) {
			let move = await Api.fetchSimple("api/event/movement", events[i].id);
			let moveIn = 0;
			let moveReturn = 0;
			for (let i = 0; i < move.length; i++) {
				moveIn += move[i].outgoingSum;
				moveReturn += move[i].returningSum;
			}
			data[0].data[count] = moveReturn;
			data[1].data[count] = moveIn - moveReturn;
			yAxis[count] = events[i].eventname;
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
}
async function RenderFinishedEventTable() {	// Finished Events Table
	let events = await GetEvents();
	let el = $("#chart3");
	let html = "<table class='chartTable'>";
	html += "<thead><tr><th>Datum<th>Event</tr></thead>";

	for (let i = events.length - 1; i > 0 && i > events.length - 40; i--) {
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
async function UpdateData() {	// Refresh Data
	if (Api.isAllowed("StockView")) {
		stock = await GetStockList();
	}
	categories = await GetCategories();
	categoryInfos = [];
	for (let i = 0; i < categories.length; i++) {
		categoryInfos[i] = {
			name: categories[i],
			specs: [],
			count: 0
		};
		let specs = await GetSpecsByCategory(categories[i]);
		categoryInfos[i].count = specs.length;
		for (let s = 0; s < specs.length; s++) {
			categoryInfos[i].specs[s] = specs[s];
		}
	}
}
function RenderSpecificationChart(category, percent, kg) {	// Specification Pie-Chart
	// Doesn't need to fetch new data, since it uses the data from the "Category Pie-Chart"
	$("#chart2").find("h1").remove();
	$("#specBox").find(".graphTitle").html(category);
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
			formatter: '{b} {d} Kg'
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

$(async function() {	// Executed after page load
	await Api.init();
	if (await HeaderCheckLogin()) {
		await RenderAllCharts();
		GenerateGrid();
	}
});
