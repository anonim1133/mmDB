$(document).ready(function(){
	console.log("ONLOAD");
	//document.getElementById('uploadFileInput').addEventListener('change', getFile, false);

	$( "#btn-add-files" ).click(function() {
		console.log("Add Files");
		$("#list-files").hide( "fast");
		$("#doc-content").hide( "fast");
		$("#add-files").show("fast");
	});

	$( "#btn-list-files" ).click(function() {
		console.log("List Files");
		$('#file-list').text('');
		showFiles();
	});
});

function showFiles(){
	showFileList();
	$("#add-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#list-files").show("fast");
};