(function() {
    'use strict';

    const App = {
        config: {
            grammarPath: '../grammar/',
            rulesPath: '../rules/',
            storageKey: 'b2_english_progress',
            lessonsCache: new Map()
        },

        state: {
            currentView: 'welcome',
            currentLesson: null,
            currentFile: null,
            progress: {},
            unlockedLevel: 19,
            completedLessons: [],
            flashcardScore: 0,
            flashcardMastery: {},
            sessionMastered: 0,
            bookMarks: [],
            exerciseState: {
                current: null,
                score: 0,
                total: 0,
                answers: []
            }
        },

        GRAMMAR_LEVELS: {
            1: ['00-grammar-terms', '01-present-simple', '02-present-continuous'],
            2: ['03-past-simple', '04-past-continuous'],
            3: ['05-present-perfect', '06-present-perfect-continuous', '07-present-perfect-vs-past-simple'],
            4: ['08-past-perfect', '09-past-perfect-continuous'],
            5: ['10-for-since-have-got-used-to', '11-present-tenses-for-future', '12-future-simple-going-to-will-shall', '13-future-continuous-future-perfect'],
            6: ['14-when-i-do-when-ive-done-if-when', '15-modal-verbs-can-could-able-to', '16-modal-verbs-could-do-could-have-done', '17-modal-verbs-must-cant-may-might', '18-modal-verbs-have-to-must-mustnt-neednt', '19-modal-verbs-should-id-better-its-time'],
            7: ['20-modal-verbs-would-can-could-would-you', '21-conditionals-if-i-do-if-i-did', '22-if-i-knew-i-wish-i-knew', '23-if-i-had-known-i-wish-i-had-known'],
            8: ['24-passive-voice-is-done-was-done', '25-passive-voice-be-done-been-done-being-done', '26-impersonal-constructions', '27-reported-speech', '28-verb-ing'],
            9: ['29-verb-to', '30-verb-ing-or-to', '31-verb-preposition-ing'],
            10: ['32-verb-preposition-ing-2', '33-adjective-to-preposition-ing', '34-countable-uncountable-nouns'],
            11: ['35-articles-an-the', '36-pronouns-determiners', '37-relative-clauses'],
            12: ['38-adjectives-ing-ed', '39-comparatives', '40-superlatives-word-order'],
            13: ['41-conjunctions-prepositions', '42-conditional-connectors', '43-quantifiers'],
            14: ['44-reflexive-pronouns', '45-time-expressions', '46-prepositions-time', '47-prepositions-place', '48-prepositions-movement', '49-verb-preposition'],
            15: ['50-verb-preposition-2', '51-phrasal-verbs', '52-phrasal-verbs-in-out-on-off', '53-phrasal-verbs-up-down-away-back'],
            16: ['54-irregular-verbs', '55-stative-dynamic-verbs', '56-verb-aspects', '57-conditionals'],
            17: ['58-subjunctive-inversion', '59-gerunds-infinitives', '60-reporting-verbs'],
            18: ['61-adjectives-comparison', '62-confusing-vocabulary', '63-ellipsis-substitution', '64-parallel-structure'],
            19: ['65-cleft-sentences-fronting']
        },

        init() {
            this.loadProgress();
            this.setupEventListeners();
            this.setupMarked();
            this.registerServiceWorker();
            this.renderLessonList();
            this.bindButtons();
            this.loadITFlashcards();
            console.log('B2 IT English initialized');
        },

        loadITFlashcards() {
            var _this = this;
            this.state.itFlashcards = [];
            
            fetch('../grammar/it-vocabulary.md')
                .then(function(r) { 
                    if (!r.ok) throw new Error('File not found');
                    return r.text(); 
                })
                .then(function(text) {
                    var cards = _this.parseVocabularyCards(text);
                    _this.state.itFlashcards = _this.state.itFlashcards.concat(cards);
                    console.log('Loaded vocabulary flashcards:', cards.length);
                })
                .catch(function(e) { console.log('Vocabulary load error:', e.message); });
            
            fetch('../grammar/it-phrasal-verbs.md')
                .then(function(r) { 
                    if (!r.ok) throw new Error('File not found');
                    return r.text(); 
                })
                .then(function(text) {
                    var cards = _this.parsePhrasalVerbCards(text);
                    _this.state.itFlashcards = _this.state.itFlashcards.concat(cards);
                    console.log('Loaded phrasal verb flashcards:', cards.length);
                })
                .catch(function(e) { console.log('Phrasal verbs load error:', e.message); });
            
            fetch('../grammar/it-idioms.md')
                .then(function(r) { 
                    if (!r.ok) throw new Error('File not found');
                    return r.text(); 
                })
                .then(function(text) {
                    var cards = _this.parseIdiomCards(text);
                    _this.state.itFlashcards = _this.state.itFlashcards.concat(cards);
                    console.log('Loaded idiom flashcards:', cards.length);
                    console.log('Total IT flashcards:', _this.state.itFlashcards.length);
                })
                .catch(function(e) { console.log('Idioms load error:', e.message); });
        },

        parseVocabularyCards(text) {
            var lines = text.split('\n');
            var cards = [];
            var currentTerm = null;
            var currentDef = null;
            var currentExamples = [];
            
            lines.forEach(function(line) {
                var termMatch = line.match(/^### ([a-z][a-z0-9]+)\s*\[([A-Z][0-9])\]/);
                if (termMatch) {
                    if (currentTerm && currentDef) {
                        cards.push({ term: currentTerm, def: currentDef, examples: currentExamples.slice(0, 2), type: 'vocabulary' });
                    }
                    currentTerm = termMatch[1];
                    currentDef = null;
                    currentExamples = [];
                }
                if (line.startsWith('**Meaning**:') && currentTerm && !currentDef) {
                    currentDef = line.replace('**Meaning**:', '').trim();
                }
                var exampleMatch = line.match(/^>\s*\*\*Example:\*\*\s*(.+)/);
                if (exampleMatch && currentExamples.length < 2) {
                    currentExamples.push(exampleMatch[1].trim());
                }
            });
            
            if (currentTerm && currentDef) {
                cards.push({ term: currentTerm, def: currentDef, examples: currentExamples.slice(0, 2), type: 'vocabulary' });
            }
            return cards;
        },

        parsePhrasalVerbCards(text) {
            var lines = text.split('\n');
            var cards = [];
            var currentVerb = null;
            var currentMeaning = null;
            var currentExamples = [];
            
            lines.forEach(function(line) {
                var verbMatch = line.match(/^### \d+\. ([a-z ]+)\(?([SI])\)?/);
                if (verbMatch) {
                    if (currentVerb && currentMeaning) {
                        cards.push({ term: currentVerb, def: currentMeaning, examples: currentExamples.slice(0, 2), type: 'phrasal-verb' });
                    }
                    currentVerb = verbMatch[1].trim();
                    currentMeaning = null;
                    currentExamples = [];
                }
                if (line.startsWith('**Meaning**:') && currentVerb) {
                    currentMeaning = line.replace('**Meaning**:', '').trim();
                }
                if (line.startsWith('>') && currentExamples.length < 2) {
                    var ex = line.replace(/^>\s*/, '').trim();
                    if (ex) currentExamples.push(ex);
                }
            });
            
            if (currentVerb && currentMeaning) {
                cards.push({ term: currentVerb, def: currentMeaning, examples: currentExamples.slice(0, 2), type: 'phrasal-verb' });
            }
            return cards;
        },

        parseIdiomCards(text) {
            var lines = text.split('\n');
            var cards = [];
            var currentIdiom = null;
            var currentMeaning = null;
            var currentExamples = [];
            
            lines.forEach(function(line) {
                var idiomMatch = line.match(/^### \d+\. "([^"]+)"/);
                if (idiomMatch) {
                    if (currentIdiom && currentMeaning) {
                        cards.push({ term: currentIdiom, def: currentMeaning, examples: currentExamples.slice(0, 2), type: 'idiom' });
                    }
                    currentIdiom = idiomMatch[1];
                    currentMeaning = null;
                    currentExamples = [];
                }
                if (line.startsWith('**Meaning**:') && currentIdiom) {
                    currentMeaning = line.replace('**Meaning**:', '').trim();
                }
                if (line.startsWith('>') && currentExamples.length < 2) {
                    var ex = line.replace(/^>\s*/, '').replace(/\*\*/g, '').trim();
                    if (ex) currentExamples.push(ex);
                }
            });
            
            if (currentIdiom && currentMeaning) {
                cards.push({ term: currentIdiom, def: currentMeaning, examples: currentExamples.slice(0, 2), type: 'idiom' });
            }
            return cards;
        },

        bindButtons() {
            document.getElementById('btn-audio-play')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Audio button clicked');
                this.playAudio();
            });

            document.getElementById('btn-exercise')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openExercise();
            });

            document.getElementById('btn-bookmark')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleBookmark();
            });
        },

        setupMarked() {
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: false,
                    mangle: false
                });
            }
        },

        async registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('service-worker.js');
                    console.log('Service Worker registered');
                } catch (e) {
                    console.log('Service Worker registration failed:', e);
                }
            }
        },

        loadProgress() {
            try {
                const saved = localStorage.getItem(this.config.storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    this.state.progress = data.progress || {};
                    this.state.bookMarks = data.bookMarks || [];
                    this.state.unlockedLevel = data.unlockedLevel || 19;
                    this.state.completedLessons = data.completedLessons || [];
                    this.state.flashcardScore = data.flashcardScore || 0;
                    this.state.flashcardMastery = data.flashcardMastery || {};
                }
            } catch (e) {
                console.error('Failed to load progress:', e);
            }
        },

saveProgress() {
            try {
                var data = {
                    progress: this.state.progress,
                    bookMarks: this.state.bookMarks,
                    unlockedLevel: this.state.unlockedLevel,
                    completedLessons: this.state.completedLessons,
                    flashcardScore: this.state.flashcardScore,
                    flashcardMastery: this.state.flashcardMastery
                };
                localStorage.setItem(this.config.storageKey, JSON.stringify(data));
            } catch (e) {
                console.error('Failed to save progress:', e);
            }
        },

        setupEventListeners() {
            document.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-tab');
                if (tab) {
                    this.switchView(tab.dataset.view);
                    return;
                }

                const card = e.target.closest('.quick-start-card');
                if (card) {
                    this.switchView(card.dataset.view);
                    return;
                }

                const closeBtn = e.target.closest('#sidebar-close, #exercise-close');
                if (closeBtn) {
                    this.closeModal();
                    return;
                }

                const bookmarkBtn = e.target.closest('#btn-bookmark');
                if (bookmarkBtn) {
                    this.toggleBookmark();
                    return;
                }

                const audioBtn = e.target.closest('#btn-audio-play');
                if (audioBtn) {
                    this.playAudio();
                    return;
                }

                const exerciseBtn = e.target.closest('#btn-exercise');
                if (exerciseBtn) {
                    this.openExercise();
                    return;
                }

                const checkBtn = e.target.closest('#exercise-check');
                if (checkBtn) {
                    this.checkAnswer();
                    return;
                }

                const nextBtn = e.target.closest('#exercise-next');
                if (nextBtn) {
                    this.nextQuestion();
                    return;
                }
            });

            document.getElementById('lesson-select').addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadLesson(e.target.value);
                }
            });
        },

        async renderLessonList() {
            const select = document.getElementById('lesson-select');
            
            const grammarLessons = [
                { id: '00-grammar-terms', title: '1️⃣ Grammar Terms', level: 1 },
                { id: '01-present-simple', title: '1️⃣ Present Simple', level: 1 },
                { id: '02-present-continuous', title: '1️⃣ Present Continuous', level: 1 },
                { id: '03-past-simple', title: '2️⃣ Past Simple', level: 2 },
                { id: '04-past-continuous', title: '2️⃣ Past Continuous', level: 2 },
                { id: '05-present-perfect', title: '3️⃣ Present Perfect', level: 3 },
                { id: '06-present-perfect-continuous', title: '3️⃣ Present Perfect Continuous', level: 3 },
                { id: '07-present-perfect-vs-past-simple', title: '3️⃣ Perfect vs Past Simple', level: 3 },
                { id: '08-past-perfect', title: '4️⃣ Past Perfect', level: 4 },
                { id: '09-past-perfect-continuous', title: '4️⃣ Past Perfect Continuous', level: 4 },
                { id: '10-for-since-have-got-used-to', title: '5️⃣ For, Since, Got & Used To', level: 5 },
                { id: '11-present-tenses-for-future', title: '5️⃣ Present Tenses for Future', level: 5 },
                { id: '12-future-simple-going-to-will-shall', title: '5️⃣ Future: Going To', level: 5 },
                { id: '13-future-continuous-future-perfect', title: '5️⃣ Future Continuous', level: 5 },
                { id: '14-when-i-do-when-ive-done-if-when', title: '6️⃣ When I Do / Have Done', level: 6 },
                { id: '15-modal-verbs-can-could-able-to', title: '6️⃣ Modals: Can & Could', level: 6 },
                { id: '16-modal-verbs-could-do-could-have-done', title: '6️⃣ Could Do / Have Done', level: 6 },
                { id: '17-modal-verbs-must-cant-may-might', title: '6\u20E3 Must, Can\u2019t, May, Might', level: 6 },
                { id: '18-modal-verbs-have-to-must-mustnt-neednt', title: '6️⃣ Have To & Must', level: 6 },
                { id: '19-modal-verbs-should-id-better-its-time', title: '6️⃣ Should & Had Better', level: 6 },
                { id: '20-modal-verbs-would-can-could-would-you', title: '7️⃣ Would, Can, Could', level: 7 },
                { id: '21-conditionals-if-i-do-if-i-did', title: '7️⃣ Conditionals: If I Do', level: 7 },
                { id: '22-if-i-knew-i-wish-i-knew', title: '7️⃣ If I Knew / Wish', level: 7 },
                { id: '23-if-i-had-known-i-wish-i-had-known', title: '7️⃣ If I Had Known', level: 7 },
                { id: '24-passive-voice-is-done-was-done', title: '8️⃣ Passive: Is/Was Done', level: 8 },
                { id: '25-passive-voice-be-done-been-done-being-done', title: '8️⃣ Passive: Be Done', level: 8 },
                { id: '26-impersonal-constructions', title: '8️⃣ Impersonal', level: 8 },
                { id: '27-reported-speech', title: '8️⃣ Reported Speech', level: 8 },
                { id: '28-verb-ing', title: '8️⃣ Verb + Ing', level: 8 },
                { id: '29-verb-to', title: '9️⃣ Verb + To', level: 9 },
                { id: '30-verb-ing-or-to', title: '9️⃣ Verb + Ing or To', level: 9 },
                { id: '31-verb-preposition-ing', title: '9️⃣ Verb + Preposition + Ing', level: 9 },
                { id: '32-verb-preposition-ing-2', title: '🔟 Verb + Preposition + Ing (2)', level: 10 },
                { id: '33-adjective-to-preposition-ing', title: '🔟 Adj + To + Ing', level: 10 },
                { id: '34-countable-uncountable-nouns', title: '🔟 Countable/Uncountable', level: 10 },
                { id: '35-articles-an-the', title: '1️⃣1️⃣ Articles: A & The', level: 11 },
                { id: '36-pronouns-determiners', title: '1️⃣1️⃣ Pronouns & Determiners', level: 11 },
                { id: '37-relative-clauses', title: '1️⃣1️⃣ Relative Clauses', level: 11 },
                { id: '38-adjectives-ing-ed', title: '1️⃣2️⃣ Adj + Ing / Ed', level: 12 },
                { id: '39-comparatives', title: '1️⃣2️⃣ Comparatives', level: 12 },
                { id: '40-superlatives-word-order', title: '1️⃣2️⃣ Superlatives & Word Order', level: 12 },
                { id: '41-conjunctions-prepositions', title: '1️⃣3️⃣ Conjunctions & Prepositions', level: 13 },
                { id: '42-conditional-connectors', title: '1️⃣3️⃣ Conditional Connectors', level: 13 },
                { id: '43-quantifiers', title: '1️⃣3️⃣ Quantifiers', level: 13 },
                { id: '44-reflexive-pronouns', title: '1️⃣4️⃣ Reflexive Pronouns', level: 14 },
                { id: '45-time-expressions', title: '1️⃣4️⃣ Time Expressions', level: 14 },
                { id: '46-prepositions-time', title: '1️⃣4️⃣ Prepositions: Time', level: 14 },
                { id: '47-prepositions-place', title: '1️⃣4️⃣ Prepositions: Place', level: 14 },
                { id: '48-prepositions-movement', title: '1️⃣4️⃣ Prepositions: Movement', level: 14 },
                { id: '49-verb-preposition', title: '1️⃣4️⃣ Verb + Preposition', level: 14 },
                { id: '50-verb-preposition-2', title: '1️⃣5️⃣ Verb + Preposition (2)', level: 15 },
                { id: '51-phrasal-verbs', title: '1️⃣5️⃣ Phrasal Verbs', level: 15 },
                { id: '52-phrasal-verbs-in-out-on-off', title: '1️⃣5️⃣ Phrasal: In, Out, On, Off', level: 15 },
                { id: '53-phrasal-verbs-up-down-away-back', title: '1️⃣5️⃣ Phrasal: Up, Down, Away, Back', level: 15 },
                { id: '54-irregular-verbs', title: '1️⃣6️⃣ Irregular Verbs', level: 16 },
                { id: '55-stative-dynamic-verbs', title: '1️⃣6️⃣ Stative & Dynamic Verbs', level: 16 },
                { id: '56-verb-aspects', title: '1️⃣6️⃣ Verb Aspects', level: 16 },
                { id: '57-conditionals', title: '1️⃣6️⃣ Conditionals', level: 16 },
                { id: '58-subjunctive-inversion', title: '1️⃣7️⃣ Subjunctive & Inversion', level: 17 },
                { id: '59-gerunds-infinitives', title: '1️⃣7️⃣ Gerunds & Infinitives', level: 17 },
                { id: '60-reporting-verbs', title: '1️⃣7️⃣ Reporting Verbs', level: 17 },
                { id: '61-adjectives-comparison', title: '1️⃣8️⃣ Adj: Comparison', level: 18 },
                { id: '62-confusing-vocabulary', title: '1️⃣8️⃣ Confusing Vocabulary', level: 18 },
                { id: '63-ellipsis-substitution', title: '1️⃣8️⃣ Ellipsis & Substitution', level: 18 },
                { id: '64-parallel-structure', title: '1️⃣8️⃣ Parallel Structure', level: 18 },
                { id: '65-cleft-sentences-fronting', title: '🔥 B2 Review', level: 19 }
            ];

            const rules = [
                { id: 'native-phrases-it', title: '📱 Native Phrases (IT)' },
                { id: 'native-phrases-general', title: '💬 Native Phrases (General)' },
                { id: 'phrasal-verbs-a-m', title: '🔥 Phrasal Verbs A-M' },
                { id: 'phrasal-verbs-n-z', title: '🔥 Phrasal Verbs N-Z' },
                { id: 'native-verbs', title: '⭐ Native Verbs' },
                { id: 'get-vs-other', title: '⭐ Get vs Other Verbs' },
                { id: 'word-choice', title: '📝 Word Choice' }
            ];

            var unlockedLevel = this.state.unlockedLevel || 19;
            var completedLessons = this.state.completedLessons || [];

            function renderGrammarOptions(level) {
                return grammarLessons.filter(function(l) {
                    return l.level <= level;
                }).map(function(l) {
                    var completed = completedLessons.indexOf(l.id) !== -1;
                    var check = completed ? '✅' : '🔓';
                    return '<option value="' + l.id + '">' + check + ' ' + l.title + '</option>';
                }).join('');
            }

            function renderLockedOptions(level) {
                return grammarLessons.filter(function(l) {
                    return l.level > level;
                }).map(function(l) {
                    return '<option value="" disabled>🔒 Level ' + l.level + ': ' + l.title + '</option>';
                }).join('');
            }

            select.innerHTML = '<option value="">select a lesson...</option>' +
                '<optgroup label="📖 Grammar Levels (🔓 unlocked: ' + unlockedLevel + ')">' +
                renderGrammarOptions(unlockedLevel) +
                '</optgroup>' +
                '<optgroup label="🔒 Locked Levels">' +
                renderLockedOptions(unlockedLevel) +
                '</optgroup>' +
                '<optgroup label="💬 Rules & Phrases (unlocked)">' +
                rules.map(function(r) {
                    return '<option value="' + r.id + '">📝 ' + r.title + '</option>';
                }).join('') +
                '</optgroup>';

            this.state.lessons = grammarLessons.concat(rules);
        },

        isLessonLocked(lessonId) {
            var lesson = this.state.lessons.find(function(l) { return l.id === lessonId; });
            if (!lesson || !lesson.level) return false;
            return lesson.level > this.state.unlockedLevel;
        },

        getLessonLevel(lessonId) {
            var lesson = this.state.lessons.find(function(l) { return l.id === lessonId; });
            return lesson ? lesson.level : 0;
        },

        async loadLesson(lessonId) {
            if (this.isLessonLocked(lessonId)) {
                this.showToast('🔒 Complete current level first!');
                return;
            }
            
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '<div class="loading">Loading...</div>';

            try {
                let path, fileId = lessonId;

                if (lessonId.match(/^\d/)) {
                    path = this.config.grammarPath + lessonId + '.md';
                } else {
                    const rulesMap = {
                        'native-phrases-it': 'NATIVE_PHRASES_IT.md',
                        'native-phrases-general': 'NATIVE_PHRASES_GENERAL.md',
                        'phrasal-verbs-a-m': 'PHRASAL_VERBS_A-M.md',
                        'phrasal-verbs-n-z': 'PHRASAL_VERBS_N-Z.md',
                        'native-verbs': 'NATIVE_VERBS.md',
                        'get-vs-other': 'GET_VS_OTHER.md',
                        'word-choice': 'WORD_CHOICE.md'
                    };
                    path = this.config.rulesPath + (rulesMap[lessonId] || lessonId + '.md');
                }

                let markdown;
                if (this.config.lessonsCache.has(path)) {
                    markdown = this.config.lessonsCache.get(path);
                } else {
                    const response = await fetch(path);
                    if (!response.ok) {
                        console.error('Failed to load:', path, response.status, response.statusText);
                        throw new Error('Lesson not found');
                    }
                    markdown = await response.text();
                    this.config.lessonsCache.set(path, markdown);
                }

                const html = marked.parse(markdown);
                
                if (markdown.includes('!!!START_TEST!!!')) {
                    var testStart = markdown.indexOf('!!!START_TEST!!!');
                    var cleanMarkdown = markdown.substring(0, testStart);
                    var cleanHtml = marked.parse(cleanMarkdown);
                    contentDiv.innerHTML = cleanHtml;
                } else {
                    contentDiv.innerHTML = html;
                }
                
                this.state.currentLesson = lessonId;
                this.state.currentFile = path;
                
                if (markdown.includes('!!!START_TEST!!!')) {
                    this.addTestButton(lessonId);
                }
                
                this.highlightCodeBlocks();

            } catch (e) {
                contentDiv.innerHTML = `<div class="error">
                    <h3>Error loading lesson</h3>
                    <p>${e.message}</p>
                </div>`;
            }
        },

        highlightCodeBlocks() {
            const content = document.getElementById('content');
            const codeBlocks = content.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                if (!block.parentNode.classList.contains('hljs')) {
                    block.classList.add('language-english');
                }
            });
        },

        switchView(view) {
            var _this = this;
            var content = document.getElementById('content');

            document.querySelectorAll('.nav-tab').forEach(function(tab) {
                tab.classList.toggle('active', tab.dataset.view === view);
            });

            switch (view) {
                case 'grammar':
                    document.getElementById('flashcard-container').classList.add('hidden');
                    document.getElementById('exercise-modal').classList.add('hidden');
                    content.innerHTML = '<div class="welcome-screen"><h2>Grammar Lessons</h2><p>Select a lesson from the dropdown above.</p></div>';
                    break;
                case 'rules':
                    document.getElementById('flashcard-container').classList.add('hidden');
                    document.getElementById('exercise-modal').classList.add('hidden');
                    content.innerHTML = '<div class="welcome-screen"><h2>Rules & Phrases</h2><p>Select a lesson from the dropdown above.</p></div>';
                    break;
                case 'flashcards':
                    _this.showFlashcards();
                    break;
                case 'exercises':
                    document.getElementById('flashcard-container').classList.add('hidden');
                    this.renderExercises();
                    break;
                case 'progress':
                    document.getElementById('flashcard-container').classList.add('hidden');
                    document.getElementById('exercise-modal').classList.add('hidden');
                    this.renderProgress();
                    break;
                case 'welcome':
                default:
                    this.showWelcome();
            }

            this.state.currentView = view;
        },
        
        showWelcome() {
            var content = document.getElementById('content');
            content.innerHTML = `
                <div class="welcome-screen">
                    <h2 data-i18n="welcome">Welcome to B2 IT English</h2>
                    <p data-i18n="welcomeDesc">Master professional English for IT with grammar guides, native phrases, and interactive exercises.</p>
                    <div class="quick-start">
                        <h3 data-i18n="quickStart">Quick Start</h3>
                        <div class="quick-start-grid">
                            <button class="quick-start-card" data-view="grammar">
                                <span class="card-icon">📖</span>
                                <span class="card-title">Grammar</span>
                                <span class="card-desc">65 grammar lessons</span>
                            </button>
                            <button class="quick-start-card" data-view="rules">
                                <span class="card-icon">💬</span>
                                <span class="card-title">Phrases & Rules</span>
                                <span class="card-desc">Native expressions</span>
                            </button>
                            <button class="quick-start-card" data-view="flashcards">
                                <span class="card-icon">🎴</span>
                                <span class="card-title">IT Cards</span>
                                <span class="card-desc">Vocabulary flashcards</span>
                            </button>
                            <button class="quick-start-card" data-view="exercises">
                                <span class="card-icon">✏️</span>
                                <span class="card-title">Exercises</span>
                                <span class="card-desc">Practice B2 tests</span>
                            </button>
                            <button class="quick-start-card" data-view="progress">
                                <span class="card-icon">📊</span>
                                <span class="card-title">Progress</span>
                                <span class="card-desc">Track your learning</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.querySelectorAll('.nav-tab').forEach(function(tab) {
                tab.classList.remove('active');
            });
            document.getElementById('flashcard-container').classList.add('hidden');
            document.getElementById('exercise-modal').classList.add('hidden');
        },

        showFlashcards() {
            document.getElementById('content').innerHTML = '';
            document.getElementById('flashcard-container').classList.remove('hidden');
            document.getElementById('exercise-modal').classList.add('hidden');
        },

        startFlashcards() {
            var cards = this.state.itFlashcards;
            if (!cards || cards.length === 0) {
                this.showToast('Loading flashcards...');
                return;
            }
            
            var mastery = this.state.flashcardMastery || {};
            
            var pendingCards = cards.filter(function(c) {
                var m = mastery[c.term];
                return !m || m.correct < 3;
            });
            
            var sessionMastered = Object.keys(mastery).filter(function(k) {
                return mastery[k].correct >= 3 && !mastery[k].shown;
            }).length;
            
            if (pendingCards.length === 0) {
                this.endFlashcards();
                return;
            }
            
            var randomCard = pendingCards[Math.floor(Math.random() * pendingCards.length)];
            var m = mastery[randomCard.term] || { correct: 0, wrong: 0 };
            
            document.getElementById('flashcard-type').textContent = randomCard.type.toUpperCase() + ' (✅' + m.correct + '/❌' + m.wrong + ')';
            document.getElementById('flashcard-front').textContent = randomCard.term;
            
            var backContent = randomCard.def;
            if (randomCard.examples && randomCard.examples.length > 0) {
                backContent += '\n\n📝 Ejemplos:\n' + randomCard.examples.slice(0, 2).map(function(ex, i) {
                    return (i + 1) + '. ' + ex;
                }).join('\n');
            }
            document.getElementById('flashcard-back').textContent = backContent;
            document.getElementById('flashcard-back').classList.add('hidden');
            document.getElementById('flashcard-front').classList.remove('hidden');
            
            document.getElementById('flashcard-start').classList.add('hidden');
            document.getElementById('flashcard-wrong').classList.remove('hidden');
            document.getElementById('flashcard-right').classList.remove('hidden');
            
            this.state.currentFlashcard = randomCard;
            this.showToast('Click card to reveal');
        },

        flipFlashcard() {
            if (!this.state.currentFlashcard) {
                this.startFlashcards();
                return;
            }
            var front = document.getElementById('flashcard-front');
            var back = document.getElementById('flashcard-back');
            if (front.classList.contains('hidden')) {
                front.classList.remove('hidden');
                back.classList.add('hidden');
            } else {
                front.classList.add('hidden');
                back.classList.remove('hidden');
            }
        },

        flashcardResult(known) {
            var _this = this;
            var card = this.state.currentFlashcard;
            if (!card) return;
            
var mastery = this.state.flashcardMastery || {};
            if (!mastery[card.term]) {
                mastery[card.term] = { correct: 0, wrong: 0 };
            }
            
            if (known) {
                mastery[card.term].correct++;
                if (mastery[card.term].correct >= 3 && !mastery[card.term].sessionMastered) {
                    mastery[card.term].sessionMastered = true;
                    this.state.sessionMastered = (this.state.sessionMastered || 0) + 1;
                }
                this.state.flashcardScore += 10;
                this.showToast('+10 Points! 🎉');
            } else {
                mastery[card.term].wrong++;
                if (mastery[card.term].sessionMastered) {
                    mastery[card.term].sessionMastered = false;
                    this.state.sessionMastered = Math.max(0, (this.state.sessionMastered || 1) - 1);
                }
                this.showToast('Keep practicing!');
            }
            
            this.state.flashcardMastery = mastery;
            
            var totalMastered = Object.keys(mastery).filter(function(k) { return mastery[k].correct >= 3; }).length;
            var total = this.state.itFlashcards ? this.state.itFlashcards.length : 0;
            
            document.getElementById('flashcard-score-value').textContent = this.state.flashcardScore + ' | Sesión: ' + (this.state.sessionMastered || 0) + '/' + total + ' dominadas';
            
            if (this.state.flashcardScore >= 100 || (this.state.sessionMastered || 0) >= 10) {
                this.showToast('🎉 10 dominadas! Continuando con más...');
                this.state.flashcardScore = 0;
                this.state.sessionMastered = 0;
                var _this = this;
                Object.keys(mastery).forEach(function(k) {
                    mastery[k].sessionMastered = false;
                });
                setTimeout(function() {
                    _this.startFlashcards();
                }, 1500);
                return;
            }
            
            if (known) {
                mastery[card.term].correct++;
                this.state.flashcardScore += 10;
                this.state.sessionMastered = (this.state.sessionMastered || 0) + 1;
                this.showToast('+10 Points! 🎉');
            } else {
                mastery[card.term].wrong++;
                this.showToast('Keep practicing!');
            }
            
            this.state.flashcardMastery = mastery;
            
            var totalMastered = Object.keys(mastery).filter(function(k) { return mastery[k].correct >= 3; }).length;
            var total = this.state.itFlashcards ? this.state.itFlashcards.length : 0;
            
            document.getElementById('flashcard-score-value').textContent = this.state.flashcardScore + ' | Sesión: ' + (this.state.sessionMastered || 0) + '/' + total + ' dominadas';
            
            if (this.state.flashcardScore >= 100 || (this.state.sessionMastered || 0) >= 10) {
                this.showToast('🎉 10 dominadas! Continuando con más...');
                this.state.flashcardScore = 0;
                this.state.sessionMastered = 0;
                var _this = this;
                Object.keys(mastery).forEach(function(k) {
                    mastery[k].sessionMastered = false;
                });
                setTimeout(function() {
                    _this.startFlashcards();
                }, 1500);
                return;
            }
            
            setTimeout(function() {
                _this.startFlashcards();
            }, 500);
        },

        endFlashcards() {
            var score = this.state.flashcardScore;
            var mastery = this.state.flashcardMastery || {};
            var mastered = Object.keys(mastery).filter(function(k) { return mastery[k].correct >= 3; }).length;
            var total = this.state.itFlashcards ? this.state.itFlashcards.length : 0;
            
            document.getElementById('flashcard-front').textContent = '🎉 ¡Juego Completado!';
            document.getElementById('flashcard-back').textContent = 'Puntos: ' + score + ' | Dominadas: ' + mastered + '/' + total;
            document.getElementById('flashcard-back').classList.remove('hidden');
            document.getElementById('flashcard-front').classList.add('hidden');
            document.getElementById('flashcard-wrong').classList.add('hidden');
            document.getElementById('flashcard-right').classList.add('hidden');
            document.getElementById('flashcard-start').classList.remove('hidden');
            document.getElementById('flashcard-start').textContent = 'Repetir';
            this.showToast('¡Completado! Puntos: ' + score + ' | Dominadas: ' + mastered + '/' + total);
            this.saveProgress();
        },

        renderExercises() {
            const content = document.getElementById('content');
            content.innerHTML = `
                <div class="exercises-view">
                    <h2>B2 Practice Exercises</h2>
                    <div class="exercise-categories">
                        <div class="exercise-category" data-exercise="grammar">
                            <h3>Grammar</h3>
                            <p>Test your grammar knowledge</p>
                        </div>
                        <div class="exercise-category" data-exercise="vocabulary">
                            <h3>Vocabulary</h3>
                            <p>IT vocabulary exercises</p>
                        </div>
                        <div class="exercise-category" data-exercise="listening">
                            <h3>Listening</h3>
                            <p>Listen and answer (TTS)</p>
                        </div>
                    </div>
                </div>
            `;

            content.querySelectorAll('.exercise-category').forEach(cat => {
                cat.addEventListener('click', () => this.startExercise(cat.dataset.exercise));
            });
        },

        startExercise(type) {
            this.state.exerciseState = {
                type: type,
                current: 0,
                score: 0,
                total: 5,
                questions: this.generateQuestions(type)
            };

            this.showQuestion();
            document.getElementById('exercise-modal').classList.remove('hidden');
        },

        generateQuestions(type) {
            const questions = {
                grammar: [
                    { q: 'Complete: She ___ to work every day.', answers: ['go', 'goes', 'going', 'gone'], correct: 1 },
                    { q: 'Choose the correct form: If I ___ rich, I would buy a computer.', answers: ['was', 'am', 'were', 'be'], correct: 2 },
                    { q: 'Complete: He ___ English since 2020.', answers: ['learns', 'learned', 'has learned', 'is learning'], correct: 2 },
                    { q: 'Choose: The server ___ down yesterday.', answers: ['went', 'goes', 'going', 'go'], correct: 0 },
                    { q: 'Complete: If she ___ here, she would help us.', answers: ['was', 'is', 'were', 'be'], correct: 2 }
                ],
                vocabulary: [
                    { q: 'What does "debug" mean?', answers: ['Add errors', 'Remove errors', 'Create software', 'Delete files'], correct: 1 },
                    { q: 'What is a "server"?', answers: ['Client', 'Central computer', 'Network', 'Browser'], correct: 1 },
                    { q: 'What does "deploy" mean?', answers: ['Delete', 'Install/activate', 'Create', 'Test'], correct: 1 },
                    { q: 'What is "cloud computing"?', answers: ['Weather', 'Online services', 'Local network', 'Hardware'], correct: 1 },
                    { q: 'What does "API" stand for?', answers: ['Application', 'App Programming Interface', 'Applied Program', 'Advanced Program'], correct: 1 }
                ],
                listening: [
                    { q: 'Listen and write: The server is ___ down.', audio: 'The server is going down', correct: 'going' },
                    { q: 'Listen and write: I will ___ the bug.', audio: 'I will fix the bug', correct: 'fix' },
                    { q: 'Listen and write: Please ___ the code.', audio: 'Please review the code', correct: 'review' },
                    { q: 'Listen and write: The system ___ crashed.', audio: 'The system has crashed', correct: 'has' },
                    { q: 'Listen and write: Can you ___ the file?', audio: 'Can you upload the file', correct: 'upload' }
                ]
            };
            return questions[type] || questions.grammar;
        },

        showQuestion() {
            const { questions, current } = this.state.exerciseState;
            if (current >= questions.length) {
                this.showResults();
                return;
            }

            const q = questions[current];
            const body = document.getElementById('exercise-body');
            const title = document.getElementById('exercise-title');

            title.textContent = `Question ${current + 1} of ${questions.length}`;
            this.state.exerciseState.currentAnswer = q.correct;

            if (this.state.exerciseState.type === 'listening' && q.audio) {
                body.innerHTML = `
                    <div class="listening-exercise">
                        <button class="btn btn-audio-play" onclick="App.playQuestionAudio()">
                            <svg class="icon" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>
                            Play Audio
                        </button>
                        <p class="question-text">${q.q}</p>
                        <input type="text" class="text-input" id="answer-input" placeholder="Type your answer...">
                    </div>
                `;
            } else {
                const optionsHtml = q.answers.map((ans, i) => `
                    <label class="option-label">
                        <input type="radio" name="answer" value="${i}">
                        <span class="option-text">${ans}</span>
                    </label>
                `).join('');

                body.innerHTML = `
                    <div class="multiple-choice">
                        <p class="question-text">${q.q}</p>
                        <div class="options">${optionsHtml}</div>
                    </div>
                `;
            }

            document.getElementById('exercise-check').classList.remove('hidden');
            document.getElementById('exercise-next').classList.add('hidden');
        },

        playQuestionAudio() {
            const q = this.state.exerciseState.questions[this.state.exerciseState.current];
            if (q.audio) {
                this.speak(q.audio);
            }
        },

        checkAnswer() {
            const { type, current, questions, currentAnswer } = this.state.exerciseState;
            let isCorrect = false;

            if (type === 'listening') {
                const input = document.getElementById('answer-input');
                const userAnswer = input.value.trim().toLowerCase();
                const correctAnswer = questions[current].correct.toLowerCase();
                isCorrect = userAnswer === correctAnswer;
            } else {
                const selected = document.querySelector('input[name="answer"]:checked');
                isCorrect = selected && parseInt(selected.value) === currentAnswer;
            }

            this.state.exerciseState.score += isCorrect ? 1 : 0;

            const resultClass = isCorrect ? 'correct' : 'incorrect';
            const feedback = isCorrect ? '✅ Correct!' : `❌ Incorrect. The answer is: ${questions[current].answers ? questions[current].answers[currentAnswer] : questions[current].correct}`;

            const body = document.getElementById('exercise-body');
            body.innerHTML += `<div class="feedback ${resultClass}">${feedback}</div>`;

            document.getElementById('exercise-check').classList.add('hidden');
            document.getElementById('exercise-next').classList.remove('hidden');

            this.showToast(feedback);
        },

        nextQuestion() {
            this.state.exerciseState.current++;
            this.showQuestion();
        },

showResults() {
            var _this = this;
            var state = this.state;
            var score = state.exerciseState.score;
            var total = state.exerciseState.total;
            var percentage = Math.round((score / total) * 100);
            
            var nextLevelUnlocked = false;
            var newUnlockedLevel = state.unlockedLevel;
            
            if (percentage >= 80 && state.currentLesson) {
                var lessonLevel = this.getLessonLevel(state.currentLesson);
                if (lessonLevel && lessonLevel >= state.unlockedLevel && lessonLevel < 19) {
                    newUnlockedLevel = lessonLevel + 1;
                    nextLevelUnlocked = true;
                }
                
                if (state.completedLessons.indexOf(state.currentLesson) === -1) {
                    state.completedLessons.push(state.currentLesson);
                }
            }
            
            var body = document.getElementById('exercise-body');
            var message = void 0;
            if (percentage >= 80) {
                message = '🎉 Great job! Level passed!';
                if (nextLevelUnlocked) {
                    message += ' 🔓 Level ' + newUnlockedLevel + ' unlocked!';
                }
            } else if (percentage >= 60) {
                message = '📈 Good progress! Try again for unlock.';
            } else {
                message = '💪 Keep practicing!';
            }
            
            body.innerHTML = '<div class="results"><h3>Results</h3><div class="score">' + score + '/' + total + ' (' + percentage + '%)</div><p class="feedback-text">' + message + '</p></div>';
            
            document.getElementById('exercise-check').classList.add('hidden');
            document.getElementById('exercise-next').classList.add('hidden');
            
            if (nextLevelUnlocked) {
                state.unlockedLevel = newUnlockedLevel;
                this.renderLessonList();
            }
            
            this.saveProgress();
        },

renderProgress() {
            var _this = this;
            var state = this.state;
            var completedCount = state.completedLessons ? state.completedLessons.length : 0;
            var totalGrammar = 66;
            var totalLevels = 19;
            var unlocked = state.unlockedLevel || 1;
            var percentage = Math.round((completedCount / totalGrammar) * 100);
            
            var mastery = state.flashcardMastery || {};
            var masteredCards = Object.keys(mastery).filter(function(k) { return mastery[k].correct >= 3; });
            var totalCards = state.itFlashcards ? state.itFlashcards.length : 0;
            var masteredCount = masteredCards.length;
            var masteredPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
            
            var vocabularyMastered = masteredCards.filter(function(k) { return mastery[k].type === 'vocabulary'; }).length;
            var phrasalMastered = masteredCards.filter(function(k) { return mastery[k].type === 'phrasal-verb'; }).length;
            var idiomMastered = masteredCards.filter(function(k) { return mastery[k].type === 'idiom'; }).length;
            
            var bookmarksHtml = state.bookMarks && state.bookMarks.length > 0 
                ? state.bookMarks.map(function(b) { return '<div class="bookmark-item" data-lesson="' + b + '">' + b + '</div>'; }).join('')
                : '<p>No bookmarks yet. Click the bookmark icon to save lessons.</p>';
            
            var content = document.getElementById('content');
            content.innerHTML = '<div class="progress-view"><h2>Your Progress</h2>' +
                '<div class="progress-stats">' +
                '<div class="stat-card"><div class="stat-value">' + completedCount + '</div><div class="stat-label">Lessons Completed</div></div>' +
                '<div class="stat-card"><div class="stat-value">' + unlocked + '/' + totalLevels + '</div><div class="stat-label">Levels Unlocked</div></div>' +
                '<div class="stat-card"><div class="stat-value">' + percentage + '%</div><div class="stat-label">Grammar Progress</div></div>' +
                '</div>' +
                '<div class="progress-bar"><div class="progress-fill" style="width:' + percentage + '%"></div></div>' +
                '<div class="current-level"><h3>Current Level: ' + unlocked + '</h3><p>Complete tests with 90% to unlock next level</p></div>' +
                '<h2>IT Cards Progress</h2>' +
                '<div class="progress-stats">' +
                '<div class="stat-card"><div class="stat-value">' + masteredCount + '</div><div class="stat-label">Cards Mastered</div></div>' +
                '<div class="stat-card"><div class="stat-value">' + totalCards + '</div><div class="stat-label">Total Cards</div></div>' +
                '<div class="stat-card"><div class="stat-value">' + masteredPercentage + '%</div><div class="stat-label">Mastery %</div></div>' +
                '</div>' +
                '<div class="progress-bar"><div class="progress-fill" style="width:' + masteredPercentage + '%"></div></div>' +
                '<div class="flashcard-breakdown">' +
                '<div class="breakdown-item"><span>Vocabulary:</span> <strong>' + vocabularyMastered + '</strong></div>' +
                '<div class="breakdown-item"><span>Phrasal Verbs:</span> <strong>' + phrasalMastered + '</strong></div>' +
                '<div class="breakdown-item"><span>Idioms:</span> <strong>' + idiomMastered + '</strong></div>' +
                '</div>' +
                '<div class="flashcard-points">Points Earned: ' + (state.flashcardScore || 0) + '</div>' +
                '<div class="bookmarks-section"><h3>Bookmarks</h3><div class="bookmarks-list">' + bookmarksHtml + '</div></div>' +
                '</div>';
            
            content.querySelectorAll('.bookmark-item').forEach(function(item) {
                item.addEventListener('click', function() { _this.loadLesson(item.dataset.lesson); });
            });
        },

        markLessonComplete(lessonId) {
            this.state.progress[lessonId] = true;
            if (this.state.completedLessons.indexOf(lessonId) === -1) {
                this.state.completedLessons.push(lessonId);
            }
            this.saveProgress();
        },

        toggleBookmark() {
            const { currentLesson } = this.state;
            if (!currentLesson) {
                this.showToast('Select a lesson first');
                return;
            }

            const index = this.state.bookMarks.indexOf(currentLesson);
            if (index > -1) {
                this.state.bookMarks.splice(index, 1);
                this.showToast('Bookmark removed');
            } else {
                this.state.bookMarks.push(currentLesson);
                this.showToast('Lesson bookmarked');
            }

            this.saveProgress();
        },

        playAudio() {
            const content = document.getElementById('content');
            if (!content || content.innerHTML.trim() === '') {
                this.showToast('Open a lesson first');
                return;
            }

            const heading = content.querySelector('h1, h2');
            const title = heading ? heading.textContent : 'Welcome';
            this.speak(title);
        },

speak(text) {
            var _this = this;
            
            // Try browser TTS first (try multiple times - voices load async)
            var synth = window.speechSynthesis;
            var tryTTS = function(attempts) {
                if (attempts > 3) {
                    _this.showToast('Try Chrome for audio');
                    return;
                }
                
                var voices = synth.getVoices();
                if (!voices || voices.length === 0) {
                    setTimeout(function() { tryTTS(attempts + 1); }, 500);
                    return;
                }
                
                try {
                    synth.cancel();
                    var utter = new SpeechSynthesisUtterance(text);
                    utter.voice = voices[0];
                    utter.lang = 'en-US';
                    utter.rate = 0.9;
                    utter.onerror = function(e) { 
                        _this.showToast('Audio error');
                    };
                    utter.onend = function() { _this.showToast('Done'); };
                    synth.speak(utter);
                    _this.showToast('Playing...');
                } catch(e) {
                    _this.showToast('Try Chrome for audio');
                }
            };
            
            tryTTS(0);
        },

        googleTTS(text) {
            var _this = this;
            
            // Try Google Translate TTS via CORS proxy
            var proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://translate.google.com/translate_vq?hl=en&tl=en&q=' + encodeURIComponent(text));
            
            var audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.onerror = function(e) {
                console.log('Audio error:', e);
                _this.showToast('TTS unavailable. Use Chrome.');
            };
            audio.onended = function() {
                _this.showToast('Done');
            };
            audio.onplay = function() {
                _this.showToast('Playing...');
            };
            
            audio.src = proxyUrl;
            audio.play().catch(function(e) {
                console.log('Play error:', e);
                _this.showToast('Try Chrome for audio.');
            });
        },

        closeModal() {
            document.getElementById('sidebar').classList.add('hidden');
            document.getElementById('exercise-modal').classList.add('hidden');
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
        },

        showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.remove('hidden');

            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        },

        openExercise() {
            if (!this.state.currentLesson) {
                this.showToast('Select a lesson first');
                return;
            }

            this.switchView('exercises');
        },
        
        addTestButton(lessonId) {
            const contentDiv = document.getElementById('content');
            const testSection = document.createElement('div');
            testSection.className = 'lesson-test';
            testSection.innerHTML = `
                <button class="btn btn-primary btn-test" onclick="App.startLessonTest('${lessonId}')">
                    📝 Start Test (30 questions - 90% to pass)
                </button>
            `;
            contentDiv.appendChild(testSection);
        },
        
        startLessonTest(lessonId) {
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '<div class="loading">Loading test...</div>';
            
            var path = lessonId.match(/^\d/) ? this.config.grammarPath + lessonId + '.md' : lessonId + '.md';
            
            fetch(path).then(function(r) { return r.text(); }).then(function(markdown) {
                this.parseAndShowTest(lessonId, markdown);
            }.bind(this));
        },
        
        parseAndShowTest(lessonId, markdown) {
            var testMatch = markdown.match(/!!!START_TEST!!!([\s\S]*?)!!!END_TEST!!!/);
            if (!testMatch) {
                document.getElementById('content').innerHTML = '<p>No test found for this lesson.</p>';
                return;
            }
            
            var testContent = testMatch[1];
            var lines = testContent.split('\n');
            var questions = [];
            var currentQ = null;
            var questionNum = 0;
            
            lines.forEach(function(line) {
                var qMatch = line.match(/^### Q(\d+)/);
                if (qMatch) {
                    if (currentQ) questions.push(currentQ);
                    questionNum = parseInt(qMatch[1]);
                    currentQ = { num: questionNum, options: [] };
                    return;
                }
                
                var typeMatch = line.match(/^\((\w+)\)$/);
                if (typeMatch && currentQ) {
                    currentQ.type = typeMatch[1];
                    return;
                }
                
                if (line.trim() && currentQ) {
                    if (line.startsWith('- ')) {
                        currentQ.options.push(line.substring(2).trim());
                    } else if (!line.startsWith('//') && !line.startsWith('Q') && !line.match(/^###/)) {
                        currentQ.question = (currentQ.question || '') + ' ' + line.trim();
                    }
                }
            });
            if (currentQ) questions.push(currentQ);
            
            var answersMatch = markdown.match(/\/\/ ANSWERS[\s\S]*$/m);
            var answers = {};
            if (answersMatch) {
                var answerLines = answersMatch[0].split('\n');
                answerLines.forEach(function(line) {
                    var aMatch = line.match(/\/\/ Q(\d+):\s*(.+)/);
                    if (aMatch) {
                        answers[parseInt(aMatch[1])] = aMatch[2].trim();
                    }
                });
            }
            
            this.state.lessonTest = {
                lessonId: lessonId,
                questions: questions,
                answers: answers,
                current: 0,
                score: 0,
                total: questions.length
            };
            
            this.showLessonQuestion();
        },
        
        showLessonQuestion() {
            var test = this.state.lessonTest;
            if (!test) return;
            
            var q = test.questions[test.current];
            var contentDiv = document.getElementById('content');
            
            var html = '<div class="lesson-test-container">';
            html += '<h3>Question ' + (test.current + 1) + ' of ' + test.total + '</h3>';
            html += '<p class="lesson-test-q">' + (q.question || 'Question ' + q.num) + '</p>';
            html += '<div class="lesson-test-options">';
            
            if (q.options.length > 0) {
                q.options.forEach(function(opt, i) {
                    html += '<label class="option"><input type="radio" name="q' + q.num + '" value="' + i + '"> ' + opt + '</label>';
                });
            } else {
                html += '<input type="text" class="fill-blank" name="q' + q.num + '" placeholder="Your answer...">';
            }
            html += '<button class="btn btn-primary" onclick="App.checkLessonAnswer()">Check Answer</button>';
            html += '</div>';
            
            contentDiv.innerHTML = html;
        },
        
        checkLessonAnswer() {
            var test = this.state.lessonTest;
            if (!test) return;
            
            var q = test.questions[test.current];
            var userAnswer = '';
            
            if (q.options.length > 0) {
                var selected = document.querySelector('input[name="q' + q.num + '"]:checked');
                userAnswer = selected ? q.options[parseInt(selected.value)].trim().toLowerCase() : '';
            } else {
                var input = document.querySelector('.fill-blank');
                userAnswer = input ? input.value.trim().toLowerCase() : '';
            }
            
            var correctAnswer = (test.answers[q.num] || '').trim().toLowerCase();
            var isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) {
                test.score++;
                this.showToast('✅ Correct!');
            } else {
                this.showToast('❌ Incorrect. Answer: ' + correctAnswer);
            }
            
            test.current++;
            
            if (test.current >= test.total) {
                this.showLessonResults();
            } else {
                this.showLessonQuestion();
            }
        },
        
        showLessonResults() {
            var test = this.state.lessonTest;
            var percentage = Math.round((test.score / test.total) * 100);
            var passed = percentage >= 90;
            
            var contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '<div class="lesson-test-results">';
            contentDiv.innerHTML += '<h2>' + (passed ? '🎉 PASSED!' : '❌ Try Again') + '</h2>';
            contentDiv.innerHTML += '<p>Score: ' + test.score + '/' + test.total + ' (' + percentage + '%)</p>';
            contentDiv.innerHTML += '<p>' + (passed ? 'Level completed!' : 'Need 90% to pass') + '</p>';
            
            if (passed) {
                this.markLessonComplete(test.lessonId);
                if (test.lessonId.match(/^\d+/) && this.state.unlockedLevel < parseInt(test.lessonId.replace(/\D/g, ''))) {
                    this.state.unlockedLevel = parseInt(test.lessonId.replace(/\D/g, '')) + 1;
                    this.showToast('🎉 Level ' + this.state.unlockedLevel + ' UNLOCKED!');
                    this.renderLessonList();
                }
            }
            
            contentDiv.innerHTML += '<button class="btn btn-primary" onclick="App.loadLesson(\'' + test.lessonId + '\')">Return to Lesson</button>';
            contentDiv.innerHTML += '</div>';
        }
    };

    window.App = App;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
})();