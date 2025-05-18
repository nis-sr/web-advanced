const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");
const sortSelect = document.getElementById("sort-select");
const categorySelect = document.getElementById("category-select");
const backToSearchButton = document.getElementById("back-to-search");

let currentMeals = [];

window.addEventListener("DOMContentLoaded",async () => {
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
    if(query === ""){
        alert("Typ een zoekterm in!");
        return; 
    }
    try {
    resultsContainer.innerHTML = "<p>Zoeken...</p>";    
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

// kaarten maken
function showResults(meals) {
  currentMeals = meals;
  const sort = sortSelect.value;

  if (!meals || meals.length === 0) {
    resultsContainer.innerHTML = "<p>Geen resultaten gevonden.</p>";
    return;
  }

  if (sort === "asc") {
    meals.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  } else if (sort === "desc") {
    meals.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
  }
  resultsContainer.innerHTML = "";
  const favorites = getFavorites(); 

  meals.forEach(meal => {
    const card = document.createElement("div");
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
sortSelect.addEventListener("change", () => {
  if (currentMeals.length > 0) {
    showResults([...currentMeals]); 
  }
});

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

resultsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("fav-btn")) {
    const id = e.target.getAttribute("data-id");
    toggleFavorite(id);
    const isInFavoritesView = !backToSearchButton.classList.contains("hidden");
    
    if (isInFavoritesView) {
      const favorites = getFavorites();
      if (favorites.length === 0) {
        resultsContainer.innerHTML = "<p>Je hebt nog geen favorieten opgeslagen.</p>";
        backToSearchButton.classList.add("hidden");
        return;
      }
       Promise.all(
        favorites.map((id) =>
          fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`).then((res) => res.json())
        )
      ).then((results) => {
        const meals = results
          .map((r) => r.meals ? r.meals[0] : null)
          .filter((meal) => meal);
        showResults(meals);
      });
    } else {
        e.target.textContent = getFavorites().includes(id) ? "❤️" : "🤍";
      }
      return;
   }
});

document.getElementById("show-favorites").addEventListener("click", () => {
  const favorites = getFavorites();
  const backBtn = document.getElementById("back-to-search");

  if (favorites.length === 0) {
    resultsContainer.innerHTML = "<p>Je hebt nog geen favorieten opgeslagen.</p>";
    backBtn.classList.add("hidden");
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
     backToSearchButton.classList.remove("hidden");
     
  });
});

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

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      entry.target.classList.remove("hidden");
    }
  });
}, { threshold: 0.1 });

document.getElementById("back-to-search").addEventListener("click", async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
  loadCategories();
  document.getElementById("back-to-search").classList.add("hidden");
});






