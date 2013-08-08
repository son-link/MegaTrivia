var acertadas = 0;
var falladas = 0;
var rand = new Array;
var ids = [0,1,2,3];
var actual = 0;
var preguntas;
var seconds = 10;
var trivia_name;
var trivia_file;
// Esta función es la encargada de randomizar los arrays que le pasemos
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}
// Esta función se encarga de mostrar los trivials disponibles
function showtrivials(data){
	$('#trivia_selection').empty();
	$.each(data.trivials, function(indice,valor) {
		button = '<a href="#" class="btn btn-primary span2" data-title="{0}" data-content="{1}" data-file="{2}">{0}</a>'.format(valor['name'], valor['desc'], valor['file'])
		$('#trivia_selection').append(button);
	});
	$('#trivials').modal();
}
// Cuando se pulsa sobre uno de los trivials se muestra la información y un link para empezar a jugarlo
$("#trivia_selection").delegate('a', 'click', function() {
	$('#descripcion').empty();
	$('#descripcion').text($(this).attr('data-content'));
	$('#descripcion').append('<br /><a data-dismiss="modal" aria-hidden="true" data-name="{0}"data-trivia="{1}"><i class="icon-chevron-right"></i> Jugar</a>'.format($(this).attr('data-title'), $(this).attr('data-file')));
});
// al pulsar sobre el link para jugar a un trivial solicitamos los datos e invocamos a la función pertinente
$("#jugar").click(function() {
	$.ajax({
		url: 'trivials.json',
		dataType: 'json',
		async: false,
		success: showtrivials
	});
});

// Comprobamos si hay una nueva puntuación máxima de un trivial. Si no es así solo guarda la puntuación si se acertó al menos 3 preguntas
function maxpuntuaciones(){
	if (window.localStorage.getItem('MegaTrivia') == null && acertadas >= 3){
		punt = [{"name": trivia_name, "acertadas": acertadas}];
		window.localStorage.setItem('MegaTrivia', JSON.stringify(punt));
		$('#gameover .modal-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
	}else{
		puntuaciones = JSON.parse(window.localStorage.getItem("MegaTrivia"));
		result = $.grep(puntuaciones, function(e){ return e.name == trivia_name; });
		if (result.length){
			$.each(puntuaciones, function(i, item) {
				if (item.name == trivia_name && item.acertadas < acertadas){
					item.acertadas = acertadas;
					$('#gameover .modal-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
				}
			});
		}else{
			$('#gameover .modal-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
			puntuaciones.push({"name": trivia_name, "acertadas": acertadas});
		}
		window.localStorage.setItem("MegaTrivia", JSON.stringify(puntuaciones));
	}
}

// Muestra las puntuaciones máximas
$("#puntuaciones").click(function() {

	$('#maximas ul').empty();
	puntuaciones = JSON.parse(window.localStorage.getItem("MegaTrivia"));
	if (puntuaciones != null){
		$.each(puntuaciones,function(i, item) {
			$('#maximas ul').append('<li><a>{0}<span class="badge pull-right">{1}</span></a></li>'.format(item.name, item.acertadas));
		});
	}else{
		$('#maximas').text('Aun no hay ninguna puntuación guardada');
	}
	$('#puntuacionesmaximas').modal();
});

$('#gameover').on('hidden', function () {
	window.location.href = "index.html";
});

// Esta función es invocada cada vez que se vaya a hacer una nueva pregunta
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

// Esta función carga el trivial solicitado
function loadTrivia(file) {
	var file = file;

	$.ajax({
		url: 'trivias/'+file+'.json',
		dataType: 'json',
		async: false,
		success: callback
	});
}

// Comprobamos si se escogió la respuesta correcta o no
$("#game").delegate('#questions a', 'click', function() {
	var idresp = $(this).attr('idresp');
	if (idresp == '0'){
		acertadas ++;
		$(this).addClass('btn-success');
		setTimeout(nueva_pregunta, 2000);
	}else{
		falladas ++;
		nueva_pregunta();
	}
});

$(window).load(function(){
	$('#mainlist li').on('click', function(e) {
		e.preventDefault();
	});
});

// Cuando se pulsa sobre el link para jugar esta función guarda el nombre del trivial e invoca a la función encargada de solicitar el fichero con las preguntas
$("#descripcion").delegate('a','click',function() {
	$('#game').empty();
	trivia_name = $(this).attr('data-name');
	trivia_file = $(this).attr('data-trivia');
	loadTrivia(trivia_file);
});
