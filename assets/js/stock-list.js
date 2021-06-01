const monthNames = ["Jänner", "Februar", "März", "April", "Mai", "June", "July", "August", "September", "Oktober", "November", "Dezember"];
var currentdate = new Date();
var stockTable;
var newWareCat;
var newWareSpec;
var removeWareCat;
var removeWareSpec;
var filterByCat;
var filterBySpec;

// Stocklist modification functions
async function AddItems() {
	let kg = $("#newWareKg");
	let cat = newWareCat;
	let spec = newWareSpec;
	let error = $("#newWareErrorMessage");

	let weight = parseFloat(kg.val());
	let goodInfo = await GetGoodInfo(spec.val());

	if(weight <= 0 || weight == null || isNaN(weight)) {
		PrintError("Ein gültiges Gewicht muss eingetragen werden.", error);
		return;
	}
	if(goodInfo == null || goodInfo == "") {
		PrintError("Eine Kategorie und eine Sub-Kategorie müssen ausgewählt sein.", error);
		return;
	}

	try {
		await Api.fetchSimple("api/stock/add", {GoodInfo: spec.val(), Weight: weight});
		PrintInfo("Articles have been uploaded.");
		error.html("");
		$.modal.close();
		UpdateDatatable();
	} catch {
		PrintError(e, error);
	}
}
async function RemoveItems() {
	let kg = $("#removeWareKg");
	let cat = $("#removeWareCat");
	let spec = $("#removeWareSpec");
	let date = $("#removeWareDate");
	let error = $("#removeWareErrorMessage");
	let warning = $("#removeWareWarningMessage");

	let weight = parseFloat(kg.val());
	let goodInfo = await GetGoodInfo(spec.val());
	if(weight <= 0 || weight == null || isNaN(weight)) {
		error.html("Ein gültiges Gewicht muss eingetragen werden.");
		return;
	}
	if(goodInfo == null || goodInfo == "") {
		error.html("Eine Kategorie und eine Sub-Kategorie müssen ausgewählt sein.");
		return;
	}

	try {
		await Api.fetchSimple("api/stock/remove", {GoodInfo: spec.val(), Weight: weight});
		PrintInfo("Articles have been removed.");
		error.html("");
		$.modal.close();
		UpdateDatatable();
	} catch(e) {
		PrintError(e, error);
	}
}
async function CreateCategory() {
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
		weight = 0;
	}

	let data = {
		Category: name,
		Specification: spec,
		MinWeight: weight
	};

	try {
		await Api.fetchSimple("api/goodInfo/create", data);
		PrintInfo("Category has been created.")
		error.html("");
		$.modal.close();
	} catch(e) {
		PrintError(e, error);
	}
}
async function RemoveCategory() {
	let spec = $("#removeWareSpec");
	let error = $("#removeWareErrorMessage");

	if(spec.val() == null || spec.val() == "") {
		error.html("Ein Warentyp muss mittels der beiden Dropdowns ausgewählt werden.");
		return;
	}

	try {
		await Api.fetchSimple("api/goodinfo/delete", spec.val());
		PrintInfo("Category has been deleted.");
		error.html("");
		$.modal.close();
	} catch(e) {
		PrintError(e, error);
	}
	UpdateDatatable();
}

// UI Functions
async function OpenAddItemWindow(fill_cat) {
	let kg = $("#newWareKG");
	let cat = newWareCat;
	let spec = newWareSpec;
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

	let catList = await GetCategories();
	catList.sort();

	catList.forEach(el => {
		cat.append("<option value='" + el + "'>" + el + "</option>");
	});
	cat.append("<option selected disabled>Kategorie auswählen</option>");
	kg.css("border-color", "red");

	if(fill_cat != null && fill_cat != "") {
		let info = await GetGoodInfo(fill_cat);
		cat.val(info.category);
		ValidateSelectedCategory(cat, "add", info.id);
	}
	cat.refresh();
	spec.refresh();

	if(Api.isAllowed("GoodInfoEdit")) {
		$("#createCategoryBtn").show();
	}
}
async function OpenRemoveItemWindow(fill_cat) {
	let kg = $("#removeWareKg");
	let cat = removeWareCat;
	let spec = removeWareSpec;
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
		let info = await GetGoodInfo(fill_cat);
		cat.val(info.category);
		ValidateSelectedCategory(cat, "remove", info.id);
	}
	removeWareCat.refresh();
	removeWareSpec.refresh();
	if(Api.isAllowed("GoodInfoEdit")) {
		$("#removeCategoryBtn").show();
	}
}
async function OpenCategoryCreatorWindow() {
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

// Valdiation Functions
async function ValidateSelectedCategory(obj, operation, fill) {
	let el = $(obj);
	let specs = await GetSpecsByCategory(el.val());
	let spec = newWareSpec;

	if(operation == "remove") {
		spec = removeWareSpec;
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
	spec.refresh();
}
async function CheckInputKg() {	// Parse input Kg
	let el = $("#newWareKg");
	let weight = parseFloat(el.val());
	let spec = $("#newWareSpec");
	let goodInfo = await GetGoodInfo(spec.val());
	let error = $("#newWareWarningMessage");
}
function AutoFillNewCatSub(obj) {
	let el = $(obj);
	let name = $("#newCatName");

	name.val(el.val());
}

// Datatable & Search
async function CreateDatatable() {
	if(Api.isAllowed("StockView")) {
		let categories = await GetGoodInfoList();
		categories.sort(function(a, b){
	    if(a.specification < b.specification) { return -1; }
	    if(a.specification > b.specification) { return 1; }
	    return 0;
		});

		let data = UpdateDatatable();

		// Initializing dataTables
		stockTable = $("#stockTable").DataTable({
			paging: false,
			scrollCollapse: true,
			info: true,
			responsive:true,
			data: data,
			order: [[1, "asc"]],
			rowGroup: {
				dataSrc: 1
			},
			"dom": '<"stock-toolbar">frtip',
			"columns": [
				{title: "Bezeichnung",},
				{title: "Kategorie", visible:false, width:"50%"},
				{title: "Gewicht", className: "alignRight", width:"30%"},
				{title: "Mindestgewicht", className: "alignRight", width:"20%"},
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
		if(Api.isAllowed("StockEdit")) {
			$("#removeStock").show();
			$("#addStock").show();
		}
	} else {
		$("#viewContainer").html("<legend>Keine Berechtigungen</legend>");
	}
}
async function UpdateDatatable() {
	if(stockTable != null) {
		stockTable.clear();
	}

	let wares = await GetStockList();
	let categories = await GetGoodInfoList();

	let data = [];
	for(let i=0; i < wares.length; i++) {
		let info = categories.find(el => el.id == wares[i].good.goodInfo);
		if(info != null) {
			data[i] = [];
			data[i][1] = info.category;
			data[i][0] = info.specification;

			if(Api.isAllowed("StockEdit")) {
				data[i][2] = '<span class="tools material-icons remove" onclick="OpenRemoveItemWindow(\''+info.id+'\')">remove</span>';
			} else { data[i][2] = ""; }
			data[i][2] += "<span class='cellKg'>" + wares[i].good.weight + " Kg" + "</span>";
			if(Api.isAllowed("StockEdit")) {
				data[i][2] += '<span class="material-icons add" onclick="OpenAddItemWindow(\''+info.id+'\')">add</span>';
			}

			if(info.minWeight > 0) {
				data[i][3] = info.minWeight + " Kg";
			} else {
				data[i][3] = "-";
			}
		}
	}

	if(stockTable != null) {
		stockTable.rows.add(data);
		stockTable.draw();
	}
	return data;
}
function ExternSearch(obj) {
	let select = $(obj);
	CustomSearch(select.val(), "");
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
$(async function () {
	await Api.init();
	if(await HeaderCheckLogin()) {
		await CreateDatatable();

		// Initialize PrettyDropdowns
		newWareCat = $("#newWareCat").prettyDropdown({});
		newWareSpec = $("#newWareSpec").prettyDropdown({});
		removeWareCat = $("#removeWareCat").prettyDropdown({});
		removeWareSpec = $("#removeWareSpec").prettyDropdown({});
		filterByCat = $("#catFilter").prettyDropdown({});
		filterBySpec = $("#specFilter").prettyDropdown({});
		filterByCat.refresh();
		filterBySpec.refresh();
	}
});
