const GlobalMethodsPlugin = {
	install(Vue) {
		Vue.prototype.$dialogs = {};

		Vue.prototype.$dialogs.deleteElement = function(context, workFunction) {
			context.$swal({
				title: 'Are you sure?',
				text: 'You will not be able to recover this data once it is deleted.',
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: 'Yes',
				cancelButtonText: 'Cancel'
			}).then(workFunction).catch(context.$swal.noop);
		};

		Vue.prototype.$dialogs.ajaxError = function(context, err) {
			if (err.status === 0) {
				// no connection
				context.$swal({
					title: 'No Connection',
					html: 'Unable to reach API server. Please try again later.',
					type: 'error'
				});
			} else if (err.status === 400) {
				// constraint violation
				let errorText = err.body.message + ':<br/>';
				if (err.body.code === 4001) {
					let jsonErrors = '<ul style="text-align:left">';
					err.body.violations.forEach(violation => {
						jsonErrors += '<li>' + violation.field + ' ' + violation.message + ' (' + violation.code + ' - ' + violation.constraint + ')</li>';
					});
					errorText += '</ul><br />' + jsonErrors;
				}

				context.$swal({
					title: err.body.name + ' (' + err.body.code + ')',
					html: errorText,
					type: 'error'
				});
			} else if (err.status === 403) {
				// forbidden
				context.$swal({
					title: 'Forbidden',
					html: 'No permission for this request',
					type: 'error'
				});
			} else if (err.status === 404) {
				// not found
				context.$swal({
					title: 'Not Found',
					html: 'Unable to find the requested resource.',
					type: 'error'
				});
			} else {
				// general error
				context.$swal({
					title: 'General Error',
					html: 'Encountered HTTP error code ' + err.status + '.',
					type: 'error'
				});
			}
		};

		Vue.prototype.$helpers = {};

		Vue.prototype.$helpers.getAjaxErrorMessage = function(response) {
			if (response.status === 0) {
				return 'Unable to reach API server. Please try again later.';
			} else if (response.status === 401 || response.status === 403) {
				return 'Invalid login credentials or no permission for this request. Please check username and password.';
			} else {
				return 'Unhandled HTTP error (' + response.status + '). Please try again later.';
			}
		};

		Vue.prototype.$helpers.checkForInput = function(context, form) {
			for (let key in form) {
				if (form.hasOwnProperty(key)) {
					if (form[key].length === 0 || form[key] === '') {
						context.$swal({
							title: 'Missing input',
							html: 'Please fill in every field to continue.',
							type: 'error'
						});
						return false;
					}
				}
			}
			return true;
		};

		Vue.prototype.$helpers.zeroPad = function(number, size) {
			let s = String(number);
			while (s.length < (size || 2)) {
				s = '0' + s;
			}
			return s;
		};
	}
};

export default GlobalMethodsPlugin;