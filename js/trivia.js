var acertadas = 0;
var falladas = 0;
var rand = new Array;
var ids = [0,1,2,3];
var actual = 0;
var preguntas;
var seconds = 10;
var trivia_name;
var trivia_file;
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function maxpuntuaciones(){
	puntuaciones = JSON.parse(window.localStorage.getItem("MegaTrivia"));
	result = $.grep(puntuaciones, function(e){ return e.name == trivia_name; });

	if (window.localStorage.getItem('MegaTrivia') == null){
		punt = [{"name": trivia_name, "acertadas": acertadas}];
		window.localStorage.setItem('MegaTrivia', JSON.stringify(punt));
		$('#gameover').append('<br /><b>Ha obtenido un nuevo récord</b>');
	}else{
		if (result.length){
			$.each(puntuaciones, function(i, item) {
				if (item.name == trivia_name && item.acertadas < acertadas){
					item.acertadas = acertadas;
					$('#gameover').append('<br /><b>Ha obtenido un nuevo récord</b>');
				}
			});
		}else{
			$('#gameover').append('<br /><b>Ha obtenido un nuevo récord</b>');
			puntuaciones.push({"name": trivia_name, "acertadas": acertadas});
		}
		window.localStorage.setItem("MegaTrivia", JSON.stringify(puntuaciones));
	}
}

$("#puntuaciones").click(function() {
	$('#game').empty();
	$('#game').append('<div><ul class="nav nav-tabs nav-stacked span4 offset1" style="text-align: left"></ul></div>');
	puntuaciones = JSON.parse(window.localStorage.getItem("MegaTrivia"));
	$.each(puntuaciones,function(i, item) {
		$('#game .nav').append('<li><a>{0}<span class="badge badge-info" style="float: right">{1}</span></a></li>'.format(item.name, item.acertadas));
	});
	$('#game').append('<div class="span8" style="text-align: center"><a href="index.html" class="btn">Volver</a></div>');
});

$('#gameover').on('hidden', function () {
	window.location.href = "index.html";
});

function nueva_pregunta(){
	if (actual <= preguntas.length-1 && falladas < 3){
		$('#game').empty();
		ids = shuffleArray(ids);
		var item = preguntas[actual];
		$("#game").append('<p>'+item.titulo+'<p><div class="btn-group btn-group-vertical" id="questions"></div>');
		for (var i=0; i<item.respuestas.length; i++){
			li_str = '<a href="#" class="btn" idresp="'+ids[i]+'">'+item.respuestas[ids[i]]+'</a>';
			$("#game #questions").append(li_str);
		}
		actual++;
	}else{
		$("#gameover #acertadas").text(acertadas);
		$("#gameover #falladas").text(falladas);
		$('#gameover').modal('show');
		maxpuntuaciones();
	}
}

function callback(data){
	preguntas = shuffleArray(data.preguntas);
	nueva_pregunta();
}

function loadTrivia(file) {
	var file = file;

	$.ajax({
		url: 'trivias/'+file+'.json',
		dataType: 'json',
		async: false,
		success: callback
	});
}

$("#game").delegate('#questions a', 'click', function() {
	var idresp = $(this).attr('idresp');
	if (idresp == '0'){
		acertadas ++;
		nueva_pregunta();
	}else{
		falladas ++;
		nueva_pregunta();
	}
});

$(window).load(function(){
	$('#mainlist li').on('click', function(e) {
		e.preventDefault();
	});
})
$("#triviainfo .modal-footer").delegate('.btn','click',function() {
	$('#game').empty();
	trivia_name = $(this).attr('data-name');
	trivia_file = $(this).attr('data-trivia');
	loadTrivia(trivia_file);
});
