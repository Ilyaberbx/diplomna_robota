АНОТАЦІЯ

Вербанов І. Г. Вебзастосунок для пошуку загублених домашніх тварин : кваліфікаційна робота бакалавра за спеціальністю «121 Інженерія програмного забезпечення» / Ілля Геннадійович Вербанов ; керівник Надія Миколаївна Беглова – Одеса : Нац. ун-т «Одес. політехніка», 2026. – 70 с.

Кваліфікаційна робота містить основну текстову частину на 58 сторінках, список використаних джерел з 13 найменувань на 1 сторінці, додатки на 4 сторінках.

Метою кваліфікаційної роботи є підвищення ефективності первинного зіставлення оголошень про загублених і знайдених тварин шляхом розроблення вебзастосунку, що автоматично формує ранжований перелік ймовірних збігів за видом тварини, географічною відстанню та часовим вікном події. Ефективність оцінюється якістю ранжування (часткою випадків, коли істинний збіг потрапляє в перші позиції переліку, та середнім оберненим рангом істинного збігу) і часом формування переліку; досягнення мети підтверджується експериментально.

У роботі розроблено вебзастосунок, який дозволяє власникам публікувати оголошення про загублену тварину, а особам, які знайшли тварину, — оголошення про знахідку. Реалізовано алгоритм формування ранжованого переліку оголошень-кандидатів, що оцінює збіг за видом тварини, відстанню між місцями події за формулою гаверсинуса та різницею дат. Запропонований кандидат підтверджується людиною: після підтвердження зв'язку контактні дані сторін взаємно розкриваються, що дозволяє організувати повернення тварини.

Систему реалізовано із застосуванням платформи Node.js, фреймворку NestJS, бібліотеки React, ORM Drizzle та системи керування базами даних PostgreSQL. У процесі розробки проведено аналіз предметної області та аналогів, сформовано функціональні та нефункціональні вимоги, виконано планування проєкту, спроєктовано архітектуру системи, структуру бази даних і користувацький інтерфейс, проведено функціональне та нефункціональне тестування.

Результатом кваліфікаційної роботи є вебзастосунок для пошуку загублених тварин, який може бути використаний волонтерськими спільнотами та притулками для автоматизації первинного зіставлення оголошень. Проведене тестування підтвердило коректність роботи системи, а експериментальне дослідження на модельному наборі даних — досягнення мети: істинний збіг потрапляє у перші позиції ранжованого переліку, а час формування переліку задовольняє вимогу продуктивності.

*Ключові слова:* вебзастосунок, пошук загублених тварин, алгоритм зіставлення, формула гаверсинуса, ранжування кандидатів, база даних, NestJS, React.

ABSTRACT

Verbanov I. H. Web application for finding lost pets : Bachelor's qualification work in the specialty «121 Software Engineering» / Illia Hennadiiovych Verbanov ; supervisor Nadiia Mykolaivna Behlova – Odesa : Odesa Polytechnic Nat. Univ., 2026. – 70 pages.

The qualification work contains the main text part on 58 pages, a list of used sources with 13 titles on 1 page, and appendices on 4 pages.

The aim of the qualification work is to improve the effectiveness of the initial matching of lost- and found-pet reports by developing a web application that automatically builds a ranked list of likely matches by animal species, geographic distance, and the time window of the event. Effectiveness is assessed by ranking quality (the share of cases in which the true match appears among the top positions of the list, and the mean reciprocal rank of the true match) and by the time to build the list; the achievement of the aim is confirmed experimentally.

The work presents a web application that allows owners to publish reports about a lost pet and finders to publish reports about a found animal. A matching algorithm is implemented that builds a ranked list of candidate reports, evaluating the match by species equality, the distance between event locations computed with the haversine formula, and the difference of dates. A proposed candidate is confirmed by a human: after the link is confirmed, the contact details of both parties are mutually revealed so that the return of the pet can be arranged.

The system is implemented using the Node.js platform, the NestJS framework, the React library, the Drizzle ORM, and the PostgreSQL database management system. During the development, the subject area and existing solutions were analyzed, functional and non-functional requirements were defined, project planning was carried out, the system architecture, database structure, and user interface were designed, and functional and non-functional testing was performed.

The result of the qualification work is a web application for finding lost pets that can be used by volunteer communities and shelters to automate the initial matching of reports. Testing confirmed the correctness of the system, and an experiment on a model dataset confirmed that the aim was achieved: the true match appears among the top positions of the ranked list, and the list is built within the performance requirement.

*Keywords:* web application, lost pet search, matching algorithm, haversine formula, candidate ranking, database, NestJS, React.

<!-- ОФОРМЛЕННЯ:
- АНОТАЦІЯ та ABSTRACT — кожна з нової сторінки; заголовки ВЕЛИКИМИ, напівжирні, по центру, без крапки; один порожній рядок після заголовка.
- Основний текст TNR 14 пт, інтервал 1,5, за шириною, абзацний відступ 1,25 см.
- «Ключові слова:» / «Keywords:» — курсивом разом із самим переліком; слова в називному відмінку, в один рядок через кому.
- Бібліоопис у 1-му абзаці згенерувати через https://bo.op.edu.ua і замінити плейсхолдери. Зразок: appendices/dodatok-b-anotacii.docx.
-->
