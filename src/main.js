const searchInput=document.getElementById("search-input");
const searchButton=document.getElementById("search-button");
const resultsContainer=document.getElementById("results");

searchButton.addEventListener("click",()=>{
    const query=searchInput.ariaValueMax.trim();
    if(!query){
        alert("typ een zoekterm in!");
    }else{
        console.log("zoeken naar",query);
        
    }
});


