

// Initialize "Select" elements

function GenerateGrid() {
	var grid = new Muuri('.grid', {
		dragEnabled: true,
		layout: {
			fillGaps: false,
			horizontal: false,
			alignRight: false,
			alignBottom: false,
			rounding: true
		},
		layoutOnResize: true,
		layoutOnInit: true,
		layoutDuration: 200,
		dragStartPredicate: {
	    distance: 100,
	    delay: 0,
	  },
	});
}

function GenerateECharts() {
	// Chart 1
	var chart1 = echarts.init($(".diagram1").find(".graph")[0], null, {renderer: 'svg'});

  chart1.setOption({
		visualMap: {
			// hide visualMap component; use lightness mapping only
			show: false,
			// mapping with min value at 80
			min: 80,
			// mapping with max value at 600
			max: 600,
			inRange: {
					// mapping lightness from 0 to 1
					colorLightness: [0, 1]
		}
	},
	series : [
		{
			name: 'Reference Page',
			type: 'pie',
			radius: '70%',
			roseType: "angle",
			data:[
				{value:400, name:'Hosen'},
				{value:335, name:'Hemden'},
				{value:310, name:'Jacken'},
				{value:274, name:'Röcke'}
			]
		}
	]
	});
}

async function Initiliaze() {
	await Api.init();
	HeaderCheckLogin();
	
	// Generating GridList
	GenerateECharts();
	GenerateGrid();


	$('select').selectric({
		maxHeight: 200,
		inheritOriginalWidth: true
	});
}

$(function () {
	Initiliaze();
});
