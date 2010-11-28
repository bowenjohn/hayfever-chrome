/**
 * Hayfever for Chrome
 * Popup Script
 *
 * by Mike Green
 */

// String prototype method, convert string to slug
String.prototype.toSlug = function() {
	var slug = this.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().replace(/\s/g, '_');
	return slug;
};

$(document).ready(function() {
	// Setup
	var bgPage = chrome.extension.getBackgroundPage()
		, app = bgPage.application
		, dayEntries = app.todaysEntries
		, $timesheet = $('#timesheet tbody');
	
	if (!app.authDataExists()) {
		$('#header').after($('<div/>', {
			'class': 'notice'
			, text: 'Please visit the Options page and configure Hayfever'
		}));
	}
	// Populate table with current timesheet entries for the current day
	if (dayEntries.length > 0) {
		$timesheet.find('.noentries').remove();
		$('#entry-row-template').tmpl(dayEntries).appendTo($timesheet);
	}

	// Events

	$('a#refresh').click(function(e) {
		app.refreshHours();
		$timesheet.find('tr').animate({height: 'toggle', opacity: 'toggle'}, 350, function() {
			$(this).remove();
			$('#entry-row-template').tmpl(app.todaysEntries).appendTo($timesheet);
		})
	});

	$('td.entry-toggle').delegate('a', 'click', function(e) {
		var entryID = parseInt($(this).attr('id').split('_')[1], 10)
			, $link = $(this)
			, bgPage = chrome.extension.getBackgroundPage()
			, app = bgPage.application;
		
		app.client.toggleTimer(entryID, function(xhr, txt) {
			var js = JSON.parse(xhr.responseText);
			if (js.timer_started_at) {
				bgPage.console.log('timer started: ' + js.project_id);
				$link.text('Stop');
			} else {
				bgPage.console.log('timer stopped');
				$link.text('Start');
			}
		});
		
		return false;
	});
	
	// loop thru the TaffyDB object and create optgroup tags for each client, option tags for each project	
	app.projectDB.forEach(function(p, i) {
		var $select = $('#client-select')
			, clientSlug = p.client.toSlug()
			, $optgroup = $select.find('.' + clientSlug);
		
		if ($optgroup.size() == 0) {
			$select.append($('<optgroup/>', {
				'label': p.client
					, 'class': clientSlug
			}));
			$optgroup = $select.find('.' + clientSlug);
		}
		
		$('#client-project-option-tag').tmpl(p).appendTo($optgroup);
	});

	// When user selects a project, populate the tasks selector with that project's tasks
	$('#client-select').change(function() {
		var $option = $(this).find('option:selected')
			, $taskSelect = $('#task-select')
			, $billable = $taskSelect.find('optgroup.billable')
			, $notBillable = $taskSelect.find('optgroup.not-billable')
			, val = $(this).val()
			, tasks = app.projectDB.first({id: val}).tasks;
		
		// clear all options from the task selector, except the first
		$taskSelect.find('option:not(.no-selection)').remove();
		
		// Append each of the selected project's tasks to the task selector	
		$.each(tasks, function() {
			var opt = $('<option/>', {
				'class': 'task-' + this.id
				, value: this.id
				, text: this.name
			});

			if (this.billable) {
				opt.appendTo($billable);
			} else {
				opt.appendTo($notBillable);
			}
		});

		// return true or else...
		return true;
	});
});

// vim: set ts=2 sw=2 syntax=jquery smartindent :
