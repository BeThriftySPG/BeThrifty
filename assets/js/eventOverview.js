const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
var ev;

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

function OpenCloseEvent() {

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

async function Initiliaze() {
	await Api.init();
	HeaderCheckLogin();
	LoadEvent();
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

$(function () {
	Initiliaze();
});
