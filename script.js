class MovieExplorer {
    constructor(){
        this.API_KEY ="ba7a7ab492ae117b59a47ab641ceee73";
        this.BASE_URL ="https://api.themoviedb.org/3";
        this.IMAGE_BASE_URL ="https://image.tmdb.org/t/p/w500";
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
    

    // --- NEW: MODAL & CARD CLICK LISTENERS ---
        const trailerModal = document.getElementById("trailerModal");
        const closeModalBtn = document.getElementById("closeModalBtn");

        // Event Delegation: Listen for clicks on the parent containers
        document.getElementById("moviesGrid").addEventListener("click", (e) => {
            const card = e.target.closest('.movie-card-btn');
            if(card) this.openTrailer(card.dataset.id);
        });

        document.getElementById("trendingCarousel").addEventListener("click", (e) => {
            const card = e.target.closest('.movie-card-btn');
            if(card) this.openTrailer(card.dataset.id);
        });

        // Close Modal Listeners
        closeModalBtn.addEventListener("click", () => this.closeTrailer());
        trailerModal.addEventListener("click", (e) => {
            // Close if clicking the dark background overlay, but not the video player itself
            if(e.target === trailerModal) this.closeTrailer();
        });
    }

    // --- NEW: TRAILER METHODS ---
    async openTrailer(movieId) {
        const modal = document.getElementById('trailerModal');
        const iframe = document.getElementById('trailerIframe');
        const noTrailerMsg = document.getElementById('noTrailerMsg');

        // Show the modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Reset previous state
        iframe.src = ''; 
        iframe.classList.add('hidden');
        noTrailerMsg.classList.remove('hidden');
        noTrailerMsg.textContent = "Loading trailer...";

        try {
            // Fetch videos for this specific movie
            const response = await fetch(`${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`);
            const data = await response.json();
            
            // Find an official YouTube trailer (or just any YouTube video if a "Trailer" is missing)
            const trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer') 
                         || data.results.find(vid => vid.site === 'YouTube');

            if (trailer) {
                noTrailerMsg.classList.add('hidden');
                iframe.classList.remove('hidden');
                // The ?autoplay=1 parameter ensures it starts playing immediately
                iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            } else {
                noTrailerMsg.textContent = "😕 Sorry, no trailer available for this movie.";
            }
        } catch (error) {
            console.error("Error fetching trailer:", error);
            noTrailerMsg.textContent = "Error loading trailer data.";
        }
    }

    closeTrailer() {
        const modal = document.getElementById('trailerModal');
        const iframe = document.getElementById('trailerIframe');
        
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // Clear the iframe source so the video stops playing in the background
        iframe.src = ''; 
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

            const trendingMovies = data.results.slice(0,50);
            this.displayTrendingMovies(trendingMovies);
        } catch (error) {
            console.error("Error loading trending movies:", error);
            document.getElementById("trendingCarousel").innerHTML = '<div class="text-center p-12 text-netflix text-lg">Failed to load trending movies</div>'
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

        return `
        <div class="movie-card-btn relative min-w-[300px] h-[450px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-gradient-to-tr from-netflix/10 to-black/80 hover:scale-105 hover:shadow-[0_20px_40px_rgba(229,9,20,.3)] group shrink-0" data-id="${movie.id}">
           <img src="${posterPath || poster}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'">
        <div class="absolute top-4 left-4 bg-black/80 text-netflix text-4xl font-bold px-4 py-2 rounded-xl z-10 shadow-[2px_2px_4px_rgba(0,0,0,0.8)] border-2 border-netflix">${rank}</div>
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-10 px-5 pb-5 text-white">
            <div class="text-xl font-bold mb-2 drop-shadow-md truncate">${movie.title}</div>
            <div class="flex justify-between items-center text-sm opacity-90">
            <span class="trending-year">${year}</span>
            <span class="bg-netflix px-2.5 py-1 rounded-full font-bold text-xs">${rating}</span>
            </div>
            <div class="text-xs text-gray-300 mt-2 truncate">${genres}</div>
        </div>
        </div>
        `;
    }

    async loadRandomMovies(){
        try {
            const randomPage = Math.floor(Math.random() * 10) +1;
            let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${randomPage}`;
            if(this.currentFilters.sort){
                url += `&sort_by=${this.currentFilters.sort}`
            }
            if(this.currentFilters.genre){
                url += `&with_genres=${this.currentFilters.genre}`
            }
            const response = await fetch(url);
            const data = await response.json();

            this.displayMovies(data.results,"moviesGrid");
        } catch (error) {
            console.error("Error loading random movies", error);
            document.getElementById("moviesGrid").innerHTML = '<div class="text-center p-12 text-netflix text-lg col-span-full" >Failed to load movies.Please try again. </div> '
        }
    }

    displayMovies(movies,containerId){
        const container = document.getElementById(containerId);

        if(movies.length === 0){
            container.innerHTML = `<div class="text-center p-16 text-[#ccc] col-span-full">
                <h2 class="text-3xl mb-4">🔍 No movies found</h2>
                <p>Try adjusting your search criteria or filters</p>
                </div>
                `;
                return;
        }
        container.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
    }

    createMovieCard(movie){
         const posterPath = movie.poster_path ? `${this.IMAGE_BASE_URL}${movie.poster_path}`:this.FALLBACK_IMAGE;

        const rating = movie.vote_average ? movie.vote_average.toFixed(1):'N/A';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear():'TBA';
        const description = movie.overview || "No description available"
        const genres = movie.genre_ids && movie.genre_ids.length ? movie.genre_ids.slice(0,2).map(id=>this.genres[id]).filter(Boolean).join(',') :"N/A";

        return`
        <div class="movie-card-btn bg-white/5 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer min-h-[450px] backdrop-blur-md border border-white/10 hover:-translate-y-2.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-netflix group flex flex-col " data-id="${movie.id}">
           <img src="${posterPath || poster}" alt="${movie.title}" class="w-full h-[300px] object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'">
        <div class="p-4 flex-1 flex flex-col">
            <div class="text-lg font-bold mb-2 text-white truncate">${movie.title}</div>
            <div class="flex justify-between items-center mb-2.5 text-sm text-[#ccc]">
            <span class="movie-year">${year}</span>
            <span class="bg-netflix px-2 py-1 rounded-full font-bold text-xs text-white">${rating}</span>
            </div>
            <div class="text-xs text-[#ccc] mb-1.5 truncate">${genres}</div>
            <div class="text-[#999] text-xs leading-relaxed line-clamp-3 mb-2 flex-1">${description || movie.overview}</div>

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
            clearBtn.classList.remove("inline-block");
            clearBtn.classList.add("hidden");
            sectionTitle.textContent = '🎦 Discover Movies';
            trendingSection.style.display ="block";
            await this.loadRandomMovies();
            return;
        }
        this.isSearching = true;
        clearBtn.classList.remove("hidden");
        clearBtn.classList.add("inline-block");
        sectionTitle.textContent = `🔍Search Results for ${trimmedQuery}`;
        trendingSection.style.display = "none";

        try {
            document.getElementById("moviesGrid").innerHTML = '<div class="text-center p-12 text-xl text-[#ccc] col-span-full"> Searching movies.... </div>';

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
            document.getElementById("moviesGrid").innerHTML = '<div class="text-center p-12 text-netflix text-lg col-span-full" >Search failed.Please try again. </div> '
        }
    }

    sortMovies(movies,sortBy){
        switch(sortBy){
            case "popularity.desc":
                return movies.sort((a,b) => b.popularity - a.popularity);
            case "vote_average.desc":
                return movies.sort((a,b) => b.vote_average - a.vote_average);
            case "release_date.desc":
                return movies.sort((a,b) => new Date(b.release_date) - new Date(a.release_date));
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
        const trendingSection = document.getElementById("trendingSection");

        this.currentFilters = {
            genre:genreFilter.value,
            year:yearFilter.value,
            sort:sortFilter.value
        }

        if(this.currentFilters.genre || this.currentFilters.year || this.currentFilters.sort || searchInput.value.trim()){
            clearBtn.classList.remove("hidden")
            clearBtn.classList.add("inline-block")
        }else{
            clearBtn.classList.add("hidden")
            clearBtn.classList.remove("inline-block")
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
            document.getElementById("moviesGrid").innerHTML = '<div class="text-center p-12 text-xl text-[#ccc] col-span-full"> Loading filtered Movies.... </div>';

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
            document.getElementById("moviesGrid").innerHTML = '<div class="text-center p-12 text-netflix text-lg col-span-full" >Failed to load filtered movies.Please try again. </div> '
        }
    
    }

    clearAllFilters(){
        const trendingSection = document.getElementById("trendingSection");
        document.getElementById("searchInput").value ='';
        document.getElementById("genreFilter").value ='';
        document.getElementById("yearFilter").value ='';
        document.getElementById("sortFilter").value ='';

        const clearBtn = document.getElementById("clearBtn");

        clearBtn.classList.add("hidden");
        clearBtn.classList.remove("inline-block");

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