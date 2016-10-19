var callSignData, rubricData, transmitterData, transmitterGroupData, nodeData, userData;

// Loads all data for every table
function loadData() {
	loadCalls();
	loadNews();
	loadCallSigns();
	loadRubrics();
	loadTransmitters();
	loadTransmitterGroups();
	loadNodes();

	// users will be loaded after all call signs have been loaded
	// to make sure there is data for the call sign column
	//loadUsers();
}

/* #########################
*  # INTERACT WITH THE API #
*  ######################### */

// Load all Calls
function loadCalls() {
	if (!isAdmin) return;

	$.ajax({
		url: config.apiUrl + "/calls",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			$("#tableCalls").DataTable().destroy();
			$("#tableCalls").DataTable({
				data: data,
				language: {
					url: "./assets/langs/DataTables_" + currentLanguage + ".json"
				},
				columns: [
					{ data: "timestamp" },
					{ data: "callSignNames[, ]" },
					{ data: "transmitterGroupNames[, ]" },
					{ data: "text" },
					{ data: "emergency" },
					{ data: "ownerName" }
				],
				"order": [[ 0, "desc" ]]
			});

			var statEmergency = 0;
			$.each(data, function(index, value) {
				if (value.emergency) statEmergency++;
			});
			$("#statsCallsEmergency").text(statEmergency);
			$("#statsCallsTotal, #statsStartCalls").text(data.length);
		},
		error: handleError
	});
}

// Add a Call
function postCall() {
	if (checkForInput("container2-detail")) {
		handleMissingInput();
		return;
	}

	var callSignNames = [];
	$("#formEditCallCallsign option").each(function() {
		if (this.selected) callSignNames.push(this.value);
	});
	var transmitterGroupNames = [];
	$("#formEditCallTransmitterGroup option").each(function() {
		if (this.selected) transmitterGroupNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/calls",
		type: "POST",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			text: $("#formEditCallText").val(),
			callSignNames: callSignNames,
			transmitterGroupNames: transmitterGroupNames,
			emergency: $("#formEditCallEmergency").prop("checked")
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromCallDetails();
			loadCalls();
		},
		error: handleError
	});
}

// Load all News
function loadNews() {
	if (!isAdmin) return;

	$.ajax({
		url: config.apiUrl + "/news",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			$("#tableNews").DataTable().destroy();
			$("#tableNews").DataTable({
				data: data,
				language: {
					url: "./assets/langs/DataTables_" + currentLanguage + ".json"
				},
				columns: [
					{ data: "timestamp" },
					{ data: "rubricName" },
					{ data: "number" },
					{ data: "text" },
					{ data: "ownerName" }
				]
			});

			$("#statsNewsTotal, #statsStartNews").text(data.length);
		},
		error: handleError
	});
}

// Add a News
function postNews() {
	if (checkForInput("container3-detail")) {
		handleMissingInput();
		return;
	}

	$.ajax({
		url: config.apiUrl + "/news",
		type: "POST",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			text: $("#formEditNewsText").val(),
			rubricName: $("#formEditNewsRubric").val(),
			number: $("#formEditNewsNumber").val()
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromNewsDetails();
			loadNews();
		},
		error: handleError
	});
}

// Load all CallSigns
function loadCallSigns() {
	$.ajax({
		url: config.apiUrl + "/callsigns",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			callSignData = data;

			$("#tableCallSigns").DataTable().destroy();

			if (!isAdmin) {
				$("#tableCallSigns").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: "description" },
						{ data: function (obj) {
							return "---";
						}},
						{ data: function (obj) {
							return "---";
						}},
						{ data: "ownerNames[, ]" },
						{ data: function (obj) {
							return "---";
						}}
					]
				});
			} else {
				$("#tableCallSigns").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: "description" },
						{ data: "pagers.0.number" },
						{ data: "pagers.0.name" },
						{ data: "ownerNames[, ]" },
						{ data: function (obj) {
							return "<a href='#4' onclick='editCallSign(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
							"<a href='#4' onclick='deleteCallSign(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
						}}
					]
				});
			}

			$("#statsCallSignsTotal").text(data.length);

			$("#formEditCallCallsign").empty();
			$.each(data, function (i, item) {
				$("#formEditCallCallsign").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditCallCallsign").trigger("chosen:updated");

			// load users after all calls signs have been loaded
			loadUsers();
		},
		error: handleError
	});
}

// Add / Edit a CallSign
function putCallSign() {
	if (checkForInput("container4-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editCallSignName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditCallSignName").val();
	}

	if (checkForOverwriting(callSignData, urlName) && !$("#formEditCallSignName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	var pagerNumbers = $("#formEditCallSignsPagersNumber").val().split("\n");
	var pagerNames = $("#formEditCallSignsPagersName").val().split("\n");
	var pagers = [];
	for (i = 0; i < pagerNumbers.length; i++) {
		item = {};
		item.number = pagerNumbers[i];
		item.name = pagerNames[i];

		pagers.push(item);
	}
	var ownerNames = [];
	$("#formEditCallSignOwners option").each(function() {
		if (this.selected) ownerNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/callsigns/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			description: $("#formEditCallSignDescription").val(),
			pagers: pagers,
			ownerNames: ownerNames
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromCallSignDetails();
			loadCallSigns();
		},
		error: handleError
	});
}

// Delete a CallSign
function deleteCallSign(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/callsigns/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadCallSigns();
			},
			error: handleError
		});
	});
}

// Load all Rubrics
function loadRubrics() {
	$.ajax({
		url: config.apiUrl + "/rubrics",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			rubricData = data;

			$("#tableRubrics").DataTable().destroy();
			$("#tableRubrics").DataTable({
				data: data,
				language: {
					url: "./assets/langs/DataTables_" + currentLanguage + ".json"
				},
				columns: [
					{ data: "number" },
					{ data: "name" },
					{ data: "label" },
					{ data: "transmitterGroupNames[, ]" },
					{ data: "ownerNames[, ]" },
					{ data: function (obj) {
						if (!isAdmin) {
							return "---";
						} else {
							return "<a href='#5' onclick='editRubric(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
							"<a href='#5' onclick='deleteRubric(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
						}
					}}
				]
			});

			$("#statsRubricsTotal").text(data.length);

			$("#formEditNewsRubric").empty();
			$.each(data, function (i, item) {
				$("#formEditNewsRubric").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditNewsRubric").trigger("chosen:updated");
		},
		error: handleError
	});
}

// Add / Edit a Rubric
function putRubric() {
	if (checkForInput("container5-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editRubricName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditRubricName").val();
	}

	if (checkForOverwriting(rubricData, urlName) && !$("#formEditRubricName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	var transmitterGroupNames = [];
	$("#formEditRubricTransmitterGroups option").each(function() {
		if (this.selected) transmitterGroupNames.push(this.value);
	});
	var ownerNames = [];
	$("#formEditRubricOwners option").each(function() {
		if (this.selected) ownerNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/rubrics/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			name: urlName,
			number: $("#formEditRubricNumber").val(),
			transmitterGroupNames: transmitterGroupNames,
			label: $("#formEditRubricLabel").val(),
			ownerNames: ownerNames
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromRubricDetails();
			loadRubrics();
		},
		error: handleError
	});
}

// Delete a Rubric
function deleteRubric(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/rubrics/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadRubrics();
			},
			error: handleError
		});
	});
}

// Send an Activation
function sendRubricsActivation() {
	if (checkForInput("container5-detail2")) {
		handleMissingInput();
		return;
	}

	var transmitterGroupNames = [];
	$("#formActivateRubricTransmitterGroups option").each(function() {
		if (this.selected) transmitterGroupNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/activation",
		type: "POST",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			number: $("#formActivateRubricNumber").val(),
			transmitterGroupNames: transmitterGroupNames
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromRubricDetails2();
		},
		error: handleError
	});
}

// Load all Transmitters
function loadTransmitters() {
	$.ajax({
		url: config.apiUrl + "/transmitters",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			transmitterData = data;

			$("#tableTransmitters").DataTable().destroy();
			if (!isAdmin) {
				$("#tableTransmitters").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: "nodeName" },
						{ data: function (obj) {
							return "---";
						}},
						{ data: "ownerNames[, ]" },
						{ data: "deviceType" },
						{ data: statusFormatter },
						{ data: function (obj) {
							return "---";
						}}
					]
				});
			} else {
				$("#tableTransmitters").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: "nodeName" },
						{ data: "address.ip_addr" },
						{ data: "ownerNames[, ]" },
						{ data: "deviceType" },
						{ data: statusFormatter },
						{ data: function (obj) {
							return "<a href='#6' onclick='editTransmitter(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
							"<a href='#6' onclick='deleteTransmitter(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
						}}
					]
				});
			}

			var statCountOnline = 0;
			var statCountOffline = 0;
			$.each(data, function(index, value) {
				if (value.status === "ONLINE") {
					statCountOnline++;
				} else {
					statCountOffline++;
				}
			});
			$("#statsTransmitterTotal").text(data.length);
			$("#statsStartTransmitter").text(statCountOnline + " / " + data.length);

			new Chart($("#chartTransmitter"), {
			    type: 'pie',
			    data: {
			        labels: ["Online", "Offline"],
			        datasets: [
				        {
				            data: [statCountOnline, statCountOffline],
				            backgroundColor: ["#469408", "#D9230F"],
				            hoverBackgroundColor: ["#469408", "#D9230F"]
				        }]
			    }
			});

			var statCountRasppager1 = 0;
			var statCountC9000 = 0;
			var statCountSDRPager = 0;
			$.each(data, function(index, value) {
				if (value.deviceType === "RASPPAGER1") {
					statCountRasppager1++;
				} else if (value.deviceType === "C9000") {
					statCountC9000++;
				} else if (value.deviceType === "SDRPAGER") {
					statCountSDRPager++;
				}
			});

			new Chart($("#chartTransmitterTypes"), {
			    type: 'pie',
			    data: {
			        labels: ["RASPPAGER1", "C9000", "SDRPAGER"],
			        datasets: [
				        {
				            data: [statCountRasppager1, statCountC9000, statCountSDRPager],
				            backgroundColor: ["#3A01DF", "#DF7401", "#04B431"],
				            hoverBackgroundColor: ["#3A01DF", "#DF7401", "#04B431"]
				        }]
			    }
			});

			$("#formEditTransmitterGroupTransmitters").empty();
			$.each(data, function (i, item) {
				$("#formEditTransmitterGroupTransmitters").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditTransmitterGroupTransmitters").trigger("chosen:updated");

			// Set Markers on map
			var markerOnline = L.icon({
				iconUrl: './assets/img/marker-wifi-online.png',
				iconSize: [28, 30],
				iconAnchor: [15, 30],
				popupAnchor: [0, -25]
			});
			var markerOffline = L.icon({
				iconUrl: './assets/img/marker-wifi-offline.png',
				iconSize: [28, 30],
				iconAnchor: [15, 30],
				popupAnchor: [0, -25]
			});

			if (markers !== undefined && mapInited) map.removeLayer(markers);
			markers = new L.FeatureGroup();
			$.each(data, function(i, item) {
				var markerIcon = markerOnline;
				if (item.status !== "ONLINE") markerIcon = markerOffline;

				var marker = L.marker([item.latitude, item.longitude], {icon: markerIcon}).bindPopup("<b>" + item.name + "</b><br />" + jQuery.i18n.prop("transmitters_add_power") + ": " + item.power + "<br />" + jQuery.i18n.prop("transmitters_add_timeslot") + ": " + item.timeSlot);
				markers.addLayer(marker);
			});
			if (mapInited) map.addLayer(markers);
		},
		error: handleError
	});
}

// Add / Edit a Transmitter
function putTransmitter() {
	if (checkForInput("container6-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editTransmitterName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditTransmitterName").val();
	}

	if (checkForOverwriting(transmitterData, urlName) && !$("#formEditTransmitterName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	var timeSlot = "";
	$(".timeslotCheckBox").each(function() {
		if (this.checked) timeSlot += this.id.substring(27);
	});
	var ownerNames = [];
	$("#formEditTransmitterOwners option").each(function() {
		if (this.selected) ownerNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/transmitters/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			nodeName: $("#formEditTransmitterNodeName").val(),
			latitude: $("#formEditTransmitterLatitude").val() * $("#formEditTransmitterLatitudeOrientation").val(),
			longitude: $("#formEditTransmitterLongitude").val() * $("#formEditTransmitterLongitudeOrientation").val(),
			power: $("#formEditTransmitterPower").val(),
			address: {
				ip_addr: $("#formEditTransmitterIp").val(),
				port: $("#formEditTransmitterPort").val()
			},
			timeSlot: timeSlot,
			ownerNames: ownerNames,
			deviceType: $("#formEditTransmitterDeviceType").val()
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromTransmitterDetails();
			loadTransmitters();
		},
		error: handleError
	});
}

// Delete a Trasnmitter
function deleteTransmitter(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/transmitters/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadTransmitters();
				loadTransmitterGroups();
			},
			error: handleError
		});
	});
}

// Load all TransmitterGroups
function loadTransmitterGroups() {
	$.ajax({
		url: config.apiUrl + "/transmitterGroups",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			transmitterGroupData = data;

			$("#tableTransmitterGroups").DataTable().destroy();
			$("#tableTransmitterGroups").DataTable({
				data: data,
				language: {
					url: "./assets/langs/DataTables_" + currentLanguage + ".json"
				},
				columns: [
					{ data: "name" },
					{ data: "description" },
					{ data: "transmitterNames[, ]" },
					{ data: "ownerNames[, ]" },
					{ data: function (obj) {
						return "<a href='#7' onclick='editTransmitterGroup(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
						"<a href='#7' onclick='deleteTransmitterGroup(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
					}}
				]
			});

			$("#statsTransmitterGroupsTotal").text(data.length);

			$("#formEditCallTransmitterGroup, #formEditRubricTransmitterGroups, #formActivateRubricTransmitterGroups").empty();
			$.each(data, function (i, item) {
				$("#formEditCallTransmitterGroup, #formEditRubricTransmitterGroups, #formActivateRubricTransmitterGroups").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditCallTransmitterGroup, #formEditRubricTransmitterGroups, #formActivateRubricTransmitterGroups").trigger("chosen:updated");
		},
		error: handleError
	});
}

// Add / Edit a TransmitterGroup
function putTransmitterGroup() {
	if (checkForInput("container7-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editTransmitterGroupName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditTransmitterGroupName").val();
	}

	if (checkForOverwriting(transmitterGroupData, urlName) && !$("#formEditTransmitterGroupName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	var transmitters = [];
	$("#formEditTransmitterGroupTransmitters option").each(function() {
		if (this.selected) transmitters.push(this.value);
	});
	var ownerNames = [];
	$("#formEditTransmitterGroupOwners option").each(function() {
		if (this.selected) ownerNames.push(this.value);
	});

	$.ajax({
		url: config.apiUrl + "/transmitterGroups/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			description: $("#formEditTransmitterGroupDescription").val(),
			transmitterNames: transmitters,
			ownerNames: ownerNames
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromTransmitterGroupDetails();
			loadTransmitterGroups();
		},
		error: handleError
	});
}

// Delete a TrasnmitterGroup
function deleteTransmitterGroup(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/transmitterGroups/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadTransmitterGroups();
			},
			error: handleError
		});
	});
}

// Load all Nodes
function loadNodes() {
	$.ajax({
		url: config.apiUrl + "/nodes",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			nodeData = data;

			$("#tableNodes").DataTable().destroy();
			if (!isAdmin) {
				$("#tableNodes").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: function (obj) {
							return "---";
						}},
						{ data: function (obj) {
							return "---";
						}},
						{ data: statusFormatter },
						{ data: function (obj) {
							return "---";
						}}
					]
				});
			} else {
				$("#tableNodes").DataTable({
					data: data,
					language: {
						url: "./assets/langs/DataTables_" + currentLanguage + ".json"
					},
					columns: [
						{ data: "name" },
						{ data: function (obj) {
							if (obj.status !== "ONLINE") {
								return "---";
							} else {
								return obj.address.ip_addr;
							}
						}},
						{ data: function (obj) {
							if (obj.status !== "ONLINE") {
								return "---";
							} else {
								return obj.address.port;
							}
						}},
						{ data: statusFormatter },
						{ data: function (obj) {
							return "<a href='#8' onclick='editNode(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
							"<a href='#8' onclick='deleteNode(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
						}}
					]
				});
			}

			var statCountOnline = 0;
			var statCountOffline = 0;
			$.each(data, function(index, value) {
				if (value.status === "ONLINE") {
					statCountOnline++;
				} else {
					statCountOffline++;
				}
			});
			$("#statsNodesTotal").text(data.length);
			$("#statsStartNodes").text(statCountOnline + " / " + data.length);

			new Chart($("#chartNodes"), {
			    type: 'pie',
			    data: {
			        labels: ["Online", "Offline"],
			        datasets: [
				        {
				            data: [statCountOnline, statCountOffline],
				            backgroundColor: ["#469408", "#D9230F"],
				            hoverBackgroundColor: ["#469408", "#D9230F"]
				        }]
			    }
			});

			$("#formEditTransmitterNodeName").empty();
			$.each(data, function (i, item) {
				$("#formEditTransmitterNodeName").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditTransmitterNodeName").trigger("chosen:updated");
		},
		error: handleError
	});
}

// Add / Edit a Node
function putNode() {
	if (checkForInput("container8-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editNodeName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditNodeName").val();
	}

	if (checkForOverwriting(nodeData, urlName) && !$("#formEditNodeName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	$.ajax({
		url: config.apiUrl + "/nodes/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			latitude: $("#formEditNodeLatitude").val() * $("#formEditNodeLatitudeOrientation").val(),
			longitude: $("#formEditNodeLongitude").val() * $("#formEditNodeLatitudeOrientation").val(),
			status: $("#formEditNodeStatus").val(),
			key: $("#formEditNodeKey").val()
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromNodeDetails();
			loadNodes();
		},
		error: handleError
	});
}

// Delete a Node
function deleteNode(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/nodes/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadNodes();
			},
			error: handleError
		});
	});
}

// Load all Users
function loadUsers() {
	$.ajax({
		url: config.apiUrl + "/users",
		type: "GET",
		beforeSend: setCookieHeader,
		success: function(data) {
			userData = data;

			$("#tableUsers").DataTable().destroy();
			$("#tableUsers").DataTable({
				data: data,
				language: {
					url: "./assets/langs/DataTables_" + currentLanguage + ".json"
				},
				columns: [
					{ data: "name" },
					{ data: "mail" },
					{ data: "admin" },
					{ data: function(obj) {
						var usersCallSigns = "";
						$.each(callSignData, function(i, item) {
							if ($.inArray(obj.name, item.ownerNames) != -1) {
								usersCallSigns += item.name + ", ";
							}
						});
						return usersCallSigns.substring(0, usersCallSigns.length - 2);
					}},
					{ data: function (obj) {
						return "<a href='#9' onclick='editUser(\"" + obj.name + "\")'><i class='fa fa-pencil' title='" + jQuery.i18n.prop('container_table_actions_edit') + "'></i></a> " +
						"<a href='#9' onclick='deleteUser(\"" + obj.name + "\")'><i class='fa fa-trash' title='" + jQuery.i18n.prop('container_table_actions_delete') + "'></i></a>";
					}}
				]
			});

			var statAdmin = 0;
			$.each(data, function(index, value) {
				if (value.admin) statAdmin++;
			});
			$("#statsUsersAdmins").text(statAdmin);
			$("#statsUsersTotal, #statsStartUsers").text(data.length);

			$("#formEditCallSignOwners, #formEditRubricOwners, #formEditTransmitterOwners, #formEditTransmitterGroupOwners").empty();
			$.each(data, function (i, item) {
				$("#formEditCallSignOwners, #formEditRubricOwners, #formEditTransmitterOwners, #formEditTransmitterGroupOwners").append($("<option>", {
					value: item.name,
					text : item.name
				}));
			});
			$("#formEditCallSignOwners, #formEditRubricOwners, #formEditTransmitterOwners, #formEditTransmitterGroupOwners").trigger("chosen:updated");
		},
		error: handleError
	});
}

// Add / Edit a User
function putUser() {
	if (checkForInput("container9-detail")) {
		handleMissingInput();
		return;
	}

	var urlName = editUserName;
	if (urlName === "" || urlName === undefined || urlName === null) {
		urlName = $("#formEditUserName").val();
	}

	if (checkForOverwriting(userData, urlName) && !$("#formEditUserName").prop("disabled")) {
		handleOverwriteError();
		return;
	}

	$.ajax({
		url: config.apiUrl + "/users/" + urlName,
		type: "PUT",
		contentType: "application/json",
		dataType: "json",
		data: JSON.stringify({
			hash: $("#formEditUserPassword").val(),
			mail: $("#formEditUserMail").val(),
			admin: $("#formEditUserAdmin").prop("checked")
		}),
		beforeSend: setCookieHeader,
		success: function(data) {
			showSuccessAlert();
			returnFromUserDetails();
			loadUsers();
		},
		error: handleError
	});
}

// Delete a User
function deleteUser(name) {
	if (name === "" || name === null) return;

	showDeleteAlert(function() {
		$.ajax({
			url: config.apiUrl + "/users/" + name,
			type: "DELETE",
			beforeSend: setCookieHeader,
			success: function(data) {
				showSuccessAlert();
				loadUsers();
			},
			error: handleError
		});
	});
}

function statusFormatter(obj) {
	if (obj.status === "ONLINE") {
		return "<span class='label label-success'>ONLINE</span>";
	} else if (obj.status === "OFFLINE") {
		return "<span class='label label-primary'>OFFLINE</span>";
	} else {
		return "<span class='label label-warning'>" + obj.status + "</span>";
	}
}

function setCookieHeader(req) {
	req.setRequestHeader("Authorization", "Basic " + Cookies.get("auth"));
}
