const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");
// het zoeken van recepten
searchButton.addEventListener("click",()=>{
    const query = searchInput.value.trim();
    if(!query){
        alert("Typ een zoekterm in!");
    }else{
        console.log("Zoeken naar:", query);  
    }
 });
// recepten per letter (api)
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
// kaarten maken
function showResults(meals) {
  resultsContainer.innerHTML = "";

  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <div class="meal-info">
        <h3>${meal.strMeal}</h3>
        <p><strong>Categorie:</strong> ${meal.strCategory || 'Onbekend'}</p>
        <p><strong>Land:</strong> ${meal.strArea || 'Onbekend'}</p>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

(async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
})();









