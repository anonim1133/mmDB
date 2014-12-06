function stats(filename, what){
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

					unzip(file, what);

				}, errorHandler);

			}, errorHandler);

		}, errorHandler);
	}
}

function unzip(blob, what){
	//console.log("Unzipping");
	zip.createReader(new zip.BlobReader(blob), function(reader) {
		//console.log("createreader");
		// get all entries from the zip
		reader.getEntries(function(entries) {
			//console.log("getentries");
			if (entries.length) {
				entries.forEach(function(entry, i) {
					switch(what){
						case 'S':
							if(entry.filename == "meta.xml") {
								console.log(" [ S ] ");
								entry.getData(new zip.TextWriter(), function (text) {
									reader.close(function () {
									});

								}, function (current, total) {
									//console.log(".");
								});
							}
							break;
						case 'V':
							if(entry.filename == "content.xml") {
								console.log(" [ V ] ");
								entry.getData(new zip.TextWriter(), function (text) {
									reader.close(function () {
									});

								}, function (current, total) {
									//console.log(".");
								});
							}
							break;
					}
				});
			}
		});
	}, function(error) {
		console.log(error);
	});
}

function DoSomethingWithTextFile(file) {
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(file, "text/xml");

	if ( (xmlDoc.getElementsByTagName("document-meta")) && (xmlDoc.getElementsByTagName("document-meta").length)){
		XmlMetaFile(xmlDoc);
	}else if( (xmlDoc.getElementsByTagName("body")) && (xmlDoc.getElementsByTagName("body").length)){
		xmlDoc = $.parseXML( file );
		var xml = $( xmlDoc );
		var body = xml.find("body");

		xmlToVector(xml);
	}

}

function XmlMetaFile(xmlDoc) {
	var stats = xmlDoc.getElementsByTagName("document-statistic")[0];
	if(stats !== 'undefined'){
		console.log( "Tabele: " + stats.getAttribute("meta:table-count") );
		console.log( "Obrazy: " + stats.getAttribute("meta:image-count") );
		console.log( "Strony: " + stats.getAttribute("meta:page-count") );
		console.log( "Obiekty: " + stats.getAttribute("meta:object-count") );
		console.log( "Paragrafy: " + stats.getAttribute("meta:paragraph-count") );
		console.log( "Słowa: " + stats.getAttribute("meta:word-count") );
		console.log( "Znaki: " + stats.getAttribute("meta:character-count") );
	}
}

function xmlToVector(xml){
	var body = xml.find("*").children();
	var vector = '';

	body.each(function( index ) {
		if($( this ).prop("tagName") == 'text:p' && $(this).text().length){
			vector += 'P->';

			$.each($(this).text().split(' '), (function(word){
				vector += 'W->';
			}));
		}


		if($( this ).prop("tagName") == 'table:table')
			vector += 'T->';

		if($( this ).prop("tagName") == 'draw:image')
			vector += 'I->';

		if($( this ).prop("tagName") == 'draw:object')
			vector += 'O->';
	});

	console.log(vector);
}