const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
var ev;
var stock;
var categories;
var categoryNames;
var startStock;
var endStock;
var startTable;
var startNewRow;
var startCatSelect;
var startSpecSelect;

// Event functions
async function LoadEvent() {
	ev = await Api.fetchSimple("api/event", eventId);
	//console.log(ev);
	let loc = moment(ev.date);
	loc.locale("de");

	let el = $(".eventEdit").find("#eventName").val(ev.eventname);
	RequiredInput(el);
	el = $(".eventEdit").find("#eventOrt").val(ev.city);
	RequiredInput(el);
	el = $(".eventEdit").find("#eventDatum").val(loc.format("YYYY-MM-DD"));
	RequiredInput(el);
	el = $(".eventEdit").find("#eventStrasse").val(ev.street);
	RequiredInput(el);
	el = $(".eventEdit").find("#eventPLZ").val(ev.postcode);
	RequiredInput(el);
	el = $(".eventEdit").find("#eventHausnummer").val(ev.houseNumber);
	RequiredInput(el);
	el = $(".eventEdit").find("#eventPhone").val(ev.phonenumber);
	RequiredInput(el);

	$(".eventName").html(ev.eventname);
	$(".eventLocation").html(ev.city);
	$(".eventDate").html(loc.format("ll"));

	if(ev.completed) {
		$("#openEventBtn").html("Event Öffnen");
		$("#closeEventBtn").css("display", "none");
		$("#infoTab").find("a").css("color", "var(--danger)");
		$("#infoTab").find("a").html("Geschlossen");
	} else {
		$("#closeEventBtn").html("Event Schließen");
		$("#openEventBtn").css("display", "none");
		$("#infoTab").find("a").css("color", "var(--teal)");
		$("#infoTab").find("a").html("Geöffnet");
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
function RequiredInput(obj) {
	let el = $(obj);
	if(el == null || el.val() == null) return;

	if(el.val().length > 0) {
		el.css("border-color", "black");
		el.css("background-color", "#FFF");
	} else {
		el.css("border-color", "red");
		el.css("background-color", "#FEEFEF");
	}

	if($("#eventName").val().length > 0 && $("#eventDatum").val().length > 0 && $("#eventOrt").val().length > 0 && $("#eventPLZ").val().length > 0) {
		$("#updateEventBtn").prop("disabled", false);
	} else {
		$("#updateEventBtn").prop("disabled", true);
	}
}

// UI Functions
function ToggleEditView() {
	if($("#editInfo").css("display") == "none") {
		$("#editInfo").css("display", "inherit");
		$("#mainInfo").css("display", "none");
	} else {
		$("#editInfo").css("display", "none");
		$("#mainInfo").css("display", "inherit");
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
async function RemoveBagStart(selectSource, bag) {
	let data = {
		event: ev.id,
		goodinfo: selectSource,
		weight: bag,
		return: false
	};

	try {
		await Api.fetchSimple("api/event/revoke", data);
		await UpdateStartTable();
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
	let stockDiv = $("#startStockTables");
	let tablesHTML = '<br><table style="color:black" class="startTables display cell-border responsive nowrap"></table></div>';
	stockDiv.html(tablesHTML);

	startTable = $(".startTables").DataTable({
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
			{title: "Kategorie"}
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
			data[r][1] = '<div>' + st.good.bags.length + ' Säcke ';

			for(let s = 0; s < st.good.bags.length; s++) {
				data[r][1] += '<button title="Sack Löschen" class="bagRemoveBtn" onclick="RemoveBagStart(`'+cat.id+'`, '+st.good.bags[s]+')">'+ st.good.bags[s] + '</button>';
				if(s < st.good.bags.length - 1) {
					data[r][1] += " + ";
				}
			}
			data[r][1] += ' = ' + st.good.bags.reduce((a, b) => a + b, 0) + " Kg" + '</div>';
			g = stock.find(el => el.good.goodInfo == cat.id);
			if(g != null) {
				data[r][2] = g.good.weight + " Kg";
			} else {
				data[r][2] = "-";
			}
		}
	}

	if(startTable != null) {
		startTable.rows.add(data);
		startTable.draw();
	}
	return data;
}

$(async function () {
	await Api.init();
	if(await HeaderCheckLogin()) {
		stock = await Api.fetchSimple("api/stock/list");
		categories = await Api.fetchSimple("api/goodInfos");
		categoryNames = await GetCategories();
		
		await HeaderCheckLogin();
		await LoadEvent();
		await PrintStartTables();
	}
});
