function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries) {
	$('#file-list').text('');
	// Document fragments can improve performance since they're only appended
	// to the DOM once. Only one browser reflow occurs.
	var fragment = document.createDocumentFragment();
	var file_list = $('#file-list');

	entries.forEach(function(entry, i) {
		var a_stats = $('<a></a>');
		var a_vector = $('<a></a>');
		var a_delete = $('<a></a>');
		var span = $('<span></span>');
		var li = $('<li></li>');
		var icon = $('<i></i>');

		li.addClass("list-group-item");

		icon.addClass("glyphicon").addClass("glyphicon-file").addClass("left");
		a_stats.attr('href', '#stats').text('[ S ]').attr('onclick', 'stats(\''+ entry.name +'\', "S")').addClass("left").attr('title', 'Statystyki');
		a_vector.attr('href', '#vector').text('[ V ]').attr('onclick', 'stats(\''+ entry.name +'\', "V")').addClass("left").attr('title', 'Wektor');
		a_delete.attr('href', '#delete').text('[ D ]').attr('onclick', 'deleteFile(\''+ entry.name +'\')').addClass("right").attr('title', 'Usuń');
		span.text(entry.name);

		li.append(icon);
		li.append(a_stats);
		li.append(a_vector);
		li.append(span);
		li.append(a_delete);

		//li.append(span);
		file_list.append(li);
	});

	document.querySelector('#file-list').appendChild(fragment);
}

function onInitFs(fs) {
	var dirReader = fs.root.createReader();
	var entries = [];

	// Call the reader.readEntries() until no more results are returned.
	var readEntries = function() {
		dirReader.readEntries (function(results) {
			if (!results.length) {
				listResults(entries.sort());
			} else {
				entries = entries.concat(toArray(results));
				readEntries();
			}
		}, errorHandler);
	};

	readEntries(); // Start reading dirs.
}

function showFileList(){
	window.webkitRequestFileSystem(window.PERSISTENT, 1024*1024, onInitFs, errorHandler);
}

function deleteFile(file){
	navigator.webkitPersistentStorage.requestQuota (1024*1024*1024, function(grantedBytes) {
		console.log ('requestQuota: ', arguments);
		requestFS(grantedBytes);
	}, errorHandler);

	function requestFS(grantedBytes) {
		window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, function(fs) {
			fs.root.getFile(file, {create: false}, function(fileEntry) {
				fileEntry.remove(function() {
					console.log('File ' + file + 'removed.');
					showFileList();
				}, errorHandler);
			}, errorHandler);

		}, errorHandler);
	}
}