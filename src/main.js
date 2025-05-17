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

 async function fetchMealsByAlphabet() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const fetches = alphabet.split('').map(letter =>
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`)
      .then(res => res.json())
      .then(data => data.meals || [])
  );
  const allMeals = await Promise.all(fetches);
  return allMeals.flat();
}
(async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
})();






