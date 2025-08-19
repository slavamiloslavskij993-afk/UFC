// Простая логика квиза UFC
// — По одному вопросу на экран
// — Прогресс-бар и кнопка "Далее"
// — Результат и кнопка "Поделиться"
// — Пасхалка: тройной тап по октагону открывает бонус

(function () {
	'use strict';

	/**
	 * Массив вопросов:
	 * - text: текст вопроса
	 * - options: варианты ответа
	 * - correctIndex: индекс правильного ответа в массиве options
	 */
	const QUESTIONS = [
		{
			text: 'Как расшифровывается аббревиатура UFC?',
			options: [
				'Ultimate Fighting Championship',
				'United Fight Club',
				'Universal Fight Contest',
				'Unlimited Fight Circuit'
			],
			correctIndex: 0
		},
		{
			text: 'Как называется восьмиугольная арена, где проходят бои UFC?',
			options: [ 'Клетка', 'Ринг', 'Октагон', 'Арена'] ,
			correctIndex: 2
		},
		{
			text: 'Сколько минут длится один раунд в титульном бою UFC?',
			options: [ '3 минуты', '5 минут', '7 минут', '10 минут' ],
			correctIndex: 1
		},
		{
			text: 'Как называется прием, когда соперник сдаётся, постукивая рукой?',
			options: [ 'Клинч', 'Тэп-аут', 'Апперкот', 'Скрембл' ],
			correctIndex: 1
		},
		{
			text: 'Кто считается первым двукратным чемпионом UFC в двух весах одновременно?',
			options: [ 'Жорж Сен-Пьер', 'Даниэль Кормье', 'Конор Макгрегор', 'Аманда Нуньес' ],
			correctIndex: 2
		}
	];

	// Элементы DOM
	const progressBar = document.getElementById('progressBar');
	const progressLabel = document.getElementById('progressLabel');
	const questionText = document.getElementById('questionText');
	const answersForm = document.getElementById('answers');
	const nextBtn = document.getElementById('nextBtn');
	const resultSection = document.getElementById('result');
	const resultScore = document.getElementById('resultScore');
	const resultBadge = document.getElementById('resultBadge');
	const quizCard = document.getElementById('quizCard');
	const shareBtn = document.getElementById('shareBtn');
	const restartBtn = document.getElementById('restartBtn');

	// Пасхалка/бонус
	const octagonBtn = document.getElementById('octagon');
	const bonusModal = document.getElementById('bonusModal');
	const modalBackdrop = document.getElementById('modalBackdrop');
	const modalClose = document.getElementById('modalClose');
	const copyBonusBtn = document.getElementById('copyBonusBtn');
	const bonusCode = document.getElementById('bonusCode');

	let currentIndex = 0;
	let score = 0;
	let selectedIndex = null;
	let octagonTapCount = 0;
	let octagonTapTimer = null;

	// Инициализация
	init();

	function init() {
		currentIndex = 0;
		score = 0;
		selectedIndex = null;
		quizCard.hidden = false;
		resultSection.hidden = true;
		updateProgress();
		renderQuestion();
		nextBtn.disabled = true;
	}

	// Обновляем прогресс-бар и текст
	function updateProgress() {
		const progress = Math.round((currentIndex / QUESTIONS.length) * 100);
		progressBar.style.width = progress + '%';
		progressBar.parentElement?.setAttribute('aria-valuenow', String(progress));
		progressLabel.textContent = `Вопрос ${Math.min(currentIndex + 1, QUESTIONS.length)} из ${QUESTIONS.length}`;
	}

	// Рендер вопроса и вариантов
	function renderQuestion() {
		const q = QUESTIONS[currentIndex];
		questionText.textContent = q.text;
		answersForm.innerHTML = '';

		q.options.forEach((opt, idx) => {
			const id = `a_${currentIndex}_${idx}`;
			const label = document.createElement('label');
			label.className = 'answer';
			label.setAttribute('for', id);

			const input = document.createElement('input');
			input.type = 'radio';
			input.name = 'answer';
			input.id = id;
			input.value = String(idx);

			const span = document.createElement('span');
			span.className = 'answer__text';
			span.textContent = opt;

			label.appendChild(input);
			label.appendChild(span);
			answersForm.appendChild(label);
		});

		answersForm.addEventListener('change', onAnswerChange, { once: true });
	}

	function onAnswerChange(e) {
		const target = e.target;
		if (target && target.name === 'answer') {
			selectedIndex = Number(target.value);
			nextBtn.disabled = false;
		}
	}

	// Переход к следующему вопросу или показ результата
	nextBtn.addEventListener('click', () => {
		if (selectedIndex === null) return;

		if (selectedIndex === QUESTIONS[currentIndex].correctIndex) {
			score++;
		}

		selectedIndex = null;
		currentIndex++;

		if (currentIndex < QUESTIONS.length) {
			updateProgress();
			renderQuestion();
			nextBtn.disabled = true;
			return;
		}

		// Завершение: показываем результат
		showResult();
	});

	function showResult() {
		quizCard.hidden = true;
		resultSection.hidden = false;

		resultScore.textContent = `${score}/${QUESTIONS.length}`;
		progressBar.style.width = '100%';
		progressLabel.textContent = 'Готово!';

		// Бейдж в зависимости от баллов
		let badge = 'Новичок октагона';
		if (score >= 4) badge = 'Гуру UFC';
		else if (score === 3) badge = 'Уверенный фанат';
		else if (score === 2) badge = 'Наблюдатель';
		resultBadge.textContent = badge;
	}

	// Поделиться результатом (Web Share API если есть)
	shareBtn?.addEventListener('click', async () => {
		const text = `Мой результат в UFC-квизе: ${score}/${QUESTIONS.length}. Сможешь лучше?`;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: 'UFC Quiz', text, url });
			} else {
				await navigator.clipboard.writeText(`${text} ${url}`);
				shareBtn.textContent = 'Скопировано!';
				setTimeout(() => (shareBtn.textContent = 'Поделиться результатом'), 1600);
			}
		} catch (e) {
			console.warn('Share canceled or failed', e);
		}
	});

	// Рестарт
	restartBtn?.addEventListener('click', () => init());

	// Пасхалка: тройной тап по октагону
	octagonBtn?.addEventListener('click', () => {
		octagonTapCount++;
		clearTimeout(octagonTapTimer);
		octagonTapTimer = setTimeout(() => {
			if (octagonTapCount >= 3) {
				openBonus();
			}
			octagonTapCount = 0;
		}, 350);
	});

	function openBonus() {
		bonusModal.setAttribute('aria-hidden', 'false');
	}

	function closeBonus() {
		bonusModal.setAttribute('aria-hidden', 'true');
	}

	modalBackdrop?.addEventListener('click', closeBonus);
	modalClose?.addEventListener('click', closeBonus);

	copyBonusBtn?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(bonusCode.textContent || '');
			copyBonusBtn.textContent = 'Скопировано!';
			setTimeout(() => (copyBonusBtn.textContent = 'Скопировать'), 1500);
		} catch {
			copyBonusBtn.textContent = 'Не удалось :(';
			setTimeout(() => (copyBonusBtn.textContent = 'Скопировать'), 1500);
		}
	});
})();





