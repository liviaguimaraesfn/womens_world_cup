# Web Development & Deployment Project
# Sports > Football > Women's World Cup
## Women's World Cup Database Museum/Repository Web Application, from 1991 to present.

Student: Lívia Ferreira Guimarães Neves - C24329646

- this database will contain all and each women's players in every single World Cup, from the first edition in 1991 until present, including all country teams;
- this system will be able to search by year, host country, team, stadium, top scorer, winners, best world teams/countries, winners top 10, and other options;
- this system will be enable the user to register in a log-in page, being able to favourite teams, players, and stadiums including wishlist to visit, and scores in trivia quizzes;
- analyse a list of things my system needs based on these requirements, including advanced search/filtering/maybe binary search;
- this application must implement the Create / Read / Update / Delete database operations, asynchronous data consumption from a REST API and offer a responsive mobile-first interaction design, while respecting code quality and security.
- this application will interact with a persistent database (relational or document-based) and includes authentication and search mechanisms

## Technologies used:
  - Node.js
  - Express
  - Bootstrap 5
  - MySQL

## Project structure:
    app/controller/   Express server and routes (api.js)
    app/model/        Database code (planned)
    app/view/         index.html, styles.css, images
    app/config/       Database credentials (gitignored; see mysql.example.js later)
