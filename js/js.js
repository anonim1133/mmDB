$(document).ready(function(){
	console.log("ONLOAD");
	//document.getElementById('uploadFileInput').addEventListener('change', getFile, false);

	$( "#btn-add-files" ).click(function(){
		console.log("Add Files");

		$("#add-files").show("fast");
		$("#list-files").hide("fast");
		$("#doc-content").hide("fast");
		$("#doc-stats").hide("fast");
		$("#doc-vectors").hide("fast");
	});

	$( "#btn-list-files" ).click(function(){
		console.log("List Files");

		showFiles();
	});

	$( "#btn-doc-stats" ).click(function(){
		console.log("Doc stats");

		showStats();
	});

	$( "#btn-doc-vectors" ).click(function(){
		console.log("Doc vectors");

		showVectors();
	});
});

function resetVectors(){
	$("#doc-vectors").text('');
	console.log('Reset Vectors');
}

function showFiles(){
	showFileList();
	$("#list-files").show("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
	$("#doc-stats").hide("fast");
	$("#doc-vectors").hide("fast");

	$('#file-list').text('');
};

function showStats(){
	$("#doc-stats").show("fast");
	$("#list-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
	$("#doc-vectors").hide("fast");
}

function showVectors(){
	$("#doc-vectors").show("fast");
	$("#doc-stats").hide("fast");
	$("#list-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
}