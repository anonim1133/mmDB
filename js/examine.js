function examine(filename){
	console.log("Examine");

	navigator.webkitPersistentStorage.requestQuota (1024*1024*1024, function(grantedBytes) {
		requestFS(grantedBytes);
	}, errorHandler);

	function requestFS(grantedBytes) {
		window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, function (fs) {
			fs.root.getFile(filename, {create: false}, function (fileEntry) {
				//console.log("Get file");

				// Get a File object representing the file,
				// then use FileReader to read its contents.
				fileEntry.file(function (file) {

					unzip(file);

				}, errorHandler);

			}, errorHandler);

		}, errorHandler);
	}
}

function unzip(blob){
	//console.log("Unzipping");
	zip.createReader(new zip.BlobReader(blob), function(reader) {
		//console.log("createreader");
		// get all entries from the zip
		reader.getEntries(function(entries) {
			//console.log("getentries");
			if (entries.length) {
				//console.log("entries");

				entries.forEach(function(entry, i) {
					//console.log(entry.filename);
					if(entry.filename == "meta.xml"){
						entry.getData(new zip.TextWriter(), function(text) {
							// text contains the entry data as a String

							// close the zip reader
							reader.close(function() {
								// onclose callback
							});

						}, function(current, total) {
							//console.log(".");
						});

					}
				});

			}
		});
	}, function(error) {
		console.log(error);
	});
}

function DoSomethingWithTextFile(file) {
	//console.log(file);

	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(file, "text/xml");

	if ( (xmlDoc.getElementsByTagName("document-meta")) && (xmlDoc.getElementsByTagName("document-meta").length) ) {
		XmlMetaFile(xmlDoc);
	}else if ( (xmlDoc.getElementsByTagName("document-content")) && (xmlDoc.getElementsByTagName("document-content").length) ) {
		XmlContentFile(xmlDoc);
	}
}

function XmlMetaFile(xmlDoc) {
	var stats = xmlDoc.getElementsByTagName("document-statistic")[0];
	console.log( "Tabele: " + stats.getAttribute("meta:table-count") );
	console.log( "Obrazy: " + stats.getAttribute("meta:image-count") );
	console.log( "Strony: " + stats.getAttribute("meta:page-count") );
	console.log( "Obiekty: " + stats.getAttribute("meta:object-count") );
	console.log( "Paragrafy: " + stats.getAttribute("meta:paragraph-count") );
	console.log( "Słowa: " + stats.getAttribute("meta:word-count") );
	console.log( "Znaki: " + stats.getAttribute("meta:character-count") );
}