'use strict';

const players = 6;
const questions = 6;
let question = 0;

const playerScores = new Array(players).fill(0);
const playerNames = new Array(players).fill(null);
let lavaLevel = -3; // Name Select + Click to start + 1 point lead

let initialHeight = -1;

const initialLavaHeight = -95;
const finalLavaHeight = -17;

const loadPlayers = () => {
	const bottom = document.querySelector('.floor-divider.last').getBoundingClientRect();
	const top = document.querySelector('.floor-divider').getBoundingClientRect();
	const playerBox = document.querySelector('.player').getBoundingClientRect();

	initialHeight = top.y + top.height - bottom.y;
	// const spaceInterval = (bottom.width - (players * playerBox.width)) / players + playerBox.width;
	const spaceInterval = playerBox.width + ((bottom.width - ((players) * playerBox.width)) / (players - 1));

	for (let i = 0; i < players; i++) {
		const element = document.getElementById(`player-${i}`);
		element.style.left = `${i * spaceInterval}px`;
		element.style.bottom = `${initialHeight}px`;
		element.addEventListener('click', () => {
			if (playerNames[i] === null && i != 5) {
				const name = prompt('i was too lazy to program a prompt');
				playerNames[i] = name;
				element.innerText = name;
				textFit(element);
				return;
			}

			playerScores[i] += 1;
			const score = playerScores[i];
			const height = initialHeight / questions * (questions - score);
			element.style.bottom = `${height}px`;
		})
	}
}

const loadLava = () => {
	const lavaElement = document.getElementById('lava');
	lavaElement.addEventListener('click', () => {
		setTimeout(showModal, 3000, question);
		question++;

		lavaLevel++;
		if (lavaLevel <= 0) {
			return;
		}
		const height = initialLavaHeight + (finalLavaHeight - initialLavaHeight) * (lavaLevel / questions);
		lavaElement.style.bottom = `${height}%`;
	});
}

const hideModal = () => {
	const element = document.getElementById('modal');
	while (element.firstChild) {
		element.removeChild(element.lastChild);
	}
	element.style.display = 'none';
}

const showModal = question => {
	const element = document.getElementById('modal');
	const img = document.createElement('img');
	img.addEventListener('load', () => {
		element.style.display = 'flex';
	})
	img.src = `./problems/${question}.png`;

	element.appendChild(img);
}

const loadModal = () => {
	const element = document.getElementById('modal');
	element.addEventListener('click', () => {
		hideModal();
	});
}

const main = () => {
	loadPlayers();
	loadLava();
	loadModal();
}

window.onload = main;