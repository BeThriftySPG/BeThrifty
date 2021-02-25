const monthNames = ["Jänner", "Februar", "März", "April", "Mai", "June", "July", "August", "September", "Oktober", "November", "Dezember"];
var currentdate = new Date();
var stockTable;

// Server Functions

async function UploadNewWare() {
	let kg = $("#newWareKg");
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
		UpdateStockTable();
	}
}
async function UploadRemoveWare() {
	let kg = $("#removeWareKg");
	let cat = $("#removeWareCat");
	let spec = $("#removeWareSpec");
	let date = $("#removeWareDate");
	let error = $("#removeWareErrorMessage");
	let warning = $("#removeWareWarningMessage");

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

	if(await Api.fetchSimple("api/stock/remove", {GoodInfo: spec.val(), Weight: weight}) == null) {
		error.html("Ein Fehler ist aufgetreten.");
	} else {
		console.log("Remove Ware upload complete.");
		error.html("");
		$.modal.close();
		UpdateStockTable();
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
async function RemoveCategory() {
	let spec = $("#removeWareSpec");
	let error = $("#removeWareErrorMessage");

	if(spec.val() == null || spec.val() == "") {
		error.html("Ein Warentyp muss mittels der beiden Dropdowns ausgewählt werden.");
		return;
	}

	console.log("Deleting category: " + spec.val());
	if(await Api.fetchSimple("api/goodinfo/delete", spec.val()) == null) {
		error.html("Ein bereits genutzter Warentyp kann nicht gelöscht werden.");
	} else {
		console.log("Warentyp erfolgreich entfernt.");
		error.html("");
		$.modal.close();
	}
	UpdateStockTable();
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
async function ValidateSelectedCategory(obj, operation, fill) {
	let el = $(obj);
	let specs = await GetSpecsByCategory(el.val());
	let spec = $("#newWareSpec");

	if(operation == "remove") {
		spec = $("#removeWareSpec");
	}

	spec.html("");

	specs.sort(function(a, b){
    if(a.specification < b.specification) { return -1; }
    if(a.specification > b.specification) { return 1; }
    return 0;
	});
	specs.forEach(el => {
		spec.append("<option value='" + el.id + "'>" + el.specification + "</option>");
	});
	if(operation == "add") {
		CheckInputKg($("#newWareKg"));
	}
	if(fill != null || fill == "") {
		spec.val(fill);
	}
}
async function OpenNewWarePopup(fill_cat) {
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
	catList.sort();

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorie auswählen</option>");
	kg.css("border-color", "red");

	if(fill_cat != null && fill_cat != "") {
		let info = await Api.fetchSimple("api/goodInfo", fill_cat);
		cat.val(info.categorie);
		ValidateSelectedCategory(cat, "add", info.id);
	}
}
async function OpenDeleteWarePopup(fill_cat) {
	let kg = $("#removeWareKg");
	let cat = $("#removeWareCat");
	let spec = $("#removeWareSpec");
	let date = $("#removeWareDate");
	let error = $("#removeWareErrorMessage");
	let warning = $("#removeWareWarningMessage");

	kg.val("");
	cat.html("");
	spec.html("");
	error.html("");
	warning.html("");

	date.val("" + (monthNames[currentdate.getMonth()])  + " " + currentdate.getDate() + " "
					+ currentdate.getFullYear() + ", "
					+ currentdate.getHours() + ":"
					+ currentdate.getMinutes() + " Uhr");

	$('#removeStockPopup').modal({
		fadeDuration: 100,
		escapeClose: false,
		clickClose: false,
		showClose: false
	});

	cat.html("");
	let catList = await GetCategories();
	catList.sort();

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorie auswählen</option>");
	kg.css("border-color", "red");

	if(fill_cat != null && fill_cat != "") {
		let info = await Api.fetchSimple("api/goodInfo", fill_cat);
		cat.val(info.categorie);
		ValidateSelectedCategory(cat, "remove", info.id);
	}
}
async function PrintTable() {
	let wares = await Api.fetchSimple("api/stock/list");
	let categories = await Api.fetchSimple("api/goodInfos");
	categories.sort(function(a, b){
    if(a.specification < b.specification) { return -1; }
    if(a.specification > b.specification) { return 1; }
    return 0;
	});

	let data = UpdateStockTable();

	//console.log(wares);
	//console.log(categories);

	// Initializing dataTables
	stockTable = $("#stockTable").DataTable({
		paging: false,
		scrollCollapse: true,
		info: false,
		responsive:true,
		data: data,
		order: [[1, "asc"]],
		rowGroup: {
			dataSrc: 1
		},
		"dom": '<"stock-toolbar">frtip',
		"columns": [
			{title: "Bezeichnung"},
			{title: "Kategorie"},
			{title: "Gewicht", className: "alignRight"},
			{title: "Mindestgewicht", className: "alignRight"},
		]
	});

	// Create Advanced Filters
	let catList = await GetCategories();
	catList.sort();

	// Category Selector
	cat = '<select id="catFilter" class="advancedFilter" onchange="ExternSearch(this)">';
	catList.forEach(el => {
		cat += '<option>' + el + '</option>';
	});
	cat += '<option selected disabled>Kategorien</option></select>';
	$("#stockTable_filter").append(cat);

	// Specification Selector
	spec = '<select id="specFilter" class="advancedFilter" onchange="ExternSearch(this)">';
	categories.forEach(el => {
		spec += '<option>' + el.specification + '</option>';
	});
	spec += '<option selected disabled>Sub-Kategorien</option></select>';
	$("#stockTable_filter").append(spec);
}
function ExternSearch(obj) {
	let select = $(obj);
	CustomSearch(select.val(), "");
}
async function UpdateStockTable() {
	if(stockTable != null) {
		stockTable.clear();
	}

	let wares = await Api.fetchSimple("api/stock/list");
	let categories = await Api.fetchSimple("api/goodInfos");

	let data = [];

	for(let i=0; i < wares.length; i++) {
		data[i] = [];
		let info = categories.find(el => el.id == wares[i].goodInfo);
		data[i][1] = info.categorie;
		data[i][0] = info.specification;

		data[i][2] = '<span class="tools material-icons add" onclick="OpenDeleteWarePopup(\''+info.id+'\')">remove</span></span>';

		data[i][2] += "<span style='margin-right:10px'>" + wares[i].weight + " Kg" + "</span>";
		data[i][2] += '<span class="material-icons remove" onclick="OpenNewWarePopup(\''+info.id+'\')">add</span>';

		if(info.minWeight > 0) {
			data[i][3] = info.minWeight + " Kg";
		} else {
			data[i][3] = "-";
		}
	}

	if(stockTable != null) {
		stockTable.rows.add(data);
		stockTable.draw();
	}
	return data;
}
function CustomSearch(cat, spec) {
	let searchBar = $("");

	if(cat != null && cat != "") {
		stockTable.search(
			cat
		).draw();
	}
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
