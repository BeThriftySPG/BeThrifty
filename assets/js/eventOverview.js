const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
var ev;
var stock;
var categories;
var categoryNames;
var startStock;
var endStock;
var startTable;

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

function GetGoodInfo(id) {
	for(let i = 0; i < categories.length; i++) {
		if(categories[i].id == id) {
			return categories[i];
		}
	}
	return null;
}

async function PrintStartTables() {
	let data = await UpdateStartTable();
	console.log(data);
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
			dataSrc: 5
		},
		order: [[5, "asc"]],
		"columns": [
			{title: "Kategorie"},
			{title: "Säcke"},
			{title: "Neuer Sack"},
			{title: "Gesamtgewicht"},
			{title: "Lagerstand"},
			{title: "Kat"}
		]
	});
	AddStartTableFunctionality();
}

async function UpdateStartTable() {
	if(startTable != null) {
		startTable.clear();
	}
	//console.log(stock);
	let stockDiv = $("#startStockTables");
	startStock = await Api.fetchSimple("api/event/movement", ev.id);
	//console.log(startStock);
	//console.log(categories);
	let data = [];

	for(r = 0; r < startStock.length; r++) {
		let st = startStock[r];
		let cat = await Api.fetchSimple("api/goodinfo", st.goodInfo);

		data[r] = [];
		data[r][0] = "";
		data[r][1] = "";
		data[r][2] = "";
		data[r][3] = "";
		data[r][4] = "";
		data[r][5] = cat.categorie;
		if(cat.categorie == cat.categorie) {
			data[r][0] = cat.specification;
			data[r][1] = '<select class="prettydropdown arrow bagDropdown">' + st.bags.length + ' Säcke';
			//data[r][1] += '<option selected disabled>'+st.bags.length+' Bags</option>';
			for(let s = 0; s < st.bags.length; s++) {
				data[r][1] += '<option>' + st.bags[s] + ' Kg</option>'
			}
			data[r][1] += '</select>';
			data[r][2] = `<input id="`+cat.id+`" class="newBagInput" placeholder="Kg" />`;
			data[r][3] = st.bags.reduce((a, b) => a + b, 0) + " Kg";
			g = stock.find(el => el.goodInfo == cat.id);
			if(g != null) {
				data[r][4] = g.weight + " Kg";
			} else {
				data[r][4] = "-";
			}
		}
	}

	if(startTable != null) {
		startTable.rows.add(data);
		startTable.draw();
		AddStartTableFunctionality();
	}

	return data;
}
function AddStartTableFunctionality() {
	$(".newBagInput").each(async function(index) {
		this.addEventListener('keypress', async function (e) {
	    if (e.key === 'Enter') {
	      let el = $($(".newBagInput")[index]);
				let value = parseFloat(el.val());
				if(await Api.fetchSimple("api/event/add", {Event:ev.id, GoodInfo: el.attr("id"), Bags:[value]}) == null) {
					console.log("ERROR: Failed adding " + value + " Kg");
				} else {
					console.log("Added " + value + " Kg.");
				}
				el.val("");
				UpdateStartTable();
	    }
		});
	});
	let drops = [];
	$(".bagDropdown").each(function(index) {
		drops[index] = $($(".bagDropdown")[index]).prettyDropdown({
			hoverIntent:-1,
		});
	});
}

$(function () {
	Initiliaze();
});
