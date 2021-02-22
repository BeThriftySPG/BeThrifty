const monthNames = ["Jänner", "Februar", "März", "April", "Mai", "June", "July", "August", "September", "Oktober", "November", "Dezember"];
var currentdate = new Date();

// Server Functions

async function UploadNewWare() {
	let kg = $("#newWareKG");
	let cat = $("#newWareCat");
	let spec = $("#newWareSpec");
	let error = $("#newWareErrorMessage");

	let weight = parseFloat(kg.val());
	let goodInfo = await Api.fetchSimple("api/goodinfo", spec.val());

	if(weight <= 0 || weight == null || isNaN(weight)) {
		error.html("Ein gültiges Gewicht muss eingetragen werden.");
		return;
	}
	if(goodInfo == null || goodInfo == "") {
		error.html("Eine Kategorie und eine Sub-Kategorie müssen ausgewählt sein.");
		return;
	}

	if(await Api.fetchSimple("api/stock/add", {GoodInfo: spec.val(), Weight: weight}) == null) {
		error.html("Ein Fehler ist aufgetreten.");
	} else {
		console.log("New Ware upload complete.");
		error.html("");
		$.modal.close();
	}
}
async function UploadNewCategory() {
	let name = $("#newCatName").val();
	let spec = $("#newCatSpec").val();
	let minWeight = $("#newCatMinWeight").val();
	let error = $("#newCatErrorMessage");
	let weight = parseFloat(minWeight);

	if(spec == null || spec == "") {
		spec = "";
	}
	if(name == null || name == "" || name.length < 3) {
		error.html("Bezeichnung muss mindestens länger als 3 Zeichen sein.");
		return;
	}
	if(weight == null || weight == "" || isNaN(weight) || weight < 0) {
		error.html("Mindestgewicht muss 0 oder größer sein.");
		return;
	}

	//console.log("Uploading category: Name = " + name + " , Specification = " + spec + " , MinWeight = " + minWeight);

	let data = {
		categorie: name,
		specification: spec,
		minweight: weight
	};

	if(await Api.fetchSimple("api/goodInfo/create", data) == null) {
		error.html("Ein Fehler ist aufgetreten.");
	} else {
		console.log("New Category upload complete.");
		error.html("");
		$.modal.close();
	}
}
async function GetCategories() {
	return await Api.fetchSimple("api/goodInfo/categories");
}
async function GetSpecsByCategory(category) {
	return await Api.fetchSimple("api/goodinfo/find", {Categorie: category, Specification: null});
}

// UI Functions

async function OpenNewCatPopup() {
	$('#newStockCategory').modal({
		fadeDuration: 100,
		closeExisting: false,
		escapeClose: false,
		clickClose: false,
		showClose: false
	});

	let cat = $("#newCatSub");
	let name = $("#newCatName");
	let spec = $("#newCatSpec");
	let weight = $("#newCatMinWeight");
	let catList = await GetCategories();
	let error = $("#newCatErrorMessage");

	cat.html("");
	error.html("&nbsp;");
	name.val("");
	spec.val("");
	weight.val("");

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorien</option>");
}
function ValidateInputKg(el, onFocus) {
	let input = "";
	for(let i = 0; i < el.value.length; i++) {
		if(!isNaN(el.value[i]) || el.value[i] == ".") {
			input += el.value[i];
		}
	}

	if(input.length > 0) {
		el.style.borderColor = "black";
	} else {
		el.style.borderColor = "red";
	}

	if(!onFocus && input.length > 0) {
		el.value = input + " Kg";
	} else {
		el.value = input.trim();
	}
}
function AutoFillNewCatSub(obj) {
	let el = $(obj);
	let name = $("#newCatName");

	name.val(el.val());
}
async function CheckInputKg() {
	let el = $("#newWareKg");
	let weight = parseFloat(el.val());
	let spec = $("#newWareSpec");
	let goodInfo = await Api.fetchSimple("api/goodinfo", spec.val());
	let error = $("#newWareWarningMessage");

	if(weight < goodInfo.minWeight && goodInfo.minWeight > 0) {
		error.html("Hinweis: Das Mindestgewicht sollte mehr als " + goodInfo.minWeight + " betragen.");
	} else {
		error.html("");
	}
}
async function ValidateSelectedCategory(obj) {
	let el = $(obj);
	let specs = await GetSpecsByCategory(el.val());

	let spec = $("#newWareSpec");
	spec.html("");

	specs.forEach(el => {
		spec.append("<option value='" + el.id + "'>" + el.specification + "</option>");
	});
	CheckInputKg($("#newWareKg"));
}
async function OpenNewWarePopup() {
	let kg = $("#newWareKG");
	let cat = $("#newWareCat");
	let spec = $("#newWareSpec");
	let date = $("#newWareDate");
	let error = $("#newWareErrorMessage");
	let warning = $("#newWareWarningMessage");

	kg.val("");
	cat.html("");
	spec.html("");
	error.html("");
	warning.html("");

	date.val("" + (monthNames[currentdate.getMonth()])  + " " + currentdate.getDate() + " "
					+ currentdate.getFullYear() + ", "
					+ currentdate.getHours() + ":"
					+ currentdate.getMinutes() + " Uhr");

	$('#newStockPopup').modal({
		fadeDuration: 100,
		escapeClose: false,
		clickClose: false,
		showClose: false
	});


	cat.html("");
	let catList = await GetCategories();

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorie auswählen</option>");
	kg.css("border-color", "red");
}
async function PrintTable() {
	let wares = await Api.fetchSimple("api/stock/list");
	let categories = await Api.fetchSimple("api/goodInfos");

	let data = [];

	for(let i=0; i < wares.length; i++) {
		data[i] = [];
		let info = categories.find(el => el.id == wares[i].goodInfo);
		data[i][0] = info.categorie;
		data[i][1] = info.specification;
		data[i][2] = wares[i].weight;
		data[i][3] = info.minWeight;
	}

	console.log(wares);
	console.log(categories);

	// Initializing dataTables
	var eventOpenTable = $("#stockTable").DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true,
		data: data,
		"columns": [
			{title: "Kategorie"},
			{title: "Sub-Kategorie"},
			{title: "Gewicht"},
			{title: "Mindestgewicht"}
		]
	});
}

// Initialize

$(function () {
	Initiliaze();
});
async function Initiliaze() {
	await Api.init();
	HeaderCheckLogin();
	PrintTable();
}
