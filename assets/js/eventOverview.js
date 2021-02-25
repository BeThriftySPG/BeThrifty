const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
var ev;
var stock;
var categories;
var categoryNames;
var startStock;
var endStock;

async function LoadEvent() {
	ev = await Api.fetchSimple("api/event", eventId);
	console.log(ev);
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

async function GetCategories() {
	return await Api.fetchSimple("api/goodInfo/categories");
}

async function Initiliaze() {
	await Api.init();
	stock = await Api.fetchSimple("api/stock/list");
	categories = await Api.fetchSimple("api/goodInfos");
	categoryNames = await GetCategories();
	await HeaderCheckLogin();
	await LoadEvent();
	await PrintStartTables();
}

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

async function PrintStartTables() {
	console.log(stock);
	let stockDiv = $("#startStockTables");
	startStock = await Api.fetchSimple("api/event/movement", ev.id);
	console.log(startStock);
	console.log(categories);

	let data = [];

	let tablesHTML = "";
	for(i = 0; i < categoryNames.length; i++) {
		tablesHTML += `<table class="toggleViewBar" id="startTableDiv_`+categoryNames[i]+`" onclick="ToggleEventViews('`+categoryNames[i]+`')">
				<tr>
					<td style="padding-left:25px">`+categoryNames[i]+`</td>
					<td style="width:25px;border:none;background:none"><button class="toggleArrowButton"><span class="material-icons">keyboard_arrow_up</span></button></td>
				</tr>
			</table>
			<div class="content" id="startTableDiv_`+categoryNames[i]+`">`;
		tablesHTML += '<table id="start_table_'+categoryNames[i]+'" class="startTables display cell-border responsive nowrap"></table></div>';
	}
	stockDiv.html(tablesHTML);

	for(i = 0; i < categoryNames.length; i++) {
		// Initializing dataTables
		data[i] = {};
		for(c = 0; c < startStock.length; c++) {
			data[i].spec = startStock[c].goodInfo;
			data[i].test = "Test";
		}
		console.log(data[i]);
		let table = $("#start_table_"+categoryNames[i]).DataTable({
			paging: false,
			scrollCollapse: true,
			info: false,
			responsive:true,
			data: data[i],
			"dom": '<"stock-toolbar">',
			"columns": [
				{title: "Kategorie"},
			]
		});
	}
}

$(function () {
	Initiliaze();
});
