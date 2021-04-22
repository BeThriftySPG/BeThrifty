var permissions = new Array(); // All avialable Permissions
var users = new Array(); // All avialable Users
var currentGroupPerms = new Array(); // All avialable Groups
var currentGroupName; // Selected Group
var isNewGroup = false; // Used to check if the used group is new or loaded
var isNewUser = false; // Used to check if the used user is new or loaded
var permissionNames =  { // Converts variable names to language
	"UserCreate": "Benutzer erstellen",
	"UserChangeName": "Benutzername ändern",
	"SameUserChangeName": "Eigenen Benutzernamen ändern",
	"UserChangePassword": "Benutzer Passwort ändern",
	"SameUserChangePassword": "Eigenes Benutzer Passwort ändern",
	"UserChangeGroup": "Benutzergruppe ändern",
	"SameUserChangeGroup": "Eigene Benutzergruppe ändern",
	"UserDelete": "Benutzer löschen",
	"SameUserDelete": "Eigenen Benutzer löschen",
	"GroupCreate": "Gruppe erstellen",
	"GroupChangePermissions": "Gruppen Berechtigung ändern",
	"GroupDelete": "Gruppe löschen",
	"GoodInfoView": "Kategorien lesen",
	"GoodInfoEdit": "Kategorien ändern",
	"StockView": "Lagerbestand lesen",
	"StockEdit": "Lagerbestand ändern",
	"StockViewHistory": "Lagerbestandverlauf lesen",
	"EventView": "Events lesen",
	"EventEdit": "Events ändern",
};

async function FetchUsers() {
	const userTable = document.getElementById("userTable");

	// Fetch Users and their groups
	for(const val of await Api.fetchSimple("api/users")) {
		let tr = document.createElement("tr");
		let userName = document.createElement("td");
		let userGroup = document.createElement("td");
		let userOptions = document.createElement("td");
		let userDeleteButton = document.createElement("div");
		let userEditButton = document.createElement("div");

		userName.innerHTML = val.username;
		userGroup.innerHTML = val.group.groupname;
		userEditButton.innerHTML = "Bearbeiten";
		userDeleteButton.innerHTML = "Löschen";
		userDeleteButton.setAttribute("onclick", "DeleteUser('"+val.username+"')");
		userEditButton.setAttribute("onclick", "EditUser('"+val.username+"')");

		userDeleteButton.setAttribute("class", "optionButton");
		userEditButton.setAttribute("class", "optionButton");
		userOptions.setAttribute("class", "optionButtonTd");

		userOptions.appendChild(userEditButton);
		userOptions.appendChild(userDeleteButton);
		tr.appendChild(userName);
		tr.appendChild(userGroup);
		tr.appendChild(userOptions);
		userTable.appendChild(tr);
	}
}
// Fetches all avialable user groups
async function FetchUserGroups() {
	const groupDrop = document.getElementById("userGroupInput");
	const groupTable = document.getElementById("groupTable");

	// Fetch Groups and build List with groups and permissions
	for(const val of await Api.fetchSimple("api/groups")) {
		let tr = document.createElement("tr");
		let groupName = document.createElement("td");
		let groupPerms = document.createElement("td");
		let groupOptions = document.createElement("td");
		let groupPermsDiv = document.createElement("div");
		let groupDeleteButton = document.createElement("div");
		let groupEditButton = document.createElement("div");

		groupName.innerHTML = val.groupname;
		groupEditButton.innerHTML = "Bearbeiten";
		groupDeleteButton.innerHTML = "Löschen";
		groupDeleteButton.setAttribute("onclick", "DeleteGroup('"+val.groupname+"')");
		groupEditButton.setAttribute("onclick", "EditGroup('"+val.groupname+"')");

		for(const p of val.permissions) {
			groupPermsDiv.appendChild(CreatePermissionItem(p));
		}

		groupPermsDiv.setAttribute("class", "groupPermissionList");
		groupDeleteButton.setAttribute("class", "optionButton");
		groupEditButton.setAttribute("class", "optionButton");
		groupOptions.setAttribute("class", "optionButtonTd");

		groupOptions.appendChild(groupEditButton);
		groupOptions.appendChild(groupDeleteButton);
		groupPerms.appendChild(groupPermsDiv);
		tr.appendChild(groupName);
		tr.appendChild(groupPerms);
		tr.appendChild(groupOptions);
		groupTable.appendChild(tr);
	}

	for(const val of await Api.fetchSimple("api/groups")) {
		let option = document.createElement("option");
		option.innerHTML = val.groupname;
		groupDrop.appendChild(option);
	}
}
// Fetches all avialable permissions for groups
async function FetchPermissions() {
	const permList = document.getElementById("permissionsContainer");
	let c = 0;

	for(const val of await Api.fetchSimple("api/permissions")) {
		permissions[c] = val;
		let li = document.createElement("li");
		li.innerHTML = val;
		//permList.appendChild(li);
		c++;
	}
}
// Creates a DIV with an "a" element as a clickable removeable item field
function CreatePermissionItem(perm) {
	let pDiv = document.createElement("div");
	let a = document.createElement("a");
	a.innerHTML = permissionNames[perm];
	pDiv.appendChild(a);
	return pDiv;
}
// Shows or Hides the Group Edit-Tab as Creation-Tab
function ToggleNewUser(state) {
	const box = document.getElementById("userEditContainer");
	if(state) {
		box.style.display = "initial";
		document.getElementById("toggleNewUserButton").style.display = "none";
	} else {
		box.style.display = "none";
		document.getElementById("toggleNewUserButton").style.display = "initial";
	}
}
// Shows or Hides the Group Edit-Tab
function ToggleGroupEdit(state) {
	const box = document.getElementById("groupEditContainer");
	if(state) {
		box.style.display = "initial";
		document.getElementById("toggleNewGroupButton").style.display = "none";
	} else {
		box.style.display = "none";
		document.getElementById("toggleNewGroupButton").style.display = "initial";
	}
}
// Fills the User-Edit Tab with the given information
async function EditUser(username) {
	ToggleNewUser(true);
	const usernameInput = document.getElementById("usernameInput");
	const userPasswordInput = document.getElementById("userGroupInput");
	const userGroupInput = document.getElementById("userGroupInput")
	if(!isNewUser) {
		const user = await Api.fetchSimple("api/user", username);
		usernameInput.value = user.username;
		userPasswordInput.value = "";
		userGroupInput.value = user.group.groupname;
		document.getElementById("confirmUserChangeButton").innerHTML = "Aktualisieren";
		document.getElementById("confirmUserChangeButton").onclick = function() {
			UpdateUser(username, usernameInput.value, userPasswordInput.value, userGroupInput.value);
		};
	} else {
		document.getElementById("confirmUserChangeButton").innerHTML = "Anlegen";
		usernameInput.value = username;
		userPasswordInput.value = "";
		userGroupInput.value = "NONE";
	}

}
// Create User
async function CreateUser() {
	try {
		Api.createUser($("#usernameInput").val(), $("#userPasswordInput").val(), $("#userGroupInput").val());
		PrintInfo("User has been created.");
	} catch(e) {
		PrintError();
	}
}
async function DeleteUser(name) {
	try {
		Api.deleteUser(name);
		PrintInfo("User " + name + " has been deleted.")
	} catch(e) {
		PrintError(e);
	}
}
async function UpdateUser(old, name, password, group) {
	try {
		Api.changePassword(old, password);
		Api.changeGroup(old, group);
		Api.changeUsername(old, name);
		PrintInfo("User information updated.");
	} catch(e) {
		PrintError(e);
	}
}
async function OpenCreateUserWindow() {
	document.getElementById("confirmUserChangeButton").innerHTML = "Erstellen";
	isNewUser = true;

	EditUser("");
}
// Creates a new Group using the EditGroup function
function CreateGroup() {
	const box = document.getElementById("groupEditPermissionContainer");
	document.getElementById("confirmGroupChangeButton").innerHTML = "Erstellen";
	currentGroupPerms = new Array();
	currentGroupName = "";
	isNewGroup = true;

	EditGroup("");
}
// Deletes the given group
async function DeleteGroup(groupName) {
	let result = await Api.deleteGroup(groupName);

	if(!result) {
		console.error("Permission not granted to delete groups.");
	} else {
		console.log("Group deleted: " + groupName);
		location.reload();
	}
}
// Upload an edited group or Create as new
async function UploadGroupEdit() {
	let result;
	console.log("Uploading Group: " + currentGroupName);
	console.log("With Permissions: " + currentGroupPerms);

	if(isNewGroup) {
		result = await Api.createGroup(document.getElementById("editGroupName").value, currentGroupPerms);
	} else {
		await Api.changeGroupname(currentGroupName, document.getElementById("editGroupName").value);
		result = await Api.changePermissions(currentGroupName , currentGroupPerms);
	}
	if(result) {
		location.reload();
	} else {
		console.error("Uploading new Group failed.");
	}
}
// Fills the Group-Edit Tab with the given information
async function EditGroup(groupName) {
	ToggleGroupEdit(true);
	const box = document.getElementById("groupEditPermissionContainer");
	box.innerHTML = "";
	document.getElementById("editGroupName").value = groupName;
	currentGroupPerms = new Array();
	currentGroupName = groupName;
	let c = 0;
	let perms = new Array();

	if(!isNewGroup) {
		document.getElementById("confirmGroupChangeButton").innerHTML = "Aktualisieren";
		perms = (await Api.fetchSimple("api/group", groupName)).permissions;
	}

	// Fetching all permissions of this group
	for(const val of perms) {
		currentGroupPerms[c] = val;
		let item = CreatePermissionItem(val);
		item.setAttribute("class", "groupEditItem");
		item.setAttribute("onclick", "GroupEditRemoveItem('"+val+"')");
		item.setAttribute("id", ''+val+'');
		item.innerHTML += "<a class='material-icons deleteIcon'>close</a>";
		box.appendChild(item);
		c++;
	}
	BuildEditGroupPermissions();
}
// Adds a new permission to the selected Group
function GroupEditAddItem() {
	const box = document.getElementById("groupEditPermissionContainer");
	const value = document.getElementById("groupEditSelect").value;
	currentGroupPerms.push(value);
	console.log("ADD: " + value);

	let item = CreatePermissionItem(value);
	item.setAttribute("class", "groupEditItem");
	item.setAttribute("onclick", "GroupEditRemoveItem('"+value+"')");
	item.setAttribute("id", ''+value+'');
	item.innerHTML += "<a class='material-icons deleteIcon'>close</a>";
	box.appendChild(item);

	BuildEditGroupPermissions();
}
// Removes a permission from the selected Group
function GroupEditRemoveItem(item) {
	console.log("REMOVE: " + item);
	const box = document.getElementById("groupEditSelect");
	currentGroupPerms.splice(currentGroupPerms.indexOf(item), 1);
	document.getElementById("groupEditPermissionContainer").removeChild(document.getElementById(item));
	BuildEditGroupPermissions();
}
// Refreshes the "Select" Dropdown in the Group Edit-Tab with the given permissions
function BuildEditGroupPermissions() {
	const select = document.getElementById("groupEditSelect");
	select.innerHTML = "";
	let blank = document.createElement("option");
	blank.innerHTML = "Berechtigungen auswählen";
	blank.setAttribute("disabled", "disabled");
	blank.setAttribute("selected", "true");
	select.appendChild(blank);

	// Creating a <select> for missing permissions
	for(const val of permissions) {
		if(currentGroupPerms.includes(val) == false) {
			let opt = document.createElement("option");
			opt.innerHTML = permissionNames[val];
			opt.value = val;
			select.appendChild(opt);

		}
		if(select.innerHTML.length == 0) {
			select.style.display = "none";
		} else {
			select.style.display = "initial";
		}
	}
}

$(async function () {
	await Api.init();
	if(await HeaderCheckLogin()) {
		// Loads all avialable Groups and Permissions on page-load
		await FetchUsers();
		await FetchUserGroups();
		await FetchPermissions();
	}
});
