const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
var ev;
var stock;
var categories;
var categoryNames;
var startStock;
var endStock;
var startTable;
var abschlussTable;
var startNewRow;
var startCatSelect;
var startSpecSelect;
var isEditable = true;

// Event functions
async function LoadEvent() {
	ev = await Api.fetchSimple("api/event", eventId);
	//console.log(ev);
	let loc = moment(ev.date);
	loc.locale("de");

	let el = $(".eventEdit").find("#eventName").val(ev.eventname);
	el = $(".eventEdit").find("#eventOrt").val(ev.city);
	el = $(".eventEdit").find("#eventDatum").val(loc.format("YYYY-MM-DD"));
	el = $(".eventEdit").find("#eventStrasse").val(ev.street);
	el = $(".eventEdit").find("#eventPLZ").val(ev.postcode);
	el = $(".eventEdit").find("#eventHausnummer").val(ev.houseNumber);
	el = $(".eventEdit").find("#eventPhone").val(ev.phonenumber);
	loc = moment(ev.lastChangeDate);
	el = $(".eventEdit").find("#lastChange").val(loc.format("DD.MM.YYYY HH:mm"));

	$(".eventName").html(ev.eventname);
	$(".eventLocation").html(ev.city);
	$(".eventDate").html(loc.format("ll"));

	if(ev.completed) {
		$("#openEventBtn").html("Event Öffnen");
		$("#closeEventBtn").css("display", "none");
		$("#infoTab").find("a").css("color", "var(--danger)");
		$("#infoTab").find("a").html("Geschlossen");
		$(".addNewRow")[0].style.display = "none";
		$(".eventEdit").find("#eventStatus").val("Abgeschlossen");
	} else {
		$("#closeEventBtn").html("Event Schließen");
		$("#openEventBtn").css("display", "none");
		$("#infoTab").find("a").css("color", "var(--teal)");
		$("#infoTab").find("a").html("Geöffnet");
		$(".eventEdit").find("#eventStatus").val("Laufend");
	}
}
async function OpenCloseEvent() {
	if(ev.completed) {
		ev.completed = false;
		await Api.fetchSimple("api/event/update", ev);
		console.log("Event has been opened.");
		location.reload();
	} else {
		ev.completed = true;
		await Api.fetchSimple("api/event/update", ev);
		console.log("Event has been closed.");
		location.reload();
	}
}
async function UpdateEventInformation() {
	let data = {
		Id: ev.id,
		Eventname: $("#eventName").val(),
		Date: $("#eventDatum").val() + "T00:00:00Z",
		Postcode: $("#eventPLZ").val(),
		City: $("#eventOrt").val(),
		Street: $("#newStrasse").val(),
		HouseNumber: $("#eventHausnummer").val(),
		PhoneNumber: $("#eventPhone").val()
	};

	try {
		await Api.fetchSimple("api/event/update", data);
		PrintInfo("Event has been updated.");
		await LoadEvent();
		await ToggleEditView();
		//window.location.href = "/events/eventManagement.html";
	} catch(e) {
		PrintError(e);
	}
}
function RequiredInput(obj) {
	let el = $(obj);
	if(el == null || el.val() == null || isEditable == false) return;

	if(el.val().length > 0) {
		el.removeClass("inputFalse");
	} else {
		el.addClass("inputFalse");
	}

	if($("#eventName").val().length > 0 && $("#eventDatum").val().length > 0 && $("#eventOrt").val().length > 0 && $("#eventPLZ").val().length > 0) {
		//$("#updateEventBtn").attr("disabled", false);
	} else {
		//$("#updateEventBtn").attr("disabled", true);
	}
}

// UI Functions
async function ToggleEditView() {
	await LoadEvent();
	let inputs = $(".eventEditInput");
	if(isEditable) {
		isEditable = false;
		$("#updateEventBtn").hide();
		for(let i = 0; i < inputs.length; i++) {
			let el = $(inputs[i]);
			if(el.hasClass("readOnly") == false) {
				el.attr("disabled", true);
				if(el.val().length == 0) {
					el.val("-");
				}
			}
		}
	} else {
		isEditable = true;
		$("#updateEventBtn").show();
		for(let i = 0; i < inputs.length; i++) {
			let el = $(inputs[i]);
			if(el.hasClass("readOnly") == false) {
			el.attr("disabled", false);
				if(el.val() == "-") {
					el.val("");
				}
			}
		}
	}
}
function ToggleEventViews(name) {
	let container = document.getElementById("start_table_" + name);
	let icon = document.getElementById("startTableDiv_" + name).querySelector(".material-icons");

	if(container.style.display == "none") {
		container.style.display = "inherit";
		icon.innerHTML = "keyboard_arrow_up";
	} else {
		container.style.display = "none";
		icon.innerHTML = "keyboard_arrow_down";
	}
}
function GetGoodInfo(id) {
	for(let i = 0; i < categories.length; i++) {
		if(categories[i].id == id) {
			return categories[i];
		}
	}
	return null;
}
async function AddBagStartRow() {
	ValidateInputKg(document.getElementById("addNewRowInput"), true);
	try {
		let kg = parseFloat($("#addNewRowInput").val());
		let data = {
	    event: ev.id,
	    goodinfo: $("#addNewRowSpec").val(),
	    bags: [kg]
		};

		try {
			await Api.fetchSimple("api/event/deposit", data);
			console.log("Uploaded new bag!");
		} catch(e) {
			console.warn("Failed uploading new Bag!");
			console.error(e);
		}

		// Reset Input
		$("#addNewRowInput").val(0);
		ValidateInputKg(document.getElementById("addNewRowInput"), false);

		// Update
		await UpdateStartTable();
		try {
			DisplayAvialableKg('addNewRowSpec', 'addNewRowAvKg');
		} catch {}
	} catch(e) {
		console.warn("Uploading new bag failed!");
		console.error(e);
	}
}
async function WithdrawBag(goodInfoId, inputId) {
	try {
		let kg = parseFloat($("#" + inputId).val());
		let data = {
			event: ev.id,
			goodinfo: goodInfoId,
			bags: [kg]
		};

		await Api.fetchSimple("api/event/withdraw", data);
		UpdateAbschlussTable();
		PrintInfo("Bag has been withdrawn!");
	} catch(e) {
		PrintError(e);
	}
}
async function RemoveBag(selectSource, bag, returns) {
	let data = {
		event: ev.id,
		goodinfo: selectSource,
		weight: bag,
		returns: returns
	};
	console.log(data);
	try {
		await Api.fetchSimple("api/event/revoke", data);
		await UpdateStartTable();
		await UpdateAbschlussTable();
		console.log("Removed Bag!");
	} catch(e) {
		console.warn("Failed removing bag!");
		console.error(e);
	}

	try {
		await DisplayAvialableKg('addNewRowSpec', 'addNewRowAvKg');
	} catch {}
}

// Tab "Start" Functions
async function SetupNewRowStart() {
	let cat = $("#addNewRowCat");
	let catList = await GetCategories();
	catList.sort();

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorie auswählen</option>");

	startCatSelect = $("#addNewRowCat").prettyDropdown({
		hoverIntent:-1,
		height:40,
		width:150,
		selectedMarker:"",
	});
	startSpecSelect = $("#addNewRowSpec").prettyDropdown({
		hoverIntent:-1,
		height:40,
		width:200,
		selectedMarker:"",
	});
	ValidateInputKg(document.getElementById("addNewRowInput"), false);
}
async function ValidateSelectedCategory(obj, targetId, operation) {
	// obj = source select, targetId = target select, operation = 'add' or 'remove'
	let el = $(obj);
	let specs = await GetSpecsByCategory(el.val());
	let spec = $("#"+targetId);
	spec.html("");

	specs.sort(function(a, b){
    if(a.specification < b.specification) { return -1; }
    if(a.specification > b.specification) { return 1; }
    return 0;
	});
	specs.forEach(el => {
		spec.append("<option value='" + el.id + "'>" + el.specification + "</option>");
	});

	// Show avialable KG
	startSpecSelect.refresh();
	DisplayAvialableKg('addNewRowSpec', 'addNewRowAvKg');
}
async function PrintStartTables() {
	let data = await UpdateStartTable();
	let table = $("#startTable");

	startTable = table.DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true,
		data: data,
		"dom": '<"stock-toolbar">',
		rowGroup: {
			dataSrc: 3
		},
		order: [[3, "asc"]],
		"columns": [
			{title: "Kategorie"},
			{title: "Säcke"},
			{title: "Lagerstand"},
			{title: "Kategorie", visible: false}
		]
	});
	await SetupNewRowStart();
}
async function UpdateStartTable() {
	if(startTable != null) {
		startTable.clear();
	}

	stock = await Api.fetchSimple("api/stock/list");
	let stockDiv = $("#startStockTables");
	startStock = await Api.fetchSimple("api/event/movement", ev.id);
	startStock = startStock.filter(function (el) {
	  return el.returns == false;
	});
	let data = [];

	for(r = 0; r < startStock.length; r++) {
		let st = startStock[r];
		let cat = await Api.fetchSimple("api/goodinfo", st.good.goodInfo);

		data[r] = [];
		data[r][0] = "";
		data[r][1] = "";
		data[r][2] = "";
		data[r][3] = cat.category;
		if(cat.category == cat.category) {
			data[r][0] = cat.specification;
			data[r][1] = '<div>' + st.good.bags.length + ' Säcke &nbsp; [';

			for(let s = 0; s < st.good.bags.length; s++) {
				if(ev.completed == false) {
					data[r][1] += '<button title="Sack Löschen" class="bagRemoveBtn" onclick="RemoveBag(`'+cat.id+'`, '+st.good.bags[s]+', false)">'+ st.good.bags[s] + '</button>';
				} else {
					data[r][1] += "<span class='bag'>"+st.good.bags[s]+"</span>";
				}
				if(s < st.good.bags.length - 1) {
					data[r][1] += ", ";
				}
			}
			data[r][1] += '] <span class="bag_sum">' + st.good.bags.reduce((a, b) => a + b, 0) + " Kg</span>" + '</div>';
			g = stock.find(el => el.good.goodInfo == cat.id);
			if(g != null) {
				data[r][2] = g.good.weight + " Kg";
			} else {
				data[r][2] = "-";
			}
			if(st.good.bags.length == 1) {
				//data[r][1] = "1 Sack <span class='bag_sum'>" + st.good.sumWeight + " Kg</span>";
			}
		}
	}

	if(startTable != null) {
		startTable.rows.add(data);
		startTable.draw();
	}
	document.getElementById("startTable").style.width = "100%";
	return data;
}

// Tab "Abschluss" Functions
async function PrintAbschlussTable() {
	let data = await UpdateAbschlussTable();
	let table = $("#abschlussTable");

	abschlussTable = table.DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true,
		data: data,
		"dom": '<"stock-toolbar">',
		rowGroup: {
			dataSrc: 4
		},
		order: [[4, "asc"]],
		"columns": [
			{title: "Kategorie"},
			{title: "Säcke"},
			{title: "Eventlager"},
			{title: "Neuer Sack", visible:!ev.completed},
			{title: "Kategorie", visible:false}
		]
	});
	startTable.columns.adjust().draw();
}
async function UpdateAbschlussTable() {
	if(abschlussTable != null) {
		abschlussTable.clear();
	}

	let stockDiv = $("#abschlussTable");
	let eventStock = await Api.fetchSimple("api/event/movement", ev.id);
	let drawStock = eventStock.filter(function (el) {
	  return el.returns == true;
	});
	eventStock = eventStock.filter(function (el) {
	  return el.returns == false;
	});

	let data = [];

	for(r = 0; r < eventStock.length; r++) {
		let evStock = startStock[r];
		let cat = await Api.fetchSimple("api/goodinfo", evStock.good.goodInfo);

		data[r] = [];
		data[r][0] = "";
		data[r][1] = "Kein Eintrag";
		data[r][2] = evStock.good.sumWeight + " Kg";
		data[r][3] = "";
		data[r][4] = cat.category;
		if(cat.category == cat.category) {
			data[r][0] = cat.specification;
			// If the good originates from "Start"
			if(evStock.returns == false) {
				// Search of equivalents of evStock with "returns: true"
				for(let d = 0; d < drawStock.length; d++) {
					let draw = drawStock[d];
					if(draw.good.goodInfo == evStock.good.goodInfo) {
						// Fill in the information
						let differenceWeight = evStock.good.sumWeight - draw.good.sumWeight;
						data[r][1] = '<div>' + draw.good.bags.length + ' Säcke &nbsp; [';
						data[r][2] = evStock.good.sumWeight;

						// List the bags of the returned good
						for(let s = 0; s < draw.good.bags.length; s++) {
							if(ev.completed == false) {
								data[r][1] += '<button title="Sack Löschen" class="bagRemoveBtn" onclick="RemoveBag(`'+cat.id+'`, '+draw.good.bags[s]+', true)">'+ draw.good.bags[s] + '</button>';
							} else {
								data[r][1] += "<span class='bag'>"+draw.good.bags[s]+"</span>";
							}
							if(s < draw.good.bags.length - 1) {
								data[r][1] += ", ";
							}
						}
						// Display Sum KG that returns
						data[r][1] += '] <span class="bag_sum">' + draw.good.bags.reduce((a, b) => a + b, 0) + " Kg</span>" + '</div>';

						if(g != null) {
							data[r][2] = differenceWeight + " Kg";
						} else {
							data[r][2] = "-";
						}
						if(draw.good.bags.length == 1) {
							//data[r][1] = "1 Sack <span class='bag_sum'>" + draw.good.sumWeight + " Kg</span>";
						}
						break;
					}
				}
				if(ev.completed == false) {
					data[r][3] = '<div><input class="withdraw_input" id="withdraw_'+r+'" placeholder="Kg Sack" /><button class="withdraw_button blackWhiteButton" onclick="WithdrawBag(`'+cat.id+'`, `withdraw_'+r+'`)">Abziehen</button></div>';
				}
			}
		}
	}

	if(abschlussTable != null) {
		abschlussTable.rows.add(data);
		abschlussTable.draw();
		abschlussTable.columns.adjust().draw();
	}
		document.getElementById("abschlussTable").style.width = "100%";
	return data;
}

// ECharts
async function RenderGraph1() {
	var chart1 = echarts.init(document.getElementById("dia1"), 'dark', {renderer: 'svg'});
	let data1 = [
		{
			name: "Eingang",
			type: "bar",
			data: []
		},
		{
			name: "Ausgang",
			type: "bar",
			data: []
		}
	]
	let xAxis = [];
	let stock = await Api.fetchSimple("api/event/movement", ev.id);
	let inCount = 0;
	let outCount = 0;

	for(let i = 0; i < stock.length; i++) {
		if(stock[i].returns == false) {
			let good = await GetGoodInfo(stock[i].good.goodInfo);
			data1[0].data[inCount] = stock[i].good.sumWeight;
			xAxis[inCount] = good.specification;
			inCount++;
		} else {
			data1[1].data[outCount] = stock[i].good.sumWeight;
			outCount++;
		}
		//console.log(good);
	}

	chart1.setOption({
		series : data1,
		title: {
        text: 'Event Differenz',
				subtext: 'in Kg'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
		legend: {
			 data: ['Eingang', 'Ausgang'],
			 right: 'auto'
	 },
		xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01]
    },
		yAxis: {
        type: 'category',
        data: xAxis
    },
		grid: {
        left: '3%',
        right: '3%',
        bottom: '4%',
        containLabel: true
    },
	});
}

$(async function () {
	$("#eventForm").hide();
	await Api.init();
	if(await HeaderCheckLogin()) {
		stock = await Api.fetchSimple("api/stock/list");
		categories = await Api.fetchSimple("api/goodInfos");
		categoryNames = await GetCategories();

		await LoadEvent();
		await PrintStartTables();
		await PrintAbschlussTable();
		await ToggleEditView();
		await RenderGraph1();
		$("#eventForm").show();
	}
});
