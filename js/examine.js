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
								var div = $('#doc-stats');
								var h1 = $('<h1></h1>');

								div.text('');

								h1.text(blob.name);
								div.append(h1);

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
	var div = $('#doc-stats');
	var ul = $('<ul id="file-stats-list" class="list-group">');

	var stats = xmlDoc.getElementsByTagName("document-statistic")[0];
	if(stats !== 'undefined'){
		var li_strony = $('<li></li>').addClass("list-group-item").text('Strony: ' + stats.getAttribute("meta:page-count"));
		var li_tabele = $('<li></li>').addClass("list-group-item").text('Tabele: ' + stats.getAttribute("meta:table-count"));
		var li_obiekt = $('<li></li>').addClass("list-group-item").text('Obiekty :' + stats.getAttribute("meta:object-count"));
		var li_obrazy = $('<li></li>').addClass("list-group-item").text('Obrazy: ' + stats.getAttribute("meta:image-count"));
		var li_paragr = $('<li></li>').addClass("list-group-item").text('Paragrafy: ' + stats.getAttribute("meta:paragraph-count"));
		var li_slowa = $('<li></li>').addClass("list-group-item").text('Słowa: ' + stats.getAttribute("meta:word-count"));
		var li_znaki = $('<li></li>').addClass("list-group-item").text('Znaki: ' + stats.getAttribute("meta:character-count"));

		ul.append(li_strony);
		ul.append(li_tabele);
		ul.append(li_obiekt);
		ul.append(li_obrazy);
		ul.append(li_paragr);
		ul.append(li_slowa);
		ul.append(li_znaki);
	}

	div.append(ul);

	showStats();
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

	var p = $('<p></p>');
	p.text(vector).addClass('vector');

	$('#doc-vectors').append(p);

	showVectors();
}

function diffVector(){
	var files = $('input[type="checkbox"]:checked');
	files.each(function(){
		stats($(this).attr('value'), 'V');
	});
}