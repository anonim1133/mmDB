function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries) {
	// Document fragments can improve performance since they're only appended
	// to the DOM once. Only one browser reflow occurs.
	var fragment = document.createDocumentFragment();

	entries.forEach(function(entry, i) {

		var li = document.createElement('li');
		li.innerHTML = ['<span>', entry.name, '</span>'].join('');
		fragment.appendChild(li);
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