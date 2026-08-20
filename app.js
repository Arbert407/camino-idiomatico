(function () {
    'use strict';

    const STORAGE_KEY = 'b2_english_bookmarks';
    const LESSONS_CACHE = new Map();

    const CATEGORIES = {
        grammar: {
            label: 'Grammar',
            blurb: '65 lessons from present simple to advanced structures.',
            tag: '65 lessons',
            mark: 'G',
            fileFor: function (id) { return './grammar/' + id + '.md'; }
        },
        rules: {
            label: 'Phrases & Rules',
            blurb: 'Native expressions for IT and daily work.',
            tag: '7 guides',
            mark: 'P',
            fileFor: function (id) { return './rules/' + RULES_MAP[id] + '.md'; }
        },
        cards: {
            label: 'IT Cards',
            blurb: 'Vocabulary, phrasal verbs and idioms for IT.',
            tag: '3 reference pages',
            mark: 'C',
            fileFor: function (id) { return './grammar/' + id + '.md'; }
        }
    };

    const RULES_MAP = {
        'native-phrases-it': 'NATIVE_PHRASES_IT',
        'native-phrases-general': 'NATIVE_PHRASES_GENERAL',
        'phrasal-verbs-a-m': 'PHRASAL_VERBS_A-M',
        'phrasal-verbs-n-z': 'PHRASAL_VERBS_N-Z',
        'native-verbs': 'NATIVE_VERBS',
        'get-vs-other': 'GET_VS_OTHER',
        'word-choice': 'WORD_CHOICE'
    };

    const LESSONS = {
        grammar: [
            { id: '00-grammar-terms', title: 'Grammar Terms', group: 'Reference' },
            { id: '01-present-simple', title: '1. Present Simple', group: 'Tenses - Foundation' },
            { id: '02-present-continuous', title: '2. Present Continuous', group: 'Tenses - Foundation' },
            { id: '03-past-simple', title: '3. Past Simple', group: 'Tenses - Foundation' },
            { id: '04-past-continuous', title: '4. Past Continuous', group: 'Tenses - Foundation' },
            { id: '05-present-perfect', title: '5. Present Perfect', group: 'Tenses - Foundation' },
            { id: '06-present-perfect-continuous', title: '6. Present Perfect Continuous', group: 'Tenses - Foundation' },
            { id: '07-present-perfect-vs-past-simple', title: '7. Present Perfect vs Past Simple', group: 'Tenses - Foundation' },
            { id: '08-past-perfect', title: '8. Past Perfect', group: 'Tenses - Foundation' },
            { id: '09-past-perfect-continuous', title: '9. Past Perfect Continuous', group: 'Tenses - Foundation' },
            { id: '10-for-since-have-got-used-to', title: '10. For, Since, Got & Used To', group: 'Tenses - Advanced' },
            { id: '11-present-tenses-for-future', title: '11. Present Tenses for Future', group: 'Tenses - Advanced' },
            { id: '12-future-simple-going-to-will-shall', title: '12. Future: Going To / Will / Shall', group: 'Tenses - Advanced' },
            { id: '13-future-continuous-future-perfect', title: '13. Future Continuous & Perfect', group: 'Tenses - Advanced' },
            { id: '14-when-i-do-when-ive-done-if-when', title: '14. When I Do / I Have Done', group: 'Tenses - Advanced' },
            { id: '15-modal-verbs-can-could-able-to', title: '15. Modals: Can, Could, Able To', group: 'Modal Verbs' },
            { id: '16-modal-verbs-could-do-could-have-done', title: '16. Could Do / Could Have Done', group: 'Modal Verbs' },
            { id: '17-modal-verbs-must-cant-may-might', title: '17. Must, Can\u2019t, May, Might', group: 'Modal Verbs' },
            { id: '18-modal-verbs-have-to-must-mustnt-neednt', title: '18. Have To, Must, Mustn\u2019t, Needn\u2019t', group: 'Modal Verbs' },
            { id: '19-modal-verbs-should-id-better-its-time', title: '19. Should, I\u2019d Better, It\u2019s Time', group: 'Modal Verbs' },
            { id: '20-modal-verbs-would-can-could-would-you', title: '20. Would, Can, Could, Would You', group: 'Modal Verbs' },
            { id: '21-conditionals-if-i-do-if-i-did', title: '21. Conditionals: If I Do / Did', group: 'Conditionals' },
            { id: '22-if-i-knew-i-wish-i-knew', title: '22. If I Knew / I Wish I Knew', group: 'Conditionals' },
            { id: '23-if-i-had-known-i-wish-i-had-known', title: '23. If I Had Known / I Wish', group: 'Conditionals' },
            { id: '24-passive-voice-is-done-was-done', title: '24. Passive: Is / Was Done', group: 'Passive & Reported' },
            { id: '25-passive-voice-be-done-been-done-being-done', title: '25. Passive: Be / Been / Being Done', group: 'Passive & Reported' },
            { id: '26-impersonal-constructions', title: '26. Impersonal Constructions', group: 'Passive & Reported' },
            { id: '27-reported-speech', title: '27. Reported Speech', group: 'Passive & Reported' },
            { id: '28-verb-ing', title: '28. Verb + -ing', group: 'Verb Forms' },
            { id: '29-verb-to', title: '29. Verb + to', group: 'Verb Forms' },
            { id: '30-verb-ing-or-to', title: '30. Verb + -ing or to', group: 'Verb Forms' },
            { id: '31-verb-preposition-ing', title: '31. Verb + Preposition + -ing', group: 'Verb Forms' },
            { id: '32-verb-preposition-ing-2', title: '32. Verb + Preposition + -ing (2)', group: 'Verb Forms' },
            { id: '33-adjective-to-preposition-ing', title: '33. Adjective + to / Preposition + -ing', group: 'Verb Forms' },
            { id: '34-countable-uncountable-nouns', title: '34. Countable & Uncountable Nouns', group: 'Nouns & Articles' },
            { id: '35-articles-an-the', title: '35. Articles: A & The', group: 'Nouns & Articles' },
            { id: '36-pronouns-determiners', title: '36. Pronouns & Determiners', group: 'Pronouns & Adjectives' },
            { id: '37-relative-clauses', title: '37. Relative Clauses', group: 'Pronouns & Adjectives' },
            { id: '38-adjectives-ing-ed', title: '38. Adjectives: -ing / -ed', group: 'Pronouns & Adjectives' },
            { id: '39-comparatives', title: '39. Comparatives', group: 'Pronouns & Adjectives' },
            { id: '40-superlatives-word-order', title: '40. Superlatives & Word Order', group: 'Pronouns & Adjectives' },
            { id: '41-conjunctions-prepositions', title: '41. Conjunctions & Prepositions', group: 'Connectors & Prepositions' },
            { id: '42-conditional-connectors', title: '42. Conditional Connectors', group: 'Connectors & Prepositions' },
            { id: '43-quantifiers', title: '43. Quantifiers', group: 'Connectors & Prepositions' },
            { id: '44-reflexive-pronouns', title: '44. Reflexive Pronouns', group: 'Connectors & Prepositions' },
            { id: '45-time-expressions', title: '45. Time Expressions', group: 'Prepositions' },
            { id: '46-prepositions-time', title: '46. Prepositions of Time', group: 'Prepositions' },
            { id: '47-prepositions-place', title: '47. Prepositions of Place', group: 'Prepositions' },
            { id: '48-prepositions-movement', title: '48. Prepositions of Movement', group: 'Prepositions' },
            { id: '49-verb-preposition', title: '49. Verb + Preposition', group: 'Verb + Preposition' },
            { id: '50-verb-preposition-2', title: '50. Verb + Preposition (2)', group: 'Verb + Preposition' },
            { id: '51-phrasal-verbs', title: '51. Phrasal Verbs', group: 'Verb + Preposition' },
            { id: '52-phrasal-verbs-in-out-on-off', title: '52. Phrasal Verbs: In, Out, On, Off', group: 'Verb + Preposition' },
            { id: '53-phrasal-verbs-up-down-away-back', title: '53. Phrasal Verbs: Up, Down, Away, Back', group: 'Verb + Preposition' },
            { id: '54-irregular-verbs', title: '54. Irregular Verbs', group: 'Advanced' },
            { id: '55-stative-dynamic-verbs', title: '55. Stative & Dynamic Verbs', group: 'Advanced' },
            { id: '56-verb-aspects', title: '56. Verb Aspects', group: 'Advanced' },
            { id: '57-conditionals', title: '57. Conditionals', group: 'Advanced' },
            { id: '58-subjunctive-inversion', title: '58. Subjunctive & Inversion', group: 'Advanced' },
            { id: '59-gerunds-infinitives', title: '59. Gerunds & Infinitives', group: 'Advanced' },
            { id: '60-reporting-verbs', title: '60. Reporting Verbs', group: 'Advanced' },
            { id: '61-adjectives-comparison', title: '61. Adjectives & Comparison', group: 'Advanced' },
            { id: '62-confusing-vocabulary', title: '62. Confusing Vocabulary', group: 'Advanced' },
            { id: '63-ellipsis-substitution', title: '63. Ellipsis & Substitution', group: 'Advanced' },
            { id: '64-parallel-structure', title: '64. Parallel Structure', group: 'Advanced' },
            { id: '65-cleft-sentences-fronting', title: '65. Cleft Sentences & Fronting', group: 'Advanced' }
        ],
        rules: [
            { id: 'native-phrases-it', title: 'Native Phrases (IT)', group: 'Phrases' },
            { id: 'native-phrases-general', title: 'Native Phrases (General)', group: 'Phrases' },
            { id: 'phrasal-verbs-a-m', title: 'Phrasal Verbs A-M', group: 'Phrasal Verbs' },
            { id: 'phrasal-verbs-n-z', title: 'Phrasal Verbs N-Z', group: 'Phrasal Verbs' },
            { id: 'native-verbs', title: 'Native Verbs', group: 'Verbs' },
            { id: 'get-vs-other', title: 'Get vs Other Verbs', group: 'Verbs' },
            { id: 'word-choice', title: 'Word Choice', group: 'Verbs' }
        ],
        cards: [
            { id: 'it-vocabulary', title: 'IT Vocabulary', group: 'Cards' },
            { id: 'it-phrasal-verbs', title: 'IT Phrasal Verbs', group: 'Cards' },
            { id: 'it-idioms', title: 'IT Idioms', group: 'Cards' }
        ]
    };

    const App = {
        bookmarks: [],

        init() {
            this.loadBookmarks();
            this.setupMarked();
            this.registerServiceWorker();
            window.addEventListener('hashchange', () => this.render());
            this.render();
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
                } catch (e) {
                    console.log('SW failed', e);
                }
            }
        },

        loadBookmarks() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                this.bookmarks = raw ? JSON.parse(raw) : [];
            } catch (e) {
                this.bookmarks = [];
            }
        },

        saveBookmarks() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bookmarks));
            } catch (e) {
                console.error('Bookmark save failed', e);
            }
        },

        isBookmarked(category, id) {
            return this.bookmarks.indexOf(category + ':' + id) !== -1;
        },

        toggleBookmark(category, id) {
            const key = category + ':' + id;
            const i = this.bookmarks.indexOf(key);
            if (i > -1) {
                this.bookmarks.splice(i, 1);
                this.showToast('Bookmark removed');
            } else {
                this.bookmarks.push(key);
                this.showToast('Lesson bookmarked');
            }
            this.saveBookmarks();
        },

        parseRoute() {
            const raw = (window.location.hash || '').replace(/^#/, '').replace(/^\/+/, '');
            if (!raw) return { name: 'home' };
            const parts = raw.split('/').filter(Boolean);
            if (parts.length === 1 && CATEGORIES[parts[0]]) return { name: 'category', category: parts[0] };
            if (parts.length === 2 && CATEGORIES[parts[0]]) return { name: 'lesson', category: parts[0], id: parts[1] };
            return { name: 'home' };
        },

        navigate(path) {
            window.location.hash = path;
        },

        render() {
            const view = document.getElementById('view');
            const route = this.parseRoute();
            switch (route.name) {
                case 'category':
                    this.renderCategory(view, route.category);
                    break;
                case 'lesson':
                    this.renderLesson(view, route.category, route.id);
                    break;
                default:
                    this.renderHome(view);
            }
            window.scrollTo(0, 0);
        },

        renderSidebar(activeCategory) {
            const links = ['grammar', 'rules', 'cards'].map(function (cat) {
                const meta = CATEGORIES[cat];
                const cls = cat === activeCategory ? 'sidebar-link active' : 'sidebar-link';
                return '<a class="' + cls + '" href="#/' + cat + '">' +
                    '<span class="sidebar-mark">' + escapeHtml(meta.mark) + '</span>' +
                    '<span class="sidebar-label">' + escapeHtml(meta.label) + '</span>' +
                    '</a>';
            }).join('');

            return '<aside class="sidebar">' +
                '<a class="sidebar-brand" href="#/">' +
                    '<span class="sidebar-brand-title">B2 IT English</span>' +
                    '<span class="sidebar-brand-sub">camino-idiomatico</span>' +
                '</a>' +
                '<nav class="sidebar-nav">' + links + '</nav>' +
                '</aside>';
        },

        renderHome(view) {
            const bookmarked = this.bookmarks.map(key => {
                const [category, id] = key.split(':');
                return { category, id, key };
            });

            const bookmarkSection = bookmarked.length === 0
                ? ''
                : '<section class="landing-section"><h2 class="section-title">Bookmarks</h2><ul class="lesson-list">' +
                  bookmarked.map(b => {
                      const lesson = this.findLesson(b.category, b.id);
                      if (!lesson) return '';
                      return '<li><a class="lesson-link" href="#/' + b.category + '/' + b.id + '">' +
                          escapeHtml(lesson.title) +
                          '<span class="lesson-link-cat">' + escapeHtml(CATEGORIES[b.category].label) + '</span>' +
                          '</a></li>';
                  }).join('') +
                  '</ul></section>';

            const tilesHtml = '<section class="landing-tiles">' +
                ['grammar', 'rules', 'cards'].map(function (cat) {
                    const meta = CATEGORIES[cat];
                    return '<a class="category-tile" href="#/' + cat + '">' +
                        '<span class="tile-mark">' + escapeHtml(meta.mark) + '</span>' +
                        '<span class="tile-body">' +
                            '<span class="tile-title">' + escapeHtml(meta.label) + '</span>' +
                            '<span class="tile-blurb">' + escapeHtml(meta.blurb) + '</span>' +
                        '</span>' +
                        '<span class="tile-tag">' + escapeHtml(meta.tag) + ' &rarr;</span>' +
                        '</a>';
                }).join('') +
                '</section>';

            view.innerHTML =
                '<div class="shell">' +
                    this.renderSidebar(null) +
                    '<main class="main">' +
                        '<div class="landing">' +
                            '<header class="landing-header">' +
                                '<h1 class="landing-title">B2 IT English</h1>' +
                                '<p class="landing-sub">Practical English for IT professionals. Read a lesson, listen, bookmark. That is it.</p>' +
                            '</header>' +
                            tilesHtml +
                            bookmarkSection +
                            '<footer class="landing-footer">camino-idiomatico &middot; works offline</footer>' +
                        '</div>' +
                    '</main>' +
                '</div>';
        },

        renderCategoryList(category) {
            const meta = CATEGORIES[category];
            const lessons = LESSONS[category];
            const groups = {};
            lessons.forEach(function (l) {
                if (!groups[l.group]) groups[l.group] = [];
                groups[l.group].push(l);
            });

            const groupsHtml = '<div class="section-groups">' +
                Object.keys(groups).map(function (groupName) {
                    return '<div class="lesson-group">' +
                        '<h3 class="group-title">' + escapeHtml(groupName) + '</h3>' +
                        '<ul class="lesson-list">' +
                        groups[groupName].map(function (l) {
                            return '<li><a class="lesson-link" href="#/' + category + '/' + l.id + '">' +
                                escapeHtml(l.title) + '</a></li>';
                        }).join('') +
                        '</ul>' +
                        '</div>';
                }).join('') +
            '</div>';

            return '<section class="landing-section">' +
                '<div class="section-head">' +
                    '<h2 class="section-title">' + escapeHtml(meta.label) + '</h2>' +
                    '<p class="section-blurb">' + escapeHtml(meta.blurb) + '</p>' +
                '</div>' +
                groupsHtml +
                '</section>';
        },

        renderCategory(view, category) {
            const meta = CATEGORIES[category];
            view.innerHTML =
                '<div class="shell">' +
                    this.renderSidebar(category) +
                    '<main class="main">' +
                        '<div class="category-page">' +
                            '<h1 class="page-title">' + escapeHtml(meta.label) + '</h1>' +
                            '<p class="page-blurb">' + escapeHtml(meta.blurb) + '</p>' +
                            this.renderCategoryList(category) +
                        '</div>' +
                    '</main>' +
                '</div>';
        },

        findLesson(category, id) {
            const list = LESSONS[category];
            if (!list) return null;
            return list.find(function (l) { return l.id === id; }) || null;
        },

        neighbours(category, id) {
            const list = LESSONS[category];
            const i = list.findIndex(function (l) { return l.id === id; });
            if (i === -1) return { prev: null, next: null };
            return {
                prev: i > 0 ? list[i - 1] : null,
                next: i < list.length - 1 ? list[i + 1] : null
            };
        },

        async renderLesson(view, category, id) {
            const meta = CATEGORIES[category];
            const lesson = this.findLesson(category, id);
            if (!meta || !lesson) {
                view.innerHTML =
                    '<div class="category-page">' +
                        '<nav class="page-bar"><a class="back-link" href="#/">&larr; Home</a></nav>' +
                        '<h1 class="page-title">Lesson not found</h1>' +
                        '<p class="page-blurb">The lesson you tried to open does not exist.</p>' +
                    '</div>';
                return;
            }

            view.innerHTML =
                '<div class="shell">' +
                    this.renderSidebar(category) +
                    '<main class="main">' +
                        '<div class="lesson-page">' +
                            '<nav class="lesson-bar">' +
                                '<a class="back-link" href="#/' + category + '">&larr; ' + escapeHtml(meta.label) + '</a>' +
                                '<div class="lesson-actions">' +
                                    '<button id="btn-audio" class="bar-btn" type="button" title="Play audio">Play</button>' +
                                    '<button id="btn-bookmark" class="bar-btn" type="button" title="Bookmark">' + (this.isBookmarked(category, id) ? 'Bookmarked' : 'Bookmark') + '</button>' +
                                '</div>' +
                            '</nav>' +
                            '<header class="lesson-hero">' +
                                '<nav class="lesson-hero-trail">' +
                                    '<a class="trail-link" href="#/' + category + '">' + escapeHtml(meta.label) + '</a>' +
                                    (lesson.group
                                        ? '<svg class="trail-sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
                                          '<span class="trail-group">' + escapeHtml(lesson.group) + '</span>'
                                        : '') +
                                '</nav>' +
                                '<h1 class="lesson-hero-title">' + escapeHtml(lesson.title) + '</h1>' +
                                '<p class="lesson-hero-sub">' + escapeHtml(meta.blurb) + '</p>' +
                            '</header>' +
                            '<div class="lesson-progress"><div class="lesson-progress-bar" id="lesson-progress-bar"></div></div>' +
                            '<article id="lesson-body" class="lesson-body">Loading&hellip;</article>' +
                            '<nav class="lesson-foot" id="lesson-foot"></nav>' +
                        '</div>' +
                    '</main>' +
                '</div>';

            document.getElementById('btn-audio').addEventListener('click', () => this.speakTitle(lesson.title));
            document.getElementById('btn-bookmark').addEventListener('click', () => {
                this.toggleBookmark(category, id);
                document.getElementById('btn-bookmark').textContent = this.isBookmarked(category, id) ? 'Bookmarked' : 'Bookmark';
            });

            this.renderFoot(lesson, category);

            try {
                const path = meta.fileFor(id);
                let markdown = LESSONS_CACHE.get(path);
                if (!markdown) {
                    const res = await fetch(path);
                    if (!res.ok) throw new Error('Lesson not found (' + res.status + ')');
                    markdown = await res.text();
                    LESSONS_CACHE.set(path, markdown);
                }
                const cleaned = markdown.replace(/## Test[\s\S]*$/, '');
                const html = marked.parse(cleaned);
                let processed = enhanceHtml(html);
                processed = movePracticeExercisesToBottom(processed);
                processed = makePracticeInteractive(processed);
                document.getElementById('lesson-body').innerHTML = processed;
                this.setupPracticeHandlers();
                this.setupProgress();
            } catch (e) {
                document.getElementById('lesson-body').innerHTML =
                    '<p class="error">Could not load lesson: ' + escapeHtml(e.message) + '</p>';
            }
        },

        setupProgress() {
            const bar = document.getElementById('lesson-progress-bar');
            if (!bar) return;
            const update = () => {
                const body = document.getElementById('lesson-body');
                if (!body) return;
                const rect = body.getBoundingClientRect();
                const total = body.scrollHeight;
                const seen = Math.min(total, Math.max(0, window.innerHeight - rect.top));
                const pct = Math.min(100, Math.max(0, (seen / total) * 100));
                bar.style.width = pct + '%';
            };
            window.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            update();
        },

        setupPracticeHandlers() {
            const sections = document.querySelectorAll('.practice-section');
            sections.forEach((section) => {
                const btn = section.querySelector('.practice-evaluate');
                const reset = section.querySelector('.practice-reset');
                if (btn) btn.addEventListener('click', () => evaluatePractice(section));
                if (reset) reset.addEventListener('click', () => resetPractice(section));
            });
        },

        renderFoot(lesson, category) {
            const nb = this.neighbours(category, lesson.id);
            const foot = document.getElementById('lesson-foot');
            if (!foot) return;
            const prev = nb.prev
                ? '<a class="foot-nav" href="#/' + category + '/' + nb.prev.id + '">&larr; ' + escapeHtml(nb.prev.title) + '</a>'
                : '<span></span>';
            const next = nb.next
                ? '<a class="foot-nav foot-next" href="#/' + category + '/' + nb.next.id + '">' + escapeHtml(nb.next.title) + ' &rarr;</a>'
                : '<span></span>';
            foot.innerHTML = prev + next;
        },

        speakTitle(title) {
            const text = title.replace(/^\d+\.\s*/, '');
            this.speak(text);
        },

        speak(text) {
            if (!('speechSynthesis' in window)) {
                this.showToast('Audio not supported in this browser');
                return;
            }
            const synth = window.speechSynthesis;
            const trySpeak = (n) => {
                const voices = synth.getVoices();
                if (!voices || voices.length === 0) {
                    if (n > 5) { this.showToast('No voices available'); return; }
                    setTimeout(() => trySpeak(n + 1), 250);
                    return;
                }
                const enVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
                synth.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.voice = enVoice;
                u.lang = 'en-US';
                u.rate = 0.95;
                synth.speak(u);
            };
            trySpeak(0);
        },

        showToast(message) {
            const t = document.getElementById('toast');
            if (!t) return;
            t.textContent = message;
            t.classList.remove('hidden');
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
        }
    };

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function enhanceHtml(html) {
        return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, function (match, inner) {
            inner = inner.replace(/<p>([\s\S]*?)<\/p>/g, function (pMatch, pContent) {
                let cls = null;
                if (pContent.indexOf('✅') !== -1) cls = 'ex-correct';
                else if (pContent.indexOf('❌') !== -1) cls = 'ex-incorrect';
                else if (pContent.indexOf('💡') !== -1) cls = 'ex-tip';
                else if (pContent.indexOf('⚠️') !== -1 || /Warning/.test(pContent)) cls = 'ex-warning';
                if (cls) return '<p class="' + cls + '">' + pContent + '</p>';
                return '<p>' + pContent + '</p>';
            });
            return '<blockquote>' + inner + '</blockquote>';
        });
    }

    function movePracticeExercisesToBottom(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const children = Array.from(tmp.children);
        if (children.length === 0) return html;

        let startIdx = -1;
        let endIdx = -1;
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (el.tagName === 'H2' && /Practice Exercises/i.test(el.textContent)) {
                startIdx = i;
                for (let j = i + 1; j < children.length; j++) {
                    if (children[j].tagName === 'H2') { endIdx = j; break; }
                }
                if (endIdx === -1) endIdx = children.length;
                break;
            }
        }
        if (startIdx === -1) return html;

        const block = children.slice(startIdx, endIdx);
        const rest = children.slice(0, startIdx).concat(children.slice(endIdx));

        let testIdx = -1;
        for (let i = 0; i < rest.length; i++) {
            if (rest[i].tagName === 'H2' && /Test \(30 questions\)/i.test(rest[i].textContent)) {
                testIdx = i;
                break;
            }
        }

        const finalChildren = testIdx >= 0
            ? rest.slice(0, testIdx).concat(block, rest.slice(testIdx))
            : rest.concat(block);

        tmp.innerHTML = '';
        finalChildren.forEach(function (c) { tmp.appendChild(c); });
        return tmp.innerHTML;
    }

    function makePracticeInteractive(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;

        const headers = tmp.querySelectorAll('h2');
        let practiceH2 = null;
        for (const h of headers) {
            if (/Practice Exercises/i.test(h.textContent)) { practiceH2 = h; break; }
        }
        if (!practiceH2) return html;

        let endNode = practiceH2.nextElementSibling;
        while (endNode && endNode.tagName !== 'H2') endNode = endNode.nextElementSibling;

        const practiceScope = [];
        let node = practiceH2.nextElementSibling;
        while (node && node !== endNode) {
            practiceScope.push(node);
            node = node.nextElementSibling;
        }

        practiceScope.forEach(function (el) {
            if (el.tagName !== 'OL' && el.tagName !== 'UL') return;
            const items = el.querySelectorAll(':scope > li');
            items.forEach(function (li) {
                transformPracticeItem(li);
            });
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'practice-section';

        const parent = practiceH2.parentNode;
        parent.insertBefore(wrapper, practiceH2);

        wrapper.appendChild(practiceH2);
        practiceScope.forEach(function (el) { wrapper.appendChild(el); });

        const controls = document.createElement('div');
        controls.className = 'practice-controls';

        const score = document.createElement('div');
        score.className = 'practice-score';
        controls.appendChild(score);

        const buttonsRow = document.createElement('div');
        buttonsRow.className = 'practice-buttons';

        const btn = document.createElement('button');
        btn.className = 'practice-evaluate';
        btn.type = 'button';
        btn.textContent = 'Evaluate';
        btn.addEventListener('click', function () { evaluatePractice(wrapper); });
        buttonsRow.appendChild(btn);

        const reset = document.createElement('button');
        reset.className = 'practice-reset';
        reset.type = 'button';
        reset.textContent = 'Reset';
        reset.addEventListener('click', function () { resetPractice(wrapper); });
        buttonsRow.appendChild(reset);

        controls.appendChild(buttonsRow);

        wrapper.appendChild(controls);

        return tmp.innerHTML;
    }

    function transformPracticeItem(li) {
        const raw = li.innerHTML;
        let answer = null;
        let cleaned = raw;

        const arrowMatch = cleaned.match(/(?:→|⇒|=|➔)\s*<strong>([^<]+)<\/strong>/i);
        if (arrowMatch) {
            answer = arrowMatch[1];
            cleaned = cleaned.replace(/(?:→|⇒|=|➔)\s*<strong>[^<]+<\/strong>/i, '');
        } else {
            const trailingStrong = cleaned.match(/<strong>([^<]+)<\/strong>\s*$/i);
            if (trailingStrong) {
                answer = trailingStrong[1];
                cleaned = cleaned.replace(/<strong>[^<]+<\/strong>\s*$/i, '');
            }
        }

        if (!answer) return;

        cleaned = cleaned.replace(/\s*\.?\s*$/, '').trim();

        const inputHtml = '<input type="text" class="practice-input" placeholder="Your answer..." autocomplete="off" spellcheck="false" />';
        cleaned = cleaned.replace(/_{2,}(?:\([^)]*\))?/g, inputHtml);

        li.classList.add('practice-item');
        li.dataset.answer = answer.toLowerCase();
        li.dataset.display = answer;
        li.innerHTML = cleaned + '<span class="practice-feedback"></span>';
    }

    const PRACTICE_PASS_THRESHOLD = 80;

    function evaluatePractice(wrapper) {
        const inputs = wrapper.querySelectorAll('.practice-input');
        let correct = 0;
        let total = 0;

        inputs.forEach(function (input) {
            total++;
            const item = input.closest('.practice-item');
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = item.dataset.answer;
            const feedback = item.querySelector('.practice-feedback');

            input.disabled = true;
            item.classList.remove('practice-correct', 'practice-incorrect', 'practice-empty');

            if (userAnswer === '') {
                item.classList.add('practice-empty');
                feedback.textContent = '(no answer)';
            } else if (userAnswer === correctAnswer) {
                correct++;
                item.classList.add('practice-correct');
                feedback.textContent = '✓ ' + item.dataset.display;
            } else {
                item.classList.add('practice-incorrect');
                feedback.textContent = '✗ Answer: ' + item.dataset.display;
            }
        });

        const score = wrapper.querySelector('.practice-score');
        if (score) {
            const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
            const passed = pct >= PRACTICE_PASS_THRESHOLD;
            let msg;
            if (total === 0) {
                msg = 'No answers to evaluate';
            } else if (passed) {
                msg = '✓ Passed ' + pct + '%  ·  ' + correct + ' / ' + total + ' correct  ·  threshold ' + PRACTICE_PASS_THRESHOLD + '%';
            } else {
                msg = '✗ Failed ' + pct + '%  ·  ' + correct + ' / ' + total + ' correct  ·  threshold ' + PRACTICE_PASS_THRESHOLD + '%';
            }
            score.textContent = msg;
            score.className = 'practice-score show ' + (passed ? 'pass' : 'fail');
        }

        const btn = wrapper.querySelector('.practice-evaluate');
        if (btn) btn.disabled = true;
    }

    function resetPractice(wrapper) {
        wrapper.querySelectorAll('.practice-input').forEach(function (input) {
            input.value = '';
            input.disabled = false;
        });
        wrapper.querySelectorAll('.practice-item').forEach(function (item) {
            item.classList.remove('practice-correct', 'practice-incorrect', 'practice-empty');
            const fb = item.querySelector('.practice-feedback');
            if (fb) fb.textContent = '';
        });
        const score = wrapper.querySelector('.practice-score');
        if (score) { score.textContent = ''; score.className = 'practice-score'; }
        const btn = wrapper.querySelector('.practice-evaluate');
        if (btn) btn.disabled = false;
    }

    window.App = App;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
})();
