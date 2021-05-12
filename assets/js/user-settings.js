// Server functions
async function LoadSettings() {	// Initializes content
	$("#userName").val(Api.user.username);
	$("#userGroup").html(Api.user.group.groupname);
	$("#userLetter").html(Api.user.username[0]);
	$("#logoUserName").html(Api.user.username);
	$("#logoCircle").css("background-color", $("#logoBackground").css("background-color"));
	let permHtml = "";

	Api.user.group.permissions.forEach(el => {
		permHtml += "<div class='perm'>";
		permHtml += permissionNames[el];
		permHtml += "</div>";
	});
	$("#userPermissions").html(permHtml);
}
async function UploadChanges() {
	let username = Api.user.username;
	let password = "";
	if ($("#userPassword").val().length > 2) {
		password = $("#userPassword").val();
		await Api.changePassword(Api.user.username, password);
		$("#userPassword").val("");
	}
	if ($("#userName").val() != Api.user.username) {
		username = $("#userName").val();
		await Api.changeUsername(Api.user.username, username);
	}

	if (password.length > 2) {
		await AttemptLogin(username, password);
		await HeaderCheckLogin();
		await LoadSettings();
	} else {
		logout();
	}
	ExitEditMode();
}
// UI functions
function EnterEditMode() {
	$("#passwordRow").show();
	$("#saveBtn").show();
	$("#cancelBtn").show();
	$("#editBtn").hide();
	$("#userName").attr("disabled", false);
	$("#userPassword").attr("disabled", false);
}
function ExitEditMode() {
	$("#passwordRow").hide();
	$("#saveBtn").hide();
	$("#cancelBtn").hide();
	$("#userName").attr("disabled", true);
	$("#userPassword").attr("disabled", true);
	if (Api.isAllowed("UserSelfEdit")) {
		$("#editBtn").show();
	} else {
		$("#editBtn").hide();
	}
}

$(async function() {
	if (await HeaderCheckLogin()) {
		ExitEditMode();
		await LoadSettings();
	}
});
