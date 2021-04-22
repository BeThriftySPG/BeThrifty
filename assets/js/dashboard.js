
function GenerateGrid() {
	// Initialisiert das Dashboard
	var grid = new Muuri('.grid', {	// Initialisiert das Dashboard im Klassenname ".grid"
		dragEnabled: true,	// Kann man Zellen ziehen?
		// Layout-Einstellungen. fillGaps ist interessant
		layout: {
			fillGaps: false,
			horizontal: false,
			alignRight: false,
			alignBottom: false,
			rounding: true
		},
		layoutOnResize: true,
		layoutOnInit: true,
		layoutDuration: 200,	// Snap-Geschwindigkeit
		dragStartPredicate: {
	    distance: 100,
	    delay: 0,
	  },
	});
}

function GenerateECharts() {
	// Chart 1
	// echarts.init("<Klassenname>") => Erstellt ein Diagramm dort, wo sich diese Klasse befindet. Siehe index.html
	// .find("<Klassenname>") => Erstellt das Diagramm anstattt direkt in der Klasse ".diagram1" in der Unterklasse ".graph"
	//													 Da Klassen mehrfach vorkommen können Index-[0]
	//													 {renderer: 'svg'} => Render das E-Chart mit SVG-Methode anstatt mit Canvas (Es gibt für beides Vor-Nachteile)
	var chart1 = echarts.init($(".diagram1").find(".graph")[0], null, {renderer: 'svg'});

	// Konfiguriert das Diagramm (Diagrammart, Aussehen, Daten, etc...)
	// Für jede Diagrammart gibt es unterschiedliche Parameter, diese können gut hier eingesehen werden: https://echarts.apache.org/examples/en/index.html
	// Hier wird ein Tortendiagramm erstellt
	chart1.setOption({
		// Damit ist das Diagramm nicht Regenbogenfarbig, sondern eintönig mit Helligkeitsstufen
		visualMap: {
			show: false,	// Zeigt Farbengradient an
			min: 80,	// Minimale Helligkeit
			max: 800,	// Maximale Helligkeit
			inRange: {
					colorLightness: [0, 1]	// Farbstufen
		}
	},
	series : [
		{
			name: 'Reference Pagesss',	// Irgendeine Bezeichnung fürs Diagramm
			type: 'pie',	// Tortendiagramm
			radius: '70%',	// Größe des Diagramms
			roseType: "angle",	// Damit ist es nicht rund, sondern zackig geformt
			// Daten die das Diagramm anzeigen soll
			data:[
				{value:400, name:'Hosen'},	// Daten werden mittels Objekt übergeben. Eine Zeile => 1 Datensatz
				{value:335, name:'Hemden'},
				{value:310, name:'Jacken'},
				{value:274, name:'Röcke'}
			]
		}
	]
	});

}

function GenerateBarChart(){

	var chart2 = echarts.init($(".diagram2").find(".graph")[0], null, {renderer: 'svg'});

	chart2.setOption({
		// Damit ist das Diagramm nicht Regenbogenfarbig, sondern eintönig mit Helligkeitsstufen
		visualMap: {
			show: false,
			min: 10,
			max: 1000,
	},

	series: [{
        name: 'Show Categories',
				type: 'bar',
        stack: 'chart',
        label: {
            position: 'right',
            show: true
        },
        data: [
					{value:400, name:'Hosen'},	// Daten werden mittels Objekt übergeben. Eine Zeile => 1 Datensatz
					{value:335, name:'Hemden'},
					{value:310, name:'Jacken'},
					{value:274, name:'Röcke'}
				]
			}
		]
	});
}

// Wird beim Aufrufen der Seite ausgeführt
$(async function () {
	await Api.init();
	if(await HeaderCheckLogin()) {
		GenerateECharts();
		GenerateGrid();
	}
});
