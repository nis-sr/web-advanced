const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("results");
const sortSelect = document.getElementById("sort-select");
const categorySelect = document.getElementById("category-select");
const backToSearchButton = document.getElementById("back-to-search");

let currentMeals = [];

window.addEventListener("DOMContentLoaded", async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 30));
  loadCategories();

});

// enter keypress
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});

// klikken op LOGO om terug naar standaardpage te gaan
logo.addEventListener("click", async () => {
  const meals = await fetchMealsByAlphabet();
  showResults(meals.slice(0, 20));
  backToSearchButton.classList.add("hidden");
});

// zoekbalk
searchButton.addEventListener("click",async()=>{
    const query = searchInput.value.trim();
    if(query === ""){
        alert("Please enter a search term!");
        return; 
    }
    try {
    resultsContainer.innerHTML = "<p>Zoeken...</p>";    
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();

    if (!data.meals || data.meals.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    showResults(data.meals);
  } catch (err) {
    console.error("Fout bij zoeken:", err);
    resultsContainer.innerHTML = "<p>Something went wrong during the search.</p>";
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

// Zoekresultaten weergeven en sorteren op naam
function showResults(meals) {
  currentMeals = meals;
  const sort = sortSelect.value;

  if (!meals || meals.length === 0) {
    resultsContainer.innerHTML = "<p>No results found for this category</p>";
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
    const instructions = meal.strInstructions ? meal.strInstructions.slice(0, 100) + "..." : "Geen instructies beschikbaar.";
    const fakeCalories = Math.floor(300 + Math.random() * 400);
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      <div class="meal-info">
        <h3>${meal.strMeal}</h3>
        <p><strong>Category:</strong> ${meal.strCategory || 'Onbekend'}</p>
        <p><strong>Country:</strong> ${meal.strArea || 'Onbekend'}</p>
        <p><strong>Kcal(geschat):</strong> ${fakeCalories}</p>
        <p><strong>Recept:</strong> ${instructions}</p>
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
// functie popup tonen
function showModal(meal) {
  const modal = document.getElementById("meal-modal");
  const modalDetails = document.getElementById("modal-details");
  modalDetails.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
    <p><strong>Category:</strong> ${meal.strCategory}</p>
    <p> ${meal.strInstructions}</p>
  `;
  modal.classList.remove("hidden");
}

// popup sluiten
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("meal-modal").classList.add("hidden");
});

document.getElementById("meal-modal").addEventListener("click", (e) => {
  if (e.target.id === "meal-modal") {
    e.target.classList.add("hidden");
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
        resultsContainer.innerHTML = "<p>You haven't saved any favorites yet.</p>";
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
//    wanneer je op een kaart klikt is er die popup
     const card = e.target.closest(".meal-card");
  if (card) {
    const name = card.querySelector("h3").textContent;
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`)
      .then(res => res.json())
      .then(data => {
        showModal(data.meals[0]);
      });
  }

});

document.getElementById("show-favorites").addEventListener("click", () => {
  const favorites = getFavorites();
  const backBtn = document.getElementById("back-to-search");

  if (favorites.length === 0) {
    resultsContainer.innerHTML = "<p>You haven't saved any favorites yet.</p>";
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
    resultsContainer.innerHTML = "<p>Something went wrong while filtering.</p>";
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






