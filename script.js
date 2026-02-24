class MovieExplorer {
    constructor(){
        this.API_KEY ="YOUR_TMDB_API_KEY";
        this.BASE_URL ="https://api.themoviedb.org/3";
        this.IMAGE_BASE_IMAGE ="https://image.tmdb.org/t/p/w500";
        this.FALLBACK_IMAGE ='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibwlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
        this.genres ={};
        this.currentPage=1;
        this.isSearching = false;
        this.currentFilters = {
            genre:'',
            year:'',
            sort:''
        }
        this.init();
    }

    async init(){
        this.setupEventListener();
        await this.loadGenres();
        this.setupYearFilter();
        await this.loadTrendingMovies();
        await this.loadRandomMovies();
    }

    setupEventListener(){
        const searchInput=document.getElementById("searchInput");
        const genreFilter =document.getElementById("genreFilter");
        const yearFilter =document.getElementById("yearFilter");
        const sortFilter =document.getElementById("sortFilter");
        const clearBtn =document.getElementById("clearBtn");
        const trendingPrev =document.getElementById("trendingPrev");
        const trendingNext =document.getElementById("trendingNext");

        let searchTimeout;
        searchInput.addEventListener("input",(e)=>{
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(()=>{
                this.handleSearch(e.target.value)
            },500);
        });

        genreFilter.addEventListener("change", ()=>this.handleFilterChange());
        yearFilter.addEventListener("change", ()=>this.handleFilterChange());
        sortFilter.addEventListener("change", ()=>this.handleFilterChange());
        clearBtn.addEventListener("click", ()=>this.clearAllFilters());
        
        
        trendingPrev.addEventListener("click", ()=>this.scrollCarousel('prev'));
        trendingNext.addEventListener("click", ()=>this.scrollCarousel('next'));
    }

    async loadGenres(){
        try {
            const response = await fetch(`${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`);
            const data = await response.json();

            this.genres = data.genres.reduce((acc,genre)=>{
                acc[genre.id] = genre.name;
                return acc;
            },{});

            const genreSelect = document.getElementById("genreFilter");
            data.genres.forEach(genre =>{
                const option = document.createElement("option");
                option.value = genre.id;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading genres", error);
        }
    }

    setupYearFilter(){
        const yearSelect = document.getElementById("yearFilter");
        const currentYear = new Date().getFullYear();
        for(let year = currentYear; year >= 1990; year--){
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }
    async loadTrendingMovies(){
        try {
            const response = await fetch(`${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`);
            const data = await response.json();

            const trendingMovies = data.results.slice(0,10);
            this.displayTrendingMovies(trendingMovies);
        } catch (error) {
            console.error("Error loading trending movies:", error);
            document.getElementById("trendingCarousel").innerHTML = '<div class="error">Failed to load trending movies</div>'
        }
    }

    displayTrendingMovies(movies){
        const carousel = document.getElementById("trendingCarousel");
        carousel.innerHTML = movies.map((movie,index)=> this.createTrendingCard(movie,index+1)).join("");
    }

    createTrendingCard(movie, rank){
        const posterPath = movie.poster_path ? `${this.IMAGE_BASE_URL}${movie.poster_path}`:this.FALLBACK_IMAGE;

        const rating = movie.vote_average ? movie.vote_average.toFixed(1):'N/A';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear():'TBA';
        const genres = movie.genre_ids && movie.genre_ids.length ? movie.genre_ids.slice(0,2).map(id=>this.genres[id]).filter(Boolean).join(', ') :"N/A"; 

        return`
        <div class="trending-card">
           <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'">
        <div class="trending-rank">${rank}</div>
        <div class="trending-overlay">
            <div class="trending-title">${movie.title}</div>
            <div class="trending-details">
            <span class="trending-year">${year}</span>
            <span class="trending-rating">${rating}</span>
            </div>
            <div class="trending-genres">${genres}</div>
        </div>
        </div>
        `;
    }

    async loadRandomMovies(){
        try {
            const randomPage = Math.floor(Math.random() * 10) +1;
            let url = `${this.BASE_URL}/discover/movie/api_key=${this.API_KEY}&page=${randomPage}`;
            if(this.currentFilters.sort){
                url += `&sort_by = ${this.currentFilters.sort}`
            }
            if(this.currentFilters.genre){
                url += `&with_genres = ${this.currentFilters.genre}`
            }
            const response = await fetch(url);
            const data = await response.json();

            this.displayMovies(data.results,"moviesGrid");
        } catch (error) {
            console.error("Error loading random movies", error);
            document.getElementById("moviesGrid").innerHTML = '<div class="error" >Failed to load movies.Please try again. </div> '
        }
    }

    displayMovies(movies,containerId){
        const container = document.getElementById(containerId);

        if(movies.length === 0){
            container.innerHTML = `<div class="no-results">
                <h2>🔍 No movies found</h2>
                <p>Try adjusting your search criteria or filters</p>
                </div>
                `;
                return;
        }
        container.innerHTML = movies.map(movie => this.createMovieCard(movie).join(''));
    }

    createMovieCard(movie){
         const posterPath = movie.poster_path ? `${this.IMAGE_BASE_URL} ${movie.poster_path}`:this.FALLBACK_IMAGE;

        const rating = movie.vote_average ? movie.vote_average.toFixed(1):'N/A';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear():'TBA';
        const description = movie.overview || "No description available"
        const genres = movie.genre_ids && movie.genre_ids.length ? movie.genre_ids.slice(0,2).map(id=>this.genres[id]).filter(Boolean).join(',') :"N/A";

        return`
        <div class="movie-card">
           <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'">
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-details">
            <span class="movie-year">${year}</span>
            <span class="movie-rating">${rating}</span>
            </div>
            <div class="movie-genres">${genres}</div>
            <div class="movie-description">${description}</div>

        </div>
        </div>
        `;
    }


    async handleSearch(query){
        const trimmedQuery = query.trim();
        const clearBtn = document.getElementById("clearBtn");
        const sectionTitle = document.getElementById("randomSectionTitle");
        const trendingSection = document.getElementById("trendingSection");

        if(trimmedQuery ===""){
            this.isSearching = false;
            clearBtn.classList.remove("show");
            sectionTitle.textContent = '🎦 Discover Movies';
            trendingSection.style.display ="block";
            await this.loadRandomMovies();
            return;
        }
        this.isSearching = true;
        clearBtn.classList.add("show");
        sectionTitle.textContent = `🔍Search Results for ${trimmedQuery}`;
        trendingSection.style.display = "none";

        try {
            document.getElementById("moviesGrid").innerHTML = '<div class="loading"> Searching movies.... </div>';

            let url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(trimmedQuery)}&page=1`;
            if(this.currentFilters.year){
                url += `&primary_release_year=${this.currentFilters.year}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            let results = data.results;
            if(this.currentFilters.genre){
                results = results.filter(movie => movie.genre_ids.includes(parseInt(this.currentFilters.genre,10)));
            }

            if(this.currentFilters.sort){
                results = this.sortMovies(results, this.currentFilters.sort)
            }

            this.displayMovies(results, "moviesGrid")
        } catch (error) {
            console.error("Error searching movies", error);
            document.getElementById("moviesGrid").innerHTML = '<div class="error" >Search failed.Please try again. </div> '
        }
    }

    sortMovies(movies,sortBy){
        switch(sortBy){
            case "popularity.desc":
                return movies.sort((a,b) => b.popularity - a.popularity);
            case "vote_average.desc":
                return movies.sort((a,b) => b.vote_average - a.vote_average);
            case "release_date.desc":
                return movies.sort((a,b) => new Date (b.release_date) - (a.release_date));
            case "title.asc":
                return movies.sort((a,b)=> a.title.localeCompare(b.title));
            default:
                return movies;
        }
    }

    async handleFilterChange(){
         const searchInput=document.getElementById("searchInput");
        const genreFilter =document.getElementById("genreFilter");
        const yearFilter =document.getElementById("yearFilter");
        const sortFilter =document.getElementById("sortFilter");
        const clearBtn =document.getElementById("clearBtn");
        const trendingSection = document.getElementById("trendingsection");

        this.currentFilters = {
            genre:genreFilter.value,
            year:yearFilter.value,
            sort:sortFilter.value
        }

        if(this.currentFilters.genre || this.currentFilters.year || this.currentFilters.sort || searchInput.value.trim()){
            clearBtn.classList.add("show")
        }else{
            clearBtn.classList.remove("show")
        }

        if(searchInput.value.trim()){
            trendingSection.style.display = "none";
            await this.handleSearch(searchInput.value.trim())
        } else{
            if(this.currentFilters.genre || this.currentFilters.year || this.currentFilters.sort){
                trendingSection.style.display = "none";
                document.getElementById("randomSectionTitle").textContent = '🎦Filtered Movies';
            } else {
                trendingSection.style.display = "block";
                document.getElementById("randomSectionTitle").textContent = "🎦Discover Movies";
            }

            await this.loadFilteredMovies();
        }
    }

    async loadFilteredMovies(){
        try {
            document.getElementById("moviesGrid").innerHTML = '<div class="loading"> Loading filtered Movies.... </div>';

            let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;
            if(this.currentFilters.genre){
                url += `&with_genres=${this.currentFilters.genre}`;
            }
            if(this.currentFilters.year){
                url += `&primary_release_year=${this.currentFilters.year}`;
            }
            if(this.currentFilters.sort){
                url += `&sort_by=${this.currentFilters.sort}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            

            this.displayMovies(data.results, "moviesGrid")
        } catch (error) {
            console.error("Error loading filtered movies", error);
            document.getElementById("moviesGrid").innerHTML = '<div class="error" >Failed to load filtered movies.Please try again. </div> '
        }
    
    }

    clearAllFilters(){
        const trendingSection = document.getElementById("trendingSection");
        document.getElementById("searchInput").value ='';
        document.getElementById("genreFilter").value ='';
        document.getElementById("yearFilter").value ='';
        document.getElementById("sortFilter").value ='';

        document.getElementById("clearBtn").classList.remove("show");
        document.getElementById("randomSectionTitle").textContent = '🎦Discover Movies';

        trendingSection.style.display = "block";
 
        this.currentFilters ={
            genre:'',
            year:'',
            sort:''
        }

        this.isSearching = false;
        this.loadRandomMovies();
    }

    scrollCarousel(direction){
        const carousel = document.getElementById("trendingCarousel");
        const scrollAmount = 320;
        if(direction === "prev"){
            carousel.scrollBy({
                left:-scrollAmount,behavior:"smooth"
            })
        }else{
            carousel.scrollBy({
                left:scrollAmount,behavior:"smooth"
            })
        }
    }
}



document.addEventListener("DOMContentLoaded",()=>{
    const app =new MovieExplorer();
})