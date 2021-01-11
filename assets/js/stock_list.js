var stockList = document.getElementById("stockList");
var stockClone = document.getElementsByClassName("stock")[0].cloneNode(true);
var sackClone = stockClone.getElementsByClassName("sackItem")[0].cloneNode(true);
document.getElementsByClassName("stock")[0].style.display = "none";

$('#categoryPopup').on($.modal.AFTER_CLOSE, function(event, modal) {
	// Clear popup form
	event.target.getElementsByClassName("catInput")[0].value = "";
	event.target.getElementsByClassName("catInput")[1].value = "";
	event.target.getElementsByClassName("catInput")[2].value = 0;
});

function UploadNewCategory() {

}
function PrintCategory(data) {
	let content = stockList.querySelector("#addStockButton");
	let node = stockClone.cloneNode(true);
	let sackList = node.getElementsByClassName("sackList")[0];
	let inputs = node.querySelectorAll(".catItem");
	let button = node.querySelector("#addSackButton");
	sackList.innerHTML = "";
	inputs[0].innerHTML = data["title"] + " " + data["specification"];
	inputs[1].innerHTML = "Säcke " + data["sacks"].length;
	let sumWeight = 0;
	for(let i = 0; i < data["sacks"].length; i++) {
		let s = sackClone.cloneNode(true);
		s.querySelector("li").innerHTML = "Sack " + (i + 1);
		s.querySelector(".sackGewicht").value = data["sacks"][i];
		sackList.appendChild(s);
		sumWeight += data["sacks"][i];
	}
	inputs[2].innerHTML = "Gesamtgewicht " + sumWeight + "Kg";	// calculate
	inputs[3].innerHTML = "min. Gewicht " + data["minWeight"] + "Kg";
	let sackDiv = node.querySelector("#sackListDiv");
	let stockCollArrow = node.getElementsByClassName("collapse-arrow")[0];
	sackDiv.id = ("sackListDiv_" + inputs[0].innerHTML).replace(/ /g,'.');

	node.getElementsByClassName("stockItem")[0].onclick = function ToggleCategory() {
		if(sackDiv.style.display == "none") {
			sackDiv.style.display = "inherit";
			stockCollArrow.style.transform = "rotateZ(90deg)";
		} else {
			sackDiv.style.display = "none";
			stockCollArrow.style.transform = "rotateZ(0deg)";
		}
	};
	node.querySelector("#editCatButton").onclick = function EditCategory() {
		event.stopPropagation();
		let node = document.getElementById("editCategoryPopup");
		let inputs = node.getElementsByClassName("catInput");
		let delButton = node.querySelector("#deleteButton");
		inputs[0].value = data["title"];
		inputs[1].value = data["specification"];
		inputs[2].value = data["minWeight"];
		delButton.onclick = function DeleteButton() {
			$("#deleteCategoryPopup").modal({fadeDuration: 100, closeExisting: false});
		}
		$("#editCategoryPopup").modal({fadeDuration: 100});
	}
	sackDiv.style.display = "none";
	sackList.appendChild(button);
	stockList.appendChild(node);
	stockList.appendChild(content);
}
function UploadNewSack() {

}
