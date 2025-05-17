const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");

searchButton.addEventListener("click",()=>{
    const query = searchInput.value.trim();
    if(!query){
        alert("Typ een zoekterm in!");
    }else{
        console.log("Zoeken naar:", query);  
    }
 });





