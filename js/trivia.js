import Translate from "./translate.js";

let corrects = 0;
let failed = 0;
let ids = [0, 1, 2, 3];
let current_question = 0;
let questions;
let seconds = 20;
let trivials;
let trivia_name;
let questions_timer = null;
let block_answers = false;
let options = {};
const nav_lang = navigator.language.slice(0, 2);
const langs_supported = ['es', 'en'];

// En el caso de que en el navegador se este usando los idiomas co-oficiales (Catalán, Euskera y Gallego)
// usaremos por defecto el español, al menos hasta que las traducciones estén disponibles
if (nav_lang == 'ca' || nav_lang == 'eu' || nav_lang == 'gl')
  nav_lang = 'es'

if (localStorage.getItem('MegaTriviaConf') == null) {
  options = {
    lang: (langs_supported.includes(nav_lang)) ? nav_lang : 'en',
    time: 20,
    only_in_lang: false
  }

  localStorage.setItem('MegaTriviaConf', JSON.stringify(options));
} else {
  options = JSON.parse(localStorage.getItem('MegaTriviaConf'));
}

const translate = new Translate(options.lang);

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
    case 'options':
      loadConf();
      break;
  
    default:
      break;
  }
});

// Esta función se encarga de mostrar los trivials disponibles
function showtrivials() {
  $('#trivia_selection').empty();
  trivials.forEach(function (trivia, i) {
    if ((options.only_in_lang && trivia.lang == options.lang) || !options.only_in_lang) {
      const button = `
        <button class="btn-green trivia" data-trivia="${i}">
          <img src="flags/${trivia.lang}.svg" /> ${trivia.name}
        </button>
      `;
      $('#trivia_selection').append(button);
    }
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
    seconds = options.time;
    current_question = 0;
  }
});

// Comprobamos si hay una nueva puntuación máxima de un trivial. Si no es así solo guarda la puntuación si se acertó al menos 3 preguntas
function setMaxScores() {
  $('#new-record').hide();
  if (localStorage.getItem('MegaTrivia') == null && corrects >= 3) {
    const punt = [{
      name: trivia_name,
      corrects: corrects
    }];
    
    localStorage.setItem('MegaTrivia', JSON.stringify(punt));
    $('#new-record').show();
  } else {
    const scores = JSON.parse(localStorage.getItem("MegaTrivia"));
    let result = scores.filter((data) => {
      return (data.name == trivia_name)
    });

    if (result.length) {
      scores.forEach(function(item) {
        if (item.name == trivia_name && item.corrects < corrects){
          item.corrects = corrects;
          $('#new-record').show();
        }
      });
    } else {
      $('#new-record').show();
      scores.push({"name": trivia_name, "corrects": corrects});
    }

    localStorage.setItem("MegaTrivia", JSON.stringify(scores));
  }
}

// Muestra las puntuaciones máximas
function showRecords() {
  $('#best-scores > tbody').empty();
  const scores = JSON.parse(localStorage.getItem("MegaTrivia"));
  if (scores != null) {
    scores.forEach(function(item) {
      $('#best-scores > tbody').append(`<tr><td>${item.name}</td><td class="score-points">${item.corrects}</td></tr>`);
    });
  } else {
    $('#best-scores > tbody').html('<tr><td colspan="2" id="no-records">' + translate.__('no_records') + '</td></tr>');
  }
}

// Esta función es invocada cada vez que se vaya a hacer una nueva pregunta
function newQuestion() {
  block_answers = false;
  if (current_question <= questions.length - 1 && failed < 3) {
    seconds = options.time;
    $('#cur-time').text(seconds);
    $('#trivia-answers').empty();
    ids = shuffleArray(ids);
    const item = questions[current_question];
    $('#trivia-question').html(item.title);

    for (let i = 0; i < 4; i++) {
      const li_str = `<button class="btn-blue question" idresp="${ids[i]}">${item.answers[ids[i]]}</button>`;
      $('#trivia-answers').append(li_str);
    }

    current_question++;
    $('#cur-question').text(translate.__('question-n', { cur_question: current_question }));
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
    $('#game-over-text').html(translate.__('game_over', { total_correct: corrects, total_failed: failed }));
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

function loadConf() {
  $('#sel-lang').val(options.lang);
  $(`#sel-lang > option`).removeAttr('selected');
  $(`#sel-lang > option[value="${options.lang}]"`).attr('selected', true);
  $(`#sel-time > option`).removeAttr('selected');
  $(`#sel-time > option[value="${options.time}"]`).attr('selected', true);
  $(`#in-lang`).removeAttr('checked');
  if (options.only_in_lang) $(`#in-lang`).attr('checked', true);
}

$('#save-options').on('click', function() {
  const lang = $('#sel-lang').val();
  const time = $('#sel-time').val();
  const only_in_lang = ($('#in-lang').is(':checked')) ? true : false;

  translate.changeLang(lang);
  options.lang = lang;
  options.time = time;
  options.only_in_lang = only_in_lang;

  localStorage.setItem('MegaTriviaConf', JSON.stringify(options));
});

$('#back2home').on('click', () => {
  clearInterval(questions_timer);
  $('.page').removeClass('active');
  $('#main').addClass('active');
})

window.onload = () => {
  if ('serviceWorker' in navigator) {
    const onSuccessRegister = (registration) => console.log("SW Register Success: ", registration.scope)
    const onErrorRegister = (error) => console.log("SW Register Error: ",error)

    navigator.serviceWorker.register('sw.js')
      .then(onSuccessRegister)
      .catch(onErrorRegister)
  } else console.log('Your browser do not support service worker')
}