	const monthNames = ["Jänner", "Februar", "März", "April", "Mai", "June", "July", "August", "September", "Oktober", "November", "Dezember"];
	var currentdate = new Date();

	// Initialize "Select" elements
	$('select').selectric({
		maxHeight: 200,
		inheritOriginalWidth: true
	});

	function OpenNeueWarenKategorie() {
		$('#newStockCategory').modal({fadeDuration: 100, closeExisting: false});
	}

	function OpenNeuerWareneingang() {
		let inputs = document.getElementById("newStockPopup").getElementsByClassName("catInput");
		let dateInput = inputs[1];

		dateInput.value = "" + (monthNames[currentdate.getMonth()])  + " " + currentdate.getDate() + " "
						+ currentdate.getFullYear() + ", "
						+ currentdate.getHours() + ":"
						+ currentdate.getMinutes() + " Uhr";
		$('#newStockPopup').modal({fadeDuration: 100});
	}

	function ValidateInputKg(el, onFocus) {
		let input = "";
		for(let i = 0; i < el.value.length; i++) {
			if(!isNaN(el.value[i]) || el.value[i] == ".") {
				input += el.value[i];
			}
		}

		if(!onFocus) {
			el.value = input + " Kg";
		} else {
			el.value = input.trim();
		}
	}
