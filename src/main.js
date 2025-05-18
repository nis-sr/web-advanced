const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");
const sortSelect = document.getElementById("sort-select");
const categorySelect = document.getElementById("category-select");
const backToSearchButton = document.getElementById("back-to-search");

let currentMeals = [];

(async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
  loadCategories();

})();

// enter
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});

// zoekbalk
searchButton.addEventListener("click",async()=>{
    const query = searchInput.value.trim();
    if(!query){
        alert("Typ een zoekterm in!");
        return; 
    }
    try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();

    if (!data.meals || data.meals.length === 0) {
      resultsContainer.innerHTML = "<p>Geen resultaten gevonden.</p>";
      return;
    }

    showResults(data.meals);
  } catch (err) {
    console.error("Fout bij zoeken:", err);
    resultsContainer.innerHTML = "<p>Er ging iets mis bij het zoeken.</p>";
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

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function toggleFavorite(id) {
  let favorites = getFavorites();
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
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
    const favorites = getFavorites(); 
    card.className = "meal-card hidden";
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <div class="meal-info">
        <h3>${meal.strMeal}</h3>
        <p><strong>Categorie:</strong> ${meal.strCategory || 'Onbekend'}</p>
        <p><strong>Land:</strong> ${meal.strArea || 'Onbekend'}</p>
        <button class="fav-btn" data-id="${meal.idMeal}">
        ${favorites.includes(meal.idMeal) ? "❤️" : "🤍"}
        </button>
      </div>
    `;
    resultsContainer.appendChild(card);
    observer.observe(card);

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

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      entry.target.classList.remove("hidden");
    }
  });
}, { threshold: 0.1 });

resultsContainer.addEventListener("click", async (e) => {
  if (e.target.classList.contains("fav-btn")) {
    const id = e.target.getAttribute("data-id");
    toggleFavorite(id);

    const backBtn = document.getElementById("back-to-search");
    const isInFavoritesView = !backBtn.classList.contains("hidden");
    if (isInFavoritesView) {
      const favorites = getFavorites();
      if (favorites.length === 0) {
        resultsContainer.innerHTML = "<p>Je hebt nog geen favorieten opgeslagen.</p>";
        backBtn.classList.add("hidden");
        return;
      }

       const updatedFavorites = await Promise.all(
        favorites.map((id) =>
          fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`).then(res => res.json())
        )
      );
        const meals = results
          .map((r) => r.meals ? r.meals[0] : null)
          .filter((meal) => meal);
        showResults(meals);
      
    } else {
        e.target.textContent = getFavorites().includes(id) ? "❤️" : "🤍";
      }
      return
   }
});
document.getElementById("show-favorites").addEventListener("click", () => {
  const favorites = getFavorites();

  if (favorites.length === 0) {
    resultsContainer.innerHTML = "<p>Je hebt nog geen favorieten opgeslagen.</p>";
    return;
  }

  Promise.all(
    favorites.map((id) =>
      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
        .then((res) => res.json())
    )
  ).then((results) => {
    const meals = results
      .map((r) => r.meals ? r.meals[0] : null)
      .filter((meal) => meal !== null);

    showResults(meals);
     document.getElementById("back-to-search").classList.remove("hidden");
  });
});







