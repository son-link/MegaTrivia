let corrects = 0;
let failed = 0;
let ids = [0, 1, 2, 3];
let current_question = 0;
let questions;
let seconds = 20;
let trivials;
let trivia_name;
let trivia_file;
let questions_timer = null;
let block_answers = false;

$().get('trivials.json', function(resp) {
  trivials = resp.trivials;
});

// Esta función es la encargada de randomizar los arrays que le pasemos
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

$('.show-page').on('click', function() {
  $('.page').removeClass('active');
  const target = $(this).attr('data-target');
  $(`#${target}`).addClass('active');

  switch (target) {
    case 'trivials-list':
      showtrivials();
      break;
    case 'top-ratings':
      showRecords();
      break;
  
    default:
      break;
  }
});

// Esta función se encarga de mostrar los trivials disponibles
function showtrivials() {
  $('#trivia_selection').empty();
  trivials.forEach(function (trivia, i) {
    const button = `<button class="btn-green trivia" data-trivia="${i}">${trivia.name}</button>`;
    $('#trivia_selection').append(button);
  });
}

// Cuando se pulsa sobre uno de los trivials se muestra la información y un link para empezar a jugarlo
$('#trivia_selection').on('click', '.trivia', function(e) {
  const trivia = parseInt($(e.target).attr('data-trivia'));
  const data = trivials[trivia];

  if (data) {
    loadTrivia(data.file);
    trivia_name = data.name
    $('.page').removeClass('active');
    $('#trivia').addClass('active');
    corrects = 0;
    failed = 0;
    seconds = 20;
    current_question = 0;
  }
});

// Comprobamos si hay una nueva puntuación máxima de un trivial. Si no es así solo guarda la puntuación si se acertó al menos 3 preguntas
function setMaxScores() {
  if (window.localStorage.getItem('MegaTrivia') == null && corrects >= 3){
    punt = [{
      name: trivia_name,
      corrects: corrects
    }];
    
    window.localStorage.setItem('MegaTrivia', JSON.stringify(punt));
    $('#gameover .modal-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
  } else {
    const scores = JSON.parse(window.localStorage.getItem("MegaTrivia"));
    result = scores.filter((data) => {
      return (data.name == trivia_name)
    });

    if (result.length) {
      scores.forEach(function(item) {
        if (item.name == trivia_name && item.corrects < corrects){
          item.corrects = corrects;
          $('#gameover .page-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
        }
      });
    } else {
      $('#gameover .page-body').append('<br /><b>Ha obtenido un nuevo récord</b>');
      scores.push({"name": trivia_name, "corrects": corrects});
    }

    window.localStorage.setItem("MegaTrivia", JSON.stringify(scores));
  }
}

// Muestra las puntuaciones máximas
function showRecords() {
  $('#best-scores > tbody').empty();
  scores = JSON.parse(window.localStorage.getItem("MegaTrivia"));
  if (scores != null) {
    scores.forEach(function(item) {
      $('#best-scores > tbody').append(`<tr><td>${item.name}</td><td>${item.corrects}</td></tr>`);
    });
  } else {
    $('#best-scores > tbody').html('<tr><td colspan="2">Aun no hay ninguna puntuación guardada</td></tr>');
  }
}

// Esta función es invocada cada vez que se vaya a hacer una nueva pregunta
function newQuestion() {
  block_answers = false;
  if (current_question <= questions.length - 1 && failed < 3) {
    seconds = 20;
    $('#cur-time').text(seconds);
    $('#trivia-answers').empty();
    ids = shuffleArray(ids);
    var item = questions[current_question];
    $('#trivia-question').html(item.title);

    for (let i = 0; i < 4; i++) {
      li_str = `<button class="btn-blue question" idresp="${ids[i]}">${item.answers[ids[i]]}</button>`;
      $('#trivia-answers').append(li_str);
    }

    current_question++;
    $('#cur-question > span').text(current_question);
    $('#acer-total').text(`${corrects} / ${questions.length}`);

    if (questions_timer) clearInterval(questions_timer);

    questions_timer = setInterval( function () {
      seconds--;
      $('#cur-time').text(seconds);

      if (seconds == 0) {
        $('#cur-time').text(0);
        clearInterval(questions_timer);
        failed++;
        newQuestion();
      }
    }, 1000);
  } else {
    clearInterval(questions_timer);
    $('#total-correct').text(`${corrects}`);
    $('#total-failed').text(`${failed}`);
    $('.page').removeClass('active');
    $('#gameover').addClass('active');
    setMaxScores()
  }
}

// Esta función carga el trivial solicitado
function loadTrivia(file) {
  $().get('trivias/'+file+'.json', function(res) {
    questions = shuffleArray(res.questions);
    newQuestion();
  });
}

// Comprobamos si se escogió la respuesta correcta o no
$('#trivia').on('click', '.question', function() {
  if (block_answers) return;

  const idresp = $(this).attr('idresp');
  $(this).removeClass('btn-blue');

  if (idresp == '0') {
    corrects++;
    $(this).addClass('btn-green');
  } else {
    failed++;
    $(this).addClass('btn-red');
  }

  block_answers = true;
  setTimeout(newQuestion, 1000);
});
