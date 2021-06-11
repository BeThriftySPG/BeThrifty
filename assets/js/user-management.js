var permissions = new Array(); // All avialable Permissions
var users = new Array(); // All avialable Users
var currentGroupPerms = new Array(); // All avialable Groups
var currentGroupName; // Selected Group
var isNewGroup = false; // Used to check if the used group is new or loaded
var isNewUser = false; // Used to check if the used user is new or loaded
var userGroupInput;
var groupEditSelect;

// Initialization functions
async function FetchUsers() {
	// Fetches all avialable user groups
	const userTable = document.getElementById("userTable");
	userTable.innerHTML = "";

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
		if(Api.isAllowed("UserDelete")) {
			userDeleteButton.innerHTML = "Löschen";
			userDeleteButton.setAttribute("onclick", "DeleteUser('"+val.username+"')");
			userDeleteButton.setAttribute("class", "optionButton");
		}
		if(Api.isAllowed("UserEdit")) {
			userEditButton.innerHTML = "Bearbeiten";
			userEditButton.setAttribute("onclick", "EditUser('"+val.username+"')");
			userEditButton.setAttribute("class", "optionButton");
		}
		if(Api.isAllowed("UserCreate") == false) {
			$("#toggleNewUserButton").hide();
		}
		userOptions.setAttribute("class", "optionButtonTd");

		userOptions.appendChild(userEditButton);
		userOptions.appendChild(userDeleteButton);
		tr.appendChild(userName);
		tr.appendChild(userGroup);
		tr.appendChild(userOptions);
		userTable.appendChild(tr);
	}
}
async function FetchUserGroups() {
	// Fetches all avialable permissions for groups
	const groupDrop = document.getElementById("userGroupInput");
	const groupTable = document.getElementById("groupTable");
	groupTable.innerHTML = "";

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
		if(Api.isAllowed("GroupDelete")) {
			groupDeleteButton.innerHTML = "Löschen";
			groupDeleteButton.setAttribute("onclick", "DeleteGroup('"+val.groupname+"')");
			groupDeleteButton.setAttribute("class", "optionButton");
		}
		if(Api.isAllowed("GroupEdit")) {
			groupEditButton.innerHTML = "Bearbeiten";
			groupEditButton.setAttribute("onclick", "EditGroup('"+val.groupname+"')");
			groupEditButton.setAttribute("class", "optionButton");
		}
		if(Api.isAllowed("GroupCreate") == false) {
			$("#toggleNewGroupButton").hide();
		}

		for(const p of val.permissions) {
			groupPermsDiv.appendChild(CreatePermissionItem(p));
		}

		groupPermsDiv.setAttribute("class", "groupPermissionList");
		groupOptions.setAttribute("class", "optionButtonTd");

		groupOptions.appendChild(groupEditButton);
		groupOptions.appendChild(groupDeleteButton);
		groupPerms.appendChild(groupPermsDiv);
		tr.appendChild(groupName);
		tr.appendChild(groupPerms);
		tr.appendChild(groupOptions);
		groupTable.appendChild(tr);
	}

	/*for(const val of await Api.fetchSimple("api/groups")) {
		let option = document.createElement("option");
		option.innerHTML = val.groupname;
		groupDrop.appendChild(option);
	}*/
	UpdateUserGroupDropdown();
}
async function FetchPermissions() {
	// Creates a DIV with an "a" element as a clickable removeable item field
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
async function UpdateData() {	// Refresh content after updates
	await FetchUsers();
	await FetchUserGroups();
	await FetchPermissions();
	$("#usernameInput").val("");
	$("#userPasswordInput").val("");
}
// UI functions
async function OpenCreateUserWindow() {
	document.getElementById("confirmUserChangeButton").innerHTML = "Erstellen";
	isNewUser = true;

	EditUser("");
}
async function UpdateUserGroupDropdown(group) {
	let userGroupInput = $("#userGroupInput");
	let groups = await Api.fetchSimple("api/groups");
	groups.forEach(el => {
		if(group != null && el.groupname == group) {
			//userGroupInput.append("<option selected disabled value='" + el.groupname + "'>" + el.groupname + "</option>");
		} else {
			userGroupInput.append("<option value='" + el.groupname + "'>" + el.groupname + "</option>");
		}
	});
	//userGroupInput.refresh();
}
function CreateGroup() {
	// Creates a new Group using the EditGroup function
	const box = document.getElementById("groupEditPermissionContainer");
	document.getElementById("confirmGroupChangeButton").innerHTML = "Erstellen";
	currentGroupPerms = new Array();
	currentGroupName = "";
	isNewGroup = true;

	EditGroup("");
}
function CreatePermissionItem(perm) {
	// Shows or Hides the Group Edit-Tab as Creation-Tab
	let pDiv = document.createElement("div");
	let a = document.createElement("a");
	a.innerHTML = permissionNames[perm];
	pDiv.appendChild(a);
	return pDiv;
}
function ToggleNewUser(state) {
	// Shows or Hides the Group Edit-Tab
	const box = document.getElementById("userEditContainer");
	if(state) {
		box.style.display = "initial";
		document.getElementById("toggleNewUserButton").style.display = "none";
	} else {
		box.style.display = "none";
		document.getElementById("toggleNewUserButton").style.display = "initial";
	}
}
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
function GroupEditAddItem() {
	// Adds a new permission to the selected Group
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
function GroupEditRemoveItem(item) {
	// Removes a permission from the selected Group
	console.log("REMOVE: " + item);
	const box = document.getElementById("groupEditSelect");
	currentGroupPerms.splice(currentGroupPerms.indexOf(item), 1);
	document.getElementById("groupEditPermissionContainer").removeChild(document.getElementById(item));
	BuildEditGroupPermissions();
}
function BuildEditGroupPermissions() {
	// Refreshes the "Select" Dropdown in the Group Edit-Tab with the given permissions
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
	//userGroupInput.refresh();
	//groupEditSelect.refresh();
}
function InitDropdowns() {
	userGroupInput = $("#userGroupInput").prettyDropdown({
		hoverIntent:-1,
		height:40,
		width:150,
		selectedMarker:"",
	});
	groupEditSelect = $("#groupEditSelect").prettyDropdown({
		hoverIntent:-1,
		height:40,
		width:150,
		selectedMarker:"",
	});
}
// User functions
async function CreateUser() {
	try {
		await Api.createUser($("#usernameInput").val(), $("#userPasswordInput").val(), $("#userGroupInput").val());
		await UpdateData();
		ToggleNewUser();
		PrintInfo("User has been created.");
	} catch(e) {
		PrintError(e);
	}
}
async function DeleteUser(name) {
	try {
		await Api.deleteUser(name);
		await UpdateData();
		PrintInfo("User " + name + " has been deleted.");
	} catch(e) {
		PrintError(e);
	}
}
async function UpdateUser(old, name, password, group) {
	try {
		if(password.length > 2) {
			await Api.changePassword(old, password);
		} else {
			PrintInfo("No change in user password.");
		}
		await Api.changeGroup(old, group);
		await Api.changeUsername(old, name);
		await UpdateData();
		ToggleNewUser();
		PrintInfo("User information updated.");
	} catch(e) {
		PrintError(e);
	}
}
async function EditUser(username) {
	// Fills the User-Edit Tab with the given information
	ToggleNewUser(true);
	const usernameInput = document.getElementById("usernameInput");
	const userPasswordInput = document.getElementById("userPasswordInput");
	const userGroupInput = document.getElementById("userGroupInput")
	if(!isNewUser) {
		const user = await Api.fetchSimple("api/user", username);
		usernameInput.value = user.username;
		userPasswordInput.value = $("#userPasswordInput").val();
		userGroupInput.value = user.group.groupname;
		document.getElementById("confirmUserChangeButton").innerHTML = "Aktualisieren";
		document.getElementById("confirmUserChangeButton").onclick = function() {
			UpdateUser(username, usernameInput.value, $("#userPasswordInput").val(), userGroupInput.value);
		};
		UpdateUserGroupDropdown(user.group.groupname);
	} else {
		document.getElementById("confirmUserChangeButton").innerHTML = "Anlegen";
		usernameInput.value = username;
		userPasswordInput.value = "";
		userGroupInput.value = "NONE";
	}
}
// Group functions
async function DeleteGroup(groupName) {
	// Deletes the given group
	try {
		await Api.deleteGroup(groupName);
		PrintInfo("Group has been deleted!");
		UpdateData();
	} catch(e) {
		PrintError(e);
	}
}
async function UploadGroupEdit() {
	// Upload an edited group or Create as new
	try {
		if(isNewGroup) {
			await Api.createGroup(document.getElementById("editGroupName").value, currentGroupPerms);
			PrintInfo("Group has been created!");
			UpdateData();
		} else {
			await Api.changeGroupname(currentGroupName, document.getElementById("editGroupName").value);
			await Api.changePermissions(currentGroupName , currentGroupPerms);
			PrintInfo("Group info has been changed!");
			UpdateData();
		}
	} catch(e) {
		PrintError(e);
	}
	ToggleGroupEdit(false);
}
async function EditGroup(groupName) {	// Create or upload modified Groups, isNewGroup = false
	// Fills the Group-Edit Tab with the given information
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
	//userGroupInput.refresh();
	//groupEditSelect.refresh();
}

$(async function () {
	if(await HeaderCheckLogin()) {
		// Loads all avialable Groups and Permissions on page-load
		//InitDropdowns();
		await FetchUsers();
		await FetchUserGroups();
		await FetchPermissions();
	}
});
