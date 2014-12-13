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
	var vector = $('<ul></ul>');

	body.each(function( index ) {
		if($( this ).prop("tagName") == 'text:p' && $(this).text().length){
			var slowa = $($(this).text().split(' '));
			vector.append('<li>P' + slowa.size() + '</li>');

			$.each(slowa, (function(i, word){
				vector.append('<li>W' + word.length + '</li>');
			}));
		}


		if($( this ).prop("tagName") == 'table:table'){
			var row_count = $(this).find('table-row').size();
			var column_count = $(this).find('table-column').size();
			vector.append('<li>T' + row_count+column_count + '</li>');
		}

		if($( this ).prop("tagName") == 'draw:image'){
			var height = $(this).parent().attr('svg:height').match(/(\d)+\.(\d+)/g)[0];
			var width = $(this).parent().attr('svg:width').match(/(\d)+\.(\d+)/g)[0];
			var hash = Math.round(parseFloat(height)*parseFloat(width));
			vector.append('<li>R' + hash + '</li>');
		}

		if($( this ).prop("tagName") == 'draw:object'){
			//draw:frame draw:style-name="fr1" draw:name="Object1" text:anchor-type="as-char" svg:y="-0.377cm"
			//				svg:width="2.731cm" svg:height="0.467cm" draw:z-index="0">
			var height = $(this).parent().attr('svg:height').match(/(\d)+\.(\d+)/g)[0];
			var width = $(this).parent().attr('svg:width').match(/(\d)+\.(\d+)/g)[0];
			var y = $(this).parent().attr('svg:y').match(/(\d)+\.(\d+)/g)[0];
			var z = $(this).parent().attr('draw:z-index');
			var hash = Math.round(parseFloat(height)*parseFloat(width)+parseFloat(y)+parseFloat(z));
			vector.append('<li>O' + hash + '</li>');
		}
	});


	vector.addClass('vector');

	$('#doc-vectors').append(vector);

	showVectors();
}

function diffVector(){
	var files = $('input[type="checkbox"]:checked');
	files.each(function(){
		stats($(this).attr('value'), 'V');
	});
}

function compareVectors(){
	var vector_container = $('#doc-vectors');
	var vectors = $('ul.vector');
	var n = vectors.length;

	//Tworzę nowe puste wektor
	var new_vectors = new Array(n);
	for(i=0; i<n; i++){
		new_vectors[i] = $('<ul class="vector"></ul>');
	}

	var max = 0;
	vectors.each(function(i, li){
		var l = $(this).text().length;
		if(l > max)
			max = l;

		vectors[i] = $($('ul.vector')[i]).find('li');
	});

	for (i = 0; i < max; i++) {
		var eq = false;
		var l_j = 0;

		for(j=1; j<n; j++){
			if(vectors[0][i] !== undefined && $(vectors[j][i]).text() === $(vectors[0][i]).text()){
					new_vectors[j].append($('<li class="eq">' + $(vectors[0][i]).text() + '</li>'));

				eq = true;
			}else {
				if (vectors[j][i] !== undefined)
					new_vectors[j].append($('<li class="n_eq">' + $(vectors[j][i]).text() + '</li>'));
			}

			l_j = j;
		}

		if(eq)
				new_vectors[0].append($('<li class="eq">' + $(vectors[0][i]).text() + '</li>'));
		else
			if(vectors[0][i] !== undefined)
				new_vectors[0].append($('<li class="n_eq">' + $(vectors[0][i]).text() + '</li>'));
	}

	resetVectors();

	$.each(new_vectors, function (i, vector) {
		vector_container.append(vector);
	});
}

function findLCS(){
	var vectors = $('p.vector');

	var longest = 0;
	vectors.each(function(i){
		var l = $(this).text().length;
		if(l > longest)
			longest = l;

		vectors[i] = $(this).text();
	});

	var lcs = '';
	var max = 0;
	vectors.each(function(i, v1){
		vectors.each(function(j, v2){
			if(i != j){
				var tmp_max = 0;
				var tmp_lcs = '';

				for(var k = 0; k < longest; k++) {
					for(var m = 0; m < longest; m++) {
						if (v1[k] !== undefined && v2[m] !== undefined && v1[k] === v2[m]) {
							tmp_lcs += v1[k];
							tmp_max++;
							k++;
						} else {
							if (tmp_max > max) {
								lcs = tmp_lcs;
								max = tmp_max;
								m = -1;
							}
							tmp_max = 0;
							tmp_lcs = '';
						}
					}
				}
			}
		});
	});

	$('div#results').append('<p class="result">' + 'M: ' + max + ' LCS: ' + lcs + '</p>');

	$('p.vector').each(function(i, v){
		$(v).text($.trim($(v).text()));
	});

	$('p.vector').highlight(lcs);
	$('div#results').highlight(lcs);
}
