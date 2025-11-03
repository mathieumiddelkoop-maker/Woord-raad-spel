// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
    getDatabase, ref, set, onChildAdded, onValue, runTransaction 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// --- Firebase configuratie ---
const firebaseConfig = {
    apiKey: "AIzaSyDHNYnX394eQP5PtyMUnZCuB9yrIQthrqc",
    authDomain: "woord-raad-spel.firebaseapp.com",
    databaseURL: "https://woord-raad-spel-default-rtdb.firebaseio.com",
    projectId: "woord-raad-spel",
    storageBucket: "woord-raad-spel.appspot.com",
    messagingSenderId: "720430629018",
    appId: "1:720430629018:web:1bed6cebcccb9cb6b0df23"
};

// --- Firebase initialiseren ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Spelvariabelen ---
const words = [
    "appel","fiets","water","tafel","stoel","licht","vogel","plant","snoep","smaak",
    "grond","kleur","molen","brood","koffer","graag","droom","steen","boeken","regen",
    "zomer","lente","winter","paard","koets","markt","wonen","prijs","laptop","taart",
    "boter","kaars","lampen","zagen","haren","schip","snaar","kaas","bomen","graan",
    "roos","fruit","vissen","vlieg","toren","klok","groen","zout","lepel","bord",
    "rozen","tasjes","muren","kamer","dakje","deur","stoep","stoer","krant","boek",
    "boot","brug","straat","plein","vijver","muren","stoel","appel","boter","melk",
    "vogel","paard","molen","tafel","lamp","plant","regen","wind","fiets","stoel",
    "taart","snoep","plant","kaars","boter","appel","licht","vader","moeder","broer",
    "zusje","kindje","balon","kraan","zeven","vijfh","driee","tienn","negen","achtg",
    "kroon","schaap","hondj","katje","beerj","fiets","fiets","stoel","tafel","lampj",
    "plant","water","regen","wind","vogel","paard","molen","bootj","brugj","straat",
    "plein","vijver","kaars","boter","appel","licht","steen","boeken","regen","zomer",
    "lente","winter","paard","koets","markt","wonen","prijs","laptop","taart","boter",
    "kaars","lampen","zagen","haren","schip","snaar","kaas","bomen","graan","roos",
    "fruit","vissen","vlieg","toren","klok","groen","zout","lepel","bord","rozen",
    "tasjes","muren","kamer","dakje","deur","stoep","stoer","krant","boek","boot",
    "brug","straat","plein","vijver","muren","stoel","appel","boter","melk","vogel",
    "paard","molen","tafel","lamp","plant","regen","wind","fiets","stoel","taart",
    "snoep","plant","kaars","boter","appel","licht","vader","moeder","broer","zusje",
    "kindje","balon","kraan","zeven","vijfh","driee","tienn","negen","achtg","kroon",
    "schaap","hondj","katje","beerj","fiets","fiets","stoel","tafel","lampj","plant",
    "water","regen","wind","vogel","paard","molen","bootj","brugj","straat","plein"
]; // 200 woorden
let targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
let team = null;
let round = 0;
let attempt = 0;
let timer = 60;
let interval = null;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let letterStatus = {}; // Houdt bij welke letters fout zijn

// --- Team login ---
function loginTeam() {
    const code = document.getElementById('teamCode').value.toUpperCase();
    if (!code) return alert('Voer een teamcode in!');
    team = code;
    document.getElementById('game').style.display = 'block';
    document.getElementById('roundCounter').textContent = round;
    document.getElementById('attemptCounter').textContent = attempt;
}

// --- Gissing versturen ---
function submitGuess() {
    if (round >= 10) return alert('Alle 10 rondes gespeeld!');
    const guess = document.getElementById('guessInput').value.toUpperCase();
    if (guess.length !== 5) return alert('Voer een 5-letter woord in!');
    attempt++;
    document.getElementById('attemptCounter').textContent = attempt;

    // Firebase opslaan
    set(ref(db, 'guesses/' + Date.now()), { team: team, guess: guess });

    // Check woord
    if (guess === targetWord) {
        alert(`Correct! ${guess} is goed!`);
        const scoreRef = ref(db, 'scores/' + team);
        runTransaction(scoreRef, score => (score || 0) + (60 - timer));
        nextRound();
    } else if (attempt >= 5) {
        alert(`Max pogingen bereikt. Het woord was ${targetWord}`);
        nextRound();
    }

    document.getElementById('guessInput').value = '';
}

// --- Volgende ronde ---
function nextRound() {
    round++;
    attempt = 0;
    letterStatus = {};
    document.getElementById('roundCounter').textContent = round;
    document.getElementById('attemptCounter').textContent = attempt;

    // Kies nieuw targetWord
    targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();

    // Reset bord
    const board = document.getElementById('board');
    if(board) board.innerHTML = '';

    // Reset timer
    clearInterval(interval);
    timer = 60;
    const timerEl = document.getElementById('timer');
    interval = setInterval(() => {
        timer--;
        if(timerEl) timerEl.textContent = timer;
        if(timer <= 0){
            alert('Tijd voorbij voor deze ronde!');
            nextRound();
        }
    }, 1000);
}

// --- Alfabet renderen ---
function renderAlphabet() {
    const alphaDiv = document.getElementById('alphabet');
    if (!alphaDiv) return;
    alphaDiv.innerHTML = '';
    alphabet.forEach(l => {
        const span = document.createElement('div');
        span.classList.add('letter');
        if(letterStatus[l] === 'wrong') span.classList.add('gray');
        span.textContent = l;
        alphaDiv.appendChild(span);
    });
}

// --- Hoofdscherm realtime update ---
if (window.location.pathname.includes('index.html')) {
    const board = document.getElementById('board');
    const scoresEl = document.getElementById('scores');
    const timerEl = document.getElementById('timer');

    // Luister naar nieuwe gissingen
    onChildAdded(ref(db, 'guesses'), snapshot => {
        const { team, guess } = snapshot.val();
        const row = document.createElement('div');
        row.classList.add('row');

        for (let i = 0; i < guess.length; i++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');

            if (guess[i] === targetWord[i]) tile.classList.add('green');
            else if (targetWord.includes(guess[i])) tile.classList.add('yellow');
            else {
                tile.classList.add('gray');
                letterStatus[guess[i]] = 'wrong';
            }

            tile.textContent = guess[i];
            row.appendChild(tile);
        }

        board.appendChild(row);
        renderAlphabet();
    });

    // Luister naar score updates
    onValue(ref(db, 'scores'), snapshot => {
        scoresEl.innerHTML = "";
        const data = snapshot.val() || {};
        Object.keys(data).forEach(t => {
            const li = document.createElement('li');
            li.textContent = `${t}: ${data[t]} punten`;
            scoresEl.appendChild(li);
        });
    });

    // Timer starten
    interval = setInterval(() => {
        timer--;
        if(timerEl) timerEl.textContent = timer;
        if(timer <= 0){
            alert('Tijd voorbij voor deze ronde!');
            nextRound();
        }
    }, 1000);
}