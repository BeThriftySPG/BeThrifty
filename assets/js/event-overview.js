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
async function LoadEvent() {	// Initializes the EventView
	if(Api.isAllowed("EventView")) {
		ev = await Api.fetchSimple("api/event", eventId);
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

		if(Api.isAllowed("EventEdit")) {
			$("#editEventBtn").show();
			$("#closeEventBtn").show();
			$("#openEventBtn").show();
		}
		if(ev.completed && Api.isAllowed("EventEdit")) {
			$("#openEventBtn").html("Event Öffnen");
			$("#closeEventBtn").css("display", "none");
			$("#infoTab").find("a").css("color", "var(--danger)");
			$("#infoTab").find("a").html("Geschlossen");
			$(".addNewRow")[0].style.display = "none";
			$(".eventEdit").find("#eventStatus").val("Abgeschlossen");
			$(".eventEdit").find("#eventStatus").css("color", "#dc3545");
		} else {
			$("#closeEventBtn").html("Event Schließen");
			$("#openEventBtn").css("display", "none");
			$("#infoTab").find("a").css("color", "var(--teal)");
			$("#infoTab").find("a").html("Geöffnet");
			$(".eventEdit").find("#eventStatus").val("Laufend");
			$(".eventEdit").find("#eventStatus").css("color", "#20c997");
		}
		if(Api.isAllowed("EventEdit")) {
			$("#openEventBtn").show();
		}
	} else {
		$("#viewContainer").html("<legend>Keine Berechtigungen</legend>");
	}
	$("#viewContainer").show();
}
async function OpenCloseEvent() {	// Changes the event value "completed"
	try {
		if(ev.completed) {
			ev.completed = false;
			await Api.fetchSimple("api/event/update", ev);
			PrintInfo("Event has been opened.");
			location.reload();
		} else {
			ev.completed = true;
			await Api.fetchSimple("api/event/update", ev);
			PrintInfo("Event has been closed.");
			location.reload();
		}
	} catch(e) {
		PrintError("Changing Event completed status failed!");
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
	} catch(e) {
		PrintError(e);
	}
}
async function AddBagStartRow() {	// Adds a bag that shipped to the event
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
			PrintInfo("Uploaded new bag!");
		} catch(e) {
			PrintError(e);
		}

		// Reset Input
		$("#addNewRowInput").val(0);
		ValidateInputKg(document.getElementById("addNewRowInput"), false);

		// Update
		await UpdateStartTable();
		await UpdateAbschlussTable();
		try {
			DisplayAvialableKg('addNewRowSpec', 'addNewRowAvKg');
		} catch {}
	} catch(e) {
		console.warn("Uploading new bag failed!");
		console.error(e);
	}
}
async function WithdrawBag(goodInfoId, inputId) {	// Adds a bag that returns from the event
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
async function RemoveBag(selectSource, bag, returns) {	// Undo a bag entry
	let data = {
		event: ev.id,
		goodinfo: selectSource,
		weight: bag,
		returns: returns
	};

	try {
		await Api.fetchSimple("api/event/revoke", data);
		await UpdateStartTable();
		await UpdateAbschlussTable();
		PrintInfo("Removed Bag!");
	} catch(e) {
		PrintError(e);
	}

	try {
		await DisplayAvialableKg('addNewRowSpec', 'addNewRowAvKg');
	} catch {}
}
function RequiredInput(obj) {	// Validates the event edit information fields
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
async function SetupNewRowStart() {	// Adds a row for adding new bags
	if(Api.isAllowed("EventEdit")) {
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
function GetGoodInfo(id) {
	for(let i = 0; i < categories.length; i++) {
		if(categories[i].id == id) {
			return categories[i];
		}
	}
	return null;
}

// Datatable "Start" Functions
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
		"dom": '<"stock-toolbar">rtip',
		"columns": [
			{title: "Kategorie", width:"35%"},
			{title: "Säcke", width:"50%"},
			{title: "Lagerstand", className:"alignRight", width:"10%"},
			{title: "Kategorie", visible: false}
		]
	});
	await SetupNewRowStart();
}
async function UpdateStartTable() {
	let moveStock = await Api.fetchSimple("api/event/movement", ev.id);
	let data = [];
	stock = await Api.fetchSimple("api/stock/list");

	for(let i = 0; i < moveStock.length; i++) {
		let cat = await Api.fetchSimple("api/goodinfo", moveStock[i].goodInfo);
		data[i] = [];
		data[i][0] = cat.specification;
		data[i][1] = '<div>' + moveStock[i].outgoing.length + ' Säcke &nbsp; [';
		data[i][2] = moveStock[i].outgoingSum + " Kg";
		data[i][3] = cat.category;

		for(let s = 0; s < moveStock[i].outgoing.length; s++) {
			if(ev.completed == false && Api.isAllowed("EventEdit")) {
				data[i][1] += '<button title="Sack Löschen" class="bagRemoveBtn" onclick="RemoveBag(`' + cat.id + '`, ' + moveStock[i].outgoing[s] + ', false)">' + moveStock[i].outgoing[s] + '</button>';
			} else {
				data[i][1] += "<span class='bag'>" + moveStock[i].outgoing[s] + "</span>";
			}
			if(s < moveStock[i].outgoing.length - 1) data[i][1] += ", ";
		}
		data[i][1] += '] <span class="bag_sum">' + moveStock[i].outgoingSum + " Kg</span>" + '</div>';

		let stockGood = stock.find(el => el.good.goodInfo == cat.id);
		data[i][2] = stockGood.good.weight + " Kg";
	}

	if(startTable != null) {
		startTable.clear();
		startTable.rows.add(data);
		startTable.draw();
		startTable.columns.adjust().draw();
		RenderGraph1();
	}
	document.getElementById("startTable").style.width = "100%";
	return data;
}

// Datatable "Abschluss" Functions
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
			{title: "Kategorie", width:"30%"},
			{title: "Säcke", width:"45%"},
			{title: "Eventlager", className:"alignRight", width:"5%"},
			{title: "Neuer Sack", visible:!ev.completed && Api.isAllowed("EventEdit"), width:"20%"},
			{title: "Kategorie", visible:false}
		]
	});
	startTable.columns.adjust().draw();
}
async function UpdateAbschlussTable() {
	let moveStock = await Api.fetchSimple("api/event/movement", ev.id);
	let data = [];

	for(let i = 0; i < moveStock.length; i++) {
		let cat = await Api.fetchSimple("api/goodinfo", moveStock[i].goodInfo);
		data[i] = [];
		data[i][0] = cat.specification;
		data[i][1] = '<div>' + moveStock[i].outgoing.length + ' Säcke &nbsp; [';
		data[i][2] = (moveStock[i].outgoingSum - moveStock[i].returningSum) + " Kg";
		data[i][3] = "";
		data[i][4] = cat.category;

		// List the bags of the returned good
		if(moveStock[i].returningSum > 0) {
			for(let s = 0; s < moveStock[i].returning.length; s++) {
				if(ev.completed == false && Api.isAllowed("EventEdit")) {
					data[i][1] += '<button title="Sack Löschen" class="bagRemoveBtn" onclick="RemoveBag(`' + cat.id + '`, ' + moveStock[i].returning[s] + ', true)">' + moveStock[i].returning[s] + '</button>';
				} else {
					data[i][1] += "<span class='bag'>" + moveStock[i].returning[s] + "</span>";
				}
				if(s < moveStock[i].returning.length - 1) data[i][1] += ", ";
			}
			data[i][1] += '] <span class="bag_sum">' + moveStock[i].returningSum + " Kg</span>" + '</div>';
		} else {
			data[i][1] = "Kein Eintrag";
		}

		if(ev.completed == false && Api.isAllowed("EventEdit")) {
			data[i][3] = '<div><input class="withdraw_input" id="withdraw_' + i + '" placeholder="Kg Sack" /><button class="withdraw_button blackWhiteButton" onclick="WithdrawBag(`' + cat.id + '`, `withdraw_' + i + '`)">Abziehen</button></div>';
		}
	}

	if(abschlussTable != null) {
		abschlussTable.clear();
		abschlussTable.rows.add(data);
		abschlussTable.draw();
		abschlussTable.columns.adjust().draw();
		RenderGraph1();
	}
	document.getElementById("abschlussTable").style.width = "100%";
	return data;
}

// Render ECharts
async function RenderGraph1() {
	var chart1 = echarts.init(document.getElementById("dia1"), 'dark', {renderer: 'svg'});
	let legend = ["Eingang", "Ausgang"];
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
	];
	if(ev.completed == false) {
		data1 = [
			{
				name: "Eventlager",
				type: "bar",
				data: []
			}
		];
		legend = ["Eventlager"];
	}
	let xAxis = [];
	let movement = await Api.fetchSimple("api/event/movement", ev.id);

	for(let i = 0; i < movement.length; i++) {
		let good = movement[i];
		xAxis[i] = await GetGoodInfo(good.goodInfo).specification;
		data1[0].data[i] = good.outgoingSum;
		if(ev.completed && Api.isAllowed("EventEdit")) {
			data1[1].data[i] = good.returningSum;
		}
	}

	chart1.setOption({
		series : data1,
		title: {
        text: 'Eventlager',
				subtext: 'in Kg'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
		legend: {
			 data: legend,
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
function ResizeAdjust() {	// Responsive window size adjust
	if ($(this).width() < 1250) {
		$("#graphs").appendTo($("#overflowGraph"));
  } else {
		$("#graphs").appendTo($("#defaultGraph"));
  }
}

$(async function () {
	$("#eventForm").hide();
	$("#viewContainer").hide();
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
		ResizeAdjust();
		$("#eventForm").show();
	}
});
$(window).resize(function() {
	ResizeAdjust();
});
