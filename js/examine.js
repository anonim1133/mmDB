var lastVectorFor = ''; // sorry, nie chciało mi się przekazywać parametrem w 1000 funkcjach :D
var lastStatFor = ''; // likewise ;)

function stats(filename, what){
	if (what == 'V') {
		lastVectorFor = filename;
	}
	if (what == 'S') {
		lastStatFor = filename;
	}
	
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

function parseSqlString(sqlString) {
	///////////////////////////////////////////////////
	//
	// SELECT <what> FROM files WHERE <condition>
	// There can be multiple <what>s separated by ", "
	// There can be multiple <condition>s separated by " AND "
	// 
	// Accepted <what>s:
	// - filename
	// - hash
	// - COUNT(words)
	// - COUNT(pages)
	// - COUNT(tables)
	// 
	// Accepted <condition>s:
	// - "HASHLEVEL IS 2" (0-3)
	// - "filename = article"
	// - COUNT(words) > 2
	// - COUNT(pages) < 3
	// - COUNT(tables) = 1
	// 
	///////////////////////////////////////////////////
	var myRegexp = /SELECT (.*?) FROM files WHERE (.*)/g;
	var match = myRegexp.exec(sqlString);
	var selectionsString = match[1];
	var conditionsString = match[2];
	console.log("Selecting: " + selectionsString);
	console.log("Conditions: " + conditionsString);
	
	var conditions = [];
	var selections = [];
	
	$.each(conditionsString.split("AND"), function(index, value) {
		var condition = value.trim();
		var pieces = condition.split(" ");		
		var tmpC = [pieces[0], pieces[1], pieces[2]];		
		conditions.push(tmpC);
	});
	
	$.each(selectionsString.split(","), function(index, value) {
		var selection = value.trim();
		selections.push(selection);
	});
	
	execSql(conditions, selections);
}

function myCompare(v1, v2, op) {
	// v1 is the real database value
	// v2 is the condition value
	if ($.inArray(op, ['<', '>', '=', '<=', '>=']) == -1) {
		return false;
	}
	
	if ((op == '=') && (v1 = v2)) {
		return true;
	}
	else if ((op == '>') && (v1 > v2)) {
		return true;
	}
	else if ((op == '<') && (v1 < v2)) {
		return true;
	}
	else if ((op == '>=') && (v1 >= v2)) {
		return true;
	}
	else if ((op == '<=') && (v1 <= v2)) {
		return true;
	}
	
	return false;
}

function execSql(conditions, selections) {
	var filenames = [];
	
	$.each(localStorage, function(index, value) {
		if ((index.substr(0, 11)) == 'countpages_') {
			var filename = index.substr(11);
			if ("simplest_hash_0_" + filename in localStorage) {
				filenames.push(filename.slice(0, -3));
			}
		}
	});
	
	// hashlevel
	var hashLevel = 0;
	$.each(conditions, function(index, value) {
		var s1 = value[0];
		var s2 = value[2]
		var op = value[1];
		
		if ((s1 == 'HASHLEVEL') && (op == 'IS')) {
			var tmpH = parseInt(s2, 10);
			if (tmpH < 0) {
				hashLevel = 0;
			}
			else if (tmpH > 3) {
				hashLevel = 3;
			}
			else {
				hashLevel = tmpH;
			}
		}
	});
	console.log('Setting HASHLEVEL to ' + hashLevel);
	
	// rest of conditions
	$.each(conditions, function(index, value) {
		var s1 = value[0];
		var s2 = value[2];
		var op = value[1];
		
		if ((s1 == 'filename') && (op == '=')) {
			filenames = $.grep(filenames, function(f) {
				return f == s2;
			});
		}
		else if (s1.substr(0, 5) == 'COUNT') {
			var countWhat = s1.substr(6).slice(0, -1);
			
			if ($.inArray(countWhat, ['pages', 'words', 'tables']) == -1) {
				return;
			}
			
			var lsKeyPrefix = 'count' + countWhat + '_';
			filenames = $.grep(filenames, function(f) {
				var lsKey = lsKeyPrefix + f + 'odt';
				var lsValue = parseInt(localStorage[lsKey], 10);
				s2 = parseInt(s2, 10);
				
//				console.log('We want: ' + op + ' ' + s2);
//				console.log('Really is: ' + lsValue);
//				console.log('Result: ' + myCompare(lsValue, s2, op));
				return myCompare(lsValue, s2, op);
			});
		}
		
	});
	
	console.log('These are the files that are left after applying conditions:');
	console.log(filenames);
	
	printSqlResult(filenames, selections, hashLevel);
}

function printSqlResult(filenames, initialSelections, hashLevel) {
	var resultsArray = [];
	var selections = [];
	
	var theadArray = [];
	var tbodyArray = [];
	
	// th
	$.each(initialSelections, function(index, value) {
		if ($.inArray(value, ['COUNT(words)', 'COUNT(tables)', 'COUNT(pages)', 'filename', 'hash']) != -1) {
			selections.push(value);
		}
	});
	resultsArray.push(selections);
	theadArray.push(selections);
	
	// td's
	$.each(filenames, function(index, f) {
		var tmpRow = [];
		$.each(selections, function(index2, s) {
			if (s == 'COUNT(words)') {
				tmpRow.push(localStorage['countwords_' + f + 'odt']);
			}
			else if (s == 'COUNT(pages)') {
				tmpRow.push(localStorage['countpages_' + f + 'odt']);
			}
			else if (s == 'COUNT(tables)') {
				tmpRow.push(localStorage['counttables_' + f + 'odt']);
			}
			else if (s == 'filename') {
				tmpRow.push(f);
			}
			else if (s == 'hash') {
				tmpRow.push(localStorage['simplest_hash_' + hashLevel + '_' + f + 'odt']);
			}
		});
		resultsArray.push(tmpRow);
		tbodyArray.push(tmpRow);
	});
	
	//console.log(resultsArray);
	
	// displaying the array as a table:
	// thead
	var html = '<thead>';
	$.each(theadArray, function(index, row) {
		html += '<tr>';
		$.each(row, function(index2, cell) {
			html += '<th>' + cell + '</th>';
		});
		html += '</tr>';
	});
	html += '</thead><tbody>';
	// tbody
	$.each(tbodyArray, function(index, row) {
		html += '<tr>';
		$.each(row, function(index2, cell) {
			html += '<td>' + cell + '</td>';
		});
		html += '</tr>';
	});
	html += '</tbody>';
	
	$('#theResultTable').html(html);
}

$(document).on('click', '#execSqlButton', function(e) {
	e.preventDefault();
	e.stopPropagation();
	
	var sqlString = $('#sqlTextArea').val().trim();
	console.log(sqlString);
	parseSqlString(sqlString);
	
	return false;
});

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
		
		// saving stats in localstorage
		if (lastStatFor) {
			var find = '\\.';
			var re = new RegExp(find, 'g');
			var keyAddition = lastStatFor.replace(re, '');
			localStorage['counttables_' + keyAddition] = stats.getAttribute("meta:table-count");
			localStorage['countpages_' + keyAddition] = stats.getAttribute("meta:page-count");
			localStorage['countwords_' + keyAddition] = stats.getAttribute("meta:word-count");
		}
		// end-of saving stats in localstorage
		
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

function addToTreeString(treeString, object) {
	
	if ((object.prop("tagName") == 'text:p') && (object.text().length)) {
		treeString += '{"name":"paragraph","children":[';
		var slowa = $(object.text().split(' '));

		$.each(slowa, (function(i, word) {
			treeString += '{"name":"word","size":' + word.length + '},';
		}));
	}
	else if (object.prop("tagName") == 'table:table') {
		treeString += '{"name":"table","children":[';
	}
	else if (object.prop("tagName") == 'draw:image') {
		var height = object.parent().attr('svg:height').match(/(\d)+\.(\d+)/g)[0];
		var width = object.parent().attr('svg:width').match(/(\d)+\.(\d+)/g)[0];
		var hash = Math.round(parseFloat(height) * parseFloat(width));
		treeString += '{"name":"image","size":' + parseInt(hash, 10) + '},';
	}
	else if (object.prop("tagName") == 'draw:object') {
		// draw:frame draw:style-name="fr1" draw:name="Object1" text:anchor-type="as-char" svg:y="-0.377cm"
		// svg:width="2.731cm" svg:height="0.467cm" draw:z-index="0">
		var height = object.parent().attr('svg:height').match(/(\d)+\.(\d+)/g)[0];
		var width = object.parent().attr('svg:width').match(/(\d)+\.(\d+)/g)[0];
		var y = object.parent().attr('svg:y').match(/(\d)+\.(\d+)/g)[0];
		var z = object.parent().attr('draw:z-index');
		var hash = Math.round(parseFloat(height) * parseFloat(width) + parseFloat(y) + parseFloat(z));
		treeString += '{"name":"object","size":' + parseInt(hash, 10) + '},';
	}
	
	// recursion
	object.children().each(function() {
		treeString = addToTreeString(treeString, $(this));
	});
	
	if ((object.prop("tagName") == 'text:p') && (object.text().length)) {
		treeString += ']},';
	}
	else if (object.prop("tagName") == 'table:table') {
		treeString += ']},';
	}
	
	return treeString;
}

function createTree(body) {
	console.log(body);
	var treeString = '{"name":"body","children":[';
	
	body.children().each(function() {
		treeString = addToTreeString(treeString, $(this));
	});
	
	treeString += ']}';
	
	var find = ',}';
	var re = new RegExp(find, 'g');
	treeString = treeString.replace(re, '}');
	
	var find = ',]';
	var re = new RegExp(find, 'g');
	treeString = treeString.replace(re, ']');
	
	console.log(treeString);
	
	// let's store the json in the local storage
	if (lastVectorFor) {		
		var find = '\\.';
		var re = new RegExp(find, 'g');
		var keyAddition = lastVectorFor.replace(re, '');
		var key = 'jsontree_' + keyAddition;
		
		localStorage[key] = treeString;
		
		// let's make a hash, while we're here
		makeAHash(treeString, keyAddition);
	}
}

var howDeepDoWeGoWhenCreatingHashes = 3;

function makeAHash(treeString, keyAddition) {
	// now, let's create a hash
	var object = JSON.parse(treeString);
	for (var i = 0 ; i <= howDeepDoWeGoWhenCreatingHashes ; i++) {
		// robimy kilka hashow
		// hash_0 jest najbardziej ogolny
		// hash_1 bedzie uwzglednial dzieci
		// hash_2 bedzie uwzglednial dzieci dzieci
		// etc...

		// tworzymy hash_i
		var hashString = '';
		var simpleHashString = '';
		var simplestHashInt = 0;
		var objectsOnLevelJ = [];
		objectsOnLevelJ.push(object); // zaczynamy od poziomu 0
		var keyString = 'hash_' + i + '_' + keyAddition;
		for (var j = 0 ; j <= i ; j++) {
			// j to level na ktorym aktualnie sprawdzamy
			if (j > 0) {
				var tmpObjectsOnLevelJ = [];
				$.each(objectsOnLevelJ, function(index, value) {
					if ((value.children) && (value.children.length)) {
						$.each(value.children, function(index2, value2) {
							tmpObjectsOnLevelJ.push(value2);
						});
					}
				});
				objectsOnLevelJ = tmpObjectsOnLevelJ;
			}
			$.each(objectsOnLevelJ, function(index, value) {
				var thisValueSize = 0;
				if (value.size) {
					thisValueSize = value.size;
				}
				if (value.children) {
					thisValueSize = value.children.length;
				}
				hashString += value.name + thisValueSize;
				
				simpleHashString += thisValueSize + ' ';
				
				simplestHashInt += thisValueSize;
			});
		}
		// hash
		localStorage[keyString] = hashString;
		
		// simple hash
		simpleHashString = simpleHashString.replace(/\s{2,}/g, ' ');
		localStorage['simple_' + keyString] = $.trim(simpleHashString);
		
		// simplest hash
		localStorage['simplest_' + keyString] = simplestHashInt;
	}
}

function xmlToVector(xml){
	createTree(xml.find("body"));
	
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
	var vectors = $('ul.vector');

	var longest = 0;
	vectors.each(function(i){
		//var l = $(this).text().length;
		var l = $($('ul.vector')[i]).find('li').size();
		if(l > longest)
			longest = l;

		vectors[i] = $($('ul.vector')[i]).find('li');
	});

	var lcs = '';
	var max = 0;
	vectors.each(function(i, v1){
		vectors.each(function(j, v2){
			if(i != j && i < j){
				var tmp_max = 0;
				var tmp_lcs = '';
				var start_k = -1;

				for(var k = 0; k < longest; k++) {
					for(var m = 0; m < longest; m++) {
						if (v1[k] !== undefined && v2[m] !== undefined && $(v1[k]).text() === $(v2[m]).text()) {

							//Ustawiam k, do którego wrócę, po przejściu przez dane podciagi
							if(start_k === -1){
								start_k = k;
							}

							tmp_lcs += $(v1[k]).text();
							tmp_max++;
							k++;
						} else {
							if (tmp_max > max) {
								lcs = tmp_lcs;
								max = tmp_max;
								m = -1;
							}
							//Wracam do k przy którym zacząłem poszukiwanie podciągu
							if(start_k !== -1 && k !== longest){
								k = start_k;
							}

							start_k = -1;
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

	highlight(lcs);
	$('div#results').highlight(lcs);
}


function highlight(lcs){
	$('ul.vector').each(function(){
		var pos = $(this).text().indexOf(lcs)
		var str = $(this).text().substring(0, pos);
		pos = str.match(/[a-zA-Z]/g).length;

		var lcs_len = lcs.length;

		$.each($(this).find('li'), function(i, li){
			if(i >= pos && i < lcs_len+pos)
				$(li).addClass('highlight');
		});

	});
}
