# I-Student Research: Related Papers, Open-Source Projects & Licensing

This document summarizes research into academic papers and open-source projects relevant to the **I-Student** project — an intelligent student learning platform. It covers intelligent tutoring systems (ITS), adaptive learning, knowledge tracing, learning management systems (LMS), and AI-powered education tools.

---

## Table of Contents

1. [Related Academic Papers](#1-related-academic-papers)
2. [Open-Source Projects](#2-open-source-projects)
3. [Licensing Summary](#3-licensing-summary)
4. [Recommendations](#4-recommendations)
5. [References](#5-references)

---

## 1. Related Academic Papers

### 1.1 Intelligent Tutoring Systems (ITS)

| Paper | Authors | Year | Summary |
|-------|---------|------|---------|
| *Intelligent Tutoring Systems: An Overview* | Nwana, H.S. | 1990 | Foundational survey classifying ITS architectures into four categories: curriculum sequencing, intelligent solution analysis, interactive problem solving, and student modeling. |
| *The Cambridge Handbook of the Learning Sciences (Ch. on ITS)* | VanLehn, K. | 2006 | Comprehensive review of ITS design principles including the inner loop (step-level decisions) and outer loop (task-level decisions) model. |
| *Intelligent Tutoring Goes to School in the Big City* | Koedinger, K.R.; Anderson, J.R.; Hadley, W.H.; Mark, M.A. | 1997 | Demonstrated the effectiveness of ITS (Cognitive Tutors) in real-world classroom settings with significant student learning gains. |

### 1.2 Knowledge Tracing & Student Modeling

| Paper | Authors | Year | Summary |
|-------|---------|------|---------|
| *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge* | Corbett, A.T.; Anderson, J.R. | 1995 | Introduced Bayesian Knowledge Tracing (BKT), the foundational model for tracking student knowledge states over time. |
| *Deep Knowledge Tracing* | Piech, C.; Bassen, J.; Huang, J.; Ganguli, S.; Sahami, M.; Guibas, L.; Sohl-Dickstein, J. | 2015 | Applied recurrent neural networks (LSTM) to model student learning, outperforming traditional BKT on multiple datasets. |
| *SPARFA: Sparse Factor Analysis for Learning and Content Analytics* | Lan, A.S.; Waters, A.E.; Studer, C.; Baraniuk, R.G. | 2014 | Proposed a machine-learning framework for jointly estimating student knowledge and question–concept relationships. |
| *A Self-Improving Chatbot for Education: Bayesian Deep Knowledge Tracing* | — | 2025 | Recent work on combining Bayesian uncertainty quantification with deep knowledge tracing for improved student performance prediction with confidence intervals. |

### 1.3 Adaptive & Personalized Learning

| Paper | Authors | Year | Summary |
|-------|---------|------|---------|
| *Adaptive Learning Systems: A Systematic Review* | Alshammari, M.; Anane, R.; Hendley, R.J. | 2015 | Systematic review of adaptive learning approaches, comparing learner modeling techniques and adaptation strategies. |
| *The Effect of Personalized Learning on Student Achievement: A Meta-Analysis* | Bernacki, M.L.; Greene, M.J.; Lobczowski, N.G. | 2021 | Meta-analysis showing positive effects of personalization on student outcomes, especially when combined with self-regulated learning supports. |
| *Optimizing Spaced Repetition with a DSR Model* | Ye, W. (open-spaced-repetition) | 2022 | Introduced the Free Spaced Repetition Scheduler (FSRS) algorithm based on the DSR (Difficulty, Stability, Retrievability) model for optimized memory retention scheduling. |

### 1.4 AI & NLP in Education

| Paper | Authors | Year | Summary |
|-------|---------|------|---------|
| *Automatic Question Generation from Text: A Survey* | Kurdi, G.; Leo, J.; Parsia, B.; Sattler, U.; Al-Emari, S. | 2020 | Survey of NLP-based automatic question generation techniques applicable to educational content creation. |
| *Educational Data Mining and Learning Analytics: An Updated Survey* | Romero, C.; Ventura, S. | 2020 | Comprehensive survey covering data mining techniques in education: classification, clustering, association rule mining, and more. |
| *Large Language Models in Education: A Focus on the Complementary Relationship Between Human Teachers and ChatGPT* | Kasneci, E. et al. | 2023 | Explores opportunities and challenges of LLMs (e.g., GPT) in educational contexts including tutoring, assessment, and feedback. |

---

## 2. Open-Source Projects

### 2.1 Learning Management Systems (LMS)

| Project | URL | Stars | Language | License | Description |
|---------|-----|-------|----------|---------|-------------|
| **Moodle** | [moodle/moodle](https://github.com/moodle/moodle) | 5,000+ | PHP | **GPL-3.0** | The world's most widely used open-source LMS. Extensive plugin ecosystem for course management, grading, and collaboration. |
| **Canvas LMS** | [instructure/canvas-lms](https://github.com/instructure/canvas-lms) | 5,500+ | Ruby | **AGPL-3.0** | Modern LMS widely used in higher education. REST API for integrations. |
| **Frappe LMS** | [frappe/lms](https://github.com/frappe/lms) | 2,673 | Vue/Python | **AGPL-3.0** | Simple and beautiful LMS built on the Frappe framework. Easy to customize and extend. |
| **ClassroomIO** | [classroomio/classroomio](https://github.com/classroomio/classroomio) | 1,415 | Svelte | **AGPL-3.0** | Open-source education platform, alternative to Moodle/Teachable. Built with SvelteKit and Supabase. |
| **Kalvi** | [kalvilabs/kalvi](https://github.com/kalvilabs/kalvi) | 106 | TypeScript | **AGPL-3.0** | Open-source infrastructure for launching online education platforms with courses, mock tests, and live classes. |

### 2.2 Intelligent Tutoring & Adaptive Learning

| Project | URL | Stars | Language | License | Description |
|---------|-----|-------|----------|---------|-------------|
| **Cognitive Tutor (Open-source ITS)** | [yrahul3910/student-modeling-project](https://github.com/yrahul3910/student-modeling-project) | 14 | Jupyter Notebook | **MIT** | ITS implementation using various algorithms from the literature for student modeling and knowledge tracing. |
| **Virtual Tutor** | [Fadh1/Virtual-Tutor](https://github.com/Fadh1/Virtual-Tutor) | 1 | JavaScript | **Not specified** | Adaptive learning platform using Bayesian Knowledge Tracing to personalize content and track mastery. |

### 2.3 Spaced Repetition & Memory Systems

| Project | URL | Stars | Language | License | Description |
|---------|-----|-------|----------|---------|-------------|
| **Anki** | [ankitects/anki](https://github.com/ankitects/anki) | 26,345 | Rust | **AGPL-3.0** | The most popular smart spaced-repetition flashcard program. Highly extensible with add-ons. |
| **FSRS4Anki** | [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) | 3,798 | Jupyter Notebook | **MIT** | Modern Anki scheduling based on Free Spaced Repetition Scheduler (FSRS) algorithm using machine learning. |
| **FSRS (Algorithm)** | [open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) | 585 | — | **MIT** | The standalone FSRS spaced-repetition algorithm based on the DSR model. Can be integrated into any app. |
| **Carden** | [alyssaxuu/carden](https://github.com/alyssaxuu/carden) | 479 | JavaScript | **MIT** | Flashcards with spaced repetition and gamification. Chrome extension for bite-sized learning. |
| **AnyMemo** | [helloworld1/AnyMemo](https://github.com/helloworld1/AnyMemo) | 154 | Java | **GPL-3.0** | Advanced spaced repetition flashcard software for Android. |

### 2.4 AI-Powered Education Tools

| Project | URL | Stars | Language | License | Description |
|---------|-----|-------|----------|---------|-------------|
| **Speech-Driven Lessons** | [bobhaotian/speech-driven-lessons](https://github.com/bobhaotian/speech-driven-lessons) | 90 | TypeScript | **Not specified** | AI-powered LMS with course auto-creation and delivery using speech. |
| **EduNexus 2.0** | [muhammadibrahim313/EDUNEXUS-2.0](https://github.com/muhammadibrahim313/EDUNEXUS-2.0) | 10 | Python | **MIT** | AI learning platform offering personalized learning, real-time support, and coding mentorship. |
| **ShikshaSoladu.ai** | [Axestein/shikshasoladu.ai](https://github.com/Axestein/shikshasoladu.ai) | 9 | JavaScript | **Not specified** | Inclusive AI-based education platform for students with disabilities (blind, deaf, dyslexic). |

### 2.5 NLP & Question Generation

| Project | URL | Stars | Language | License | Description |
|---------|-----|-------|----------|---------|-------------|
| **Auto Q&A Generation (T5/BERT)** | [VigneshKS-4633/Automatic-Question-and-Answer-Generation](https://github.com/VigneshKS-4633/Automatic-Question-and-Answer-Generation-by-using-NLP-and-Flask-Framework) | 1 | HTML/Python | **Not specified** | Uses T5 and BERT models to automatically generate questions and answers from text via Flask. |

---

## 3. Licensing Summary

### 3.1 License Compatibility Matrix

| License | Type | Commercial Use | Modification | Distribution | Patent Grant | Copyleft | Key Conditions |
|---------|------|:-:|:-:|:-:|:-:|:-:|----------------|
| **MIT** | Permissive | ✅ | ✅ | ✅ | ❌ | ❌ | Include copyright notice |
| **Apache-2.0** | Permissive | ✅ | ✅ | ✅ | ✅ | ❌ | Include copyright + notice of changes |
| **GPL-3.0** | Copyleft | ✅ | ✅ | ✅ | ✅ | ✅ (Strong) | Derivative works must also be GPL-3.0 |
| **AGPL-3.0** | Copyleft | ✅ | ✅ | ✅ | ✅ | ✅ (Strongest) | Network use counts as distribution; derivatives must be AGPL-3.0 |

### 3.2 Key Licensing Considerations

1. **MIT and Apache-2.0** projects (e.g., FSRS, FSRS4Anki, student-modeling-project, Carden, EduNexus) can be freely integrated into the I-Student project regardless of what license I-Student uses.

2. **GPL-3.0** projects (e.g., Moodle, AnyMemo) require that any derivative work also be released under GPL-3.0. Code from these projects can be used if I-Student adopts a GPL-3.0-compatible license.

3. **AGPL-3.0** projects (e.g., Canvas LMS, Anki, Frappe LMS, ClassroomIO, Kalvi) have the strictest copyleft requirements — if I-Student is deployed as a network service (web application), all source code must be made available to users under AGPL-3.0. Direct code reuse from these projects requires I-Student to also be AGPL-3.0.

4. **Projects without explicit licenses** (e.g., Virtual Tutor, Speech-Driven Lessons, ShikshaSoladu.ai) should be treated as **All Rights Reserved** by default. We cannot legally reuse their code without obtaining explicit permission from the authors.

### 3.3 Recommended License Strategy for I-Student

| Strategy | License | Pros | Cons |
|----------|---------|------|------|
| **Maximum Freedom** | MIT | Maximum adoption, simple compliance, can integrate MIT/Apache code | Cannot use GPL/AGPL code directly |
| **Balanced Approach** | Apache-2.0 | Permissive + patent grant protection, good for commercial use | Cannot use GPL/AGPL code directly |
| **Full Ecosystem Access** | AGPL-3.0 | Can use all identified open-source projects | All derivative/network-served code must remain open source |

---

## 4. Recommendations

### 4.1 Most Useful Open-Source Components to Integrate

| Priority | Component | Project | License | Reason |
|:--------:|-----------|---------|---------|--------|
| 🔴 High | Spaced repetition algorithm | [FSRS](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) | MIT | State-of-the-art memory scheduling; MIT license allows unrestricted use. |
| 🔴 High | Knowledge tracing | [student-modeling-project](https://github.com/yrahul3910/student-modeling-project) | MIT | Ready-made ITS algorithms for student performance modeling. |
| 🟡 Medium | LMS framework | [Frappe LMS](https://github.com/frappe/lms) or [ClassroomIO](https://github.com/classroomio/classroomio) | AGPL-3.0 | Full-featured LMS to build upon (requires AGPL-3.0 license adoption). |
| 🟡 Medium | Flashcard/review system | [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki) | MIT | Reference implementation of FSRS for Anki; can adapt for I-Student. |
| 🟢 Low | AI chatbot for education | [EduNexus 2.0](https://github.com/muhammadibrahim313/EDUNEXUS-2.0) | MIT | AI-powered student support chatbot patterns. |
| 🟢 Low | Gamification patterns | [Carden](https://github.com/alyssaxuu/carden) | MIT | Reference for gamification in learning (streaks, progress). |

### 4.2 Recommended Research Areas for Further Investigation

1. **Bayesian Knowledge Tracing (BKT) vs. Deep Knowledge Tracing (DKT)**: Evaluate trade-offs between interpretability (BKT) and accuracy (DKT) for student modeling.
2. **LLM-Powered Tutoring**: Explore using large language models for Socratic dialogue, hint generation, and automated feedback (see Kasneci et al., 2023).
3. **Learning Analytics Dashboards**: Investigate data visualization approaches for teachers and students to monitor learning progress.
4. **Accessibility in EdTech**: Consider inclusive design patterns (see ShikshaSoladu.ai) to serve students with disabilities.

---

## 5. References

1. Nwana, H.S. (1990). *Intelligent Tutoring Systems: An Overview*. Artificial Intelligence Review, 4(4), 251–277.
2. VanLehn, K. (2006). *The Behavior of Tutoring Systems*. International Journal of Artificial Intelligence in Education, 16(3), 227–265.
3. Koedinger, K.R., Anderson, J.R., Hadley, W.H., & Mark, M.A. (1997). *Intelligent Tutoring Goes to School in the Big City*. International Journal of Artificial Intelligence in Education, 8, 30–43.
4. Corbett, A.T. & Anderson, J.R. (1995). *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge*. User Modeling and User-Adapted Interaction, 4(4), 253–278.
5. Piech, C. et al. (2015). *Deep Knowledge Tracing*. Advances in Neural Information Processing Systems (NeurIPS), 28.
6. Lan, A.S., Waters, A.E., Studer, C., & Baraniuk, R.G. (2014). *Sparse Factor Analysis for Learning and Content Analytics*. Journal of Machine Learning Research, 15, 1959–2008.
7. Alshammari, M., Anane, R., & Hendley, R.J. (2015). *Adaptive E-learning System Based on Learning Style and Knowledge Level*. In Proc. of the 6th International Conference on E-Education, E-Business, E-Management and E-Learning.
8. Bernacki, M.L., Greene, M.J., & Lobczowski, N.G. (2021). *A Systematic Review of Research on Personalized Learning*. Journal of Research on Technology in Education.
9. Kurdi, G. et al. (2020). *A Systematic Review of Automatic Question Generation for Educational Purposes*. International Journal of Artificial Intelligence in Education, 30, 121–204.
10. Romero, C. & Ventura, S. (2020). *Educational Data Mining and Learning Analytics: An Updated Survey*. Wiley Interdisciplinary Reviews: Data Mining and Knowledge Discovery, 10(3).
11. Kasneci, E. et al. (2023). *ChatGPT for Good? On Opportunities and Challenges of Large Language Models for Education*. Learning and Individual Differences, 103, 102274.
12. Ye, W. (2022). *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling*. Proceedings of the 29th ACM SIGKDD Conference on Knowledge Discovery and Data Mining.

---

*This research document was compiled for the I-Student project. Last updated: February 2026.*
