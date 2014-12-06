$(document).ready(function(){
	console.log("ONLOAD");
	//document.getElementById('uploadFileInput').addEventListener('change', getFile, false);

	$( "#btn-add-files" ).click(function(){
		console.log("Add Files");

		$("#list-files").hide( "fast");
		$("#doc-content").hide( "fast");
		$("#add-files").show("fast");
		$("#doc-stats").hide( "fast");
	});

	$( "#btn-list-files" ).click(function(){
		console.log("List Files");

		$("#list-files").show("fast");
		$("#doc-content").hide( "fast");
		$("#add-files").hide("fast");
		$("#doc-stats").hide( "fast");

		$('#file-list').text('');
		showFiles();
	});

	$( "#btn-doc-stats" ).click(function(){
		console.log("Doc stats");

		$("#doc-stats").show( "fast");
		$("#list-files").hide( "fast");
		$("#doc-content").hide( "fast");
		$("#add-files").hide("fast");
	});
});

function showFiles(){
	showFileList();
	$("#add-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#list-files").show("fast");
};

function showStats(){
	console.log("Doc stats");

	$("#doc-stats").show( "fast");
	$("#list-files").hide( "fast");
	$("#doc-content").hide( "fast");
	$("#add-files").hide("fast");
}