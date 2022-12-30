const fs = require('fs');
const API_URL = 'https://the-trivia-api.com/api/questions?limit=50&region=ES&difficulty=medium'

let new_trivial = {questions: []};

fetch(API_URL).then((res) => res.json())
.then((questions) => {
  questions.forEach(quest => {
    new_trivial.questions.push({
      title: quest.question,
      answers: [quest.correctAnswer, ...quest.incorrectAnswers]
    });
  });
  const writeAllListStream = fs.createWriteStream('./trivias/general_en.json');
  writeAllListStream.write(JSON.stringify(new_trivial, null, 4));
})
.catch(() => {
  console.error(`Could not load ${this.lang}.json.`);
});