<template>
	<div class="container">
		<div class="row">
			<div class="col-lg-12">
				<div class="page-header">
					<h1>Users</h1>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-lg-9">
				<form class="form-horizontal well">
					<fieldset>
						<legend v-if="!this.$route.params.id">New User</legend>
						<legend v-if="this.$route.params.id">Edit User</legend>
						<div class="form-group">
							<label class="col-lg-2 control-label">Name</label>
							<div class="col-lg-10">
								<input type="text" v-model="form.name" class="form-control">
								<span v-if="editing" class="help-block">Changing this name will create a duplication and <i>not</i> change the element's name.</span>
							</div>
						</div>
						<div class="form-group">
							<label class="col-lg-2 control-label">Password</label>
							<div class="col-lg-9">
								<input type="password" v-model="form.password" class="form-control">
								<span v-if="passwordGenerated" class="help-block">This is the newly generated password: <code>{{ passwordGenerated }}</code></span>
							</div>
							<div class="col-lg-1">
								<button type="button" @click="generatePassword" title="Generate new random password" class="btn btn-warning" data-toggle="tooltip" data-placement="bottom"><i class="fa fa-repeat"></i></button>
							</div>
						</div>
						<div class="form-group">
							<label class="col-lg-2 control-label">Email</label>
							<div class="col-lg-10">
								<input type="text" v-model="form.email" class="form-control">
							</div>
						</div>
						<div class="form-group" v-if="this.$store.getters.user.admin">
							<label class="col-lg-2 control-label">Admin?</label>
							<div class="col-lg-10 checkbox">
								<label>
									<input type="checkbox" v-model="form.admin">
								</label>
							</div>
						</div>
						<div class="form-group">
							<div class="col-lg-10 col-lg-offset-2">
								<button type="submit" @click="submitForm" class="btn btn-primary">Submit</button>
								<router-link to="/users"><button class="btn btn-default">Abort</button></router-link>
							</div>
						</div>
					</fieldset>
				</form>
			</div>
			<div class="col-lg-3">
				<h2>Information</h2>
				<p>This table shows the registered users and their detail information.</p>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		created() {
			// load data of given id
			if (this.$route.params.id) {
				this.$http.get('users/' + this.$route.params.id).then(response => {
					this.editing = true;

					this.form.name = response.body.name;
					this.form.email = response.body.mail;
					this.form.admin = response.body.admin;
				}, response => {
					this.$router.push('/users');
				});
			}
		},
		data() {
			return {
				editing: false,
				form: {
					name: '',
					password: '',
					email: '',
					admin: false
				},
				passwordGenerated: ''
			};
		},
		methods: {
			submitForm(event) {
				event.preventDefault();

				// workaround to prevent broken authentication when using a colon in password
				if (this.form.password.includes(':')) {
					this.$swal({
						title: 'Forbidden character',
						html: 'Your password must not contain a colon (<code>:</code>), otherwise it may brake your login.',
						type: 'error'
					}).catch(this.$swal.noop);
					return false;
				}

				// workaround to allow empty password to not change it
				if (this.$route.params.id && this.form.password === '') {
					this.form.password = '~~~DO_NOT_CHANGE_PASSWORD~~~';
				}

				// check for input in all fields
				if (!this.$helpers.checkForInput(this, this.form)) {
					return false;
				}

				// second part of the workaround
				if (this.$route.params.id && this.form.password === '~~~DO_NOT_CHANGE_PASSWORD~~~') {
					this.form.password = '';
				}

				let body = {
					hash: this.form.password,
					mail: this.form.email,
					admin: this.form.admin
				};

				this.$http.put('users/' + this.form.name, body).then(response => {
					// changed own password --> change auth-data
					if (this.form.name === this.$store.getters.user.name && this.form.password !== '') {
						this.$store.commit('login', {
							name: this.form.name,
							auth: btoa(this.form.name + ':' + this.form.password),
							admin: this.form.admin
						});
					}

					this.$router.push('/users');
				}, response => {
					this.$dialogs.ajaxError(this, response);
				});
			},
			generatePassword() {
				// generate password
				const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
				let password = '';
				for (let i = 0; i < 20; ++i) {
					password += chars.charAt(Math.floor(Math.random() * chars.length));
				}

				// display the new password
				this.form.password = password;
				this.passwordGenerated = password;
			}
		}
	};
</script>

<style scoped>

</style>
