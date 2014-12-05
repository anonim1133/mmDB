function getFile(event){
    console.log("get file handler");
    /* Read the list of the selected files. */

    if (!event.target.files.length){
		alert('Please select a file!');
	    return;
    }else{
        var files = event.target.files;
        var file_list = $('#file-list');

	    //Support of multiple files
        for (var i = 0, f; f = files[i]; i++) {
	        //Listing files
	        var a = $('<a></a>').attr('href', '#').text(f.name);
	        var li = $('<li></li>').append(a);

	        file_list.append(li);


	        //Reading files
	        var reader = new FileReader();

	        //onLoad event is fired when the load completes.
	        reader.onload =   (function(file) {
		        return function (evt) {
					saveFile(file);
		        };
	        })(f);

			//Read file
			reader.readAsText(f)
        }
    }
}

function saveFile(file) {
	navigator.webkitPersistentStorage.requestQuota (1024*1024*1024, function(grantedBytes) {
		console.log ('requestQuota: ', arguments);
		requestFS(grantedBytes);
	}, errorHandler);

	function requestFS(grantedBytes) {
		window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, function(fs) {
			console.log("Saving: " + file.name);

			//ToDo: Delete file if exists
			fs.root.getFile(file.name, {create: true, exclusive: true}, function(file) {
				showFileList();
				//alert('A file ' + file.name + ' was created successfully.');
			}, errorHandler);
		}, errorHandler);
	}


			/*
			 fs.root.getFile(file.name, {create: true}, function(DatFile) {
			 console.log("getFile");
			 DatFile.createWriter(function(DatContent) {
			 console.log("writeFile");
			 var blob = new Blob(file.content, {type: "blob"});
			 DatContent.write(blob);
			 console.log("fileWrited");
			 });
			 });
			 */

}

function errorHandler(message){
	console.log(message);
	//alert(message);
}

/* Listener for multiple files input element. */
$(document).ready(function(){
    document.getElementById('uploadFileInput').addEventListener('change', getFile, false);
});






















