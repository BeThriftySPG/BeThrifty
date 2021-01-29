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

$(function () {

	// Initializing dataTables
	var eventOpenTable = $("#eventsOpenDiv").find(".eventTableContent").DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true
	});
	var eventClosedTable = $("#eventsClosedDiv").find(".eventTableContent").DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true
	});
	let searchBar1 = $("#eventsOpenDiv").find(".dataTables_filter");
	let searchBar2 = $("#eventsClosedDiv").find(".dataTables_filter");
	let inputs = document.getElementsByClassName("dataTables_filter");
	for(let i = 0; i < inputs.length; i++) {
		console.log(inputs[i]);
		inputs[i].placeholder = "####";
	}
});
