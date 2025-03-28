(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const apiClient = async (method, endPoint, headers = {}) => {
  const API_URL = `https://api.themoviedb.org/3${endPoint}`;
  const options = {
    method,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ODM5YTA0NWE3ZWE2MmZiMzgyZjk0YjYzMjNiZmNiOCIsIm5iZiI6MTcxNTYwOTMzMi40NTUwMDAyLCJzdWIiOiI2NjQyMWVmNGJjZDQ0ZmM3Mjg0ZTNkYTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.oM6bJmAtSFwD2uePCLydHQhaSgYv1H3eWtxaJF2hfW0"}`,
      ...headers
    }
  };
  const response = await fetch(API_URL, options);
  if (!response.ok) {
    throw new Error("Failed to fetch movie list");
  }
  return response.json();
};
const getMovieList = async ({
  page
}) => {
  try {
    return await apiClient("GET", `/movie/popular?page=${page}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};
const getMovieDetails = async (id) => {
  {
    try {
      return await apiClient("GET", `/movie/${id}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  }
};
const toElement = (htmlString) => {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content.firstChild;
};
const CustomButton = ({ title, className = "" }) => {
  const customButton = document.createElement("button");
  customButton.className = `primary detail ${className}`;
  customButton.textContent = title;
  return customButton;
};
function ErrorPage(errorMessage) {
  const $container = document.querySelector(".container");
  const errorPageContainer = toElement(`
    <div class="error-page-container">
      <img src="./images/으아아행성이.png" alt="error-page-image" class="error-page-image" />
      <h1>오류가 발생했습니다.</h1>
      <p>${errorMessage}</p>
      ${CustomButton({
    title: "홈으로 돌아가기",
    className: "error-page-button"
  }).outerHTML}
    </div>
  `);
  const errorPageButton = errorPageContainer.querySelector(".error-page-button");
  errorPageButton.addEventListener("click", () => {
    window.location.replace("/");
  });
  $container.replaceChildren(errorPageContainer);
}
const storageService = (id, rating) => {
  var _a;
  const storedRatings = JSON.parse(
    localStorage.getItem("my-movie-rating") || "[]"
  );
  if (typeof rating === "undefined") {
    return ((_a = storedRatings.find((item) => item.id === id)) == null ? void 0 : _a.rating) || 0;
  }
  const index = storedRatings.findIndex((item) => item.id === id);
  if (index !== -1) {
    storedRatings[index].rating = rating;
  } else {
    storedRatings.push({ id, rating });
  }
  localStorage.setItem("my-movie-rating", JSON.stringify(storedRatings));
};
const removeDetailModal = () => {
  const $modalBackground = document.getElementById("modalBackground");
  const $closeModal = document.getElementById("closeModal");
  $modalBackground == null ? void 0 : $modalBackground.addEventListener("click", (e) => {
    if (e.target === $modalBackground) {
      $modalBackground.remove();
    }
  });
  $closeModal == null ? void 0 : $closeModal.addEventListener("click", () => {
    $modalBackground == null ? void 0 : $modalBackground.remove();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
      $modalBackground == null ? void 0 : $modalBackground.remove();
    }
  });
};
const modalRating = {
  10: "명작이에요",
  8: "좋아요",
  6: "보통이에요",
  4: "별로에요",
  2: "최악이에요",
  0: "평가없음"
};
function MyRatingInDetailModal(rating) {
  return `
    <div class="my-rating">
        <div class="star-rating">
            ${Array.from({ length: rating / 2 }, (_, idx) => {
    return `
                <button class="star-button" data-key="${idx + 1}">
                <img src="./images/star_filled.png" class="rating-star" />
                </button>`;
  }).join("")}
            ${Array.from({ length: 5 - rating / 2 }, (_, idx) => {
    return `
                <button class="star-button" data-key="${rating / 2 + idx + 1}">
                <img src="./images/star_empty.png" class="rating-star"/>
                </button>`;
  }).join("")}
        </div>
        <div class="rating-out-of-ten">
            ${modalRating[rating]}
            <span>(${rating}/10)</span>
        </div>
    </div>
    `;
}
const updateMovieRating = () => {
  var _a;
  (_a = document.querySelector(".my-rating-container")) == null ? void 0 : _a.addEventListener("click", (e) => {
    const target = e.target;
    const starRatingButton = target.closest(
      ".star-button"
    );
    if (!starRatingButton) return;
    const rating = Number(starRatingButton.dataset.key);
    const $modal = target.closest(".modal");
    const movieId = $modal.dataset.id;
    storageService(Number(movieId), rating);
    const $myRatingContainer = document.querySelector(
      ".my-rating-container"
    );
    $myRatingContainer.replaceChildren(
      toElement(`<h2>내 별점</h2>`),
      toElement(MyRatingInDetailModal(rating * 2))
    );
  });
};
function MovieDetailModal(movieDetails) {
  const $container = document.getElementById("wrap");
  const rating = storageService(movieDetails.id);
  const movieDetailModal = toElement(`
    <div class="modal-background active" id="modalBackground">
      <div class="modal" data-id=${movieDetails.id}>
        <button class="close-modal" id="closeModal">
          <img src="./images/modal_button_close.png" />
        </button>
        <div class="modal-container">
          <div class="modal-image">
            <img
              src=${movieDetails.poster_path ? `https://image.tmdb.org/t/p/original/${movieDetails.poster_path}` : "./images/nullImage.png"}
              alt=${movieDetails.title}
            />
          </div>
          <div class="modal-description">
            <h2>${movieDetails.title}</h2>
            <p class="category">
              ${movieDetails.release_date.slice(0, 4)} · ${movieDetails.genres.map((genre) => genre.name).join(", ")}
            </p>
            <div class="rate">
              <p class="rate-title">
                평균
              </p>
              <img src="./images/star_filled.png" class="star" />
              <span class="vote-average">
                  ${movieDetails.vote_average.toFixed(1)}
              </span>
            </div>
            <hr class="bar"/>
            <div class="my-rating-container">
              <h2>내 별점</h2>
                ${MyRatingInDetailModal(rating)}
            </div>
            <hr class="bar"/>
            <div class="detail">
              <h2>줄거리</h2>
              <p>${movieDetails.overview}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
`);
  $container == null ? void 0 : $container.appendChild(movieDetailModal);
  removeDetailModal();
  updateMovieRating();
}
const bannerButtonHandler = () => {
  const $bannerButton = document.querySelector(".banner-button");
  $bannerButton == null ? void 0 : $bannerButton.addEventListener("click", async () => {
    const $firstMovieCardButton = document.querySelector(
      ".movie-card-button"
    );
    const firstMovieCardId = $firstMovieCardButton.id;
    try {
      const {
        id,
        title,
        poster_path,
        release_date,
        genres,
        vote_average,
        overview
      } = await getMovieDetails(Number(firstMovieCardId));
      const movieDetails = {
        id,
        title,
        poster_path,
        release_date,
        genres,
        vote_average,
        overview
      };
      MovieDetailModal(movieDetails);
    } catch (error) {
      if (error instanceof Error) {
        ErrorPage("영화 상세 정보를 불러오는데 실패하였습니다.");
      }
    }
  });
};
function Header(movie) {
  const $header = document.getElementById("header");
  if (!$header) {
    return;
  }
  $header.innerHTML = /*html*/
  `
    <div class="background-container">
      <div class="overlay" aria-hidden="true">
        <img src="https://media.themoviedb.org/t/p/w440_and_h660_face${movie.poster_path}" alt="MovieList" />
      </div>
      <div class="top-rated-container">
        <div class="header-container">
          <a href="./" class="logo">
            <img src="./images/logo.png" alt="MovieList" />
          </a>
          <form class="search-form">
            <input id="search-input" name="search-input" type="text" placeholder="검색어를 입력하세요" />
            <button type="submit" class="search-button">
              <img src="./images/search.png" alt="Search" />
            </button>
          </form>
        </div>
        <div class="top-rated-movie">
          <div class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span class="rate-value">${movie.vote_average}</span>
          </div>
          <div class="title">${movie.title}</div>
          ${CustomButton({ title: "자세히 보기", className: "banner-button" }).outerHTML}
        </div>
      </div>
    </div>
  `;
  bannerButtonHandler();
}
const getUrlParams = () => {
  return new URLSearchParams(window.location.search);
};
const updateUrl = (params) => {
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.pushState(null, "", newUrl);
};
const initUrl = () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "F5") {
      history.pushState(null, "", "/");
    }
  });
};
function MovieCard(movieTitle, movie) {
  const movieImgPath = movie.poster_path ? `https://media.themoviedb.org/t/p/w440_and_h660_face${movie.poster_path}` : "images/nullImage.png";
  return toElement(`
    <li class="item">
      <button class="movie-card-button" id=${movie.id}>
        <img
          class="thumbnail"
          src=${movieImgPath}
          alt=${movieTitle}
        />
        <div class="item-desc">
          <p class="rate">
            <img src="./images/star_empty.png" class="star" /><span
              >${movie.vote_average.toFixed(1)}</span
            >
          </p>
          <strong class="movie-card-title">${movieTitle}</strong>
        </div>
      </button>
    </li>
  `);
}
function showEmptySearchResult() {
  const $movieContainer = document.getElementById("movie-container");
  const $emptySearchResultContainer = document.querySelector(
    ".empty-search-result-container"
  );
  if ($emptySearchResultContainer) {
    return;
  }
  $movieContainer == null ? void 0 : $movieContainer.appendChild(
    toElement(`
  <div class="empty-search-result-container">
    <img src="./images/으아아행성이.png" alt="검색 결과가 없습니다." class="empty-search-result-image"/>
    <p class="empty-search-result-text">검색 결과가 없습니다.</p>
  </div>
  `)
  );
}
const createFragment = (items) => {
  const fragment = document.createDocumentFragment();
  fragment.append(...items);
  return fragment;
};
function addMovieCard(movieList, $movieListContainer) {
  if (movieList.length === 0) {
    showEmptySearchResult();
    return;
  }
  const $emptySearchResult = document.querySelector(
    ".empty-search-result-container"
  );
  if ($emptySearchResult) {
    $emptySearchResult.remove();
  }
  addMoreMovies$1($movieListContainer, movieList);
}
function addMoreMovies$1($movieListContainer, movieList) {
  $movieListContainer.appendChild(
    createFragment(
      movieList.map((movie) => MovieCard(movie.title, movie))
    )
  );
}
const removeSkeletons = () => {
  const $skeleton = document.querySelector(".skeleton");
  $skeleton == null ? void 0 : $skeleton.remove();
};
const MovieSkeleton = () => {
  return toElement(`
      <li class="item skeleton-item">
        <div class="thumbnail skeleton-thumbnail"></div>
        <div class="item-desc">
          <p class="rate skeleton-rate"></p>
          <div class="skeleton-title"></div>
        </div>
      </li>
    `);
};
const createSkeletons = (count = 10) => {
  const skeleton = document.createElement("div");
  skeleton.classList.add("skeleton");
  skeleton.append(
    createFragment(Array.from({ length: count }, () => MovieSkeleton()))
  );
  return skeleton;
};
function showSkeletons($container, count = 20) {
  $container.appendChild(createSkeletons(count));
}
async function withSkeleton(container, asyncFunction) {
  try {
    showSkeletons(container);
    const result = await asyncFunction;
    removeSkeletons();
    return result;
  } catch (error) {
    removeSkeletons();
    throw error;
  }
}
const getSearchedMovie = async (query, page) => {
  try {
    return await apiClient(
      "GET",
      `/search/movie?query=${query}&include_adult=true&language=ko-KR&page=${page}`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};
const movieDetailModalHandler = () => {
  const $movieCardButton = document.querySelectorAll(".movie-card-button");
  $movieCardButton.forEach((button) => {
    button.addEventListener("click", async (e) => {
      var _a;
      const target = e.target;
      const movieId = (_a = target.closest(".movie-card-button")) == null ? void 0 : _a.id;
      try {
        const {
          id,
          title,
          poster_path,
          release_date,
          genres,
          vote_average,
          overview
        } = await getMovieDetails(Number(movieId));
        const movieDetails = {
          id,
          title,
          poster_path,
          release_date,
          genres,
          vote_average,
          overview
        };
        MovieDetailModal(movieDetails);
      } catch (error) {
        if (error instanceof Error) {
          ErrorPage("영화 상세 정보를 불러오는데 실패하였습니다.");
        }
      }
    });
  });
};
async function updateSearchedMovieUI($container, searchQuery) {
  try {
    disableElements();
    updateHeaderTitle(searchQuery);
    const searchedMovies = await withSkeleton(
      $container,
      getSearchedMovie(String(searchQuery), 1)
    );
    if (searchedMovies) {
      addMovieCard(searchedMovies.results, $container);
      movieDetailModalHandler();
    }
  } catch (error) {
    ErrorPage("검색한 영화 리스트를 불러오는데 실패하였습니다.");
  }
}
function updateHeaderTitle(searchQuery) {
  const $movieListTitle = document.querySelector(".movie-list-title");
  if ($movieListTitle) {
    $movieListTitle.textContent = `"${searchQuery}" 검색 결과`;
  }
}
function disableElements() {
  const $overlay = document.querySelector(".overlay");
  $overlay == null ? void 0 : $overlay.classList.add("disabled");
  const $topRatedMovie = document.querySelector(".top-rated-movie");
  $topRatedMovie == null ? void 0 : $topRatedMovie.classList.add("disabled");
  const $backgroundContainer = document.querySelector(".background-container");
  $backgroundContainer == null ? void 0 : $backgroundContainer.classList.add("background-container-disabled");
}
const searchFormSubmitHandler = async (e) => {
  const $thumbnailList = document.querySelector(
    ".thumbnail-list"
  );
  if ($thumbnailList) {
    $thumbnailList.innerHTML = "";
  }
  const formData = new FormData(e.target);
  const searchQuery = formData.get("search-input");
  const params = getUrlParams();
  updateUrlParams(params, String(searchQuery));
  updateSearchedMovieUI($thumbnailList, String(searchQuery));
  updateUrl(params);
};
function updateUrlParams(params, searchQuery) {
  const page = params.get("page");
  if (!page) {
    params.append("page", "1");
    params.append("query", searchQuery);
  } else {
    params.set("page", "1");
    params.set("query", searchQuery);
  }
}
async function addMoreMovies($movieList) {
  const params = getUrlParams();
  const page = params.get("page");
  const query = params.get("query");
  if (!page) {
    params.append("page", "2");
  } else {
    params.set("page", (parseInt(page) + 1).toString());
  }
  if (query) {
    const searchedMovies = await getSearchedMovie(
      query,
      parseInt(params.get("page"))
    );
    if (!searchedMovies) {
      return;
    }
    addMovieCard(searchedMovies.results, $movieList);
  } else {
    const movies = await getMovieList({ page: parseInt(params.get("page")) });
    if (!movies) {
      return;
    }
    addMovieCard(movies.results, $movieList);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.pushState(null, "", newUrl);
}
const intersectionObserver = (movieList) => {
  const target = document.getElementById("target");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        try {
          withSkeleton(movieList, addMoreMovies(movieList));
        } catch (error) {
          ErrorPage("영화 리스트를 불러오는데 실패하였습니다.");
        }
      }
    });
  });
  observer.observe(target);
};
async function init() {
  const $movieList = document.querySelector(".thumbnail-list");
  if (!$movieList) {
    ErrorPage("영화 리스트를 불러오는데 실패하였습니다.");
    return;
  }
  initUrl();
  try {
    const movies = await withSkeleton($movieList, getMovieList({ page: 1 }));
    if (movies) {
      Header(movies.results[0]);
      addMovieCard(movies.results, $movieList);
    }
  } catch (error) {
    ErrorPage("영화 리스트를 불러오는데 실패하였습니다.");
  }
  const searchForm = document.querySelector(".search-form");
  searchForm == null ? void 0 : searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await searchFormSubmitHandler(e);
    } catch (error) {
      ErrorPage("영화 리스트를 불러오는데 실패하였습니다.");
    }
  });
  intersectionObserver($movieList);
  movieDetailModalHandler();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
