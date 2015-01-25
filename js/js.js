$(document).ready(function(){
	console.log("ONLOAD");

	$( "#btn-add-files" ).click(function(){
		console.log("Add Files");

		$("#add-files").show("fast");
		$("#list-files").hide("fast");
		$("#doc-content").hide("fast");
		$("#doc-stats").hide("fast");
		$("#doc-vectors").hide("fast");
		$("#sql-content").hide("fast");
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

	$( "#btn-sql" ).click(function(){
		console.log("SQL");

		showSQL();
	});
});

function resetVectors(){
	console.log('Reset Vectors');
	$("#doc-vectors").text('');
	$("#doc-vectors").append($('<button class="btn btn-lg btn-primary btn-diff-vector reset-btn" onclick="compareVectors()">Porównaj</button>'));
	$("#doc-vectors").append("\n");
	$("#doc-vectors").append($('<button class="btn btn-lg btn-primary btn-diff-vector reset-btn" onclick="findLCS()"> L C S </button>'));
	$("#doc-vectors").append("\n");
	$("#doc-vectors").append($('<button class="btn btn-lg btn-danger btn-diff-vector reset-btn" onclick="resetVectors()">Reset</button>'));
	$("#doc-vectors").append("\n");
	$("#doc-vectors").append($('<div id="results"></div>'));

}

function showFiles(){
	showFileList();
	$("#list-files").show("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
	$("#doc-stats").hide("fast");
	$("#doc-vectors").hide("fast");
	$("#sql-content").hide("fast");

	$('#file-list').text('');
};

function showStats(){
	$("#doc-stats").show("fast");
	$("#list-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
	$("#doc-vectors").hide("fast");
	$("#sql-content").hide("fast");
}

function showVectors(){
	$("#doc-vectors").show("fast");
	$("#doc-stats").hide("fast");
	$("#list-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
	$("#sql-content").hide("fast");
}

function showSQL(){
	$("#sql-content").show("fast");
	$("#doc-vectors").hide("fast");
	$("#doc-stats").hide("fast");
	$("#list-files").hide("fast");
	$("#doc-content").hide("fast");
	$("#add-files").hide("fast");
}