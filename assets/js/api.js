"use strict";

if(this.Api === undefined) {
	this.Api = (function() {
		//const apiServerAdress = "https://whitehelmet.ddns.net:5001/";
		const apiServerAdress = "http://91.113.62.68:5000/";
		const apiCreateUserPage = "api/user/create";
		const apiLoginPage = "api/user/login";
		const apiRefreshTokenPage = "api/user/refreshToken";
		const apiChangeUsernamePage = "api/user/changeUsername";
		const apiChangePasswordPage = "api/user/changePassword";
		const apiChangeGroupPage = "api/user/changeGroup";
		const apiDeleteUserPage = "api/user/delete";
		const apiCreateGroupPage = "api/group/create";
		const apiChangeGroupnamePage = "api/group/changeGroupname";
		const apiChangePermissionsPage = "api/group/changePermissions";
		const apiDeleteGroupPage = "api/group/delete";

		let jwtToken = null;
		let refreshTokenTimeout = null;
		let _username = null;
		let _password = null;
		let initialized = false;

		const output = {
			"init": init,
			"fetch": fetchFromApi3,
			"fetchSimple": fetchFromApiSimple,
			"createUser": createUser,
			"login": login2,
			"logout": logout,
			"isLoggedin": isLoggedin,
			"isStayLoggedIn": isStayLoggedIn,
			"changeUsername": changeUsername,
			"changePassword": changePassword,
			"changeGroup": changeGroup,
			"deleteUser": deleteUser,
			"createGroup": createGroup,
			"changeGroupname": changeGroupname,
			"changePermissions": changePermissions,
			"deleteGroup": deleteGroup,
			"onRequiresRelogin": function() {},
		};

		function init() {
			return new Promise(function(resolve, _) {
				if(initialized) {
					resolve();
					return;
				}
				initialized = true;

				_username = localStorage.getItem("username");
				_password = localStorage.getItem("password");
				if(typeof(_username) === "string" && typeof(_password) === "string") {
					login(_username, _password).then(function(result) {
						if(result !== true) {
							_username = null;
							_password = null;
							localStorage.removeItem("username");
							localStorage.removeItem("password");
						}
						resolve();
					});
				} else {
					_username = null;
					_password = null;
					const token = sessionStorage.getItem("jwt-token");
					if(typeof(token) !== "undefined") {
						setJwtToken(token);
					}
					resolve();
				}
			});
		}

		function setJwtToken(token) {
			if(typeof(token) === "string") {
				jwtToken = token;
				setRefreshTokenTimeout();
				sessionStorage.setItem("jwt-token", token);
			} else {
				if(refreshTokenTimeout !== null) {
					clearTimeout(refreshTokenTimeout);
				}
				jwtToken = null;
				sessionStorage.removeItem("jwt-token");
			}
		}

		function refreshToken() {
			fetchFromApi3(apiRefreshTokenPage).then(function(response) {
				if(response.ok) {
					response.text().then(function(token) {
						setJwtToken(token);
					});
				} else {
					setJwtToken(null);
					if(_username !== null && _password !== null) {
						login(_username, _password).then(function(result) {
							if(result !== true) {
								_username = null;
								_password = null;
								localStorage.removeItem("username");
								localStorage.removeItem("password");
								if(typeof(output["onRequiresRelogin"]) === "function") {
									output["onRequiresRelogin"]();
								}
							}
						});
					} else {
						if(typeof(output["onRequiresRelogin"]) === "function") {
							output["onRequiresRelogin"]();
						}
					}
				}
			}).catch(function() {
				setJwtToken(null);
			});
		}

		function setRefreshTokenTimeout() {
			const expTime = JSON.parse(decodeURIComponent(atob(jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))))["exp"] * 1000 - 10000 - Date.now();
			if(expTime > 0) {
				if(refreshTokenTimeout !== null) {
					clearTimeout(refreshTokenTimeout);
				}
				refreshTokenTimeout = setTimeout(refreshToken, expTime);
			} else {
				setJwtToken(null);
				if(_username !== null && _password !== null) {
					login(_username, _password).then(function(result) {
						if(result !== true) {
							_username = null;
							_password = null;
							localStorage.removeItem("username");
							localStorage.removeItem("password");
							if(typeof(output["onRequiresRelogin"]) === "function") {
								output["onRequiresRelogin"]();
							}
						}
					});
				} else {
					if(typeof(output["onRequiresRelogin"]) === "function") {
						output["onRequiresRelogin"]();
					}
				}
			}
		}

		function arrayBufferBase64(arrayBuffer) {
			let binary = "";
			const bytes = new Uint8Array(arrayBuffer);
			const len = bytes.byteLength;
			for (let i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return window.btoa(binary);
		}

		function hashPassword(password) {
			return new Promise(function(resolve, reject) {
				if(typeof(window.crypto) !== "undefined") {
					window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)).then(function(digestBuffer) {
						resolve(arrayBufferBase64(digestBuffer));
					});
				} else if(typeof(window.msCrypto) !== "undefined") {
					const operation = window.msCrypto.subtle.digest("SHA-256", new TextEncoder().encode(password))
					operation.oncomplete = function(e) {
						resolve(arrayBufferBase64(e.target.result));
					};
				} else {
					reject("no crypto method found");
				}
			});
		}

		function fetchFromApi(path, data, secondTry, resolve, reject) {
			let promise = null;
			const headers = {};
			if(jwtToken !== null) {
				headers["Authorization"] = "Bearer " + jwtToken;
			}
			if(typeof(data) === "undefined") {
				promise = fetch(apiServerAdress + path, {
					method: "GET",
					"headers": headers
				});
			} else {
				headers["Content-Type"] = "application/json";
				promise = fetch(apiServerAdress + path, {
					method: "POST",
					"headers": headers,
					body: JSON.stringify(data)
				});
			}
			promise.then(function(response) {
				if(response.status === 401) {
					setJwtToken(null);
					if(secondTry !== true && _username !== null && _password !== null) {
						fetchFromApi2(path, data, true).then(function(response2) {
							resolve(response2);
						}).catch(function(error2) {
							reject(error2);
						});
					} else {
						resolve(response);
					}
				} else {
					resolve(response);
				}
			}).catch(function(error) {
				reject(error);
			});
		}

		function fetchFromApi2(path, data, secondTry) {
			return new Promise(function(resolve, reject) {
				if(jwtToken === null && _username !== null && _password !== null) {
					login(_username, _password).then(function(result) {
						if(result !== true) {
							_username = null;
							_password = null;
							localStorage.removeItem("username");
							localStorage.removeItem("password");
							if(typeof(output["onRequiresRelogin"]) === "function") {
								output["onRequiresRelogin"]();
							}
						}
						fetchFromApi(path, data, secondTry, resolve, reject);
					});
				} else {
					fetchFromApi(path, data, secondTry, resolve, reject);
				}
			});
		}

		function fetchFromApi3(path, data) {
			return fetchFromApi2(path, data);
		}

		function fetchFromApiSimple(path, data) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(path, data).then(function(response) {
					if(response.ok) {
						let contentType = response.headers.get("Content-Type");
						if(contentType === null) {
							resolve(undefined);
						} else {
							response.text().then(function(str) {
								if(typeof(contentType) === "string" && contentType.startsWith("application/json")) {
									try {
										resolve(JSON.parse(str));
									} catch {
										resolve(str);
									}
								} else {
									resolve(str);
								}
							}).catch(function(error3) {
								reject(error3);
							});
						}
					} else {
						response.text().then(function(str) {
							try {
								reject(JSON.parse(str));
							} catch {
								if(typeof(str) !== "string" || str === "") {
									reject("Received status code: " + response.status + " in response to " + path + " " + data);
								} else {
									reject(str);
								}
							}
						}).catch(function(error3) {
							reject(error3);
						});
					}
				}).catch(function(error) {
					reject(error);
				})
			});
		}

		function createUser(username, password, groupname) {
			return new Promise(function(resolve, reject) {
				hashPassword(password).then(function(passwordHash) {
					fetchFromApi3(apiCreateUserPage, { Username: username, Password: passwordHash, Groupname: groupname }).then(function(response) {
						resolve(response.ok);
					}).catch(function(error) {
						reject(error);
					});
				});
			});
		}

		function login(username, password) {
			return new Promise(function(resolve, _) {
				fetchFromApi(apiLoginPage, { Username: username, Password: password }, true, function(response) {
					if(response.ok) {
						response.text().then(function(token) {
							setJwtToken(token);
							resolve(true);
						});
					} else {
						resolve(false);
					}
				}, function() {
					setJwtToken(null);
					resolve(false);
				});
			});
		}

		function login2(username, password, stayLoggedIn) {
			logout();
			return new Promise(function(resolve, reject) {
				hashPassword(password).then(function(passwordHash) {
					if(stayLoggedIn === true) {
						_username = username;
						_password = passwordHash;
						localStorage.setItem("username", username);
						localStorage.setItem("password", passwordHash);
					}
					fetchFromApi3(apiLoginPage, { Username: username, Password: passwordHash }).then(function(response) {
						if(response.ok) {
							response.text().then(function(token) {
								setJwtToken(token);
								resolve(true);
							});
						} else {
							resolve(false);
						}
					}).catch(function(error) {
						reject(error);
					});
				});
			});
		}

		function logout() {
			setJwtToken(null);
			_username = null;
			_password = null;
			localStorage.removeItem("username");
			localStorage.removeItem("password");
		}

		function isLoggedin() {
			return jwtToken !== null;
		}

		function isStayLoggedIn() {
			return _username !== null && _password !== null;
		}

		function changeUsername(oldUsername, newUsername) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiChangeUsernamePage, { OldUsername: oldUsername, NewUsername: newUsername }).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function changePassword(username, password) {
			return new Promise(function(resolve, reject) {
				hashPassword(password).then(function(passwordHash) {
					fetchFromApi3(apiChangePasswordPage, { Username: username, Password: passwordHash }).then(function(response) {
						resolve(response.ok);
					}).catch(function(error) {
						reject(error);
					});
				});
			});
		}

		function changeGroup(username, groupname) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiChangeGroupPage, { Username: username, Groupname: groupname }).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function deleteUser(username) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiDeleteUserPage, username).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function createGroup(groupname, permissions) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiCreateGroupPage, { Groupname: groupname, Permissions: permissions }).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function changeGroupname(oldGroupname, newGroupname) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiChangeGroupnamePage, { OldGroupname: oldGroupname, NewGroupname: newGroupname }).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function changePermissions(groupname, permissions) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiChangePermissionsPage, { Groupname: groupname, Permissions: permissions }).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		function deleteGroup(groupname) {
			return new Promise(function(resolve, reject) {
				fetchFromApi3(apiDeleteGroupPage, groupname).then(function(response) {
					resolve(response.ok);
				}).catch(function(error) {
					reject(error);
				});
			});
		}

		return output;
	})();
}

// Helper functions
async function GetCategories() {
	// Get List of all Categories
	return await Api.fetchSimple("api/goodInfo/categories");
}
async function GetSpecsByCategory(category) {
	// Get Specification by Category-Id
	return await Api.fetchSimple("api/goodinfo/find", {Category: category, Specification: null});
}
async function GetAvialableKg(id) {
	// Get Avialable KG by Category-Id
	return await Api.fetchSimple("api/stock", id);
}
async function GetGoodInfo(id) {
	return await Api.fetchSimple("api/goodinfo", id);
}
async function GetGoodInfoList(id) {
	return await Api.fetchSimple("api/goodInfos");
}
async function GetStockList() {
	return await Api.fetchSimple("api/stock/list");
}
async function GetEvents() {
	return await Api.fetchSimple("api/events");
}

// UI Functions
async function DisplayAvialableKg(selectSource, targetId) {
	// Displays avialable Kg by Category Id. selectSource = <select> returns id, targetId = target DOM.html()
	let info = await Api.fetchSimple("api/stock", $("#"+selectSource).val());
	$("#" + targetId).html("Verfügbar: " + info.good.weight + "Kg");
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

// Login Functions
async function HeaderCheckLogin() {
	await Api.init();
	if(Api.isLoggedin()) {
		PrintInfo("Login status: " + Api.isLoggedin());
		let name = (await Api.fetchSimple("Api/user")).username;
		document.getElementsByClassName("logo")[0].style.display = "inherit";
		document.getElementById("input-name").style.display = "none";
		document.getElementById("input-password").style.display = "none";
		document.getElementById("submitLoginButton").style.display = "none";
		document.getElementById("input-stayLogedIn").style.display = "none";
		document.getElementById("label-stayLogedIn").style.display = "none";
		document.getElementById("logo-name").innerHTML = name;
		document.getElementById("logo-letter").innerHTML = name[0];
		return true;
	} else {
		PrintInfo("Login status: " + Api.isLoggedin());
		//document.getElementsByClassName("logo")[0].style.display = "none";
		//document.getElementById("logoutButton").style.display = "none";
		//document.getElementById("logo-name").innerHTML = "Login Required";
		//document.getElementById("logo-letter").innerHTML = "";
		//document.getElementById("logo-name").style.position = "initial";
		//document.getElementById("logo-name").style.marginLeft = "20px";
		//document.getElementsByClassName("userInput")[0].style.marginTop = "20px";
		// Empty current main content
		document.getElementsByTagName("main")[0].innerHTML = `
		<div style="margin:100px 100px">
			<p style="font-size:25px">You need to be logged in to view this content.</p>
		</div>
		`;
		return false;
	}
}
async function login() {
	console.log("Logging in...");
	let username = document.getElementById("input-name").value;
	let password = document.getElementById("input-password").value;
	let stayLogedIn = document.getElementById("input-stayLogedIn").checked;

	try {
		let status = await Api.login(username, password, stayLogedIn);

		console.log("Login status: " + status);
		if(status) {
			window.location.replace("/index.html");
		} else {

		}
		Api.onRequiresRelogin = function() { console.log("RequiresRelogin"); };
	} catch(e) {
			console.log(e);
	}
}
function logout() {
	Api.logout();
	window.location.replace("/index.html");
}

// Messaging and Console
function PrintError(e, obj) {
	if(e.detail != null) {
		console.warn(e.detail);
	}
	console.error(e);
	if(obj != null) {
		obj.html(e.detail);
	}
}
function PrintInfo(msg) {
	console.info("Info: " + msg);
}
