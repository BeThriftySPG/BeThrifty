"use strict";

const Api = (function() {
	const apiServerAdress = "https://localhost:5001/";
	const apiLoginPage = "api/user/login";
	const apiRefreshTokenPage = "api/user/refreshToken";

	let jwtToken = null;
	let refreshTokenTimeout = null;
	let _username = null;
	let _password = null;

	const output = {
		"fetch": fetchFromApi3,
		"login": login2,
		"logout": logout,
		"isLogedin": isLogedin,
		"isStayLogedIn": isStayLogedIn,
		"hashPassword": hashPassword,
		"onRequiresRelogin": function() {}
	};

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
		});
	} else {
		_username = null;
		_password = null;
		const token = sessionStorage.getItem("jwt-token");
		if(typeof(token) !== "undefined") {
			setJwtToken(token);
		}
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
		}).catch(function(_) {
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
			if(typeof(data) === "object") {
				headers["Content-Type"] = "application/json";
				promise = fetch(apiServerAdress + path, {
					method: "POST",
					"headers": headers,
					body: JSON.stringify(data)
				});
			} else {
				headers["Content-Type"] = "text/plain";
				promise = fetch(apiServerAdress + path, {
					method: "POST",
					"headers": headers,
					body: data
				});
			}
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
			}, function(_) {
				setJwtToken(null);
				resolve(false);
			});
		});
	}

	function login2(username, password, stayLogedIn) {
		return new Promise(function(resolve, reject) {
			hashPassword(password).then(function(passwordHash) {
				if(stayLogedIn === true) {
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

	function isLogedin() {
		return jwtToken !== null;
	}

	function isStayLogedIn() {
		return _username !== null && _password !== null;
	}

	return output;
})();