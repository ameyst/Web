<template>
	<div>
		<button v-if="editAction" @click="editAction(element)" class="btn btn-info btn-xs" title="Edit"><i class="fa fa-pencil"></i></button>
		<button v-if="deleteAction" @click="deleteAction(element)" class="btn btn-primary btn-xs" title="Delete"><i class="fa fa-trash"></i></button>
		<button v-if="mailAction" @click="mailAction(element)" class="btn btn-default btn-xs" title="Send Email"><i class="fa fa-envelope"></i></button>
		<button v-if="sendRubricsAction" @click="sendRubricsAction(element)" class="btn btn-default btn-xs" title="Send Rubrics"><i class="fa fa-book"></i></button>
	</div>
</template>

<script>
	export default {
		props: {
			element: Object,
			editAction: Function,
			deleteAction: Function,
			mailAction: Function,
			sendRubricsAction: Function
		}
	};
</script>

<style scoped>

</style>
