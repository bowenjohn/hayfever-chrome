/**
 * Hayfever for Chrome
 * Background Script
 *
 * by Mike Green
 *
 * TODO: Figure out the best strategy for persisting data like client lists, either via Web SQL or localStorage. 
 * 			 If localStorage, use some easily query-able schema
 */

// String prototype method, convert string to slug
String.prototype.toSlug = function() {
	var slug = this.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().replace(/\s/g, '_');
	return slug;
};

$(document).ready(function() {
	// TODO: Create badge w/ total hours worked today via chrome.browserAction.setBadgeText({text: "0:00"})
	
	
	var popup = chrome.extension.getURL('popup.html')
 		, authString = localStorage['harvest_auth_string']
		, subdomain = localStorage['harvest_subdomain'];

	window.application = {
		totalHours: 0.0
		, todaysEntries: []
		, projects: []
		, clients: {}
		, refreshInterval: ''
		, configExists: function() {
			return (!_(localStorage['harvest_subdomain']).isEmpty() && !_(localStorage['harvest_auth_string']).isEmpty());
		}
		, setBadge: function() {
			var root = window.application;
			chrome.browserAction.setBadgeText({text: String(root.totalHours)});
		}
		, refreshHours: function() {
			console.log('refreshing hours');
			var root = window.application;
			root.client.getToday(function(xhr, txt) {
				var json = JSON.parse(xhr.responseText)
					, totalHours = 0.0;
				
				// Cache projects and timesheet entries from JSON feed
				root.projects = json.projects;
				root.todaysEntries = json.day_entries;
				
				// Calculate total hours by looping thru timesheet entries
				$.each(root.todaysEntries, function() {
					totalHours += this.hours;
				});
				root.totalHours = totalHours;
				
				// Build a grouped list of clients/projects for building optgroups later
				if (!_(root.projects).isEmpty()) {
					$.each(root.projects, function() {
						var clientKey = this.client.toSlug()
							, projectID = this.id;

						if (!root.clients[clientKey]) {
							root.clients[clientKey] = {
								name: this.client
								, projects: []
							};
						}
						var idExists = _(root.clients[clientKey].projects).detect(function(p) { return p.id == projectID; });

						if (!idExists) {
							root.clients[clientKey].projects.push(this);
						}
					});
				}
				
				chrome.browserAction.setBadgeText({text: String(root.totalHours)});
			}, true);
		}
		, inPopup: function(func) {
			var fn = func
				, args = _.rest(arguments);
			$.each(chrome.extension.getViews(), function() {
				if (this.location.href == popup) {
					fn.apply(this, args);
				}
			});
		}
	};

	if (window.application.configExists()) {
		window.application.client = new Harvest(localStorage['harvest_subdomain'], localStorage['harvest_auth_string']);
		setTimeout(window.application.refreshHours, 500);
		window.application.refreshInterval = setInterval(application.refreshHours, 30000);
	} else {	
		chrome.browserAction.setBadgeText({text: "!"});
	}
});

// vim: set ts=2 sw=2 syntax=jquery smartindent :
