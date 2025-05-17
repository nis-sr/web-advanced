const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");
const sortSelect = document.getElementById("sort-select");
const categorySelect = document.getElementById("category-select");

let currentMeals = [];

(async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
  loadCategories();

})();

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
  currentMeals = meals;
  const sort = sortSelect.value;
  if (sort === "asc") {
    meals.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  } else if (sort === "desc") {
    meals.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
  }
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
document.getElementById("sort-select").addEventListener("change", () => {
  if (currentMeals && currentMeals.length > 0) {
    showResults([...currentMeals]); 
  }
});

// filter categorie
function loadCategories() {
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then((res) => res.json())
    .then((data) => {
      data.meals.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.strCategory;
        option.textContent = cat.strCategory;
        categorySelect.appendChild(option);
      });
    });
}

categorySelect.addEventListener("change", async (e) => {
  const category = e.target.value;
  if (!category) return;

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    const data = await res.json();
    
    const detailedResults = await Promise.all(
      data.meals.map((meal) =>
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
          .then((res) => res.json())
          .then((detail) => detail.meals[0])
      )
    );

    showResults(detailedResults);
  } catch (err) {
    console.error("Fout bij het filteren op categorie:", err);
    resultsContainer.innerHTML = "<p>Er ging iets mis bij het filteren.</p>";
  }
});









