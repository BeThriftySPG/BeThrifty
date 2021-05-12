// Server functions
async function CreateNewEvent() {
	let data = {
		Eventname: $("#newEventName").val(),
		Date: $("#newEventDatum").val() + "T00:00:00Z",
		Postcode: $("#newEventPostleitzahl").val(),
		City: $("#newEventOrt").val(),
		Street: $("#newEventStrasse").val(),
		HouseNumber: $("#newEventHausnummer").val(),
		PhoneNumber: ""
	};
	try {
		await Api.fetchSimple("api/event/create", data);
		PrintInfo("Event has been created.");
		window.location.href = "/events/eventManagement.html";
	} catch(e) {
		PrintError(e);
	}
}
async function LoadEventTables() {	// Initializes Datatables
	if(Api.isAllowed("EventView")) {
		PrintInfo("Fetching events...");
		let events = await GetEvents();
		let eventsClosed = events.filter(ev => ev.completed == false);
		let eventsOpened = events.filter(ev => ev.completed == true);
		let data1 = [];
		let data2 = [];
		PrintInfo("Total events loaded: " + events.length);

		for(let i = 0; i < eventsClosed.length; i++) {
			let loc = moment(eventsClosed[i].date);
			loc.locale("de");
			data1[i] = [];
			data1[i][0] = "<a class='editEventLink' title='Bearbeiten' href='eventOverview.html?id=" + eventsClosed[i].id + "'>" + eventsClosed[i].eventname + "</a>";
			data1[i][1] = "<span style='display:none'>" + loc.unix() + "</span>" + loc.format("ll");
			data1[i][2] = eventsClosed[i].city;
			data1[i][3] = eventsClosed[i].postcode;
		}
		for(let i = 0; i < eventsOpened.length; i++) {
			let loc = moment(eventsOpened[i].date);
			loc.locale("de");
			data2[i] = [];
			data2[i][0] = "<a class='editEventLink' title='Bearbeiten' href='eventOverview.html?id=" + eventsOpened[i].id + "'>" + eventsOpened[i].eventname + "</a>";
			data2[i][1] = "<span style='display:none'>" + loc.unix() + "</span>" + loc.format("ll");
			data2[i][2] = eventsOpened[i].city;
			data2[i][3] = eventsOpened[i].postcode;
		}

		// Initializing dataTables
		var eventOpenTable = $("#eventsOpenDiv").find(".eventTableContent").DataTable({
			paging: false,
			scrollCollapse: true,
			info: false,
			responsive:true,
			data: data1,
			"columns": [
				{title: "Eventname"},
				{title: "Datum"},
				{title: "Ort"},
				{title: "Postleitzahl"},
			]
		});
		var eventClosedTable = $("#eventsClosedDiv").find(".eventTableContent").DataTable({
			paging: false,
			scrollCollapse: true,
			info: false,
			responsive:true,
			data: data2,
			"columns": [
				{title: "Eventname"},
				{title: "Datum"},
				{title: "Ort"},
				{title: "Postleitzahl"},
			]
		});
		if(Api.isAllowed("EventEdit")) {
			$("#toggleNewEvent").show();
		}
	} else {
		PrintError("No permissions to read Events!");
		$("#viewContainer").html("<legend>Keine Berechtigungen</legend>");
	}
}

// UI Functions
function ToggleNewEvent() {
	let div = document.querySelector("#newEventForm");
	if(div.style.display == "none") {
		div.style.display = "inherit";
	} else {
		div.style.display = "none";
	}
}
function ToggleEventViews(name) {
	let container = document.getElementById(name).querySelector(".content");
	let icon = document.getElementById(name).querySelector(".material-icons");

	if(container.style.display == "none") {
		container.style.display = "inherit";
		icon.innerHTML = "keyboard_arrow_up";
	} else {
		container.style.display = "none";
		icon.innerHTML = "keyboard_arrow_down";
	}
}
function RequiredInput(obj) {	// Validates input values for NewEvent
	let el = $(obj);
	if(el.val().length > 0) {
		el.css("border-color", "black");
		el.css("background-color", "#FFF");
	} else {
		el.css("border-color", "red");
		el.css("background-color", "#FEEFEF");
	}

	if($("#newEventName").val().length > 0 && $("#newEventDatum").val().length > 0 && $("#newEventOrt").val().length > 0 && $("#newEventPostleitzahl").val().length > 0) {
		$("#submitNewEventBtn").prop("disabled", false);
	} else {
		$("#submitNewEventBtn").prop("disabled", true);
	}
}

$(async function () {
	$("#viewContainer").hide();
	await Api.init();
	if(await HeaderCheckLogin()) {
		await LoadEventTables();
		$("#viewContainer").show();
	}
});
